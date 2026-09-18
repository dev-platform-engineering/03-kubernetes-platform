# Kubernetes / Cilium Native Routing

## firewalld Forwarding Troubleshooting Guide

---

## 1. Overview

This document describes the firewall forwarding problem encountered in the Kubernetes platform and the troubleshooting process used to identify and resolve it.

The Kubernetes cluster uses:

* Kubernetes installed with `kubeadm`
* External etcd
* Cilium CNI
* Cilium kube-proxy replacement
* Cilium native routing
* Cilium cluster-pool IPAM
* Cilium BGP
* Rocky Linux workers
* `firewalld` enabled on worker nodes

The final architecture uses:

```text
Kubernetes Pod CIDR:
10.60.0.0/16

Worker underlay network:
10.50.50.0/24

Worker-01:
10.50.50.11

Worker-02:
10.50.50.12
```

Example Pod addresses:

```text
worker-01
nettest-01
10.60.10.245

worker-02
nettest-02
10.60.9.101
```

The final solution allows forwarded Cilium Pod-to-Pod traffic:

```text
10.60.0.0/16
        ↓
10.60.0.0/16
```

while keeping the normal host firewall enabled.

---

# 2. Architecture

The cluster uses Cilium native routing.

There is no VXLAN tunnel for normal Pod-to-Pod traffic.

The conceptual path is:

```text
┌─────────────────────┐
│      worker-01      │
│  10.50.50.11        │
│                     │
│ Pod: 10.60.10.245   │
└──────────┬──────────┘
           │
           │ native IP routing
           │
           │ destination:
           │ 10.60.9.101
           ▼
┌─────────────────────┐
│      worker-02      │
│  10.50.50.12        │
│                     │
│ Pod: 10.60.9.101    │
└─────────────────────┘
```

The important point is that the packet retains its Pod IP addresses.

For example:

```text
SOURCE       DESTINATION
10.60.10.245 → 10.60.9.101
```

The worker underlay addresses:

```text
10.50.50.11
10.50.50.12
```

are used to transport the traffic between hosts, but they are not the source and destination addresses of the Pod packet being forwarded.

---

# 3. Why firewalld is involved

Cilium controls Kubernetes networking, but Cilium does not automatically bypass the host operating system firewall.

The packet still traverses the Linux networking stack.

Conceptually:

```text
Pod
 │
 ▼
Cilium endpoint / veth
 │
 ▼
Linux routing
 │
 ▼
Linux FORWARD path
 │
 ▼
firewalld / nftables
 │
 ▼
ens192
 │
 ▼
network
```

On the destination worker:

```text
ens192
 │
 ▼
Linux FORWARD path
 │
 ▼
Cilium endpoint / veth
 │
 ▼
Pod
```

Therefore there are two different security layers:

```text
Cilium
  └── Kubernetes / Pod networking policy

Linux firewalld
  └── Host-level packet filtering and forwarding
```

A healthy Cilium installation does not guarantee that the Linux firewall will permit the traffic.

---

# 4. Initial symptom

The first important symptom was:

```text
Pod-to-Pod communication between different workers failed.
```

For example:

```text
nettest-01
10.60.10.245
       │
       │ ping
       ▼
nettest-02
10.60.9.101
```

The Pods themselves were healthy.

Cilium was running.

BGP sessions were being established.

Normal host-level connectivity worked.

But Pod-to-Pod traffic failed.

---

# 5. First firewall discovery

The Rocky Linux workers had `firewalld` enabled.

Initial state:

```text
public zone

services:
    cockpit
    dhcpv6-client
    ssh

ports:
    none
```

The important observation was that TCP/10250 from the control plane was initially blocked.

From a control-plane node:

```bash
nc -vz 10.50.50.11 10250
```

failed.

After temporarily running:

```bash
sudo firewall-cmd --add-port=10250/tcp
```

the connection succeeded.

This proved that the host firewall was actively filtering Kubernetes traffic.

---

# 6. Kubelet firewall rule

The permanent solution for kubelet access is a rich rule allowing:

```text
Control Plane
10.50.30.0/24
        ↓
Worker
TCP/10250
```

Current Ansible rule:

```yaml
- name: Kubernetes | Allow Control Plane -> Kubelet
  ansible.posix.firewalld:
    zone: public
    rich_rule: >-
      rule family="ipv4"
      source address="{{ kubernetes_control_plane_cidr }}"
      port port="{{ kubernetes_kubelet_port }}"
      protocol="tcp"
      accept
    permanent: true
    immediate: true
    state: enabled
```

With:

```yaml
kubernetes_control_plane_cidr: "10.50.30.0/24"
kubernetes_kubelet_port: 10250
```

---

# 7. Cilium health connectivity

Cilium also uses TCP/4240 for health connectivity.

Therefore the workers need:

```text
Control Plane
10.50.30.0/24
        ↓
TCP/4240
        ↓
Worker
```

and worker-to-worker:

```text
10.50.50.0/24
        ↓
TCP/4240
        ↓
Worker
```

These are host access rules.

They are different from Pod forwarding.

---

# 8. The important distinction: host traffic vs forwarded traffic

This was one of the most important discoveries.

There are two fundamentally different types of firewall traffic.

### Host traffic

Traffic destined for the worker itself:

```text
10.50.30.x → worker:10250
```

This is handled by the host's input filtering.

### Forwarded traffic

Traffic passing through the worker:

```text
10.60.x.x → worker → 10.60.x.x
```

This uses the Linux forwarding path.

Conceptually:

```text
INPUT
  │
  └── traffic destined for the worker

FORWARD
  │
  └── traffic routed through the worker

OUTPUT
  │
  └── traffic generated by the worker
```

The Pod-to-Pod problem was a **FORWARD** problem.

Adding more INPUT rules would not solve it.

---

# 9. Proof that the Linux host firewall was rejecting the packet

We captured traffic on the worker using:

```bash
sudo tcpdump -ni ens192 host 10.60.7.156
```

The critical packet was:

```text
ICMP host 10.60.7.156 unreachable - admin prohibited filter
```

The important part was:

```text
admin prohibited filter
```

This meant the worker itself was generating the rejection.

Therefore:

```text
Pod
 ↓
worker
 ↓
firewall
 ↓
REJECT
```

The remote Pod was not simply unreachable.

The local Linux firewall was actively rejecting the forwarded packet.

---

# 10. Cilium was not the blocker

We checked the Cilium datapath.

Cilium TCX programs were attached to the interfaces.

Examples included:

```text
cil_from_netdev
cil_to_netdev
cil_to_host
cil_from_host
cil_from_container
```

Cilium endpoints were healthy.

The test endpoint showed:

```text
Ready
Health BPF OK
```

There was no CiliumNetworkPolicy blocking the traffic.

We also checked:

```bash
cilium-dbg monitor --type drop
```

and did not see a corresponding Cilium drop.

This was important because it ruled out a Cilium policy/datapath drop.

---

# 11. BGP was not the firewall problem

The cluster also uses Cilium BGP.

The workers establish BGP sessions to the VyOS routers.

We verified TCP/179 connectivity.

Therefore:

```text
Pod CIDR advertisement
        +
BGP sessions
        +
Linux routing
```

were not the primary problem.

BGP provides reachability information.

It does not bypass the Linux firewall.

The important separation is:

```text
BGP
 └── tells the network where 10.60.0.0/16 is

Linux routing
 └── decides where to send the packet

firewalld
 └── decides whether forwarding is permitted
```

All three must work.

---

# 12. Native routing was confirmed

We also investigated whether the traffic was using VXLAN.

The Cilium configuration showed:

```text
Network: Native
```

and the configured native routing CIDR is:

```yaml
cilium_ipv4_native_routing_cidr: "10.60.0.0/16"
```

The cluster pool is also:

```yaml
cilium_cluster_pool_ipv4_cidr: "10.60.0.0/16"
```

We checked the VTEP map:

```bash
cilium-dbg bpf vtep list
```

and received an error indicating that the VTEP map was not present.

This was consistent with the native-routing configuration.

Therefore the traffic should be treated as normal routed IP traffic, not VXLAN traffic.

---

# 13. The first wrong firewall approach

We initially tried direct nftables/firewalld rules such as:

```bash
sudo firewall-cmd --direct \
  --add-rule ipv4 filter FORWARD 0 \
  -s 10.50.50.0/24 \
  -d 10.60.0.0/16 \
  -j ACCEPT
```

and:

```bash
sudo firewall-cmd --direct \
  --add-rule ipv4 filter FORWARD 0 \
  -s 10.60.0.0/16 \
  -d 10.50.50.0/24 \
  -j ACCEPT
```

The counters increased, proving that packets reached those rules.

However, traffic still failed.

Why?

Because firewalld creates its own nftables chains with its own priorities and final rejection path.

The direct rule was not equivalent to allowing the packet through firewalld's complete forwarding policy.

The packet could be accepted by one nftables chain and subsequently reach another firewalld chain that rejected it.

This was a useful lesson:

> Do not blindly mix firewalld's direct rules with its policy abstraction unless you understand the nftables hook priorities and generated chains.

---

# 14. Firewalld forwarding chain investigation

We inspected the generated nftables chains.

The relevant chain looked conceptually like:

```text
filter_FORWARD
    │
    ├── established/related ACCEPT
    ├── DNAT ACCEPT
    ├── invalid DROP
    │
    ├── firewalld zone processing
    │
    └── REJECT admin-prohibited
```

The important final rule was:

```text
reject with icmpx admin-prohibited
```

This explained the packet capture.

If the traffic did not match an allowed forwarding path, firewalld eventually rejected it.

---

# 15. Firewalld policy experiment

The decisive diagnostic experiment was a firewalld forwarding policy:

```bash
firewall-cmd --permanent --new-policy cilium-forward
```

Then:

```bash
firewall-cmd --permanent \
  --policy cilium-forward \
  --add-ingress-zone public
```

and:

```bash
firewall-cmd --permanent \
  --policy cilium-forward \
  --add-egress-zone ANY
```

and:

```bash
firewall-cmd --permanent \
  --policy cilium-forward \
  --set-target ACCEPT
```

followed by:

```bash
firewall-cmd --reload
```

Pod-to-Pod communication started working.

This was the key diagnostic result.

It proved that the relevant firewall abstraction was the **firewalld forwarding policy**, not a CiliumNetworkPolicy.

---

# 16. Why the first policy design was still wrong

The initial attempt tried to make the policy more restrictive:

```text
public -> ANY
target CONTINUE
```

and then allow:

```text
10.50.50.0/24 -> 10.60.0.0/16
10.60.0.0/16 -> 10.50.50.0/24
```

This was wrong for the actual Pod-to-Pod packet.

The mistake was treating the worker underlay network as the source/destination network of the Pod packet.

---

# 17. The critical packet-addressing insight

For native Cilium routing:

```text
Pod A
10.60.10.245

        ↓

Pod B
10.60.9.101
```

the forwarded IP packet is:

```text
SOURCE:
10.60.10.245

DESTINATION:
10.60.9.101
```

Therefore:

```text
10.60.0.0/16
        ↓
10.60.0.0/16
```

is the correct firewall match.

The worker network:

```text
10.50.50.0/24
```

is the host/underlay network.

It is not the Pod source/destination network.

---

# 18. Final working forwarding rule

The final policy allows:

```text
10.60.0.0/16 → 10.60.0.0/16
```

through the Cilium forwarding policy.

The relevant Ansible task is:

```yaml
- name: Kubernetes | Allow Cilium Pod -> Pod forwarding
  ansible.builtin.command:
    cmd: >-
      firewall-cmd --permanent
      --policy cilium-forward
      --add-rich-rule='rule family="ipv4"
      source address="{{ cilium_cluster_pool_ipv4_cidr }}"
      destination address="{{ cilium_cluster_pool_ipv4_cidr }}"
      accept'
  when: >-
    ('source address="' ~ cilium_cluster_pool_ipv4_cidr ~
    '" destination address="' ~ cilium_cluster_pool_ipv4_cidr ~
    '" accept')
    not in kubernetes_cilium_policy_rules.stdout
  changed_when: true
```

With:

```yaml
cilium_cluster_pool_ipv4_cidr: "10.60.0.0/16"
```

the resulting rule is:

```text
10.60.0.0/16 → 10.60.0.0/16 ACCEPT
```

---

# 19. Final firewalld architecture

The workers now have two categories of firewall configuration.

## Host access

```text
Control Plane
10.50.30.0/24
      │
      ├── TCP/10250 → Kubelet
      │
      └── TCP/4240  → Cilium health
```

Worker health:

```text
Worker
10.50.50.0/24
      │
      └── TCP/4240 → Worker
```

## Pod forwarding

```text
Cilium Pod network
10.60.0.0/16
      │
      │ forwarding
      ▼
Cilium Pod network
10.60.0.0/16
```

---

# 20. Final working configuration

The relevant variables are:

```yaml
cilium_ipv4_native_routing_cidr: "10.60.0.0/16"
cilium_cluster_pool_ipv4_cidr: "10.60.0.0/16"

kubernetes_control_plane_cidr: "10.50.30.0/24"
kubernetes_worker_cidr: "10.50.50.0/24"

kubernetes_kubelet_port: 10250
```

The firewalld Cilium policy is:

```text
Policy:
    cilium-forward

Ingress:
    public

Egress:
    ANY

Target:
    ACCEPT
```

and the explicit Pod forwarding rule is:

```text
10.60.0.0/16 → 10.60.0.0/16 ACCEPT
```

---

# 21. Final validation

After applying the corrected configuration, two Pods were tested:

```text
nettest-01
10.60.10.245
worker-01

nettest-02
10.60.9.101
worker-02
```

Test:

```bash
kubectl exec nettest-01 -- ping -c 5 10.60.9.101
```

and reverse direction:

```bash
kubectl exec nettest-02 -- ping -c 5 10.60.10.245
```

Both directions now work.

This confirms that:

```text
Pod
 ↓
Cilium
 ↓
Linux routing
 ↓
firewalld
 ↓
worker underlay
 ↓
remote worker
 ↓
firewalld
 ↓
Linux routing
 ↓
Cilium
 ↓
Pod
```

is functioning correctly.

---

# 22. Troubleshooting procedure

When cross-node Pod connectivity fails, troubleshoot in this order.

## Step 1 — Check Pod state

```bash
kubectl get pods -o wide
```

Verify:

```text
Pod IP
Node
Status
```

---

## Step 2 — Test Pod-to-Pod connectivity

```bash
kubectl exec <pod-a> -- ping -c 5 <pod-b-ip>
```

Test both directions.

Do not test only one direction.

Example:

```bash
kubectl exec nettest-01 -- ping -c 5 10.60.9.101

kubectl exec nettest-02 -- ping -c 5 10.60.10.245
```

Asymmetric connectivity is an important clue.

---

# 23. Step 3 — Check worker routing

On the source worker:

```bash
ip route get <remote-pod-ip>
```

Example:

```bash
ip route get 10.60.9.101
```

Verify that Linux has a valid route.

Also check:

```bash
ip route
```

Look for the Cilium Pod CIDR.

---

# 24. Step 4 — Check Cilium status

On a worker:

```bash
cilium-dbg status
```

and:

```bash
cilium-dbg endpoint list
```

The endpoint should be healthy.

Check:

```bash
cilium-dbg monitor --type drop
```

while reproducing the problem.

If Cilium reports drops, investigate Cilium.

If Cilium reports nothing but the host sends `admin-prohibited`, investigate firewalld.

---

# 25. Step 5 — Check Cilium datapath

Check TCX programs:

```bash
sudo tcx show dev ens192
```

and:

```bash
sudo tcx show dev cilium_host
```

Look for Cilium programs such as:

```text
cil_from_netdev
cil_to_netdev
cil_to_host
cil_from_host
cil_from_container
```

If Cilium programs are attached and endpoints are healthy, continue toward host firewall investigation.

---

# 26. Step 6 — Check BGP

Check Cilium BGP:

```bash
cilium-dbg bgp peers
```

Check VyOS:

```bash
show ip bgp summary
```

Verify the worker sessions are established.

Also verify that the Pod CIDR is advertised.

Remember:

```text
BGP problem
    ≠
firewall problem
```

BGP provides routing information.

It does not permit firewall forwarding.

---

# 27. Step 7 — Check firewalld state

On the affected worker:

```bash
sudo firewall-cmd --state
```

Then:

```bash
sudo firewall-cmd --get-active-zones
```

Check the zone:

```bash
sudo firewall-cmd --zone=public --list-all
```

Check policies:

```bash
sudo firewall-cmd --get-policies
```

Then:

```bash
sudo firewall-cmd \
  --permanent \
  --policy cilium-forward \
  --list-all
```

Expected relevant configuration:

```text
ingress-zones: public
egress-zones: ANY
target: ACCEPT
```

---

# 28. Step 8 — Check the actual Pod forwarding rule

Run:

```bash
sudo firewall-cmd \
  --permanent \
  --policy cilium-forward \
  --list-rich-rules
```

You should see a rule equivalent to:

```text
source 10.60.0.0/16
destination 10.60.0.0/16
accept
```

If this rule is missing, Pod-to-Pod forwarding may be rejected by firewalld.

---

# 29. Step 9 — Check nftables

If firewalld configuration looks correct but traffic still fails:

```bash
sudo nft list ruleset
```

Focus on:

```text
filter_FORWARD
```

and firewalld's forwarding chains.

Look for:

```text
reject with icmpx admin-prohibited
```

A packet capture showing:

```text
admin prohibited filter
```

is a strong indication that the Linux firewall is rejecting the packet.

---

# 30. Step 10 — Use tcpdump

On the source worker:

```bash
sudo tcpdump -ni ens192 host <remote-pod-ip>
```

Example:

```bash
sudo tcpdump -ni ens192 host 10.60.9.101
```

On the destination worker:

```bash
sudo tcpdump -ni ens192 host <source-pod-ip>
```

Example:

```bash
sudo tcpdump -ni ens192 host 10.60.10.245
```

Interpretation:

### Packet leaves source but no packet reaches destination

Investigate:

```text
routing
BGP
underlay network
host firewall
```

### Packet reaches destination but no response

Investigate:

```text
destination worker firewall
Cilium
return route
```

### Source worker itself generates:

```text
admin-prohibited
```

Investigate:

```text
firewalld FORWARD
```

---

# 31. Common mistakes

## Mistake 1 — Opening only INPUT ports

Example:

```bash
firewall-cmd --add-port=4240/tcp
```

This does not automatically permit arbitrary Pod forwarding.

Host access and forwarded traffic are different paths.

---

## Mistake 2 — Allowing the worker CIDR instead of the Pod CIDR

Incorrect for Pod-to-Pod:

```text
10.50.50.0/24 → 10.60.0.0/16
```

The Pod packet is:

```text
10.60.x.x → 10.60.x.x
```

Correct:

```text
10.60.0.0/16 → 10.60.0.0/16
```

---

## Mistake 3 — Assuming BGP bypasses firewalld

It does not.

The path is effectively:

```text
BGP
 ↓
route installed
 ↓
Linux forwarding
 ↓
firewalld
```

A valid BGP route can exist while the firewall rejects the packet.

---

## Mistake 4 — Immediately creating a CiliumNetworkPolicy

Do not use a CiliumNetworkPolicy to solve a host firewall problem.

First determine where the packet is dropped.

If the host generates:

```text
ICMP admin-prohibited
```

the problem is below the Kubernetes policy layer.

---

## Mistake 5 — Mixing firewalld direct rules without understanding priorities

A direct nftables rule may show increasing counters while traffic is still rejected later by firewalld.

Therefore:

```text
counter increment
```

does not automatically mean:

```text
final packet ACCEPT
```

Always inspect the complete nftables/firewalld forwarding path.

---

# 32. Quick troubleshooting checklist

```text
[ ] Pod is Running
[ ] Pod has an IP
[ ] Pod is on the expected worker
[ ] Both directions tested
[ ] Remote Pod CIDR is present in routing table
[ ] Cilium status is healthy
[ ] Cilium endpoint is healthy
[ ] cilium-dbg monitor shows no drop
[ ] Cilium BGP peers are Established
[ ] VyOS has the expected BGP route
[ ] firewalld is running
[ ] public zone is active
[ ] TCP/10250 allowed from control plane
[ ] TCP/4240 allowed as required
[ ] cilium-forward policy exists
[ ] cilium-forward target is ACCEPT
[ ] ingress zone is public
[ ] egress zone is ANY
[ ] 10.60.0.0/16 -> 10.60.0.0/16 is allowed
[ ] nftables does not reject the packet
[ ] tcpdump confirms packet path
```

---

# 33. Useful commands

### Kubernetes

```bash
kubectl get nodes -o wide

kubectl get pods -A -o wide

kubectl exec nettest-01 -- ping -c 5 10.60.9.101

kubectl exec nettest-02 -- ping -c 5 10.60.10.245
```

### Cilium

```bash
cilium-dbg status

cilium-dbg endpoint list

cilium-dbg bgp peers

cilium-dbg monitor --type drop
```

### Linux routing

```bash
ip route

ip route get 10.60.9.101

ip route get 10.60.10.245
```

### firewalld

```bash
sudo firewall-cmd --state

sudo firewall-cmd --get-active-zones

sudo firewall-cmd --zone=public --list-all

sudo firewall-cmd --get-policies

sudo firewall-cmd \
  --permanent \
  --policy cilium-forward \
  --list-all

sudo firewall-cmd \
  --permanent \
  --policy cilium-forward \
  --list-rich-rules
```

### nftables

```bash
sudo nft list ruleset
```

### packet capture

```bash
sudo tcpdump -ni ens192 host <pod-ip>
```

---

# 34. Final lesson

The most important troubleshooting lesson from this issue is:

```text
Cilium networking
       ≠
Linux host firewall
```

A Kubernetes Pod packet can be:

```text
correctly allocated
        +
correctly routed
        +
correctly advertised through BGP
        +
correctly handled by Cilium
        +
still blocked by firewalld
```

The successful troubleshooting sequence was:

```text
Pod connectivity failure
        ↓
Check Cilium
        ↓
Cilium healthy
        ↓
Check BGP
        ↓
BGP healthy
        ↓
Check routing
        ↓
Route exists
        ↓
Capture packet
        ↓
"admin prohibited filter"
        ↓
Investigate firewalld FORWARD
        ↓
firewalld policy identified
        ↓
Correct source/destination CIDRs
        ↓
10.60.0.0/16 → 10.60.0.0/16
        ↓
Pod-to-Pod connectivity restored
```

The final solution is therefore based on the actual packet path rather than simply opening ports until the test works.

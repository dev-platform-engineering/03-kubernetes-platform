# Platform Infrastructure

Terraform • Ansible • VMware vSphere • Kubernetes • VyOS • BGP • Cilium

## Architecture

The platform is built as a production-style Kubernetes environment running on VMware vSphere. The design separates network, infrastructure, control-plane, etcd, and worker workloads into dedicated network segments.

### Infrastructure

The platform runs on VMware vSphere and consists of:

* **VyOS** — redundant network routers providing inter-VLAN routing, gateway services, VRRP-based high availability, and BGP routing.
* **HAProxy + Keepalived** — two load-balancer nodes providing a highly available Kubernetes API endpoint.
* **Nexus Repository** — internal repository providing package and container image access for the platform.
* **Kubernetes** — three control-plane nodes and three worker nodes.
* **External etcd** — a dedicated three-node etcd cluster separated from the Kubernetes control-plane nodes.

### Network Segmentation

The environment uses dedicated VLANs for different infrastructure functions:

* **VLAN 10 — Management** — administrative and management traffic.
* **VLAN 20 — Infrastructure** — load balancers and infrastructure services.
* **VLAN 30 — Control Plane** — Kubernetes API and control-plane nodes.
* **VLAN 40 — etcd** — dedicated network for the external etcd cluster.
* **VLAN 50 — Workers** — Kubernetes worker nodes.
* **VLAN 60 — Services** — shared platform services such as Nexus and internal DNS/NTP.
* **VLAN 70 — Monitoring** — monitoring infrastructure.
* **VLAN 80 — Databases** — database workloads.
* **VLAN 90 — Storage** — storage-related infrastructure.
* **VLAN 99 — Transit** — routing and transit connectivity.

### Kubernetes Control Plane

The Kubernetes control plane consists of three nodes:

* `cp-01` — `10.50.30.11`
* `cp-02` — `10.50.30.12`
* `cp-03` — `10.50.30.13`

The Kubernetes API is exposed through a highly available HAProxy/Keepalived layer rather than directly exposing individual control-plane nodes.

The control-plane nodes use an external etcd cluster instead of running etcd locally.

### External etcd

The etcd layer consists of three dedicated nodes:

* `etcd-01` — `10.50.40.11`
* `etcd-02` — `10.50.40.12`
* `etcd-03` — `10.50.40.13`

The three nodes form an independent etcd cluster. Kubernetes control-plane nodes communicate with etcd over the dedicated etcd network using TLS.

This separation provides a clear distinction between the Kubernetes control plane and the Kubernetes state store.

### Worker Nodes

The current Kubernetes worker layer consists of:

* `worker-01` — `10.50.50.11`
* `worker-02` — `10.50.50.12`
* `worker-03` — `10.50.50.13`

Workers are connected through a dedicated worker network and run the Kubernetes workloads managed by the control plane.

### Cilium Networking

Cilium is used as the Kubernetes CNI.

The platform uses:

* Native routing
* kube-proxy replacement
* IPv4 cluster-pool IPAM
* BGP-based route advertisement
* Pod CIDR `10.60.0.0/16`

Cilium advertises Kubernetes Pod network routes through BGP to the VyOS routers. This allows the network infrastructure to learn Kubernetes Pod routes dynamically without relying on an overlay network such as VXLAN.

### BGP Routing

BGP is used to integrate the Kubernetes network with the infrastructure routing layer.

The VyOS routers operate in AS `65000`.

Kubernetes nodes use dedicated autonomous systems:

* `cp-01` — AS `65101`
* `cp-02` — AS `65102`
* `cp-03` — AS `65103`
* `worker-01` — AS `65201`
* `worker-02` — AS `65202`
* `worker-03` — AS `65203`


The platform runs on VMware vSphere and consists of a highly available Kubernetes cluster, external etcd, VyOS routing, load balancers, and an internal Nexus Repository.


```text
                         INTERNET
                             |
                             |
                    +------------------+
                    |   VyOS HA Routers |
                    |     AS 65000      |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
              v                             v
      +---------------+             +---------------+
      | HAProxy +     |             |    Nexus      |
      | Keepalived    |             |  Repository   |
      | LB-01 / LB-02 |             |    repo-01    |
      +-------+-------+             +-------+-------+
              |                             |
              | Kubernetes API              |
              v                             |
    +-----------------------+               |
    | Kubernetes Cluster    |<--------------+
    |                       |
    |  +-----------------+  |
    |  | Control Plane   |  |
    |  | cp-01/02/03     |  |
    |  +--------+--------+  |
    |           |           |
    |           v           |
    |  +-----------------+  |
    |  | External etcd   |  |
    |  | etcd-01/02/03   |  |
    |  +-----------------+  |
    |                       |
    |  +-----------------+  |
    |  | Workers         |  |
    |  | worker-01/02/03 |  |
    |  +-----------------+  |
    |                       |
    |  Cilium: Native       |
    |  Routing + BGP        |
    +-----------------------+
```



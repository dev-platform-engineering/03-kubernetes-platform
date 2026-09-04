###
check installed packages
###

dpkg -l | grep -E 'conntrack|socat'

###
#check set overlay and modprobe
###

cat /etc/modules-load.d/k8s.conf
lsmod | grep -E 'overlay|br_netfilter'

#result 
overlay
br_netfilter


###
check net.bridge, ip_forward

sudo sysctl \
        net.bridge.bridge-nf-call-iptables \
        net.bridge.bridge-nf-call-ip6tables \
        net.ipv4.ip_forward
cat /etc/sysctl.d/k8s.conf

#result
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward = 1

### containerd
ls -l /usr/local/bin/containerd
/usr/local/bin/containerd --version
cat /etc/containerd/config.toml
grep -n "SystemdCgroup" /etc/containerd/config.toml
systemctl status containerd --no-pager
systemctl is-active containerd
sudo /usr/local/bin/ctr version
Client:
  Version:  v1.7.22
  Revision: 7f7fdf5fed64eb6a7caf99b3e12efcf9d60e311c
  Go version: go1.22.7

ls -l /run/containerd/containerd.sock
sudo systemctl status containerd --no-pager


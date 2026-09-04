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


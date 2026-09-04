
cat /etc/modules-load.d/k8s.conf
lsmod | grep -E 'overlay|br_netfilter'

#result 
overlay
br_netfilter
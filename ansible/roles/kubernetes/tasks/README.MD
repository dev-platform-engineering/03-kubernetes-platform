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
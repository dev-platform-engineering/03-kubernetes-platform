locals {
  linux_vms = merge(
    local.repository_vms,
    local.etcd_vms,
    local.kubernetes_vms,
    # local.monitoring_vms, 
  )
}

locals {
  linux_vms = merge(
    local.repository_vms,
    local.etcd_vms,
    local.kubernetes_vms,
    local.lb_vms,
    local.kubernetes_worker_linux_vms
    # local.monitoring_vms, 
  )

  # windows_vms = merge(
  #   local.kubernetes_worker_windows_vms,
  # )
}

locals {
  kubernetes_defaults = {
    template_name = "template-debian-12.15.0"

    cpu    = 4
    memory = 8192

    resource_pool = "RP-Kubernetes"

    folder    = "control_plane"
    datastore = "data2_R10"
    disk_size = 100

    network = "control_plane"

    netmask = 24
    gateway = "10.50.30.254"
  }

  kubernetes_nodes = {
    cp-01 = {
      ip = "10.50.30.11"
    }
  }

  kubernetes_vms = {
    for name, vm in local.kubernetes_nodes :
    name => merge(
      local.kubernetes_defaults,
      vm,
      {
        vm_name = name
      }
    )
  }
}

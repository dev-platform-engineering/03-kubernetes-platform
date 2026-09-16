locals {
  lb_defaults = {
    template_name = "template-debian-12.15.0"

    cpu    = 2
    memory = 4096

    resource_pool = "RP-Kubernetes"

    folder    = "infrastructure"
    datastore = "data1_R5"
    disk_size = 100

    network = "infrastructure"

    netmask = 24
    gateway = "10.50.20.254"
  }

  lb_nodes = {
    lb-01 = {
      ip = "10.50.20.11"
    },
    lb-02 = {
      ip = "10.50.20.12"
    }
  }

  lb_vms = {
    for name, vm in local.lb_nodes :
    name => merge(
      local.lb_defaults,
      vm,
      {
        vm_name = name
      }
    )
  }
}

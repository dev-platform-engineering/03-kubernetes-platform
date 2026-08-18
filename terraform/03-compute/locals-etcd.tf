locals {
  etcd_defaults = {
    template_name = "template-rocky-9.8"

    cpu    = 2
    memory = 4096

    resource_pool = "RP-Kubernetes"

    folder    = "etcd"
    datastore = "data2_R10"
    disk_size = 100

    network = "services"

    netmask = 24
    gateway = "10.50.40.254"
  }

  etcd_nodes = {
    etcd-01 = {
      ip = "10.50.40.11"
    }

    #   etcd-02 = {
    #     ip = "10.50.40.12"
    #   }

    #   etcd-03 = {
    #     ip = "10.50.40.13"
    #   }
  }

  etcd_vms = {
    for name, vm in local.etcd_nodes :
    name => merge(
      local.etcd_defaults,
      vm,
      {
        vm_name = name
      }
    )
  }
}

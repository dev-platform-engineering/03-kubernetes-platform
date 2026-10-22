locals {
  storage_defaults = {
    os            = "rocky"
    template_name = "template-rocky-9.8"

    cpu    = 2
    memory = 4096

    resource_pool = "RP-Management"
    folder        = "storage"
    datastore     = "data2_R10"

    disk_size = 100

    netmask = 24
    gateway = "10.50.90.254"
    network = "storage"
  }

  storage_vms = {
    nfs-01 = {
      ip = "10.50.90.20"
    }
  }

  storage_linux_vms = {
    for name, vm in local.storage_vms :
    name => merge(
      local.storage_defaults,
      vm,
      {
        vm_name = name
      }
    )
  }
}

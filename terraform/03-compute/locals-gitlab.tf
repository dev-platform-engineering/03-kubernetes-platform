locals {
  gitlab_defaults = {
    os            = "rocky"
    template_name = "template-rocky-9.8"

    cpu    = 4
    memory = 8192

    resource_pool = "RP-Management"
    folder        = "infrastructure"
    datastore     = "data2_R10"

    disk_size = 100

    netmask = 24
    gateway = "10.50.60.254"
    network = "services"
  }

  gitlab_vms = {
    gitlab = {
      ip = "10.50.60.70"
    }
  }

  gitlab_linux_vms = {
    for name, vm in local.gitlab_vms :
    name => merge(
      local.gitlab_defaults,
      vm,
      {
        vm_name = name
      }
    )
  }
}

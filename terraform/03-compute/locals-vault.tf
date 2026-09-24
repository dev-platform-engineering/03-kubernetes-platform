locals {
  vault_defaults = {
    os            = "rocky"
    template_name = "template-rocky-9.8"

    cpu    = 2
    memory = 4096

    resource_pool = "RP-Management"
    folder        = "vault"
    datastore     = "data1_R5"

    disk_size = 100

    netmask = 24
    gateway = "10.50.20.254"
    network = "infrastructure"
  }

  vault_vms = {
    vault-01 = {
      ip = "10.50.20.21"
    }

    vault-02 = {
      ip = "10.50.20.22"
    }

    vault-03 = {
      ip = "10.50.20.23"
    }
  }

  vault_linux_vms = {
    for name, vm in local.vault_vms :
    name => merge(
      local.vault_defaults,
      vm,
      {
        vm_name = name
      }
    )
  }
}

locals {
  repository_vms = {
    repo-01 = {
      vm_name       = "repo-01"
      template_name = "template-rocky-9.8"

      cpu    = 2
      memory = 4096

      resource_pool = "RP-Management"
      folder        = "infrastructure"
      datastore     = "system_R1"
      disk_size     = 100

      network = "management"

      ip      = "10.50.60.60"
      netmask = 24
      gateway = "10.50.60.254"

      dns = [
        "10.50.60.53"
      ]
      ntp = [
        "10.50.60.56"
      ]

      proxy = "http://10.50.60.59:5555"
    }
  }
}

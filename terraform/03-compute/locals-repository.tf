locals {

  repository_vms = {

    repo-01 = {
      vm_name       = "repo-01"
      template_name = "template-rocky-9.8"

      cpu    = 2
      memory = 4096

      resource_pool = "RP-Management"
      folder        = "Platform"
      datastore     = "system_R1"

      ip      = "10.50.60.60"
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

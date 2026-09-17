locals {
  kubernetes_worker_defaults = {
    cpu    = 4
    memory = 8192

    resource_pool = "RP-Kubernetes"
    folder        = "workers"
    datastore     = "data1_R5"
    disk_size     = 100

    netmask = 24
  }

  kubernetes_workers = {
    worker-01 = {
      os            = "rocky"
      template_name = "template-rocky-9.8"

      ip      = "10.50.50.11"
      gateway = "10.50.50.254"
      network = "workers"
    }

    worker-02 = {
      os            = "rocky"
      template_name = "template-rocky-9.8"

      ip      = "10.50.50.12"
      gateway = "10.50.50.254"
      network = "workers"
    }
  }

  kubernetes_worker_vms = {
    for name, vm in local.kubernetes_workers :
    name => merge(
      local.kubernetes_worker_defaults,
      vm,
      {
        vm_name = name
      }
    )
  }

  kubernetes_worker_linux_vms = {
    for name, vm in local.kubernetes_worker_vms :
    name => vm
    if vm.os != "windows"
  }

  #   kubernetes_worker_windows_vms = {
  #     for name, vm in local.kubernetes_worker_vms :
  #     name => vm
  #     if vm.os == "windows"
  #   }
}

output "linux_vms" {
  description = "Created Linux VMs"

  value = {
    for k, vm in module.linux_vm :
    k => {
      id   = vm.id
      name = vm.name
      uuid = vm.uuid
      moid = vm.moid
    }
  }
}

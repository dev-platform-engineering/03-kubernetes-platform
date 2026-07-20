output "vyos" {
  value = {
    for name, vm in module.vyos :
    name => {
      id   = vm.id
      uuid = vm.uuid
      name = vm.name
    }
  }
}

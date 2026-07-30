module "linux_vm" {
  source = "../modules/linux-vm"

  for_each = local.linux_vms

  vm = each.value
}

data "vsphere_virtual_machine" "templates" {
  for_each = toset([
    for vm in local.linux_vms : vm.template_name
  ])

  name          = each.value
  datacenter_id = data.terraform_remote_state.foundation.outputs.datacenter_id
}

data "vsphere_network" "networks" {
  for_each = data.terraform_remote_state.foundation.outputs.networks

  name          = each.value
  datacenter_id = data.terraform_remote_state.foundation.outputs.datacenter_id
}

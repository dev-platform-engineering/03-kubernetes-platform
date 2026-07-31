data "vsphere_datacenter" "dc" {
  name = var.datacenter
}

data "vsphere_host" "esxi_host" {
  name          = var.esxi_host
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_datastore" "this" {
  for_each = var.datastores

  name          = each.value
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_virtual_machine" "templates" {
  for_each = {
    for vm in local.repository_vms :
    vm.template_name => vm
  }

  name          = each.key
  datacenter_id = module.foundation.datacenter_id
}

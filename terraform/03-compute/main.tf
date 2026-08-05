module "linux_vm" {
  source = "../modules/linux-vm"

  for_each = local.linux_vms

  name   = each.value.vm_name
  cpu    = each.value.cpu
  memory = each.value.memory

  guest_id  = data.vsphere_virtual_machine.templates[each.value.template_name].guest_id
  firmware  = data.vsphere_virtual_machine.templates[each.value.template_name].firmware
  scsi_type = data.vsphere_virtual_machine.templates[each.value.template_name].scsi_type

  vm_folder = data.terraform_remote_state.foundation.outputs.folders[
    each.value.folder
  ]

  resource_pool_id = data.terraform_remote_state.foundation.outputs.child_resource_pools[
    each.value.resource_pool
  ]

  datastore_id = data.terraform_remote_state.foundation.outputs.datastores[
    each.value.datastore
  ]

  template_uuid = data.vsphere_virtual_machine.templates[
    each.value.template_name
  ].id

  # hostname = each.value.vm_name
  # domain   = var.domain

  ipv4_address = each.value.ip
  ipv4_netmask = each.value.netmask
  ipv4_gateway = each.value.gateway

  dns_servers        = each.value.dns
  dns_search_domains = []

  disk_size = each.value.disk_size

  # network_interfaces = [
  #   {
  #     network_id   = data.terraform_remote_state.foundation.outputs.network_ids[each.value.network]
  #     adapter_type = "vmxnet3"
  #   }
  # ]
  network_interfaces = [
    {
      network_id   = data.vsphere_network.networks[each.value.network].id
      adapter_type = "vmxnet3"
    }
  ]
}

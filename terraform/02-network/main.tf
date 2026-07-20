locals {
  routers = {
    vyos01 = { name = "vyos-router-01" }
    vyos02 = { name = "vyos-router-02" }
  }
}

module "vyos" {
  for_each = local.routers

  source = "../modules/vyos"

  name = each.value.name

  resource_pool_id = data.vsphere_resource_pool.network.id
  datastore_id     = data.vsphere_datastore.ds.id

  template_uuid = data.vsphere_virtual_machine.template.id

  template_disk_label = data.vsphere_virtual_machine.template.disks[0].label
  template_disk_size  = data.vsphere_virtual_machine.template.disks[0].size
  template_disk_thin  = data.vsphere_virtual_machine.template.disks[0].thin_provisioned

  guest_id  = data.vsphere_virtual_machine.template.guest_id
  firmware  = data.vsphere_virtual_machine.template.firmware
  scsi_type = data.vsphere_virtual_machine.template.scsi_type

  trunk_network_id = data.vsphere_network.trunk.id
}

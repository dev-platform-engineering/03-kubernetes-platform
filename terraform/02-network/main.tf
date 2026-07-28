data "terraform_remote_state" "foundation" {
  backend = "local" # read local state

  config = {
    path = "../01-foundation/terraform.tfstate" #path to state file
  }
}

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

  vm_folder = data.terraform_remote_state.foundation.outputs.network_folder

  resource_pool_id = data.vsphere_resource_pool.network.id
  datastore_id     = data.vsphere_datastore.ds.id

  template_uuid = data.vsphere_virtual_machine.template.id

  template_disk_label = data.vsphere_virtual_machine.template.disks[0].label
  template_disk_size  = data.vsphere_virtual_machine.template.disks[0].size
  template_disk_thin  = data.vsphere_virtual_machine.template.disks[0].thin_provisioned

  guest_id  = data.vsphere_virtual_machine.template.guest_id
  firmware  = data.vsphere_virtual_machine.template.firmware
  scsi_type = data.vsphere_virtual_machine.template.scsi_type

  network_interfaces = [
    {
      network_id = data.vsphere_network.management.id
    },
    {
      network_id = data.vsphere_network.trunk.id
    },
    {
      network_id = data.vsphere_network.external_services.id
    }
  ]

  # management_network_id = data.vsphere_network.management.id
  # trunk_network_id      = data.vsphere_network.trunk.id

  # external_network_id = data.vsphere_network.external_services.id
}

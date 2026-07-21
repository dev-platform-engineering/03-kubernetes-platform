resource "vsphere_virtual_machine" "this" {

  name = var.name

  folder           = var.vm_folder
  resource_pool_id = var.resource_pool_id
  datastore_id     = var.datastore_id

  num_cpus = var.cpu
  memory   = var.memory

  guest_id  = var.guest_id
  firmware  = var.firmware
  scsi_type = var.scsi_type

  wait_for_guest_net_timeout = 0

  disk {
    label            = var.template_disk_label
    size             = var.template_disk_size
    thin_provisioned = var.template_disk_thin
  }

  network_interface {
    network_id = var.management_network_id
  }

  network_interface {
    network_id = var.trunk_network_id
  }

  clone {
    template_uuid = var.template_uuid
  }
}

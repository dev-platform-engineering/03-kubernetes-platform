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

  wait_for_guest_net_timeout = var.wait_for_guest_net_timeout

  disk {
    label            = var.disk_label
    size             = var.disk_size
    thin_provisioned = var.disk_thin
  }

  dynamic "network_interface" {
    for_each = var.network_interfaces

    content {
      network_id   = network_interface.value.network_id
      adapter_type = network_interface.value.adapter_type
    }
  }

  clone {
    template_uuid = var.template_uuid

    customize {

      linux_options {
        host_name = var.name
        domain    = "local"
      }

      # network_interface {
      #   ipv4_address = var.ipv4_address
      #   ipv4_netmask = var.ipv4_netmask
      # }
      dynamic "network_interface" {
        for_each = var.network_interfaces

        content {
          # Передаем IP и маску только для первого интерфейса.
          # Если интерфейсов несколько, для остальных можно настроить DHCP или передать список IP.
          ipv4_address = network_interface.key == 0 ? var.ipv4_address : null
          ipv4_netmask = network_interface.key == 0 ? var.ipv4_netmask : null
        }
      }

      ipv4_gateway    = var.ipv4_gateway
      dns_server_list = var.dns_servers
      dns_suffix_list = var.dns_search_domains
    }
  }
}

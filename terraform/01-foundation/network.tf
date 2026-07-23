locals {
  port_groups = {
    management = {
      name        = "PG-V10-Management"
      vlan        = 10
      cidr        = "10.50.10.0/24"
      description = "Management network"
    }

    infrastructure = {
      name = "PG-V20-Infrastructure"
      vlan = 20
      cidr = "10.50.20.0/24"
      vrrp = true # <-- Added
    }

    control_plane = {
      name = "PG-V30-ControlPlane"
      vlan = 30
      cidr = "10.50.30.0/24"
      vrrp = true # <-- Added
    }

    etcd = {
      name = "PG-V40-etcd"
      vlan = 40
      cidr = "10.50.40.0/24"
      vrrp = true # <-- Added
    }

    workers = {
      name = "PG-V50-Workers"
      vlan = 50
      cidr = "10.50.50.0/24"
      vrrp = true # <-- Added
    }

    edge = {
      name = "PG-V60-Edge"
      vlan = 60
      cidr = "10.50.60.0/24"
      vrrp = true # <-- Added
    }

    monitoring = {
      name = "PG-V70-Monitoring"
      vlan = 70
      cidr = "10.50.70.0/24"
      vrrp = true # <-- Added
    }

    databases = {
      name = "PG-V80-Databases"
      vlan = 80
      cidr = "10.50.80.0/24"
      vrrp = true # <-- Added
    }

    storage = {
      name = "PG-V90-Storage"
      vlan = 90
      cidr = "10.50.90.0/24"
      vrrp = true # <-- Added
    }

    transit = {
      name = "PG-V99-Transit"
      vlan = 99
      cidr = "10.50.99.0/24"
      vrrp = true
    }

    # Trunk network for VyOS router interfaces
    trunk = {
      name = "PG-VGT-Trunk"
      vlan = 4095
      vrrp = true
    }
  }
}


resource "vsphere_host_port_group" "pgs" {
  for_each = local.port_groups

  name                = each.value.name
  host_system_id      = data.vsphere_host.esxi_host.id
  virtual_switch_name = var.vsphere_standard_switch_name
  vlan_id             = each.value.vlan

  # CRITICAL FOR VRRP: Override default vSphere security settings
  allow_promiscuous = false # Keep false unless troubleshooting packet captures

  # Required for VyOS to accept the VRRP Virtual MAC
  allow_mac_changes = try(each.value.vrrp, false)

  # Required for VyOS to transmit traffic using the VRRP Virtual MAC
  allow_forged_transmits = try(each.value.vrrp, false)
}

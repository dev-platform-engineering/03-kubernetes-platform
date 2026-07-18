locals {
  port_groups = {
    "PG-V10-Management"     = 10
    "PG-V20-Infrastructure" = 20
    "PG-V30-ControlPlane"   = 30
    "PG-V40-etcd"           = 40
    "PG-V50-Workers"        = 50
    "PG-V60-Edge"           = 60
    "PG-V70-Monitoring"     = 70
    "PG-V80-Databases"      = 80
    "PG-V90-Storage"        = 90
    "PG-V99-Transit"        = 99
  }
}

resource "vsphere_host_port_group" "pgs" {
  for_each            = local.port_groups
  name                = each.key
  host_system_id      = data.vsphere_host.esxi_host.id
  virtual_switch_name = var.vsphere_standard_switch_name
  vlan_id             = each.value
}

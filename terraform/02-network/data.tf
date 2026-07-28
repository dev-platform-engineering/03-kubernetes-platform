data "vsphere_datacenter" "dc" {
  name = var.datacenter
}

data "vsphere_host" "host" {
  name          = var.esxi_host
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_datastore" "ds" {
  name          = var.datastore
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_resource_pool" "network" {
  name          = var.resource_pool
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_network" "management" {
  name          = var.management_portgroup
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_network" "trunk" {
  name          = var.trunk_portgroup
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_virtual_machine" "template" {
  name          = var.vyos_template
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_network" "external_services" {
  name          = "PG-S13-ExternalService"
  datacenter_id = data.vsphere_datacenter.dc.id
}

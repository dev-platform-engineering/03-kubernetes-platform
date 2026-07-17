data "vsphere_datacenter" "dc" {
  name = var.datacenter
}

data "vsphere_host" "esxi_host" {
  name          = var.esxi_host
  datacenter_id = data.vsphere_datacenter.dc.id
}

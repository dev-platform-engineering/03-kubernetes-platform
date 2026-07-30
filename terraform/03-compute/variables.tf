variable "datastores" {
  type        = map(string)
  description = "Mapping of internal datastore identifiers to enterprise storage names"
}

data "vsphere_datastore" "all" {
  for_each = var.datastores

  name          = each.value
  datacenter_id = data.vsphere_datacenter.dc.id
}

resource "vsphere_resource_pool" "kubernetes" {
  name                    = var.resource_pool_name
  parent_resource_pool_id = data.vsphere_host.esxi_host.resource_pool_id

  cpu_share_level    = "normal"
  memory_share_level = "normal"
}

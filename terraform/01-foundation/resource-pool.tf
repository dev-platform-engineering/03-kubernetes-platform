resource "vsphere_resource_pool" "root" {
  name                    = var.resource_pool_name
  parent_resource_pool_id = data.vsphere_host.esxi_host.resource_pool_id

  cpu_share_level    = "normal"
  memory_share_level = "normal"
}

resource "vsphere_resource_pool" "child" {
  for_each = toset(var.child_resource_pools)

  name                    = each.value
  parent_resource_pool_id = vsphere_resource_pool.root.id

  cpu_share_level    = "normal"
  memory_share_level = "normal"
}

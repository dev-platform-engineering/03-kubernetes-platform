output "root_resource_pool" {
  description = "Root resource pool"

  value = {
    id   = vsphere_resource_pool.root.id
    name = vsphere_resource_pool.root.name
  }
}

output "child_resource_pools" {
  description = "Child resource pools"

  value = {
    for pool in vsphere_resource_pool.child :
    pool.name => pool.id
  }
}

output "networks" {
  description = "Map of all created standard port group names"
  value       = { for k, v in vsphere_host_port_group.pgs : k => v.name }
}

output "resource_pool_id" {
  value = vsphere_resource_pool.kubernetes.id
}

output "resource_pool_name" {
  value = vsphere_resource_pool.kubernetes.name
}

output "networks" {
  description = "Map of all created standard port group names"
  value       = { for k, v in vsphere_host_port_group.pgs : k => v.name }
}

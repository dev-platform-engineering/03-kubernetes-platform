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

output "network_folder" {
  value       = module.main_folders.folders["network"]
  description = "absolute path to Platform/Network"
}

output "kubernetes_folders" {
  value = {
    control_plane = module.k8s_subfolders.folders["control_plane"]
    workers       = module.k8s_subfolders.folders["workers"]
  }
  description = "path to Kubernetes"
}

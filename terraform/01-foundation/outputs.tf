output "datacenter_id" {
  description = "vSphere Datacenter ID"
  value       = data.vsphere_datacenter.dc.id
}

output "esxi_host_id" {
  description = "ESXi Host ID"
  value       = data.vsphere_host.esxi_host.id
}

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

output "datastores" {
  description = "Available datastores"

  value = {
    for key, ds in data.vsphere_datastore.this :
    key => ds.id
  }
}

output "network_ids" {
  description = "Standard Port Group IDs"

  value = {
    for key, pg in vsphere_host_port_group.pgs :
    key => pg.id
  }
}

output "networks" {
  description = "Port group names (legacy)"
  value       = { for k, v in vsphere_host_port_group.pgs : k => v.name }
}

output "folders" {
  description = "VM folder paths"

  value = merge(
    module.main_folders.folders,
    module.k8s_subfolders.folders
  )
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

variable "vsphere_server" {
  description = "The vSphere server address"
  type        = string
}
variable "vsphere_user" {
  description = "The vSphere username"
  type        = string
}
variable "vsphere_password" {
  description = "The vSphere password"
  type        = string
  sensitive   = true
}
variable "datacenter" {
  description = "The vSphere datacenter name"
  type        = string
}
variable "esxi_host" {
  description = "The vSphere server address"
  type        = string
}
variable "resource_pool_name" {
  description = "Root resource pool name"
  type        = string
}
variable "child_resource_pools" {
  description = "Child resource pools"
  type        = list(string)
}
variable "vsphere_standard_switch_name" {
  description = "Standard vSwitch used for Kubernetes networks"
  type        = string
  default     = "vSwitch2"
}

variable "datastores" {
  description = "Map of logical datastore names to vSphere datastore names"
  type        = map(string)
}

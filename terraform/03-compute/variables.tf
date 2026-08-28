variable "vsphere_server" {
  type = string
}

variable "vsphere_user" {
  type = string
}

variable "vsphere_password" {
  type      = string
  sensitive = true
}
variable "datacenter" {
  description = "The vSphere datacenter name"
  type        = string
}
variable "esxi_host" {
  description = "The vSphere server address"
  type        = string
}
variable "datastores" {
  description = "Map of logical datastore names to vSphere datastore names"
  type        = map(string)
}

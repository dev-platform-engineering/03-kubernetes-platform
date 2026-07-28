variable "datacenter" {
  type = string
}

variable "esxi_host" {
  type = string
}

variable "datastore" {
  type = string
}

variable "resource_pool" {
  type = string
}

variable "vyos_template" {
  type = string
}

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

variable "vsphere_allow_unverified_ssl" {
  type    = bool
  default = true
}

variable "management_portgroup" {
  type = string
}

variable "trunk_portgroup" {
  type = string
}

variable "external_services_portgroup" {
  type = string
}


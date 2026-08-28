variable "name" {
  type = string
}

variable "vm_folder" {
  type = string
}

variable "resource_pool_id" {
  type = string
}

variable "datastore_id" {
  type = string
}

variable "template_uuid" {
  type = string
}

variable "cpu" {
  type = number
}

variable "memory" {
  type = number
}

variable "domain" {
  type    = string
  default = "platform.internal"
}

variable "ipv4_address" {
  type = string
}

variable "ipv4_netmask" {
  type = number
}

variable "ipv4_gateway" {
  type = string
}

# variable "dns_servers" {
#   type = list(string)
# }

variable "dns_search_domains" {
  type    = list(string)
  default = []
}

variable "network_interfaces" {
  type = list(object({
    network_id   = string
    adapter_type = optional(string, "vmxnet3")
  }))
}

variable "disk_size" {
  type = number
}

variable "disk_label" {
  type    = string
  default = "disk0"
}

variable "disk_thin" {
  type    = bool
  default = true
}

variable "guest_id" {
  type    = string
  default = "other3xLinux64Guest"
}

variable "firmware" {
  type    = string
  default = "efi"
}

variable "scsi_type" {
  type    = string
  default = "pvscsi"
}

variable "wait_for_guest_net_timeout" {
  type    = number
  default = 0
}

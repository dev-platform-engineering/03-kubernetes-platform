variable "name" {
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

variable "guest_id" {
  type = string
}

variable "firmware" {
  type = string
}

variable "scsi_type" {
  type = string
}

variable "trunk_network_id" {
  type = string
}

variable "management_network_id" {
  type = string
}

variable "template_disk_label" {
  type = string
}

variable "template_disk_size" {
  type = number
}

variable "template_disk_thin" {
  type = bool
}

variable "cpu" {
  type    = number
  default = 2
}

variable "memory" {
  type    = number
  default = 2048
}

variable "vm_folder" {
  description = "vCenter VM folder"
  type        = string
}

variable "network_interfaces" {
  description = "List of network interfaces"

  type = list(object({
    network_id   = string
    adapter_type = optional(string, "vmxnet3")
  }))
}

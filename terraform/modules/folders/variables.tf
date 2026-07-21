variable "datacenter_id" {
  type = string
}

variable "folders" {
  type = map(object({
    path = string
    type = string
  }))
}

variable "parent_folder" {
  type        = string
  default     = "Platform"
  description = "Родительская папка, внутри которой создавать структуру"
}

output "id" {
  value = vsphere_virtual_machine.this.id
}

output "name" {
  value = vsphere_virtual_machine.this.name
}

output "moid" {
  value = vsphere_virtual_machine.this.moid
}

output "uuid" {
  value = vsphere_virtual_machine.this.uuid
}

output "ip_address" {
  description = "Primary IP address of the virtual machine"

  value = vsphere_virtual_machine.this.default_ip_address
}

output "folders" {
  value = {
    for k, v in vsphere_folder.this : k => v.path
  }
}

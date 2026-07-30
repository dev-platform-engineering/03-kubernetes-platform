output "datastores" {
  description = "Map of datastore IDs"

  value = {
    for key, ds in data.vsphere_datastore.this :
    key => ds.id
  }
}

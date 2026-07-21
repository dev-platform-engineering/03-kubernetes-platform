data "vsphere_folder" "parent" {
  path = var.parent_folder
}

resource "vsphere_folder" "this" {
  for_each      = var.folders
  path          = "${data.vsphere_folder.parent.path}/${each.value.path}"
  type          = each.value.type
  datacenter_id = var.datacenter_id
}

module "main_folders" {
  source        = "../modules/folders"
  datacenter_id = data.vsphere_datacenter.dc.id

  folders = {
    templates  = { path = "Templates", type = "vm" }
    network    = { path = "Network", type = "vm" }
    kubernetes = { path = "Kubernetes", type = "vm" }
  }
}

module "k8s_subfolders" {
  source        = "../modules/folders"
  datacenter_id = data.vsphere_datacenter.dc.id

  folders = {
    control_plane = { path = "Kubernetes/ControlPlane", type = "vm" }
    workers       = { path = "Kubernetes/Workers", type = "vm" }
  }

  depends_on = [
    module.main_folders
  ]
}

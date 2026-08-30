output "platform_topology" {
  description = "Current Kubernetes platform infrastructure topology"

  value = {
    foundation = {
      datacenter_id        = data.terraform_remote_state.foundation.outputs.datacenter_id
      esxi_host_id         = data.terraform_remote_state.foundation.outputs.esxi_host_id
      root_resource_pool   = data.terraform_remote_state.foundation.outputs.root_resource_pool
      child_resource_pools = data.terraform_remote_state.foundation.outputs.child_resource_pools
      datastores           = data.terraform_remote_state.foundation.outputs.datastores
      networks             = data.terraform_remote_state.foundation.outputs.networks
      folders              = data.terraform_remote_state.foundation.outputs.folders
      kubernetes_folders   = data.terraform_remote_state.foundation.outputs.kubernetes_folders
    }

    network = {
      vyos = data.terraform_remote_state.network.outputs.vyos
    }

    compute = {
      linux_vms = data.terraform_remote_state.compute.outputs.linux_vms
    }
  }
}

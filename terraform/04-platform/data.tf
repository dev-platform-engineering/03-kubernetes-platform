data "terraform_remote_state" "foundation" {
  backend = "local"

  config = {
    path = "../01-foundation/terraform.tfstate"
  }
}

data "terraform_remote_state" "network" {
  backend = "local"

  config = {
    path = "../02-network/terraform.tfstate"
  }
}

data "terraform_remote_state" "compute" {
  backend = "local"

  config = {
    path = "../03-compute/terraform.tfstate"
  }
}

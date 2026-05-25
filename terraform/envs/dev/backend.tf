terraform {
  backend "s3" {
    bucket  = "mern-auth"
    key     = "dev/terraform.tfstate"
    region  = "ap-south-1"
    encrypt = true
  }
}
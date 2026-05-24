terraform {
  backend "s3" {
    bucket = "mern-auth"
    path = "terraform.tfstate"
    region = "us-east-1"
  }
}
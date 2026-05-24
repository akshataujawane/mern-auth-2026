variable "name" {
  type        = string
  description = "EC2 instance name."
}

variable "ami_id" {
  type        = string
  description = "AMI ID for the EC2 instance."
}

variable "instance_type" {
  type        = string
  description = "EC2 instance type."
}

variable "subnet_id" {
  type        = string
  description = "Subnet ID for the EC2 instance."
}

variable "vpc_id" {
  type        = string
  description = "VPC ID for the security group."
}

variable "key_name" {
  type        = string
  default     = null
  description = "Optional EC2 key pair name."
}

variable "allowed_ssh_cidr" {
  type        = string
  description = "CIDR allowed to SSH into the instance."
}

variable "user_data" {
  type        = string
  default     = null
  description = "Startup script for the instance."
}

variable "iam_instance_profile_name" {
  type        = string
  default     = null
  description = "Optional IAM instance profile name."
}

variable "root_volume_size" {
  type        = number
  default     = 30
  description = "Root EBS volume size in GB."
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Common resource tags."
}

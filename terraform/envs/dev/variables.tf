variable "aws_region" {
  type        = string
  default     = "ap-south-1"
  description = "AWS region."
}

variable "availability_zone" {
  type        = string
  default     = "ap-south-1a"
  description = "Availability zone."
}

variable "project_name" {
  type        = string
  default     = "assessment-devops"
  description = "Project name prefix."
}

variable "instance_type" {
  type        = string
  default     = "t3.medium"
  description = "EC2 type for Jenkins plus k3s."
}

variable "key_name" {
  type        = string
  default     = null
  description = "Existing EC2 key pair name. Leave null if you use Session Manager."
}

variable "allowed_ssh_cidr" {
  type        = string
  default     = "0.0.0.0/0"
  description = "Your public IP CIDR, for example 1.2.3.4/32."
}

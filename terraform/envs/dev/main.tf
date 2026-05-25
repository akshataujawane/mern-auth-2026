locals {
  tags = {
    Project     = var.project_name
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}

resource "aws_ecr_repository" "app" {
  name                 = "mern-auth"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.tags
}

resource "aws_iam_role" "jenkins_ec2" {
  name = "${var.project_name}-jenkins-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "ec2.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.tags
}

resource "aws_iam_role_policy" "jenkins_ecr" {
  name = "${var.project_name}-ecr-policy"
  role = aws_iam_role.jenkins_ec2.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "ecr:GetAuthorizationToken"
        ]

        Resource = "*"
      },
      {
        Effect = "Allow"

        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:CompleteLayerUpload",
          "ecr:DescribeImages",
          "ecr:DescribeRepositories",
          "ecr:GetDownloadUrlForLayer",
          "ecr:InitiateLayerUpload",
          "ecr:ListImages",
          "ecr:PutImage",
          "ecr:UploadLayerPart"
        ]

        Resource = aws_ecr_repository.app.arn
      }
    ]
  })
}

resource "aws_iam_instance_profile" "jenkins_ec2" {
  name = "${var.project_name}-jenkins-ec2-profile"
  role = aws_iam_role.jenkins_ec2.name
}

module "vpc" {
  source = "../../modules/vpc"

  name               = var.project_name
  vpc_cidr           = "10.0.0.0/16"
  public_subnet_cidr = "10.0.1.0/24"
  availability_zone  = var.availability_zone

  tags = local.tags
}

module "jenkins_server" {
  source = "../../modules/ec2"

  name                      = "${var.project_name}-jenkins-k3s"
  ami_id                    = "ami-0e35ddab05955cf57"
  instance_type             = var.instance_type
  subnet_id                 = module.vpc.public_subnet_id
  vpc_id                    = module.vpc.vpc_id
  key_name                  = var.key_name
  allowed_ssh_cidr          = var.allowed_ssh_cidr
  iam_instance_profile_name = aws_iam_instance_profile.jenkins_ec2.name
  user_data                 = file("${path.module}/../../../scripts/user_data.sh")

  tags = local.tags
}
output "instance_id" {
  value = module.jenkins_server.instance_id
}

output "public_ip" {
  value = module.jenkins_server.public_ip
}

output "jenkins_url" {
  value = module.jenkins_server.jenkins_url
}

output "app_url" {
  value = module.jenkins_server.app_url
}

output "ecr_repository_url" {
  value = aws_ecr_repository.app.repository_url
}

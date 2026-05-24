output "instance_id" {
  value = aws_instance.this.id
}

output "public_ip" {
  value = aws_instance.this.public_ip
}

output "jenkins_url" {
  value = "http://${aws_instance.this.public_ip}:8080"
}

output "app_url" {
  value = "http://${aws_instance.this.public_ip}:30080"
}

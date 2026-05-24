#!/bin/bash
set -euxo pipefail

apt-get update -y
apt-get install -y ca-certificates curl gnupg git openjdk-17-jre unzip

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable docker
systemctl start docker

curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
unzip -q /tmp/awscliv2.zip -d /tmp
/tmp/aws/install

curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key -o /usr/share/keyrings/jenkins-keyring.asc
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" > /etc/apt/sources.list.d/jenkins.list
apt-get update -y
apt-get install -y jenkins
usermod -aG docker jenkins
systemctl enable jenkins
systemctl restart jenkins

curl -fsSL https://get.k3s.io | sh -
mkdir -p /var/lib/jenkins/.kube /home/ubuntu/.kube
cp /etc/rancher/k3s/k3s.yaml /var/lib/jenkins/.kube/config
cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/.kube/config
chown -R jenkins:jenkins /var/lib/jenkins/.kube
chown -R ubuntu:ubuntu /home/ubuntu/.kube
chmod 600 /var/lib/jenkins/.kube/config /home/ubuntu/.kube/config

ln -sf /usr/local/bin/kubectl /usr/bin/kubectl
ln -sf /usr/local/bin/k3s /usr/bin/k3s

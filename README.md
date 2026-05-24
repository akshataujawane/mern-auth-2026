# DevOps Kubernetes CI/CD Assessment Project

This is a simple production-style DevOps assessment project.

## Architecture

```text
GitHub -> Jenkins on one EC2 -> Amazon ECR -> Kubernetes -> MERN app + MongoDB
```

## What This Project Demonstrates

- Dockerized MERN backend/frontend app
- MongoDB service dependency
- Kubernetes deployment and service
- Jenkins CI/CD pipeline
- Amazon ECR image registry
- Terraform-provisioned AWS VPC and EC2 server
- Reliability improvement with readiness and liveness probes
- Intentional failure simulation and Kubernetes debugging

## Why This Architecture

This challenge does not need full EKS, ArgoCD, ECR, SonarQube, Trivy, Cosign, or multi-agent Jenkins.

For an 8-12 minute demo and a 90-minute challenge, the best architecture is:

- 1 EC2 instance
- Jenkins installed on that EC2
- Docker installed on that EC2
- k3s Kubernetes installed on that EC2
- Amazon ECR as image registry
- MongoDB running inside Kubernetes

This keeps the project simple, working, and easy to explain.

## Project Structure

```text
.
├── Jenkinsfile
├── README.md
├── k8s/
│   ├── namespace.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── mongo-deployment.yaml
│   ├── mongo-service.yaml
│   └── mongo-secret.yaml
├── mern-auth/
│   ├── Dockerfile
│   ├── api/
│   ├── client/
│   ├── package.json
│   └── docker-compose.yml
├── scripts/
│   └── user_data.sh
└── terraform/
    ├── modules/
    │   ├── vpc/
    │   └── ec2/
    └── envs/
        └── dev/
```

## Before Running Pipeline

Update this value in `Jenkinsfile`:

```groovy
AWS_REGION = 'us-east-1'
ECR_REPOSITORY = 'mern-auth'
```

The placeholder image in `k8s/backend-deployment.yaml` is replaced during the Jenkins deployment stage:

```yaml
image: ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/mern-auth:latest
```

The Jenkins EC2 instance gets ECR permissions from the IAM role created by Terraform. You do not need to store AWS access keys in Jenkins.

## Terraform Deployment

Go to the dev Terraform environment:

```bash
cd terraform/envs/dev
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
key_name         = "your-existing-keypair"
allowed_ssh_cidr = "YOUR_PUBLIC_IP/32"
```

Then run:

```bash
terraform init
terraform plan
terraform apply
```

Terraform outputs:

- Jenkins URL
- App URL
- EC2 public IP
- ECR repository URL

## Jenkins First Login

SSH into the EC2 instance:

```bash
ssh -i your-key.pem ubuntu@EC2_PUBLIC_IP
```

Get Jenkins initial password:

```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

Open Jenkins:

```text
http://EC2_PUBLIC_IP:8080
```

## CI/CD Pipeline Stages

1. Checkout code from GitHub
2. Run API tests
3. Build Docker image
4. Login to Amazon ECR
5. Push image to ECR
6. Create/update Kubernetes ECR image pull secret
7. Deploy to Kubernetes
8. Verify Kubernetes rollout

## Kubernetes Verification

```bash
kubectl get pods -n assessment
kubectl get svc -n assessment
kubectl rollout status deployment/mern-auth -n assessment
kubectl logs -n assessment deployment/mern-auth
```

Open the app:

```text
http://EC2_PUBLIC_IP:30080
```

Health endpoint:

```text
http://EC2_PUBLIC_IP:30080/health
```

## Reliability Improvement

The backend deployment uses:

- `readinessProbe`
- `livenessProbe`
- rolling update strategy
- resource requests and limits

This shows that Kubernetes can detect unhealthy pods and safely roll out new versions.

## Intentional Failure Simulation

Break the MongoDB service name in `k8s/mongo-secret.yaml`.

Change:

```text
mongo
```

to:

```text
wrong-mongo
```

Apply and restart:

```bash
kubectl apply -f k8s/
kubectl rollout restart deployment/mern-auth -n assessment
```

Debug:

```bash
kubectl get pods -n assessment
kubectl describe pod -n assessment <pod-name>
kubectl logs -n assessment deployment/mern-auth
kubectl get events -n assessment --sort-by=.metadata.creationTimestamp
```

Fix the service name back to `mongo`, apply again, and restart the deployment.

## Demo Script

1. Show architecture diagram in README.
2. Show Terraform creates one EC2 server.
3. Show Jenkinsfile stages.
4. Trigger Jenkins pipeline.
5. Show ECR image.
6. Show Kubernetes pods and services.
7. Open app and `/health`.
8. Show readiness/liveness probes.
9. Break MongoDB connection.
10. Debug using `kubectl logs`, `describe`, and `events`.
11. Fix and redeploy.

## What To Say In Interview

"I intentionally simplified the architecture for the assessment. Instead of using EKS, ArgoCD, and enterprise security gates, I used one EC2 instance running Jenkins and k3s. The pipeline builds the Docker image, pushes it to Amazon ECR, deploys to Kubernetes, and verifies rollout. I added health probes as a reliability improvement and simulated a MongoDB connection failure to demonstrate debugging."

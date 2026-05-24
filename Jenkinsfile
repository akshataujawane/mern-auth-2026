pipeline {
  agent any

  environment {
    AWS_REGION = 'us-east-1'
    ECR_REPOSITORY = 'mern-auth'
    IMAGE_TAG = "${BUILD_NUMBER}"
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Prepare ECR Image') {
      steps {
        script {
          env.AWS_ACCOUNT_ID = sh(
            script: 'aws sts get-caller-identity --query Account --output text',
            returnStdout: true
          ).trim()
          env.ECR_REGISTRY = "${env.AWS_ACCOUNT_ID}.dkr.ecr.${env.AWS_REGION}.amazonaws.com"
          env.IMAGE = "${env.ECR_REGISTRY}/${env.ECR_REPOSITORY}:${env.IMAGE_TAG}"
        }
        sh 'echo Building image: $IMAGE'
      }
    }

    stage('Test') {
      steps {
        dir('mern-auth') {
          sh 'npm install'
          sh 'npm run test:api'
        }
      }
    }

    stage('Build Docker Image') {
      steps {
        sh 'docker build -t $IMAGE ./mern-auth'
      }
    }

    stage('Push to ECR') {
      steps {
        sh 'aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY'
        sh 'docker push $IMAGE'
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        sh 'kubectl apply -f k8s/namespace.yaml'
        sh '''
          kubectl create secret docker-registry ecr-registry \
            --namespace assessment \
            --docker-server=$ECR_REGISTRY \
            --docker-username=AWS \
            --docker-password="$(aws ecr get-login-password --region $AWS_REGION)" \
            --dry-run=client -o yaml | kubectl apply -f -
        '''
        sh 'kubectl apply -f k8s/'
        sh 'kubectl set image deployment/mern-auth mern-auth=$IMAGE -n assessment'
        sh 'kubectl rollout status deployment/mern-auth -n assessment --timeout=120s'
      }
    }
  }

  post {
    always {
      sh 'docker logout $ECR_REGISTRY || true'
    }
  }
}

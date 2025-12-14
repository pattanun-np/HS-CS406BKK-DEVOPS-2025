pipeline {
    agent any

    tools {
        go "1.24.1"
    }

    environment {
        APP_DIR = '02-12-2025/build/go/app'
        TTL = '2h'

        // Kubernetes
        K8S_SERVER_URL = 'https://kubernetes:6443'
        K8S_NAMESPACE  = 'default'
        K8S_CREDENTIALS_ID = 'k8s-jenkins-robot-token'   // << ID ของ token ใน Jenkins Credentials

        POD_NAME = 'myapp'
        APP_PORT = '4444'
    }

    stages {
        stage('Build') {
            steps {
                dir(env.APP_DIR) {
                    sh '''#!/usr/bin/env bash
set -euxo pipefail
echo "Current dir: $(pwd)"
ls -la

CGO_ENABLED=0 GO111MODULE=off go build -o main main.go
'''
                }
            }
        }

        stage('Build & Push to ttl.sh') {
            steps {
                script {
                    def uuid = sh(
                        returnStdout: true,
                        script: 'uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid'
                    ).trim().toLowerCase()

                    env.TTL_IMAGE = "ttl.sh/${uuid}:${env.TTL}"
                }

                dir(env.APP_DIR) {
                    withEnv(["TTL_IMAGE=${env.TTL_IMAGE}"]) {
                        sh '''#!/usr/bin/env bash
set -euxo pipefail
test -f Dockerfile

echo "Pushing image: $TTL_IMAGE"
docker build -t "$TTL_IMAGE" .
docker push "$TTL_IMAGE"
'''
                    }
                }

                echo "ttl.sh image: ${env.TTL_IMAGE}"
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                withKubeConfig([
                    credentialsId: env.K8S_CREDENTIALS_ID,
                    serverUrl: env.K8S_SERVER_URL,
                    namespace: env.K8S_NAMESPACE
                ]) {
                    sh '''#!/usr/bin/env bash
set -euxo pipefail

# Pod แก้ image ตรง ๆ ไม่ได้ → ลบแล้วสร้างใหม่ให้ชัวร์
kubectl delete pod "$POD_NAME" -n "$K8S_NAMESPACE" --ignore-not-found=true

cat <<YAML | kubectl apply -n "$K8S_NAMESPACE" -f -
apiVersion: v1
kind: Pod
metadata:
  name: ${POD_NAME}
  labels:
    app: ${POD_NAME}
spec:
  restartPolicy: Always
  containers:
    - name: ${POD_NAME}
      image: ${TTL_IMAGE}
      imagePullPolicy: Always
      ports:
        - containerPort: ${APP_PORT}
YAML

kubectl wait -n "$K8S_NAMESPACE" --for=condition=Ready pod/"$POD_NAME" --timeout=120s
kubectl get pod -n "$K8S_NAMESPACE" "$POD_NAME" -o wide
'''
                }
            }
        }
    }

    post {
        always {
            echo "DONE. Image: ${env.TTL_IMAGE}"
        }
    }
}

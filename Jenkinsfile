pipeline {
    agent any

    tools {
        go "1.24.1"
    }

    environment {
        APP_DIR = '02-12-2025/build/go/app'

        // ttl.sh tag (TTL)
        TTL = '2h'

        // Deploy target (Docker VM)
        DEPLOY_HOST = '54.81.119.98'      // เปลี่ยนเป็น IP/hostname ของ Docker VM
        APP_PORT = '4444'
        CONTAINER_NAME = 'myapp'

        // Jenkins Credentials: "SSH Username with private key"
        SSH_CREDENTIALS_ID = 'aws-vm-ssh'  // << เปลี่ยนให้ตรงกับของคุณ
    }

    stages {
        stage('Build') {
            steps {
                dir(env.APP_DIR) {
                                    sh '''#!/usr/bin/env bash
                set -euxo pipefail
                echo "Current dir: $(pwd)"
                ls -la
                
                # build binary ให้พร้อมสำหรับ Dockerfile ที่ COPY main
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

        stage('Deploy to Docker VM') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: env.SSH_CREDENTIALS_ID,
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USER'
                )]) {
                    withEnv([
                        "TTL_IMAGE=${env.TTL_IMAGE}",
                        "DEPLOY_HOST=${env.DEPLOY_HOST}",
                        "APP_PORT=${env.APP_PORT}",
                        "CONTAINER_NAME=${env.CONTAINER_NAME}"
                    ]) {
                        sh '''#!/usr/bin/env bash
                        set -euxo pipefail
                        
                        # ส่งสคริปต์ไปรันบน Docker VM (pull + run + map port 4444)
                        ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$DEPLOY_HOST" 'bash -s' <<EOF
                        set -euxo pipefail
                        
                        docker pull "$TTL_IMAGE"
                        docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
                        
                        docker run -d \
                          --name "$CONTAINER_NAME" \
                          --restart unless-stopped \
                          -p "$APP_PORT:$APP_PORT" \
                          "$TTL_IMAGE"
                        
                        docker ps --filter "name=$CONTAINER_NAME"
                        EOF
                        '''
                    }
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

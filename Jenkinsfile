pipeline {
    agent any

    tools {
        go "1.24.1"
    }

    environment {
        APP_DIR   = '02-12-2025/build/go/app'
        TTL       = '1h'
        TTL_IMAGE = ''
    }

    stages {
        stage('Build') {
            steps {
                dir(env.APP_DIR) {
                    sh '''#!/usr/bin/env bash
set -euxo pipefail
echo "Current dir: $(pwd)"
echo "Listing files:"
ls -la

CGO_ENABLED=0 GO111MODULE=off go build -o main main.go
'''
                }
            }
        }

        stage('Build & Push to ttl.sh') {
            steps {
                script {
                    def uuid = sh(returnStdout: true,
                                  script: 'uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid'
                    ).trim().toLowerCase()
                    env.TTL_IMAGE = "ttl.sh/${uuid}:${env.TTL}"
                }

                dir(env.APP_DIR) {
                    sh '''#!/usr/bin/env bash
set -euxo pipefail
test -f Dockerfile

echo "Pushing image: ${TTL_IMAGE}"
docker build -t "${TTL_IMAGE}" .
docker push "${TTL_IMAGE}"
'''
                }

                echo "ttl.sh image: ${env.TTL_IMAGE}"
            }
        }
    }
}

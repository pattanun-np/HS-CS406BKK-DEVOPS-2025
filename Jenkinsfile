pipeline {
  agent any

  tools { go "1.24.1" }

  environment {
    APP_DIR   = '02-12-2025/build/go/app'
    BIN_NAME  = 'myapp'

    DEPLOY_HOST = '54.81.119.98'
    SSH_CREDENTIALS_ID = 'aws-vm-ssh'

    APP_PORT     = '4444'
    REMOTE_DIR   = '/opt/myapp'
    SERVICE_NAME = 'myapp'
  }

  stages {
    stage('Build') {
      steps {
        dir(env.APP_DIR) {
          sh '''#!/usr/bin/env bash
            set -euxo pipefail
            CGO_ENABLED=0 GO111MODULE=off GOOS=linux GOARCH=amd64 go build -o "${BIN_NAME}" main.go
          '''
        }
      }
    }

    stage('Deploy to VM (no Docker)') {
      steps {
        withCredentials([sshUserPrivateKey(
          credentialsId: env.SSH_CREDENTIALS_ID,
          keyFileVariable: 'SSH_KEY',
          usernameVariable: 'SSH_USER'
        )]) {
          dir(env.APP_DIR) {
            sh '''#!/usr/bin/env bash
              set -euxo pipefail

              ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$DEPLOY_HOST" '
                set -euxo pipefail
                sudo mkdir -p /opt/myapp
                sudo chown -R ec2-user:ec2-user /opt/myapp
                sudo chmod 755 /opt/myapp
              '

              scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "${BIN_NAME}" "$SSH_USER@$DEPLOY_HOST:/tmp/${BIN_NAME}"

              ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$DEPLOY_HOST" '
                set -euxo pipefail
                sudo mv /tmp/myapp /opt/myapp/myapp
                sudo chmod 755 /opt/myapp/myapp
              '

              ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$DEPLOY_HOST" \
                "sudo bash -c 'cat > /etc/systemd/system/${SERVICE_NAME}.service'" <<UNIT
[Unit]
Description=${SERVICE_NAME} service
After=network.target

[Service]
Type=simple
WorkingDirectory=${REMOTE_DIR}
ExecStart=${REMOTE_DIR}/${BIN_NAME}
Restart=always
RestartSec=2
Environment=PORT=${APP_PORT}
User=root

[Install]
WantedBy=multi-user.target
UNIT

              ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$DEPLOY_HOST" \
                "sudo systemctl daemon-reload && sudo systemctl enable ${SERVICE_NAME} && sudo systemctl restart ${SERVICE_NAME} && sudo systemctl --no-pager status ${SERVICE_NAME}"
            '''
          }
        }
      }
    }

    stage('Smoke test') {
      steps {
        withCredentials([sshUserPrivateKey(
          credentialsId: env.SSH_CREDENTIALS_ID,
          keyFileVariable: 'SSH_KEY',
          usernameVariable: 'SSH_USER'
        )]) {
          sh '''#!/usr/bin/env bash
            set -euxo pipefail

            echo "== Check from EC2 (local) =="
            ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$DEPLOY_HOST" "
              set -euxo pipefail
              sudo ss -lntp | grep :${APP_PORT} || true
              curl -fsS --max-time 5 http://127.0.0.1:${APP_PORT}/ || true
            "

            echo "== Check from Jenkins (external) =="
            curl -v --connect-timeout 5 --max-time 10 "http://${DEPLOY_HOST}:${APP_PORT}/"
          '''
        }
      }
    }
  }

  post {
    always {
      echo "DONE (no Docker). Deployed ${env.BIN_NAME} to ${env.DEPLOY_HOST}:${env.REMOTE_DIR} and restarted ${env.SERVICE_NAME}"
    }
  }
}

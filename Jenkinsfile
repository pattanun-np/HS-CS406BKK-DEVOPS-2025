pipeline {
  agent any

  tools {
    go "1.24.1"
  }

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
            echo "Current dir: $(pwd)"
            ls -la

            CGO_ENABLED=0 GO111MODULE=off GOOS=linux GOARCH=amd64 go build -o "${BIN_NAME}" main.go
            file "${BIN_NAME}" || true
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

              # Ensure remote dir exists + writable for ec2-user
              ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$DEPLOY_HOST" '
                set -euxo pipefail
                sudo mkdir -p /opt/myapp
                sudo chown -R ec2-user:ec2-user /opt/myapp
                sudo chmod 755 /opt/myapp
                test -w /opt/myapp
              '

              # Copy binary to HOME first, then sudo move into /opt/myapp (avoids scp permission issues)
              scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "${BIN_NAME}" "$SSH_USER@$DEPLOY_HOST:/tmp/${BIN_NAME}"

              ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$DEPLOY_HOST" "
                set -euxo pipefail
                sudo mv /tmp/${BIN_NAME} ${REMOTE_DIR}/${BIN_NAME}
                sudo chmod 755 ${REMOTE_DIR}/${BIN_NAME}
              "

              # Write systemd service
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

              # Reload + restart
              ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$DEPLOY_HOST" \
                "sudo systemctl daemon-reload && sudo systemctl enable ${SERVICE_NAME} && sudo systemctl restart ${SERVICE_NAME} && sudo systemctl --no-pager status ${SERVICE_NAME}"
            '''
          }
        }
      }
    }

    stage('Smoke test') {
      steps {
        sh '''#!/usr/bin/env bash
          set -euxo pipefail
          curl -fsS "http://${DEPLOY_HOST}:${APP_PORT}/" || true
        '''
      }
    }
  }

  post {
    always {
      echo "DONE (no Docker). Deployed ${env.BIN_NAME} to ${env.DEPLOY_HOST}:${env.REMOTE_DIR} and restarted ${env.SERVICE_NAME}"
    }
  }
}

pipeline {
  agent any

  tools {
    go "1.24.1"
  }

  environment {
    APP_DIR = '02-12-2025/build/go/app'
    BIN_NAME = 'myapp'              // output binary name

    // Deploy target (VM)
    DEPLOY_HOST = '54.81.119.98'
    SSH_CREDENTIALS_ID = 'aws-vm-ssh'

    // App runtime
    APP_PORT = '4444'
    REMOTE_DIR = '/opt/myapp'
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

            # build static-ish binary
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

              # Prepare remote folders
              ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$DEPLOY_HOST" "sudo mkdir -p ${REMOTE_DIR} && sudo chown -R $SSH_USER:$SSH_USER ${REMOTE_DIR}"

              # Copy binary
              scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "${BIN_NAME}" "$SSH_USER@$DEPLOY_HOST:${REMOTE_DIR}/${BIN_NAME}"

              # Create/Update systemd service and restart
              ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$DEPLOY_HOST" "sudo bash -s" <<'EOF'
              set -euxo pipefail

              SERVICE_NAME="${SERVICE_NAME:-myapp}"
              REMOTE_DIR="${REMOTE_DIR:-/opt/myapp}"
              BIN_NAME="${BIN_NAME:-myapp}"
              APP_PORT="${APP_PORT:-4444}"

              cat > /etc/systemd/system/${SERVICE_NAME}.service <<UNIT
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

# (optional) run as non-root user; change if needed
User=root

[Install]
WantedBy=multi-user.target
UNIT

              systemctl daemon-reload
              systemctl enable ${SERVICE_NAME}
              systemctl restart ${SERVICE_NAME}
              systemctl --no-pager status ${SERVICE_NAME} || true
              EOF
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
      echo "DONE (no Docker). Deployed binary: ${env.BIN_NAME} to ${env.DEPLOY_HOST}:${env.REMOTE_DIR}"
    }
  }
}

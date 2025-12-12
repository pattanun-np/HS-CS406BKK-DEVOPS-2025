stage('Build & Push to ttl.sh') {
    steps {
        script {
            def uuid = sh(
                returnStdout: true,
                script: 'uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid'
            ).trim().toLowerCase()

            def ttlImage = "ttl.sh/${uuid}:${env.TTL}"
            env.TTL_IMAGE = ttlImage   // เผื่ออยาก echo หลังจบ

            dir(env.APP_DIR) {
                withEnv(["TTL_IMAGE=${ttlImage}"]) {
                    sh '''#!/usr/bin/env bash
set -euxo pipefail
test -f Dockerfile

echo "Pushing image: $TTL_IMAGE"
docker build -t "$TTL_IMAGE" .
docker push "$TTL_IMAGE"
'''
                }
            }

            echo "ttl.sh image: ${ttlImage}"
        }
    }
}

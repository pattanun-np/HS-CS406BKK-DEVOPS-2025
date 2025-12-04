pipeline {
    agent any

    tools {
        go "1.24.1"
    }

    stages {
        stage('Build') {
            steps {
                dir('02-12-2025/build/go/app') {
                    sh '''
                        echo "Current dir: $(pwd)"
                        echo "Listing files:"
                        ls -la

                        # ถ้ามี main.go อยู่ในโฟลเดอร์นี้
                        GO111MODULE=off go build main.go
                    '''
                }
            }
        }
    }
}

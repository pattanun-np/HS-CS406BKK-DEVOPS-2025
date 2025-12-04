pipeline {
    agent any

    tools {
        go "1.24.1"
    }

    stages {
        stage('Build') {
            steps {
                // เข้าไปที่โฟลเดอร์ของโปรเจกต์ก่อน
                dir('main/02-12-2025/build/go/app') {
                    sh '''
                        echo "Current dir: $(pwd)"
                        echo "Listing files:"
                        ls -la

                        # ใช้ GOPATH mode
                        GO111MODULE=off go build main.go
                    '''
                }
            }
        }
    }
}

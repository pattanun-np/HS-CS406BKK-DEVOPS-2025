pipeline {
    agent any

    tools {
       go "1.24.1"
    }

    stages {
        stage('Build') {
            steps {
                sh "GO111MODULE=off go build /var/lib/jenkins/workspace/myapp-build-pipeline/main/02-12-2025/build/go/app/main.go"
            }
        }
    }
}

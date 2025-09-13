# Scout Dashboard QA Framework CI/CD Integration Guide

This guide provides detailed instructions for integrating the QA framework into CI/CD systems.

## GitHub Actions Integration

### Prerequisites
- GitHub Actions enabled in your repository
- Access to add secrets to your repository

### Setup Steps

1. **Add GitHub Secrets**
   - Navigate to your repository Settings > Secrets and Variables > Actions
   - Add the following secrets:
     - `DASHBOARD_URL` (URL to your deployed dashboard server)

2. **Set up the workflow file**
   - The QA framework includes a pre-configured workflow file at `.github/workflows/dashboard-qa.yml`
   - Ensure the workflow file is properly committed to your repository

3. **Trigger a workflow run**
   - Make a small commit to test that the workflow runs correctly
   - Check the Actions tab in your repository to verify the workflow is running

## Jenkins Integration

### Prerequisites
- Jenkins server with appropriate plugins (JUnit, NodeJS)
- Access to add environment variables to Jenkins

### Setup Steps

1. **Create a Jenkins pipeline**
   - Create a new pipeline job in Jenkins
   - Configure it to use a Jenkinsfile from your repository or create a pipeline script

2. **Sample Jenkinsfile**

```groovy
pipeline {
    agent any
    
    tools {
        nodejs 'NodeJS 16'
    }
    
    environment {
        DASHBOARD_URL = 'https://your-dashboard-url.com'
        CI = 'true'
        MOCK_BROWSER = 'true'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install') {
            steps {
                dir('tools/js/juicer-stack/qa') {
                    sh 'npm install'
                }
            }
        }
        
        stage('Prepare CI') {
            steps {
                dir('tools/js/juicer-stack/qa') {
                    sh 'node utils/prepare_ci_environment.js'
                }
            }
        }
        
        stage('Test') {
            steps {
                dir('tools/js/juicer-stack/qa') {
                    sh './run_ci_tests.sh'
                }
            }
        }
    }
    
    post {
        always {
            dir('tools/js/juicer-stack/qa') {
                junit 'reports/junit/*.xml'
                archiveArtifacts artifacts: 'reports/**/*', allowEmptyArchive: true
            }
        }
    }
}
```

## Other CI Systems

For other CI systems like CircleCI, Travis, GitLab CI, etc.:

1. Install dependencies:
```bash
cd tools/js/juicer-stack/qa
npm install
```

2. Prepare environment:
```bash
node utils/prepare_ci_environment.js
```

3. Run tests:
```bash
./run_ci_tests.sh
```

## Troubleshooting

### Common Issues

1. **Browser Launch Failures**
   - Set `MOCK_BROWSER=true` to use mocked browser instead of real browser

2. **Missing Baseline Images**
   - The framework will automatically create placeholder baselines if needed
   - For real tests, manually create the baselines and commit them to your repo

3. **Test Failures in CI but not Locally**
   - Ensure `DASHBOARD_URL` is set correctly
   - Check network connectivity to the dashboard server
   - Verify the baseline images are properly committed

## Continuous Monitoring

It's recommended to run the QA tests:
- On every pull request that touches dashboard code
- On a scheduled basis (e.g., nightly) to catch regressions
- After major dashboard updates

## Next Steps

After integrating with CI/CD:
1. Generate real baseline images once dashboards are stable
2. Customize test assertions based on your specific requirements
3. Set up notifications for test failures

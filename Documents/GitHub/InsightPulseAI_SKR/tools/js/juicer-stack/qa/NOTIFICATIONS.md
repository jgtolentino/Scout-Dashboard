# QA Test Notifications Setup

This guide shows you how to set up notifications for the QA test results to be sent to Slack, Microsoft Teams, or email.

## Slack Integration

### Setup Steps

1. **Create a Slack App**
   - Go to [Slack API Apps](https://api.slack.com/apps)
   - Click "Create New App" and select "From scratch"
   - Name your app (e.g., "Scout QA Bot") and select your workspace
   - Click "Create App"

2. **Enable Incoming Webhooks**
   - In your app settings, click on "Incoming Webhooks"
   - Toggle "Activate Incoming Webhooks" to On
   - Click "Add New Webhook to Workspace"
   - Choose the channel where notifications should be posted
   - Click "Allow"
   - Copy the Webhook URL for the next step

3. **Add the Webhook URL to your CI Secrets**
   - For GitHub Actions: Add a secret called `SLACK_WEBHOOK_URL`
   - For Azure DevOps: Add a variable called `SLACK_WEBHOOK_URL`

### GitHub Actions Implementation

```yaml
- name: Notify Slack on Success
  if: success()
  uses: slackapi/slack-github-action@v1.24.0
  with:
    payload: |
      {
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "✅ *QA Tests PASSED*\nBranch: ${{ github.ref_name }}\nCommit: ${{ github.sha }}"
            }
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "View details: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
            }
          }
        ]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

- name: Notify Slack on Failure
  if: failure()
  uses: slackapi/slack-github-action@v1.24.0
  with:
    payload: |
      {
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "❌ *QA Tests FAILED*\nBranch: ${{ github.ref_name }}\nCommit: ${{ github.sha }}"
            }
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "View details: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
            }
          }
        ]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Azure DevOps Implementation

```yaml
- task: PowerShell@2
  displayName: 'Notify Slack'
  condition: always()
  inputs:
    targetType: 'inline'
    script: |
      $BUILD_STATUS = if ($env:AGENT_JOBSTATUS -eq "Succeeded") { "✅ *QA Tests PASSED*" } else { "❌ *QA Tests FAILED*" }
      $PAYLOAD = @{
        blocks = @(
          @{
            type = "section"
            text = @{
              type = "mrkdwn"
              text = "$BUILD_STATUS`nBranch: $(Build.SourceBranchName)`nCommit: $(Build.SourceVersion)"
            }
          },
          @{
            type = "section"
            text = @{
              type = "mrkdwn"
              text = "View details: $(System.TeamFoundationCollectionUri)$(System.TeamProject)/_build/results?buildId=$(Build.BuildId)"
            }
          }
        )
      }
      
      $PAYLOAD_JSON = ConvertTo-Json -Depth 10 -InputObject $PAYLOAD
      
      Invoke-RestMethod -Uri "$(SLACK_WEBHOOK_URL)" -Method Post -Body $PAYLOAD_JSON -ContentType "application/json"
```

## Microsoft Teams Integration

### Setup Steps

1. **Create an Incoming Webhook in Teams**
   - Open Microsoft Teams
   - Go to the channel where you want to receive notifications
   - Click the "..." menu next to the channel name and select "Connectors"
   - Find "Incoming Webhook" and click "Configure"
   - Provide a name and optionally upload an icon
   - Click "Create" and copy the webhook URL

2. **Add the Webhook URL to your CI Secrets**
   - For GitHub Actions: Add a secret called `TEAMS_WEBHOOK_URL`
   - For Azure DevOps: Add a variable called `TEAMS_WEBHOOK_URL`

### GitHub Actions Implementation

```yaml
- name: Notify Teams
  if: always()
  uses: aliencube/microsoft-teams-actions@v0.8.0
  with:
    webhook_uri: ${{ secrets.TEAMS_WEBHOOK_URL }}
    title: "Scout Dashboard QA Tests"
    summary: "QA Test Results"
    theme_color: ${{ job.status == 'success' && '00FF00' || 'FF0000' }}
    sections: |
      [{
        "activityTitle": "${{ job.status == 'success' && '✅ QA Tests PASSED' || '❌ QA Tests FAILED' }}",
        "facts": [
          { "name": "Branch", "value": "${{ github.ref_name }}" },
          { "name": "Commit", "value": "${{ github.sha }}" },
          { "name": "Build", "value": "${{ github.run_id }}" }
        ],
        "markdown": true
      }]
    actions: |
      [{
        "@type": "OpenUri",
        "name": "View Build Details",
        "targets": [{ "os": "default", "uri": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}" }]
      }]
```

### Azure DevOps Implementation

```yaml
- task: PowerShell@2
  displayName: 'Notify Teams'
  condition: always()
  inputs:
    targetType: 'inline'
    script: |
      $COLOR = if ($env:AGENT_JOBSTATUS -eq "Succeeded") { "00FF00" } else { "FF0000" }
      $STATUS = if ($env:AGENT_JOBSTATUS -eq "Succeeded") { "✅ QA Tests PASSED" } else { "❌ QA Tests FAILED" }
      
      $BODY = @{
        "@type" = "MessageCard"
        "@context" = "http://schema.org/extensions"
        "themeColor" = $COLOR
        "summary" = "Scout Dashboard QA Test Results"
        "sections" = @(
          @{
            "activityTitle" = $STATUS
            "facts" = @(
              @{ "name" = "Branch"; "value" = "$(Build.SourceBranchName)" },
              @{ "name" = "Commit"; "value" = "$(Build.SourceVersion)" },
              @{ "name" = "Build"; "value" = "$(Build.BuildId)" }
            )
          }
        )
        "potentialAction" = @(
          @{
            "@type" = "OpenUri"
            "name" = "View Build Details"
            "targets" = @(
              @{ "os" = "default"; "uri" = "$(System.TeamFoundationCollectionUri)$(System.TeamProject)/_build/results?buildId=$(Build.BuildId)" }
            )
          }
        )
      }
      
      $BODY_JSON = ConvertTo-Json -Depth 10 -InputObject $BODY
      
      Invoke-RestMethod -Uri "$(TEAMS_WEBHOOK_URL)" -Method Post -Body $BODY_JSON -ContentType "application/json"
```

## Email Notifications

### GitHub Actions Implementation

```yaml
- name: Send Email Notification
  if: always()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: ${{ secrets.MAIL_SERVER }}
    server_port: ${{ secrets.MAIL_PORT }}
    username: ${{ secrets.MAIL_USERNAME }}
    password: ${{ secrets.MAIL_PASSWORD }}
    subject: "Scout Dashboard QA Results: ${{ job.status }}"
    body: |
      QA Test Results for ${{ github.repository }}
      
      Status: ${{ job.status }}
      Branch: ${{ github.ref_name }}
      Commit: ${{ github.sha }}
      
      View details: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
    to: team@example.com
    from: Scout QA <qa@example.com>
```

### Azure DevOps Implementation

```yaml
- task: SendEmail@1
  displayName: 'Send Email Notification'
  condition: always()
  inputs:
    To: 'team@example.com'
    From: 'qa@example.com'
    Subject: 'Scout Dashboard QA Results: $(Agent.JobStatus)'
    Body: |
      QA Test Results for $(Build.Repository.Name)
      
      Status: $(Agent.JobStatus)
      Branch: $(Build.SourceBranchName)
      Commit: $(Build.SourceVersion)
      
      View details: $(System.TeamFoundationCollectionUri)$(System.TeamProject)/_build/results?buildId=$(Build.BuildId)
    SmtpServer: '$(MAIL_SERVER)'
    SmtpPort: '$(MAIL_PORT)'
    SmtpUsername: '$(MAIL_USERNAME)'
    SmtpPassword: '$(MAIL_PASSWORD)'
```

## Customizing Notifications

For more detailed notifications, you can include information about:

1. **Specific Test Results**
   - Add data about which tests passed/failed
   - Include counts of tests in each category
   
2. **Performance Metrics**
   - Include Lighthouse performance score
   - Show Core Web Vitals measurements
   
3. **Visual Diffs**
   - Link to visual diff images
   - Show before/after screenshots for failed tests

## Troubleshooting

- **Notifications not sending**: Check webhook URLs and secrets
- **Empty messages**: Ensure payload format is correct
- **Missing attachments**: Use multipart/form-data for files
- **Rate limiting**: Check API limits of your messaging platform

## Additional Resources

- [Slack API Documentation](https://api.slack.com/messaging/webhooks)
- [Microsoft Teams Webhook Documentation](https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/connectors-using)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
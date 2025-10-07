# LinkedIn CSV Integration Guide

This guide explains how to set up and use the LinkedIn CSV integration for the Pulser system.

## Installation Steps

1. **Install Dependencies:**

   Navigate to the tools directory and install dependencies:

   ```bash
   cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools
   npm install
   ```

2. **Verify Installation:**

   Create a test CSV and run the processor:

   ```bash
   ./test_linkedin_processor.sh test
   ```

   This should create a test CSV file and process it successfully.

3. **Set Up CLI Integration:**

   The Pulser CLI integration is set up automatically when you install the dependencies. You can verify it by running:

   ```bash
   pulser linkedin --help
   ```

## Usage Workflows

### 1. Exporting Data from LinkedIn

1. Go to your LinkedIn Recruiter account (or LinkedIn Jobs dashboard)
2. Navigate to the applicants section
3. Select the applicants you want to export
4. Click "Export" and choose CSV format
5. Save the CSV file to your local machine (e.g., `~/Downloads/linkedin_applicants.csv`)

### 2. Processing from Command Line

Process the exported CSV file using the Pulser CLI:

```bash
pulser linkedin --file ~/Downloads/linkedin_applicants.csv --tags "Frontend,2025-Q2"
```

### 3. Processing from Web Interface

Upload the CSV file through the Pulser Web Interface:

1. Go to https://pulser-ai.app
2. Navigate to the LinkedIn Integration section
3. Upload the CSV file
4. Add tags and other options
5. Click "Process"

### 4. Viewing and Managing Applicants

After processing, you can:

1. View the Markdown report: 
   ```bash
   cat ~/.pulser/data/linkedin/[report_file].md
   ```

2. Analyze applicants with Claudia:
   ```bash
   pulser call claudia -- "Analyze the latest LinkedIn applicants for frontend developer position"
   ```

3. Create visualizations with Shogun:
   ```bash
   pulser call shogun -- "Create a visualization of applicant skills from latest LinkedIn data"
   ```

## Automating with Webhooks

You can set up a webhook to automatically process LinkedIn CSV exports:

1. Configure a webhook in your email system (e.g., Zoho Mail) to trigger when LinkedIn sends an export email
2. The webhook should call the Pulser API endpoint:
   ```
   POST http://localhost:3333/api/linkedin/process
   ```
3. Extract the CSV attachment from the email and provide its path in the request

### Example Webhook Configuration:

```json
{
  "trigger": "email_received",
  "conditions": {
    "from": "talent-solutions@linkedin.com",
    "subject_contains": "Your exported applicant data"
  },
  "action": {
    "type": "http_post",
    "url": "http://localhost:3333/api/linkedin/process",
    "payload": {
      "filePath": "${attachment_path}",
      "options": {
        "generateReport": true,
        "tags": ["Auto-Import"]
      }
    }
  }
}
```

## Integration with Zoho Mail

The LinkedIn CSV processor can be integrated with the Zoho Mail integration:

1. Set up the Zoho Mail integration as described in `/mail_configs/README_ZOHO_MAIL_SETUP.md`
2. Update your `.pulserrc` to include the LinkedIn processor configuration:

```yaml
integrations:
  zoho_mail:
    filters:
      - from: "talent-solutions@linkedin.com"
        subject_contains: "Your exported applicant data"
        action: "process_linkedin_csv"
```

3. Restart the Pulser backend:
```bash
./tools/launch_backend.sh
```

## Troubleshooting

### Common Issues:

1. **CSV format errors:**
   LinkedIn may change their export format. Check the column names in the CSV file and update the processor if needed.

2. **Missing dependencies:**
   If you get an error about missing modules, run:
   ```bash
   cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools
   npm install csvtojson
   ```

3. **Permission errors:**
   Make sure the `.pulser` directory exists and is writable:
   ```bash
   mkdir -p ~/.pulser/data/linkedin ~/.pulser/logs
   ```

### Logs:

Check the logs for more information:
```bash
cat ~/.pulser/logs/linkedin_processor.log
cat ~/.pulser/logs/pulser_exec.log
```

## Extending the Integration

To extend the LinkedIn CSV processor:

1. Add new fields to the `applicant` object in `linkedin_csv_processor.js`
2. Update the report generation function in `generateMarkdownReport()`
3. Add new command-line options to the `cli()` function and the `linkedin.js` command handler
4. Update the documentation in `/docs/linkedin/README.md`

## Contributing

If you make changes to the LinkedIn CSV processor, please:

1. Update the documentation
2. Test your changes with real LinkedIn CSV exports
3. Add a test case to the test script if needed
4. Submit your changes through the Pulser git proxy:
   ```bash
   pulser_git_proxy.sh
   ```
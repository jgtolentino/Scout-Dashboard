# LinkedIn CSV Integration for Pulser

This module allows you to process LinkedIn applicant CSV exports and integrate the data with the Pulser system.

## Features

- Process LinkedIn applicant CSV exports
- Transform applicant data into a standardized format
- Generate Markdown reports
- Store data in the Pulser system
- Add tags to applicants
- CLI integration with Pulser

## Usage

### Command Line Interface

Process a LinkedIn CSV export from the command line:

```bash
pulser linkedin --file ~/Downloads/linkedin_applicants.csv
```

With additional options:

```bash
pulser linkedin --file ~/Downloads/linkedin_applicants.csv --tags "Frontend,2025-Q2" --title "Frontend Developer Applicants May 2025"
```

### Command Options

| Option | Description |
|--------|-------------|
| `--file` | Path to the LinkedIn CSV export file (required) |
| `--output` | Output filename (defaults to timestamped name) |
| `--title` | Title for the report (defaults to "LinkedIn Applicants Report") |
| `--tags` | Comma-separated list of tags to add to all applicants |
| `--no-report` | Don't generate a Markdown report |
| `--include-raw` | Include raw CSV data in the output |
| `--help` | Show help text |

### API Integration

You can also use the API endpoint to process LinkedIn CSV exports:

```javascript
const response = await fetch('http://localhost:3333/api/linkedin/process', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    filePath: '/path/to/linkedin_export.csv',
    options: {
      generateReport: true,
      tags: ['Frontend', '2025-Q2'],
      title: 'Frontend Developer Applicants May 2025'
    }
  })
});

const result = await response.json();
console.log(result);
```

## Data Storage

Processed LinkedIn data is stored in the `~/.pulser/data/linkedin` directory. Each processed dataset is stored in a JSON file with a timestamp-based filename.

Reports are stored in the same directory with a `_report.md` suffix.

## Logs

Logs for the LinkedIn CSV processor are stored in `~/.pulser/logs/linkedin_processor.log`.

## Integration with Other Pulser Components

### Data for Claudia

The LinkedIn applicant data can be integrated with Claudia to enable applicant ranking, matching, and analysis:

```bash
pulser call claudia -- "Analyze the latest LinkedIn applicants for frontend developer position"
```

### Data for Shogun

The LinkedIn applicant data can be used by Shogun to generate applicant profile visualizations:

```bash
pulser call shogun -- "Create a visualization of applicant skills from latest LinkedIn data"
```

## LinkedIn CSV Format

The processor expects CSV exports from LinkedIn with the following columns:

- First Name
- Last Name
- Email
- Phone Number / Mobile Phone
- LinkedIn Profile / Profile URL
- Job Title / Current Position
- Company / Current Company
- Date Applied / Application Date
- Resume / Resume URL
- Status
- Notes

Additional columns will be preserved in the raw data if `--include-raw` is used.

## Development

To modify the LinkedIn CSV processor, edit the following files:

- `/tools/linkedin_csv_processor.js` - The main processor module
- `/tools/js/router/commands/linkedin.js` - The Pulser CLI command handler
- `/docs/linkedin/README.md` - This documentation file

After modifying, run:

```bash
npm install --prefix /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools
```

To install any additional dependencies.
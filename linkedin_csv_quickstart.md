# LinkedIn Applicant CSV Processing Guide

This guide shows how to use Pulser's LinkedIn integration to review job applicants.

## Basic Usage

When you receive applicants via LinkedIn, download the CSV and process it with:

```bash
pulser linkedin --file ~/Downloads/applicants_2025.csv
```

This will:
1. Parse the CSV data
2. Generate a formatted report in `.pulser/data/linkedin/`
3. Save structured applicant data for later use

## Tagging Applicants

You can add role-specific tags to categorize applicants:

```bash
pulser linkedin --file ~/Downloads/applicants_2025.csv --tags "Marketing,Q2-2025,SocialMedia"
```

## Viewing Reports

After processing, the system will tell you where the report is saved. View it with:

```bash
cat ~/.pulser/data/linkedin/linkedin_applicants_<timestamp>_report.md
```

## Integration with Pulser Agents

The LinkedIn data integrates with Claudia and Edge for automatic candidate screening:

```bash
# Have Edge review all applicants
:surf --goal "Review all LinkedIn applicants for Business Development Specialist role and identify top 3 candidates for interview" --backend "claude"
```

## Sample Command Sequence

```bash
# Download CSV from LinkedIn
# Then process it:
pulser linkedin --file ~/Downloads/applicants_business_dev_may10.csv --tags "BusinessDev,JuniorLevel"

# View the report
cat <report-path-from-output>

# Let Claude help analyze candidates
:task "Review business development applicants and sort by experience with Meta Ads"
```

Need further customization? Check the full documentation in `/docs/linkedin/INTEGRATION.md`
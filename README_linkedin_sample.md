# LinkedIn Sample Data Generator

This script generates realistic sample LinkedIn applicant data for testing the InsightPulseAI LinkedIn integration without requiring real data from LinkedIn.

## Usage

```bash
# Basic usage (generates 8 sample applicants)
./generate_linkedin_sample.py

# Generate more applicants (e.g., 15)
./generate_linkedin_sample.py --count 15

# Specify a custom output location
./generate_linkedin_sample.py --output ~/Desktop/my_applicants.csv

# Specify the job title 
./generate_linkedin_sample.py --job-title "Marketing Specialist"
```

## Default Behavior

By default, the script:
- Generates 8 fictional applicants with varied backgrounds
- Saves the CSV file to `~/Downloads/linkedin_applicants_sample.csv`
- Uses "Business Development Specialist" as the job title

## Testing with Pulser

After generating the sample data, you can test the LinkedIn integration:

```bash
# Process the generated sample
pulser linkedin --file ~/Downloads/linkedin_applicants_sample.csv

# Process with tags
pulser linkedin --file ~/Downloads/linkedin_applicants_sample.csv --tags "Marketing,Q2-2025"
```

## Sample Data Fields

The generated CSV includes realistic data for:
- Personal information (name, email, phone)
- Professional background (current position, experience)
- Education and skills
- Application details
- And more

All data is randomly generated and fictional.

## Notes

- This is for testing purposes only - the data is entirely fictional
- Each run generates different random profiles
- The file is compatible with the existing LinkedIn processor
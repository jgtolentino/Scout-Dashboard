#!/bin/bash
# Test script for LinkedIn CSV processor

# Check if a CSV file is provided
if [ -z "$1" ]; then
  echo "Usage: $0 /path/to/linkedin_export.csv [options]"
  echo "Example: $0 ~/Downloads/linkedin_applicants.csv --tags Frontend,2025-Q2"
  exit 1
fi

CSV_FILE="$1"
shift

# Check if the file exists
if [ ! -f "$CSV_FILE" ]; then
  echo "Error: File does not exist: $CSV_FILE"
  exit 1
fi

# Create a simple test CSV if testing without a real file
if [ "$CSV_FILE" == "test" ]; then
  TEST_CSV="/tmp/linkedin_test_export.csv"
  echo "Creating test CSV file at: $TEST_CSV"
  
  cat > "$TEST_CSV" << EOF
First Name,Last Name,Email,Phone Number,LinkedIn Profile,Job Title,Company,Date Applied,Status,Notes
John,Doe,john.doe@example.com,123-456-7890,https://linkedin.com/in/johndoe,Frontend Developer,Acme Inc,2025-05-01,New,Skilled in React
Jane,Smith,jane.smith@example.com,987-654-3210,https://linkedin.com/in/janesmith,UX Designer,Design Co,2025-05-02,New,Great portfolio
Alex,Johnson,alex.johnson@example.com,555-123-4567,https://linkedin.com/in/alexjohnson,Full Stack Developer,Tech Solutions,2025-05-03,New,Nodejs expert
EOF
  
  CSV_FILE="$TEST_CSV"
  echo "Test CSV file created."
fi

echo "Processing LinkedIn CSV file: $CSV_FILE"

# Run the LinkedIn CSV processor
node "$(dirname "$0")/linkedin_csv_processor.js" --file "$CSV_FILE" "$@"

# Check if processing was successful
if [ $? -eq 0 ]; then
  echo "LinkedIn CSV processing completed successfully."
  echo "To view the processed data directory, run:"
  echo "  ls -la ~/.pulser/data/linkedin/"
else
  echo "LinkedIn CSV processing failed."
  exit 1
fi
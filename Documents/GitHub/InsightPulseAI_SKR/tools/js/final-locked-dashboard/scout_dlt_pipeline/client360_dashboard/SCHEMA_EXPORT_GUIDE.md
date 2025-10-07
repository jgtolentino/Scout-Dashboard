# DBML Schema Export Guide

## Overview

This document explains the DBML (Database Markup Language) schema export process that runs as part of the CI/CD pipeline for the Client360 Dashboard.

## What is DBML?

DBML is a simple, readable DSL language designed to define database schemas and relationships. It provides:

- A human-readable way to define database structures
- Clear visualization of relationships between tables
- The ability to export to SQL, JSON, and other formats

## Schema Export Process

The CI/CD pipeline includes a `export-dbml-schema` job that:

1. Runs automatically after successful production deployment
2. Converts the `schema/client360.dbml` file to PostgreSQL format
3. Uploads the exported schema as a build artifact for documentation

This job helps ensure that our schema documentation stays up-to-date with each production release.

## How to Access Exported Schema

After each production deployment, you can access the exported schema files in the following ways:

1. **GitHub Actions**: Go to the Actions tab in the repository, select the completed workflow run, and download the "dbml-schema-export" artifact.

2. **Manually**: Clone the repository and run the export locally:
   ```bash
   # Install DBML CLI if not already installed
   npm install -g @dbml/cli
   
   # Export the schema to SQL
   dbml2sql --postgres -o schema_export/schema.sql schema/client360.dbml
   ```

## Updating the Schema

To update the database schema:

1. Edit `schema/client360.dbml` with your changes
2. Commit and push your changes
3. The next deployment will automatically generate an updated schema export

## Schema Visualization

You can visualize the schema using the DBML tools:

1. Visit [dbdiagram.io](https://dbdiagram.io)
2. Import the `client360.dbml` file
3. View the relationship diagram and make edits if needed

## Support

For questions about the schema or export process, contact the data architecture team.
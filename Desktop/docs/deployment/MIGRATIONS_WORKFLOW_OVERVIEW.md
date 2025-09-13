# SQL Migrations GitHub Actions Job

This job runs on every push to `main` and:

1. Installs **mssql-tools** for `sqlcmd`.  
2. Loads your `SQL_SERVER`, `SQL_USERNAME`, and `SQL_PASSWORD` secrets.  
3. Loops through `migrations/*.sql` in chronological order.  
4. Applies each script via:

   ```bash
   sqlcmd -S "$SQL_SERVER" -U "$SQL_USERNAME" -P "$SQL_PASSWORD" -i "$file"
   ```

> **Tip:** Failures halt the pipeline immediately, so fix the first error before re-running.

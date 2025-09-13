## Required GitHub Secrets

- `SQL_SERVER`         – e.g. `projectscout-sql-server.database.windows.net`  
- `SQL_USERNAME`       – e.g. `projectscout-admin`  
- `SQL_PASSWORD`       – e.g. _your strong DB password_  
- _(existing secrets…)_  

## Set GitHub Secrets

```bash
gh secret set SQL_SERVER   --body "projectscout-sql-server.database.windows.net"
gh secret set SQL_USERNAME --body "projectscout-admin"
gh secret set SQL_PASSWORD --body "${YOUR_DB_PASSWORD}"

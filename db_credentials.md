# Database Credentials for PH Awards Project

## Standard Credentials for All Database Access

```
Server: tbwa-ces-model-server.database.windows.net
Database: CESDatabank
Username: TBWA
Password: R@nd0mPA$2025!  (with $ interpreted as literal)
Resource Group: RG-TBWA-ProjectScout-Data
```

## How to Use in Different Contexts

### Python Connection String

```python
SQL_CONN_STR = (
    "Driver=/opt/homebrew/lib/libmsodbcsql.17.dylib;"
    "Server=tbwa-ces-model-server.database.windows.net;"
    "Database=CESDatabank;"
    "Uid=TBWA;"
    "Pwd=R@nd0mPA$2025!;"  # The $ is a literal character here
    "Encrypt=yes;"
    "TrustServerCertificate=no;"
    "Connection Timeout=30;"
)
```

### Shell Script Variables

```bash
export SQLCMDUSER="TBWA"
export SQLCMDPASSWORD="R@nd0mPA\$2025!"  # $ must be escaped in shell
SERVER="tbwa-ces-model-server"
DATABASE="CESDatabank"
RESOURCE_GROUP="RG-TBWA-ProjectScout-Data"
```

### SQL Server Command (sqlcmd)

```bash
sqlcmd -S tbwa-ces-model-server.database.windows.net -d CESDatabank -U TBWA -P "R@nd0mPA$2025!"
```

### Azure CLI Command

```bash
az sql db query \
  --server tbwa-ces-model-server \
  --name CESDatabank \
  --resource-group RG-TBWA-ProjectScout-Data \
  --query-file "your_sql_file.sql"
```

### SQL Script for Creating Login

```sql
CREATE LOGIN [TBWA] WITH PASSWORD = 'R@nd0mPA$2025!';
```

## Important Notes

- The password contains a dollar sign ($) which needs special handling in some contexts
- In shell scripts, the $ needs to be escaped with a backslash: \$
- In string literals, the $ is interpreted literally
- Always use these exact credentials consistently across all scripts
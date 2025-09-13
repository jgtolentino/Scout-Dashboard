### Prerequisites

- Azure CLI (latest)  
- `sqlcmd` (from mssql-tools)  
  ```bash
  # on Ubuntu 20.04
  curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
  curl https://packages.microsoft.com/config/ubuntu/20.04/prod.list \
    | sudo tee /etc/apt/sources.list.d/mssql-release.list
  sudo apt-get update
  sudo ACCEPT_EULA=Y apt-get install -y mssql-tools unixodbc-dev
  echo 'export PATH="$PATH:/opt/mssql-tools/bin"' >> ~/.bashrc
  source ~/.bashrc
  ```

## Deploy database schema

From the repo root run:

```bash
for f in migrations/*.sql; do
  echo "Applying $f"
  sqlcmd \
    -S $SQL_SERVER \
    -U $SQL_USERNAME \
    -P $SQL_PASSWORD \
    -i "$f"
done

#!/bin/bash

# Pulser Task: :gagambi-docker-boot
# Description: Bootstrap Gagambi MySQL in Docker

echo "🐳 Bootstrapping Gagambi MySQL..."

# Stop any existing MySQL services to free port 3306
brew services stop mysql 2>/dev/null
sudo launchctl unload -F /Library/LaunchDaemons/com.oracle.oss.mysql.mysqld.plist 2>/dev/null

# Check if container exists
if docker ps -a | grep -q mysql-gagambi; then
    echo "♻️  Resetting existing container..."
    docker stop mysql-gagambi
    docker rm mysql-gagambi
fi

# Start fresh MySQL container
docker run -d \
  --name mysql-gagambi \
  -e MYSQL_ROOT_PASSWORD='R@nd0mPA$2025!' \
  -e MYSQL_DATABASE=gagambi_db \
  -e MYSQL_USER=TBWA \
  -e MYSQL_PASSWORD='R@nd0mPA$2025!' \
  -p 3306:3306 \
  mysql:8.0

echo "⏳ Waiting for MySQL to initialize..."
for i in {1..30}; do
    if docker exec mysql-gagambi mysql -u TBWA -p'R@nd0mPA$2025!' -e "SELECT 1;" gagambi_db &>/dev/null; then
        echo "✅ MySQL is ready!"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

# Import schema if provided
if [ -f "scripts/init-mysql.sql" ]; then
    echo "📦 Importing schema..."
    docker cp scripts/init-mysql.sql mysql-gagambi:/init.sql
    docker exec mysql-gagambi bash -c "mysql -u TBWA -p'R@nd0mPA$2025!' gagambi_db < /init.sql"
    echo "✅ Schema imported!"
fi

echo ""
echo "🎉 Gagambi MySQL is running!"
echo "   Connect with: mysql -u TBWA -p'R@nd0mPA\$2025!' -h 127.0.0.1 gagambi_db"
echo "   MySQL Workbench: 127.0.0.1:3306 | TBWA | R@nd0mPA\$2025!"
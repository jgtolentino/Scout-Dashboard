-- SQL Commands to create new user for TBWA Creative Intelligence
-- These commands must be run by an existing admin user

-- 1. Create login at server level (run in master database)
USE master;
GO

CREATE LOGIN tbwa_admin 
WITH PASSWORD = 'R@nd0mPA$$2025!';
GO

-- 2. Create user in target database
USE [SQL-TBWA-ProjectScout-Reporting-Prod];
GO

CREATE USER tbwa_admin FOR LOGIN tbwa_admin;
GO

-- 3. Grant necessary permissions
ALTER ROLE db_datareader ADD MEMBER tbwa_admin;
ALTER ROLE db_datawriter ADD MEMBER tbwa_admin;
ALTER ROLE db_ddladmin ADD MEMBER tbwa_admin;
GO

-- 4. Grant additional permissions for table creation
GRANT CREATE TABLE TO tbwa_admin;
GRANT ALTER ON SCHEMA::dbo TO tbwa_admin;
GO

-- Optional: Create a more restricted user for application access
CREATE LOGIN tbwa_app_user 
WITH PASSWORD = 'R@nd0mPA$$2025!';
GO

CREATE USER tbwa_app_user FOR LOGIN tbwa_app_user;
GO

ALTER ROLE db_datareader ADD MEMBER tbwa_app_user;
ALTER ROLE db_datawriter ADD MEMBER tbwa_app_user;
GO
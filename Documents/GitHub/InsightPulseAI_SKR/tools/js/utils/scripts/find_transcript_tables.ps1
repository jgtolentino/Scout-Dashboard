# Find Transcript Tables Across Azure SQL Databases
# PowerShell script to identify which database contains the TranscriptionResults table
# Created: 2025-05-12

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerName, # e.g. sqltbwaprojectscoutserver.database.windows.net
    
    [Parameter(Mandatory=$true)]
    [string]$Username, # e.g. tbwa_admin
    
    [Parameter(Mandatory=$true)]
    [string]$Password,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFile = "transcript_table_scan_results.txt"
)

# Import SQL Server module if available (install with Install-Module -Name SqlServer)
if (-not (Get-Module -ListAvailable -Name SqlServer)) {
    Write-Host "SqlServer module not found. Attempting to use traditional SQL connection methods." -ForegroundColor Yellow
}
else {
    Import-Module SqlServer
}

# SQL query to get all non-system databases
$DatabasesQuery = @"
SELECT name FROM sys.databases 
WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')
  AND state_desc = 'ONLINE'
ORDER BY name;
"@

# SQL query to check for TranscriptionResults table
$TableCheckQuery = @"
SELECT 
    DB_NAME() AS DatabaseName,
    t.name AS TableName,
    SCHEMA_NAME(t.schema_id) AS SchemaName,
    (SELECT COUNT(*) FROM sys.columns WHERE object_id = t.object_id) AS ColumnCount,
    p.rows AS RowEstimate
FROM sys.tables t
INNER JOIN sys.indexes i ON t.object_id = i.object_id
INNER JOIN sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
WHERE t.name LIKE '%Transcript%' 
   OR t.name LIKE '%Speech%'
   OR t.name LIKE '%STT%'
   OR t.name LIKE '%Recognition%'
   OR t.name LIKE '%Entity%'
   OR t.name LIKE '%Brand%'
   OR t.name = 'TranscriptionResults'
GROUP BY t.name, t.schema_id, t.object_id, p.rows;
"@

# SQL query to check columns of a specific table
$ColumnCheckQuery = @"
SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable
FROM sys.columns c
JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('{0}.{1}')
ORDER BY c.column_id;
"@

# Function to run SQL query
function Run-SqlQuery {
    param (
        [string]$ServerName,
        [string]$DatabaseName,
        [string]$Username,
        [string]$Password,
        [string]$Query
    )

    try {
        # Try using SqlServer PowerShell module if available
        if (Get-Module -ListAvailable -Name SqlServer) {
            return Invoke-Sqlcmd -ServerInstance $ServerName -Database $DatabaseName -Username $Username -Password $Password -Query $Query -ErrorAction Stop
        }
        else {
            # Manual SQL connection
            $connectionString = "Server=$ServerName;Database=$DatabaseName;User ID=$Username;Password=$Password;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
            $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
            $command = New-Object System.Data.SqlClient.SqlCommand($Query, $connection)
            $adapter = New-Object System.Data.SqlClient.SqlDataAdapter($command)
            $dataset = New-Object System.Data.DataSet
            
            $connection.Open()
            $adapter.Fill($dataset) | Out-Null
            $connection.Close()
            
            return $dataset.Tables[0]
        }
    }
    catch {
        Write-Host "Error executing query on database '$DatabaseName': $_" -ForegroundColor Red
        return $null
    }
}

# Start output file
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"# TranscriptionResults Table Scan Results" | Out-File -FilePath $OutputFile
"# Generated: $timestamp" | Out-File -FilePath $OutputFile -Append
"# Server: $ServerName" | Out-File -FilePath $OutputFile -Append
"" | Out-File -FilePath $OutputFile -Append

Write-Host "Starting database scan on $ServerName..." -ForegroundColor Cyan

# Get list of databases
Write-Host "Retrieving database list..." -ForegroundColor Yellow
$databases = Run-SqlQuery -ServerName $ServerName -DatabaseName "master" -Username $Username -Password $Password -Query $DatabasesQuery

if ($null -eq $databases -or $databases.Count -eq 0) {
    Write-Host "No databases found or unable to access database list." -ForegroundColor Red
    exit
}

# Display found databases
Write-Host "Found $($databases.Count) databases:" -ForegroundColor Green
$databases.name | ForEach-Object { Write-Host "  - $_" }

$results = @()

# Check each database for TranscriptionResults table
foreach ($db in $databases) {
    $dbName = $db.name
    Write-Host "Scanning database '$dbName'..." -ForegroundColor Yellow
    
    $tables = Run-SqlQuery -ServerName $ServerName -DatabaseName $dbName -Username $Username -Password $Password -Query $TableCheckQuery
    
    if ($null -ne $tables -and $tables.Count -gt 0) {
        Write-Host "  Found $($tables.Count) potential transcript tables in '$dbName'" -ForegroundColor Green
        
        foreach ($table in $tables) {
            $result = [PSCustomObject]@{
                DatabaseName = $dbName
                TableName = $table.TableName
                SchemaName = $table.SchemaName
                ColumnCount = $table.ColumnCount
                RowEstimate = $table.RowEstimate
                HasTranscriptionText = $false
                HasBrandMentions = $false
            }
            
            # Check columns
            $columnsQuery = $ColumnCheckQuery -f $table.SchemaName, $table.TableName
            $columns = Run-SqlQuery -ServerName $ServerName -DatabaseName $dbName -Username $Username -Password $Password -Query $columnsQuery
            
            if ($null -ne $columns) {
                $transcriptColumns = @('TranscriptionText', 'Transcription', 'SpeechText', 'Text')
                $brandColumns = @('BrandMentions', 'Brands', 'MentionedBrands', 'EntityMentions')
                
                foreach ($column in $columns) {
                    if ($transcriptColumns -contains $column.ColumnName) {
                        $result.HasTranscriptionText = $true
                    }
                    if ($brandColumns -contains $column.ColumnName) {
                        $result.HasBrandMentions = $true
                    }
                }
                
                # Log columns of interest
                $columnsText = $columns | ForEach-Object { "      - $($_.ColumnName) ($($_.DataType))" }
                "  Table: $($table.SchemaName).$($table.TableName)" | Out-File -FilePath $OutputFile -Append
                "    Columns: $($columns.Count)" | Out-File -FilePath $OutputFile -Append
                "    Estimated Rows: $($table.RowEstimate)" | Out-File -FilePath $OutputFile -Append
                "    Has Transcription Text: $($result.HasTranscriptionText)" | Out-File -FilePath $OutputFile -Append
                "    Has Brand Mentions: $($result.HasBrandMentions)" | Out-File -FilePath $OutputFile -Append
                "    Columns:" | Out-File -FilePath $OutputFile -Append
                $columnsText | Out-File -FilePath $OutputFile -Append
                "" | Out-File -FilePath $OutputFile -Append
            }
            
            $results += $result
        }
    }
    else {
        Write-Host "  No relevant tables found in '$dbName'" -ForegroundColor Gray
    }
}

# Generate recommendations
"## RECOMMENDATIONS" | Out-File -FilePath $OutputFile -Append
"" | Out-File -FilePath $OutputFile -Append

$enrichmentTargets = $results | Where-Object { 
    $_.HasTranscriptionText -eq $true -and 
    (-not ($_.DatabaseName -like "*Reporting*")) -and
    (-not ($_.DatabaseName -like "*ReadOnly*")) -and
    (-not ($_.DatabaseName -like "*Archive*"))
}

if ($enrichmentTargets.Count -gt 0) {
    $primaryTarget = $enrichmentTargets | Sort-Object RowEstimate -Descending | Select-Object -First 1
    
    "### PRIMARY ENRICHMENT TARGET" | Out-File -FilePath $OutputFile -Append
    "Database: $($primaryTarget.DatabaseName)" | Out-File -FilePath $OutputFile -Append
    "Table: $($primaryTarget.SchemaName).$($primaryTarget.TableName)" | Out-File -FilePath $OutputFile -Append
    "Estimated Rows: $($primaryTarget.RowEstimate)" | Out-File -FilePath $OutputFile -Append
    "" | Out-File -FilePath $OutputFile -Append
    
    # SQL commands to implement
    "### IMPLEMENTATION SQL" | Out-File -FilePath $OutputFile -Append
    "```sql" | Out-File -FilePath $OutputFile -Append
    "USE $($primaryTarget.DatabaseName);" | Out-File -FilePath $OutputFile -Append
    "GO" | Out-File -FilePath $OutputFile -Append
    "" | Out-File -FilePath $OutputFile -Append
    "-- Create TranscriptEntityMentions table" | Out-File -FilePath $OutputFile -Append
    "CREATE TABLE dbo.TranscriptEntityMentions (" | Out-File -FilePath $OutputFile -Append
    "  InteractionID     VARCHAR(60)   NOT NULL," | Out-File -FilePath $OutputFile -Append
    "  ChunkIndex        INT           NOT NULL," | Out-File -FilePath $OutputFile -Append
    "  MentionedBrand    NVARCHAR(255) NOT NULL," | Out-File -FilePath $OutputFile -Append
    "  ConfidenceScore   FLOAT         NULL," | Out-File -FilePath $OutputFile -Append
    "  DeviceID          VARCHAR(60)   NULL," | Out-File -FilePath $OutputFile -Append
    "  DetectedAt        DATETIME2     DEFAULT SYSDATETIME()," | Out-File -FilePath $OutputFile -Append
    "  PRIMARY KEY (InteractionID, ChunkIndex, MentionedBrand)," | Out-File -FilePath $OutputFile -Append
    "  FOREIGN KEY (InteractionID, ChunkIndex)" | Out-File -FilePath $OutputFile -Append
    "    REFERENCES $($primaryTarget.SchemaName).$($primaryTarget.TableName)(InteractionID, ChunkIndex)" | Out-File -FilePath $OutputFile -Append
    ");" | Out-File -FilePath $OutputFile -Append
    "" | Out-File -FilePath $OutputFile -Append
    "-- Create indexes" | Out-File -FilePath $OutputFile -Append
    "CREATE INDEX idx_brand_mentions_device ON dbo.TranscriptEntityMentions(DeviceID);" | Out-File -FilePath $OutputFile -Append
    "CREATE INDEX idx_brand_mentions_brand ON dbo.TranscriptEntityMentions(MentionedBrand);" | Out-File -FilePath $OutputFile -Append
    "```" | Out-File -FilePath $OutputFile -Append
    "" | Out-File -FilePath $OutputFile -Append
    
    # Update next steps
    "### NEXT STEPS" | Out-File -FilePath $OutputFile -Append
    "1. Connect to the $($primaryTarget.DatabaseName) database" | Out-File -FilePath $OutputFile -Append
    "2. Execute the SQL commands above to create the TranscriptEntityMentions table" | Out-File -FilePath $OutputFile -Append
    "3. Update the connection string in brand_explode.py to use this database" | Out-File -FilePath $OutputFile -Append
    "4. Run the brand detection test script on this database" | Out-File -FilePath $OutputFile -Append
    "" | Out-File -FilePath $OutputFile -Append
}
else {
    "No suitable enrichment targets found." | Out-File -FilePath $OutputFile -Append
    "Consider creating a new enrichment database or checking permissions." | Out-File -FilePath $OutputFile -Append
    "" | Out-File -FilePath $OutputFile -Append
}

# Final summary 
$transcriptTableCount = ($results | Where-Object { $_.HasTranscriptionText -eq $true }).Count
$brandTableCount = ($results | Where-Object { $_.HasBrandMentions -eq $true }).Count

"## SUMMARY" | Out-File -FilePath $OutputFile -Append
"Databases scanned: $($databases.Count)" | Out-File -FilePath $OutputFile -Append
"Tables with transcription text found: $transcriptTableCount" | Out-File -FilePath $OutputFile -Append
"Tables with brand mentions found: $brandTableCount" | Out-File -FilePath $OutputFile -Append
"Potential enrichment targets identified: $($enrichmentTargets.Count)" | Out-File -FilePath $OutputFile -Append

Write-Host "`nScan completed!" -ForegroundColor Green
Write-Host "Results saved to: $OutputFile" -ForegroundColor Cyan

# If enrichment targets found, display the primary recommendation
if ($enrichmentTargets.Count -gt 0) {
    Write-Host "`nRECOMMENDED TARGET:" -ForegroundColor Green
    Write-Host "Database: $($primaryTarget.DatabaseName)" -ForegroundColor Yellow
    Write-Host "Table: $($primaryTarget.SchemaName).$($primaryTarget.TableName)" -ForegroundColor Yellow
    Write-Host "See $OutputFile for implementation details" -ForegroundColor Cyan
}
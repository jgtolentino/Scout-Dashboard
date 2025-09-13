# Azure Advisor Remediation Guide
## For TBWA-ProjectScout-Prod Subscription

This guide provides instructions for addressing the issues identified in Azure Advisor for the TBWA-ProjectScout-Prod subscription.

## 📊 Current Azure Advisor Scores

| Category | Score | Recommendations | High Impact |
|----------|-------|-----------------|------------|
| **Cost** | 12% | 14 | 14 |
| **Security** | 27% | 52 | 12 |
| **Reliability** | 72% | 17 | 5 |
| **Operational Excellence** | 100% | 0 | 0 |
| **Performance** | 100% | 0 | 0 |

## 🔧 Scripts Provided

This package includes several scripts to help remediate the issues:

1. **azure-advisor-remediation-unified.sh** - New unified Bash script with improved safety controls and features
2. **azure-advisor-remediation-unified.ps1** - New unified PowerShell script with improved safety controls and features
3. **fix-azure-advisor-cli-fixed.sh** - CLI-based script with WhatIf mode for safely applying fixes
4. **azure-advisor-remediation.sh** - Bash script for analyzing issues and creating a report
5. **azure-advisor-powershell.ps1** - PowerShell script for analyzing issues and creating a report
6. **azure-advisor-direct-fixes.ps1** - PowerShell script to apply fixes directly (with WhatIf option)

## 🚀 How to Use The New Unified Scripts

### Option 1: Unified Bash Script (Linux/macOS)

The new unified Bash script provides the most comprehensive, safe approach to remediation:

```bash
# Make the script executable
chmod +x azure-advisor-remediation-unified.sh

# Show help
./azure-advisor-remediation-unified.sh --help

# Run in simulation mode (default) for security recommendations
./azure-advisor-remediation-unified.sh --fix-security

# Apply security fixes (use with caution)
./azure-advisor-remediation-unified.sh --fix-security --apply

# Apply all fixes (use with extreme caution)
./azure-advisor-remediation-unified.sh --fix-all --apply
```

**Parameters:**
- `--help` - Show usage information
- `--subscription NAME` - Azure subscription name (default: TBWA-ProjectScout-Prod)
- `--apply` - Apply changes (default mode is simulation)
- `--fix-cost` - Fix cost recommendations
- `--fix-security` - Fix security recommendations
- `--fix-reliability` - Fix reliability recommendations
- `--fix-all` - Fix all recommendations

### Option 2: Unified PowerShell Script (Windows)

The new unified PowerShell script provides the same functionality but for Windows environments:

```powershell
# Show help
./azure-advisor-remediation-unified.ps1 -Help

# Run in simulation mode (default) for security recommendations
./azure-advisor-remediation-unified.ps1 -FixSecurity

# Apply security fixes (use with caution)
./azure-advisor-remediation-unified.ps1 -FixSecurity -Apply

# Apply all fixes (use with extreme caution)
./azure-advisor-remediation-unified.ps1 -FixAll -Apply
```

**Parameters:**
- `-Help` - Show usage information
- `-SubscriptionName NAME` - Azure subscription name (default: TBWA-ProjectScout-Prod)
- `-Apply` - Apply changes (default mode is simulation)
- `-FixCost` - Fix cost recommendations
- `-FixSecurity` - Fix security recommendations
- `-FixReliability` - Fix reliability recommendations
- `-FixAll` - Fix all recommendations

### Option 3: Original CLI-based Remediation

Our previous script is still available:

```bash
# Make the script executable
chmod +x fix-azure-advisor-cli-fixed.sh

# Run in simulation mode (no changes applied)
./fix-azure-advisor-cli-fixed.sh --fix-all

# Apply security fixes only
./fix-azure-advisor-cli-fixed.sh --fix-security --whatif false

# Apply all fixes
./fix-azure-advisor-cli-fixed.sh --fix-all --whatif false
```

### Option 4: Analysis Only Scripts

To analyze the issues without making changes:

**Bash:**
```bash
# Make the script executable
chmod +x azure-advisor-remediation.sh

# Run the script
./azure-advisor-remediation.sh
```

**PowerShell:**
```powershell
# Run the script
./azure-advisor-powershell.ps1
```

### Option 5: PowerShell Direct Fixes

To apply fixes directly using PowerShell (use with caution):

```powershell
# Test mode (no changes made)
./azure-advisor-direct-fixes.ps1 -WhatIf -FixAll

# Apply fixes for specific categories
./azure-advisor-direct-fixes.ps1 -FixCost
./azure-advisor-direct-fixes.ps1 -FixSecurity
./azure-advisor-direct-fixes.ps1 -FixReliability

# Apply all fixes
./azure-advisor-direct-fixes.ps1 -FixAll
```

## 📝 Automated Fixes by Category

### 💰 Cost (12%)

The script implements these cost optimizations:

1. **Identify Reserved Instance opportunities**
   - SQL Database Reserved Instances (reports created for manual purchase)
   - Virtual Machine Reserved Instances (reports created for manual purchase)
   - Savings Plans (reports created for manual purchase)

2. **Right-size underutilized VMs**
   - Automatically identifies underutilized VMs
   - Resizes to more appropriate (smaller) VM sizes
   - Default targets B-series VMs for cost efficiency

3. **Clean up unattached disks**
   - Creates a safety snapshot before deletion
   - Removes unattached disks to eliminate unnecessary storage costs

### 🔒 Security (27%)

The script implements these security enhancements:

1. **Enable Azure Security Defaults**
   - Sets tenant-wide security defaults
   - Improves baseline security posture

2. **Enable Azure Defender (Security Center)**
   - Enables standard tier for key services:
     - Virtual Machines
     - SQL Servers
     - App Services
     - Storage Accounts
     - Key Vaults
     - Containers

3. **Restrict network access**
   - Configures NSG rules to restrict management ports access
   - Limits SSH/RDP access to specific IP ranges (configurable)
   - Blocks public access to management ports

4. **Enable Just-in-Time VM Access**
   - Configures JIT access for vulnerable VMs
   - Secures management ports with on-demand access

5. **Configure SQL Server security**
   - Sets up Azure AD administration for SQL servers

6. **Implement Key Vault security**
   - Enables firewall rules on Key Vaults
   - Restricts access to authorized networks
   - Allows Azure service access

7. **Enable disk encryption**
   - Creates Key Vaults for encryption keys if needed
   - Enables Azure Disk Encryption for VMs

### 🔄 Reliability (72%)

The script implements these reliability improvements:

1. **Enable Soft Delete for Blob Storage**
   - Configures 7-day retention period
   - Protects against accidental or malicious deletion

2. **Configure VM backup**
   - Creates Recovery Services vaults if needed
   - Enables daily backups with standard retention policy

3. **Set up Service Health alerts**
   - Creates email notification action groups
   - Configures alerts for service health events

4. **Improve storage redundancy**
   - Upgrades Local Redundant Storage (LRS) to Geo-Redundant Storage (GRS)
   - Upgrades Premium LRS to Premium Zone-Redundant Storage (ZRS)

5. **Identify Zone Redundancy opportunities**
   - Creates reports for resources that could benefit from zone redundancy
   - Provides specific implementation commands in the report

## 📊 Generated Reports and Artifacts

The script creates a remediation directory containing:

1. **Complete advisor recommendations JSON**
   - Raw data from Azure Advisor
   - Used for detailed analysis

2. **Comprehensive remediation report**
   - Summary of all actions taken
   - Count of recommendations by category
   - List of all applied fixes

3. **Resource-specific recommendation reports**
   - Reserved Instance purchase opportunities
   - Zone Redundancy implementation guides
   - Storage redundancy upgrade recommendations

## ✅ Verification Process

After applying fixes:

1. Run Azure Advisor again to verify improvements
2. Check the remediation report directory for detailed logs
3. Monitor score changes in each category
4. Address any remaining recommendations
5. Document the changes made

## 📈 Regular Maintenance

To ensure continued optimization:

1. Schedule monthly execution of the remediation script
2. Set up Azure Advisor notifications
3. Create maintenance windows for applying fixes
4. Track improvement in Advisor scores over time

## ⚠️ Important Notes

- Always use `--whatif true` first to simulate changes
- Test in non-production environments before applying to production
- Take snapshots or backups before making significant changes
- Some recommendations require downtime (e.g., VM resizing)
- Schedule changes during maintenance windows
- Document all changes for future reference

## 🔍 Additional Resources

- [Azure Advisor Documentation](https://docs.microsoft.com/en-us/azure/advisor/)
- [Azure Security Center Best Practices](https://docs.microsoft.com/en-us/azure/security-center/security-center-recommendations)
- [Azure Cost Management](https://docs.microsoft.com/en-us/azure/cost-management-billing/)
- [Azure Backup Documentation](https://docs.microsoft.com/en-us/azure/backup/)
- [Azure Availability Zones](https://docs.microsoft.com/en-us/azure/availability-zones/az-overview)
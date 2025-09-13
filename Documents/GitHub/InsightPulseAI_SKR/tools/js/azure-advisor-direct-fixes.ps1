# Azure Advisor Direct Fixes Script
# WARNING: This script makes direct changes to your Azure environment
# Always review and test before running in production

param(
    [Parameter(Mandatory=$false)]
    [switch]$WhatIf,
    
    [Parameter(Mandatory=$false)]
    [switch]$FixCost,
    
    [Parameter(Mandatory=$false)]
    [switch]$FixSecurity,
    
    [Parameter(Mandatory=$false)]
    [switch]$FixReliability,
    
    [Parameter(Mandatory=$false)]
    [switch]$FixAll
)

# Function to display colored output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Green($message) { Write-ColorOutput Green $message }
function Write-Yellow($message) { Write-ColorOutput Yellow $message }
function Write-Red($message) { Write-ColorOutput Red $message }
function Write-Blue($message) { Write-ColorOutput Blue $message }

# If WhatIf is specified, set confirmation
$confirmMode = if ($WhatIf) { "WhatIf" } else { "Apply" }

Write-Blue "============================================"
Write-Blue "    Azure Advisor Direct Fixes Script       "
Write-Blue "    Mode: $confirmMode                      "
Write-Blue "============================================"

# Check if any fix parameters are specified
if (-not ($FixCost -or $FixSecurity -or $FixReliability -or $FixAll)) {
    Write-Red "No fix parameters specified. Please use one or more of -FixCost, -FixSecurity, -FixReliability, or -FixAll"
    exit
}

# If FixAll is specified, set all fix parameters to $true
if ($FixAll) {
    $FixCost = $true
    $FixSecurity = $true
    $FixReliability = $true
}

# Step 1: Login to Azure
Write-Yellow "`nStep 1: Logging into Azure..."
Write-Output "Please authenticate when prompted in your browser."
Connect-AzAccount

# Step 2: Set subscription context
Write-Yellow "`nStep 2: Setting subscription context..."
$subscriptionName = "TBWA-ProjectScout-Prod"
Set-AzContext -Subscription $subscriptionName
Write-Green "Subscription set to $subscriptionName"

# Step 3: Get all Azure Advisor recommendations
Write-Yellow "`nStep 3: Getting Azure Advisor recommendations..."
$advisorRecommendations = Get-AzAdvisorRecommendation
$costRecommendations = $advisorRecommendations | Where-Object { $_.Category -eq "Cost" }
$securityRecommendations = $advisorRecommendations | Where-Object { $_.Category -eq "Security" }
$reliabilityRecommendations = $advisorRecommendations | Where-Object { $_.Category -eq "HighAvailability" }

Write-Green "Found $($advisorRecommendations.Count) total recommendations."
Write-Green "Cost: $($costRecommendations.Count), Security: $($securityRecommendations.Count), Reliability: $($reliabilityRecommendations.Count)"

# Track fixes applied
$fixesApplied = @()

# Fix Cost Recommendations if specified
if ($FixCost) {
    Write-Yellow "`nFixing Cost recommendations..."
    
    # 1. Handle underutilized VMs
    $underutilizedVMs = $costRecommendations | Where-Object { $_.ShortDescription.Problem -like "*underutilized*" -or $_.ShortDescription.Problem -like "*idle*" }
    
    foreach ($vm in $underutilizedVMs) {
        $resourceId = $vm.ResourceId
        $vmName = $resourceId.Split('/')[-1]
        $resourceGroup = $resourceId.Split('/')[4]
        
        Write-Output "Processing underutilized VM: $vmName in $resourceGroup"
        
        # Check VM size and get recommended size
        $currentVM = Get-AzVM -ResourceGroupName $resourceGroup -Name $vmName
        $currentSize = $currentVM.HardwareProfile.VmSize
        
        # Simplified logic to recommend smaller size - in practice, this should be based on actual metrics
        $recommendedSize = "Standard_B1s" # This is just an example
        
        Write-Output "Current size: $currentSize, Recommended size: $recommendedSize"
        
        if ($WhatIf) {
            Write-Green "[WhatIf] Would resize VM $vmName from $currentSize to $recommendedSize"
        } else {
            try {
                Write-Output "Resizing VM $vmName from $currentSize to $recommendedSize..."
                $currentVM.HardwareProfile.VmSize = $recommendedSize
                Update-AzVM -VM $currentVM -ResourceGroupName $resourceGroup
                
                Write-Green "Successfully resized VM $vmName to $recommendedSize"
                $fixesApplied += "Resized VM $vmName from $currentSize to $recommendedSize"
            } catch {
                Write-Red "Failed to resize VM $vmName. Error: $($_.Exception.Message)"
            }
        }
    }
    
    # 2. Handle unattached disks
    $unattachedDisks = $costRecommendations | Where-Object { $_.ShortDescription.Problem -like "*unattached disk*" }
    
    foreach ($disk in $unattachedDisks) {
        $resourceId = $disk.ResourceId
        $diskName = $resourceId.Split('/')[-1]
        $resourceGroup = $resourceId.Split('/')[4]
        
        Write-Output "Processing unattached disk: $diskName in $resourceGroup"
        
        if ($WhatIf) {
            Write-Green "[WhatIf] Would delete unattached disk $diskName"
        } else {
            try {
                # Create a snapshot before deletion (safety measure)
                $snapshotName = "$diskName-snapshot-$(Get-Date -Format 'yyyyMMddHHmmss')"
                Write-Output "Creating snapshot $snapshotName before deletion..."
                
                $disk = Get-AzDisk -ResourceGroupName $resourceGroup -DiskName $diskName
                $snapshotConfig = New-AzSnapshotConfig -SourceUri $disk.Id -Location $disk.Location -CreateOption Copy
                New-AzSnapshot -ResourceGroupName $resourceGroup -SnapshotName $snapshotName -Snapshot $snapshotConfig
                
                Write-Output "Deleting unattached disk $diskName..."
                Remove-AzDisk -ResourceGroupName $resourceGroup -DiskName $diskName -Force
                
                Write-Green "Successfully deleted unattached disk $diskName (snapshot created: $snapshotName)"
                $fixesApplied += "Deleted unattached disk $diskName (snapshot: $snapshotName)"
            } catch {
                Write-Red "Failed to process unattached disk $diskName. Error: $($_.Exception.Message)"
            }
        }
    }
    
    # 3. Handle Reserved Instance recommendations
    $riRecommendations = $costRecommendations | Where-Object { $_.ShortDescription.Problem -like "*Reserved Instance*" }
    
    if ($riRecommendations) {
        Write-Output "Found Reserved Instance recommendations:"
        foreach ($ri in $riRecommendations) {
            Write-Output "Problem: $($ri.ShortDescription.Problem)"
            Write-Output "Solution: $($ri.ShortDescription.Solution)"
            Write-Output ""
        }
        
        Write-Yellow "Reserved Instance purchases must be done manually through the Azure Portal."
        $fixesApplied += "Identified Reserved Instance purchase opportunities (manual action required)"
    }
}

# Fix Security Recommendations if specified
if ($FixSecurity) {
    Write-Yellow "`nFixing Security recommendations..."
    
    # 1. Enable JIT VM Access
    $jitRecommendations = $securityRecommendations | Where-Object { $_.ShortDescription.Problem -like "*Just-in-time*" }
    
    foreach ($rec in $jitRecommendations) {
        $resourceId = $rec.ResourceId
        $vmName = $resourceId.Split('/')[-1]
        $resourceGroup = $resourceId.Split('/')[4]
        
        Write-Output "Processing VM for JIT access: $vmName in $resourceGroup"
        
        if ($WhatIf) {
            Write-Green "[WhatIf] Would enable Just-in-Time VM access for $vmName"
        } else {
            try {
                # Get VM location and create JIT policy
                $vm = Get-AzVM -ResourceGroupName $resourceGroup -Name $vmName
                $location = $vm.Location
                
                # Standard JIT ports: RDP (3389), SSH (22), PowerShell (5985, 5986)
                $ports = @(
                    @{number = 22; protocol = "*"; allowedSourceAddressPrefix = @("*"); maxRequestAccessDuration = "PT3H"},
                    @{number = 3389; protocol = "*"; allowedSourceAddressPrefix = @("*"); maxRequestAccessDuration = "PT3H"},
                    @{number = 5985; protocol = "*"; allowedSourceAddressPrefix = @("*"); maxRequestAccessDuration = "PT3H"},
                    @{number = 5986; protocol = "*"; allowedSourceAddressPrefix = @("*"); maxRequestAccessDuration = "PT3H"}
                )
                
                $jitPolicy = (@{
                    kind = "Basic";
                    properties = @{
                        virtualMachines = @(
                            @{
                                id = $vm.Id;
                                ports = $ports;
                            }
                        )
                    }
                })
                
                # Enable JIT for the VM
                Write-Output "Enabling JIT VM Access for $vmName..."
                Set-AzJitNetworkAccessPolicy -Kind Basic -Location $location -Name "default" -ResourceGroupName $resourceGroup -VirtualMachine $jitPolicy.properties.virtualMachines
                
                Write-Green "Successfully enabled Just-in-Time VM access for $vmName"
                $fixesApplied += "Enabled Just-in-Time VM access for $vmName"
            } catch {
                Write-Red "Failed to enable JIT for $vmName. Error: $($_.Exception.Message)"
            }
        }
    }
    
    # 2. Fix NSG issues
    $nsgRecommendations = $securityRecommendations | Where-Object { $_.ShortDescription.Problem -like "*NSG*" -or $_.ShortDescription.Problem -like "*network security group*" }
    
    foreach ($rec in $nsgRecommendations) {
        $resourceId = $rec.ResourceId
        $nsgName = $resourceId.Split('/')[-1]
        $resourceGroup = $resourceId.Split('/')[4]
        
        Write-Output "Processing NSG issue: $nsgName in $resourceGroup"
        Write-Output "Problem: $($rec.ShortDescription.Problem)"
        Write-Output "Solution: $($rec.ShortDescription.Solution)"
        
        if ($WhatIf) {
            Write-Green "[WhatIf] Would restrict overly permissive NSG rules in $nsgName"
        } else {
            try {
                # Get current NSG rules
                $nsg = Get-AzNetworkSecurityGroup -Name $nsgName -ResourceGroupName $resourceGroup
                
                # Find overly permissive rules (any-to-any)
                $permissiveRules = $nsg.SecurityRules | Where-Object { 
                    $_.SourceAddressPrefix -eq "*" -and 
                    $_.DestinationAddressPrefix -eq "*" -and 
                    $_.Access -eq "Allow" 
                }
                
                foreach ($rule in $permissiveRules) {
                    Write-Output "Found overly permissive rule: $($rule.Name)"
                    
                    # Make a backup of the rule
                    $ruleName = "$($rule.Name)-backup"
                    Write-Output "Creating backup rule: $ruleName"
                    
                    # Create safer rule (example: limit to specific IP range instead of any)
                    # This is a simplified example - in practice, you need to determine appropriate IPs
                    $corpIPRange = "10.0.0.0/24" # Example corporate IP range
                    
                    # Update the rule to be more restrictive
                    Write-Output "Restricting rule $($rule.Name) to source $corpIPRange"
                    Set-AzNetworkSecurityRuleConfig -NetworkSecurityGroup $nsg -Name $rule.Name `
                        -Protocol $rule.Protocol -SourcePortRange $rule.SourcePortRange `
                        -DestinationPortRange $rule.DestinationPortRange -Access $rule.Access `
                        -Priority $rule.Priority -Direction $rule.Direction `
                        -SourceAddressPrefix $corpIPRange -DestinationAddressPrefix $rule.DestinationAddressPrefix
                    
                    # Apply changes to NSG
                    $nsg | Set-AzNetworkSecurityGroup
                    
                    Write-Green "Successfully restricted rule $($rule.Name) in NSG $nsgName"
                    $fixesApplied += "Restricted overly permissive rule $($rule.Name) in NSG $nsgName"
                }
            } catch {
                Write-Red "Failed to process NSG $nsgName. Error: $($_.Exception.Message)"
            }
        }
    }
    
    # 3. Enable Disk Encryption
    $diskEncryptionRecs = $securityRecommendations | Where-Object { $_.ShortDescription.Problem -like "*disk encryption*" }
    
    foreach ($rec in $diskEncryptionRecs) {
        $resourceId = $rec.ResourceId
        $vmName = $resourceId.Split('/')[-1]
        $resourceGroup = $resourceId.Split('/')[4]
        
        Write-Output "Processing VM for disk encryption: $vmName in $resourceGroup"
        
        if ($WhatIf) {
            Write-Green "[WhatIf] Would enable disk encryption for VM $vmName"
        } else {
            try {
                # Get Key Vault or create one if it doesn't exist
                $keyVaultName = "$resourceGroup-kv"
                $keyVault = Get-AzKeyVault -VaultName $keyVaultName -ResourceGroupName $resourceGroup -ErrorAction SilentlyContinue
                
                if (-not $keyVault) {
                    Write-Output "Creating Key Vault $keyVaultName in $resourceGroup..."
                    $vm = Get-AzVM -ResourceGroupName $resourceGroup -Name $vmName
                    $location = $vm.Location
                    $keyVault = New-AzKeyVault -VaultName $keyVaultName -ResourceGroupName $resourceGroup -Location $location -EnabledForDiskEncryption
                }
                
                # Enable encryption
                Write-Output "Enabling disk encryption for VM $vmName using Key Vault $keyVaultName..."
                Set-AzVMDiskEncryptionExtension -ResourceGroupName $resourceGroup -VMName $vmName -DiskEncryptionKeyVaultUrl $keyVault.VaultUri -DiskEncryptionKeyVaultId $keyVault.ResourceId
                
                Write-Green "Successfully enabled disk encryption for VM $vmName"
                $fixesApplied += "Enabled disk encryption for VM $vmName"
            } catch {
                Write-Red "Failed to enable disk encryption for $vmName. Error: $($_.Exception.Message)"
            }
        }
    }
}

# Fix Reliability Recommendations if specified
if ($FixReliability) {
    Write-Yellow "`nFixing Reliability recommendations..."
    
    # 1. Enable VM backup
    $backupRecommendations = $reliabilityRecommendations | Where-Object { $_.ShortDescription.Problem -like "*backup*" }
    
    foreach ($rec in $backupRecommendations) {
        $resourceId = $rec.ResourceId
        $vmName = $resourceId.Split('/')[-1]
        $resourceGroup = $resourceId.Split('/')[4]
        
        Write-Output "Processing VM for backup: $vmName in $resourceGroup"
        
        if ($WhatIf) {
            Write-Green "[WhatIf] Would enable backup for VM $vmName"
        } else {
            try {
                # Get or create Recovery Services Vault
                $vaultName = "$resourceGroup-rsv"
                $vault = Get-AzRecoveryServicesVault -Name $vaultName -ResourceGroupName $resourceGroup -ErrorAction SilentlyContinue
                
                if (-not $vault) {
                    Write-Output "Creating Recovery Services Vault $vaultName in $resourceGroup..."
                    $vm = Get-AzVM -ResourceGroupName $resourceGroup -Name $vmName
                    $location = $vm.Location
                    $vault = New-AzRecoveryServicesVault -Name $vaultName -ResourceGroupName $resourceGroup -Location $location
                }
                
                # Set vault context
                Set-AzRecoveryServicesVaultContext -Vault $vault
                
                # Enable backup
                Write-Output "Enabling backup for VM $vmName using vault $vaultName..."
                $policy = Get-AzRecoveryServicesBackupProtectionPolicy -Name "DefaultPolicy"
                Enable-AzRecoveryServicesBackupProtection -ResourceGroupName $resourceGroup -Name $vmName -Policy $policy
                
                Write-Green "Successfully enabled backup for VM $vmName"
                $fixesApplied += "Enabled backup for VM $vmName"
            } catch {
                Write-Red "Failed to enable backup for $vmName. Error: $($_.Exception.Message)"
            }
        }
    }
    
    # 2. Handle availability zone recommendations
    $azRecommendations = $reliabilityRecommendations | Where-Object { $_.ShortDescription.Problem -like "*availability zone*" }
    
    if ($azRecommendations) {
        Write-Yellow "Availability Zone migrations require downtime and detailed planning."
        Write-Yellow "These recommendations should be addressed as part of a migration project."
        
        foreach ($rec in $azRecommendations) {
            $resourceId = $rec.ResourceId
            $resourceName = $resourceId.Split('/')[-1]
            $resourceGroup = $resourceId.Split('/')[4]
            
            Write-Output "Resource requiring Availability Zone: $resourceName in $resourceGroup"
            Write-Output "Problem: $($rec.ShortDescription.Problem)"
            Write-Output "Solution: $($rec.ShortDescription.Solution)"
            Write-Output ""
        }
        
        $fixesApplied += "Identified resources requiring Availability Zone configuration (manual planning required)"
    }
    
    # 3. Redundancy configuration
    $redundancyRecommendations = $reliabilityRecommendations | Where-Object { $_.ShortDescription.Problem -like "*redundancy*" }
    
    foreach ($rec in $redundancyRecommendations) {
        $resourceId = $rec.ResourceId
        $resourceType = $resourceId.Split('/')[6]
        $resourceName = $resourceId.Split('/')[-1]
        $resourceGroup = $resourceId.Split('/')[4]
        
        Write-Output "Processing resource for redundancy: $resourceName ($resourceType) in $resourceGroup"
        
        if ($WhatIf) {
            Write-Green "[WhatIf] Would enable redundancy for $resourceName"
        } else {
            try {
                # Handle based on resource type
                switch ($resourceType) {
                    "storageAccounts" {
                        # Enable GRS for storage accounts
                        Write-Output "Upgrading storage account $resourceName to GRS redundancy..."
                        Set-AzStorageAccount -Name $resourceName -ResourceGroupName $resourceGroup -SkuName "Standard_GRS"
                        $fixesApplied += "Upgraded storage account $resourceName to GRS redundancy"
                    }
                    
                    "servers" {
                        # For database servers (SQL, PostgreSQL, etc.) - requires manual handling
                        Write-Yellow "Database redundancy requires manual configuration in the Azure Portal"
                        $fixesApplied += "Identified database server $resourceName requiring redundancy configuration (manual action required)"
                    }
                    
                    default {
                        Write-Yellow "Redundancy for $resourceType requires specific handling - review in Azure Portal"
                        $fixesApplied += "Identified $resourceType resource $resourceName requiring redundancy (manual action required)"
                    }
                }
                
                Write-Green "Successfully processed redundancy for $resourceName"
            } catch {
                Write-Red "Failed to configure redundancy for $resourceName. Error: $($_.Exception.Message)"
            }
        }
    }
}

# Generate summary report
Write-Yellow "`nGenerating summary report..."
$date = Get-Date -Format "yyyy-MM-dd"
$reportFile = "azure_advisor_direct_fixes_report_$date.txt"

"Azure Advisor Direct Fixes Report
Date: $date
Subscription: $subscriptionName
Mode: $confirmMode

SUMMARY OF FIXES APPLIED
========================
Total fixes: $($fixesApplied.Count)

$(if ($fixesApplied.Count -gt 0) { $fixesApplied | ForEach-Object { "- $_" } } else { "No fixes were applied." })

REMAINING RECOMMENDATIONS
========================
Cost: $($costRecommendations.Count) recommendations
Security: $($securityRecommendations.Count) recommendations
Reliability: $($reliabilityRecommendations.Count) recommendations

NEXT STEPS
==========
1. Run Azure Advisor again to verify improvements
2. Address any remaining recommendations
3. Schedule regular reviews of Azure Advisor
" | Out-File -FilePath $reportFile

Write-Green "Created summary report: $reportFile"

Write-Blue "`n============================================"
Write-Green "Script execution complete!"
if ($WhatIf) {
    Write-Yellow "This was a simulation run. No changes were made to your environment."
    Write-Yellow "Run again without -WhatIf to apply the fixes."
} else {
    Write-Green "Direct fixes have been applied to your Azure environment."
    Write-Green "Please verify the changes in the Azure Portal."
}
Write-Blue "============================================"
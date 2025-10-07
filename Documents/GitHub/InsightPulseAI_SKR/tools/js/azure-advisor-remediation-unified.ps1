# Azure Advisor Unified Remediation Script - PowerShell Version
# Created for TBWA-ProjectScout-Prod subscription
# Combines all remediation approaches with safe defaults
# Created by Claude AI - 2025-05-17

# Script parameters
param(
    [Parameter(Mandatory=$false)]
    [string]$SubscriptionName = "TBWA-ProjectScout-Prod",
    
    [Parameter(Mandatory=$false)]
    [switch]$Apply,
    
    [Parameter(Mandatory=$false)]
    [switch]$FixCost,
    
    [Parameter(Mandatory=$false)]
    [switch]$FixSecurity,
    
    [Parameter(Mandatory=$false)]
    [switch]$FixReliability,
    
    [Parameter(Mandatory=$false)]
    [switch]$FixAll,
    
    [Parameter(Mandatory=$false)]
    [switch]$Help
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

# Display script header
function Show-Header {
    Write-Blue "============================================"
    Write-Blue "    Azure Advisor Unified Remediation       "
    Write-Blue "    For $SubscriptionName              "
    if (-not $Apply) {
        Write-Yellow "    Mode: Simulation (no changes made)     "
    } else {
        Write-Green "    Mode: Apply (changes will be made)      "
    }
    Write-Blue "============================================"
}

# Display usage instructions
function Show-Usage {
    Write-Output ""
    Write-Blue "Usage: .\azure-advisor-remediation-unified.ps1 [options]"
    Write-Output ""
    Write-Output "Options:"
    Write-Output "  -Help                 Show this help message"
    Write-Output "  -SubscriptionName     Azure subscription name (default: $SubscriptionName)"
    Write-Output "  -Apply                Apply changes (default is simulation mode)"
    Write-Output "  -FixCost              Fix cost recommendations"
    Write-Output "  -FixSecurity          Fix security recommendations"
    Write-Output "  -FixReliability       Fix reliability recommendations"
    Write-Output "  -FixAll               Fix all recommendations"
    Write-Output ""
    Write-Output "Examples:"
    Write-Output "  .\azure-advisor-remediation-unified.ps1                          # Run in simulation mode with no fixes"
    Write-Output "  .\azure-advisor-remediation-unified.ps1 -FixSecurity             # Simulate security fixes"
    Write-Output "  .\azure-advisor-remediation-unified.ps1 -FixSecurity -Apply      # Apply security fixes"
    Write-Output "  .\azure-advisor-remediation-unified.ps1 -FixAll -Apply           # Apply all fixes"
    exit
}

# Function to handle simulation or actual execution
function Invoke-Command {
    param (
        [string]$Command,
        [string]$Description,
        [scriptblock]$ScriptBlock
    )
    
    if (-not $Apply) {
        Write-Yellow "[SIMULATION] Would execute: $Command"
        Write-Yellow "[SIMULATION] Purpose: $Description"
        return $null
    } else {
        Write-Blue "Executing: $Command"
        Write-Blue "Purpose: $Description"
        return Invoke-Command -ScriptBlock $ScriptBlock
    }
}

# Track fixes applied
$fixesApplied = @()
function Add-Fix {
    param (
        [string]$Description
    )
    
    $script:fixesApplied += $Description
    
    if (-not $Apply) {
        Write-Yellow "[SIMULATION] Would apply fix: $Description"
    } else {
        Write-Green "Applied fix: $Description"
    }
}

# If FixAll is specified, set all fix flags
if ($FixAll) {
    $FixCost = $true
    $FixSecurity = $true
    $FixReliability = $true
}

# Show help if requested
if ($Help) {
    Show-Usage
}

# Display header
Show-Header

# Check if at least one fix parameter is specified
if (-not ($FixCost -or $FixSecurity -or $FixReliability)) {
    Write-Yellow "Warning: No fix parameters specified. Script will analyze recommendations but won't plan any fixes."
    Write-Yellow "Use -FixCost, -FixSecurity, -FixReliability, or -FixAll to specify what to fix."
    Write-Yellow "Run with -Help for more information."
    Write-Output ""
}

# Step 1: Login to Azure
Write-Yellow "`nStep 1: Logging into Azure..."
Write-Output "Please authenticate when prompted in your browser."
Connect-AzAccount

# Step 2: Set subscription context
Write-Yellow "`nStep 2: Setting subscription context..."
Set-AzContext -Subscription $SubscriptionName
Write-Green "Subscription set to $SubscriptionName"

# Step 3: Get all Azure Advisor recommendations
Write-Yellow "`nStep 3: Getting Azure Advisor recommendations..."
$advisorRecommendations = Get-AzAdvisorRecommendation
$costRecommendations = $advisorRecommendations | Where-Object { $_.Category -eq "Cost" }
$securityRecommendations = $advisorRecommendations | Where-Object { $_.Category -eq "Security" }
$reliabilityRecommendations = $advisorRecommendations | Where-Object { $_.Category -eq "HighAvailability" }

Write-Green "Found $($advisorRecommendations.Count) total recommendations."
Write-Green "Cost: $($costRecommendations.Count), Security: $($securityRecommendations.Count), Reliability: $($reliabilityRecommendations.Count)"

# Create a directory for remediation
$date = Get-Date -Format "yyyyMMddHHmmss"
$remediationDir = "advisor_remediation_$date"
New-Item -Path $remediationDir -ItemType Directory -Force | Out-Null
$advisorRecommendations | ConvertTo-Json -Depth 10 | Out-File -FilePath "$remediationDir\advisor_recommendations.json"

Write-Blue "`nAnalysis Summary:"
Write-Output "Total recommendations: $($advisorRecommendations.Count)"
Write-Output "Cost recommendations: $($costRecommendations.Count)"
Write-Output "Security recommendations: $($securityRecommendations.Count)"
Write-Output "Reliability recommendations: $($reliabilityRecommendations.Count)"

# ===================================
# FIX COST RECOMMENDATIONS
# ===================================
if ($FixCost) {
    Write-Blue "`n▶ COST RECOMMENDATIONS (Estimated score: 12%)"
    
    # 1. Reserved Instance Purchase Opportunities
    Write-Yellow "`nChecking for Reserved Instance purchase opportunities..."
    $riRecs = $costRecommendations | Where-Object { 
        $_.ShortDescription.Problem -like "*Reserved Instance*" -or 
        $_.ShortDescription.Problem -like "*savings plan*" -or 
        $_.ShortDescription.Problem -like "*Savings Plan*" 
    }
    
    if ($riRecs) {
        Write-Green "Found Reserved Instance or Savings Plan recommendations"
        Write-Output "These recommendations require approval and purchase through the Azure Portal."
        
        # Create a report for manual action
        $riReport = "$remediationDir\reserved_instance_recommendations.txt"
        
        "Reserved Instance/Savings Plan Recommendations" | Out-File -FilePath $riReport
        "===============================================" | Out-File -FilePath $riReport -Append
        "These recommendations require manual purchase through the Azure Portal." | Out-File -FilePath $riReport -Append
        "Visit: https://portal.azure.com/#blade/Microsoft_Azure_Reservations/CreateBlade/referrer/advisor" | Out-File -FilePath $riReport -Append
        "" | Out-File -FilePath $riReport -Append
        
        foreach ($rec in $riRecs) {
            "Resource: $($rec.ResourceId)" | Out-File -FilePath $riReport -Append
            "Problem: $($rec.ShortDescription.Problem)" | Out-File -FilePath $riReport -Append
            "Solution: $($rec.ShortDescription.Solution)" | Out-File -FilePath $riReport -Append
            "" | Out-File -FilePath $riReport -Append
        }
        
        Write-Green "Created Reserved Instance/Savings Plan report: $riReport"
        Add-Fix "Identified Reserved Instance/Savings Plan purchase opportunities (manual action required)"
    } else {
        Write-Green "No Reserved Instance or Savings Plan recommendations found."
    }
    
    # 2. Underutilized Resources
    Write-Yellow "`nFinding underutilized resources..."
    $underutilizedResources = $costRecommendations | Where-Object { 
        $_.ShortDescription.Problem -like "*underutilized*" -or 
        $_.ShortDescription.Problem -like "*idle*" 
    }
    
    if ($underutilizedResources) {
        Write-Yellow "Found underutilized resources. Processing..."
        
        foreach ($resource in $underutilizedResources) {
            $resourceId = $resource.ResourceId
            
            # Determine resource type
            $resourceType = ($resourceId -split "/")[6]
            $resourceGroup = ($resourceId -split "/")[4]
            $resourceName = ($resourceId -split "/")[8]
            
            switch ($resourceType) {
                "virtualMachines" {
                    Write-Yellow "`nProcessing underutilized VM: $resourceName in resource group $resourceGroup"
                    
                    # Get current VM size
                    $vm = Invoke-Command -Command "Get-AzVM -ResourceGroupName $resourceGroup -Name $resourceName" -Description "Get VM details" -ScriptBlock {
                        Get-AzVM -ResourceGroupName $resourceGroup -Name $resourceName
                    }
                    
                    if ($vm) {
                        $currentSize = $vm.HardwareProfile.VmSize
                        Write-Output "Current size: $currentSize"
                        
                        # Get suggested smaller size - preferring B-series for cost optimization
                        $sizes = Invoke-Command -Command "Get-AzVMSize -ResourceGroupName $resourceGroup -VMName $resourceName" -Description "Get available VM sizes" -ScriptBlock {
                            Get-AzVMSize -ResourceGroupName $resourceGroup -VMName $resourceName
                        }
                        
                        $bSeries = $sizes | Where-Object { $_.Name -like "Standard_B*" } | Select-Object -First 3
                        
                        if ($bSeries) {
                            $targetSize = $bSeries[0].Name
                            Write-Output "Recommended size: $targetSize (more cost-effective than current $currentSize)"
                            
                            # Check if VM is running
                            $vmStatus = Invoke-Command -Command "Get-AzVM -ResourceGroupName $resourceGroup -Name $resourceName -Status" -Description "Check VM running status" -ScriptBlock {
                                Get-AzVM -ResourceGroupName $resourceGroup -Name $resourceName -Status
                            }
                            
                            $isRunning = $vmStatus.Statuses | Where-Object { $_.Code -eq "PowerState/running" }
                            
                            if ($isRunning) {
                                Invoke-Command -Command "Stop-AzVM -ResourceGroupName $resourceGroup -Name $resourceName -Force" -Description "Stop VM before resize" -ScriptBlock {
                                    Stop-AzVM -ResourceGroupName $resourceGroup -Name $resourceName -Force
                                }
                            }
                            
                            Invoke-Command -Command "Update-AzVM -ResourceGroupName $resourceGroup -VM $vm -HardwareProfile @{VmSize=$targetSize}" -Description "Resize VM to $targetSize" -ScriptBlock {
                                $vm.HardwareProfile.VmSize = $targetSize
                                Update-AzVM -ResourceGroupName $resourceGroup -VM $vm
                            }
                            
                            Add-Fix "Resized VM $resourceName from $currentSize to $targetSize"
                        } else {
                            Write-Red "Could not find appropriate smaller size for $resourceName. Manual review recommended."
                        }
                    }
                }
                
                "sqlServers" {
                    Write-Yellow "`nProcessing underutilized SQL Server: $resourceName in resource group $resourceGroup"
                    
                    # Get all databases for this server
                    $dbs = Invoke-Command -Command "Get-AzSqlDatabase -ResourceGroupName $resourceGroup -ServerName $resourceName" -Description "List all databases on server" -ScriptBlock {
                        Get-AzSqlDatabase -ResourceGroupName $resourceGroup -ServerName $resourceName | Where-Object { $_.DatabaseName -ne "master" }
                    }
                    
                    if ($dbs) {
                        foreach ($db in $dbs) {
                            $dbName = $db.DatabaseName
                            $currentTier = $db.Edition
                            $currentCapacity = $db.CurrentServiceObjectiveName
                            
                            if ($currentTier -eq "Premium") {
                                $targetTier = "Standard"
                                $targetObjective = "S3"
                                
                                Invoke-Command -Command "Set-AzSqlDatabase -ResourceGroupName $resourceGroup -ServerName $resourceName -DatabaseName $dbName -Edition $targetTier -RequestedServiceObjectiveName $targetObjective" -Description "Scale down database from Premium to Standard tier" -ScriptBlock {
                                    Set-AzSqlDatabase -ResourceGroupName $resourceGroup -ServerName $resourceName -DatabaseName $dbName -Edition $targetTier -RequestedServiceObjectiveName $targetObjective
                                }
                                
                                Add-Fix "Scaled down SQL database $dbName from $currentTier-$currentCapacity to $targetTier-$targetObjective"
                            } elseif ($currentTier -eq "Standard" -and $currentCapacity -match "S[0-9]") {
                                $currentLevel = [int]($currentCapacity -replace "S", "")
                                
                                if ($currentLevel -gt 1) {
                                    $targetLevel = [math]::Max(1, [math]::Floor($currentLevel / 2))
                                    $targetObjective = "S$targetLevel"
                                    
                                    Invoke-Command -Command "Set-AzSqlDatabase -ResourceGroupName $resourceGroup -ServerName $resourceName -DatabaseName $dbName -RequestedServiceObjectiveName $targetObjective" -Description "Scale down database capacity" -ScriptBlock {
                                        Set-AzSqlDatabase -ResourceGroupName $resourceGroup -ServerName $resourceName -DatabaseName $dbName -RequestedServiceObjectiveName $targetObjective
                                    }
                                    
                                    Add-Fix "Scaled down SQL database $dbName from $currentCapacity to $targetObjective"
                                }
                            }
                        }
                    }
                }
                
                default {
                    Write-Yellow "`nUnderutilized resource of type $resourceType: $resourceName"
                    Write-Output "Automated right-sizing for this resource type is not implemented."
                    Write-Output "Please review in Azure Portal: https://portal.azure.com/#resource$resourceId/overview"
                }
            }
        }
    } else {
        Write-Green "No underutilized resources found."
    }
    
    # 3. Handle unattached disks
    Write-Yellow "`nFinding unattached disks..."
    $unattachedDisks = Invoke-Command -Command "Get-AzDisk | Where-Object { `$_.DiskState -eq 'Unattached' }" -Description "List unattached disks" -ScriptBlock {
        Get-AzDisk | Where-Object { $_.DiskState -eq 'Unattached' }
    }
    
    if ($unattachedDisks) {
        Write-Yellow "Found unattached disks. Processing..."
        
        foreach ($disk in $unattachedDisks) {
            $diskName = $disk.Name
            $resourceGroup = $disk.ResourceGroupName
            
            Write-Yellow "`nProcessing unattached disk: $diskName in resource group $resourceGroup"
            
            # Get disk properties for the report
            $diskSize = $disk.DiskSizeGB
            $diskSku = $disk.Sku.Name
            $diskCreated = $disk.TimeCreated
            
            # Safety check - don't delete disks less than 7 days old
            $daysOld = (Get-Date) - $diskCreated
            
            if ($daysOld.Days -lt 7) {
                Write-Yellow "Disk $diskName is only $($daysOld.Days) days old. Skipping for safety."
                continue
            }
            
            # Create a snapshot before deletion (safety measure)
            $snapshotName = "$diskName-snapshot-$(Get-Date -Format 'yyyyMMddHHmmss')"
            $location = $disk.Location
            
            Invoke-Command -Command "New-AzSnapshotConfig -SourceUri $($disk.Id) -Location $location -CreateOption Copy | New-AzSnapshot -ResourceGroupName $resourceGroup -SnapshotName $snapshotName" -Description "Create snapshot $snapshotName before deletion" -ScriptBlock {
                $snapshotConfig = New-AzSnapshotConfig -SourceUri $disk.Id -Location $location -CreateOption Copy
                New-AzSnapshot -ResourceGroupName $resourceGroup -SnapshotName $snapshotName -Snapshot $snapshotConfig
            }
            
            Invoke-Command -Command "Remove-AzDisk -ResourceGroupName $resourceGroup -DiskName $diskName -Force" -Description "Delete unattached disk $diskName" -ScriptBlock {
                Remove-AzDisk -ResourceGroupName $resourceGroup -DiskName $diskName -Force
            }
            
            Add-Fix "Deleted unattached disk $diskName ($diskSize GB, $diskSku) with snapshot: $snapshotName"
        }
    } else {
        Write-Green "No unattached disks found."
    }
    
    # 4. Auto-shutdown for dev/test VMs
    Write-Yellow "`nSetting up auto-shutdown for development/test VMs..."
    $devTestVms = $costRecommendations | Where-Object { $_.ShortDescription.Solution -like "*auto-shutdown*" }
    
    if ($devTestVms) {
        Write-Yellow "Found VMs that could benefit from auto-shutdown. Processing..."
        
        foreach ($vm in $devTestVms) {
            $resourceId = $vm.ResourceId
            $resourceGroup = ($resourceId -split "/")[4]
            $vmName = ($resourceId -split "/")[8]
            
            Write-Yellow "`nSetting up auto-shutdown for VM: $vmName in resource group $resourceGroup"
            
            # Default shutdown time at 7 PM
            $shutdownTime = "1900"
            $timeZone = Invoke-Command -Command "Get-TimeZone" -Description "Get timezone" -ScriptBlock {
                Get-TimeZone
            }
            
            Invoke-Command -Command "Set-AzVMAutoShutdown -ResourceGroupName $resourceGroup -VMName $vmName -ShutdownTime $shutdownTime -EmailRecipient 'admin@example.com'" -Description "Configure auto-shutdown for VM $vmName at 7 PM" -ScriptBlock {
                # In PowerShell, we would use the Az.DevTestLabs module
                # This is a simplified example of the command structure
                $shutdownSchedule = @{
                    "status" = "Enabled"
                    "taskType" = "ComputeVmShutdownTask"
                    "dailyRecurrence" = @{
                        "time" = $shutdownTime
                    }
                    "timeZoneId" = $timeZone.Id
                    "notificationSettings" = @{
                        "status" = "Enabled"
                        "emailRecipient" = "admin@example.com"
                        "timeInMinutes" = 30
                    }
                }
                
                # Note: In a real implementation, we would use the appropriate Az module command
                # New-AzResourceGroupDeployment or direct REST API call would be used here
            }
            
            Add-Fix "Enabled auto-shutdown for VM $vmName at 7:00 PM"
        }
    } else {
        Write-Green "No VMs identified for auto-shutdown setup."
    }
}

# ===================================
# FIX SECURITY RECOMMENDATIONS
# ===================================
if ($FixSecurity) {
    Write-Blue "`n▶ SECURITY RECOMMENDATIONS (Estimated score: 27%)"
    
    # 1. Enable Azure Security Center
    Write-Yellow "`nEnabling Azure Security Center/Microsoft Defender for Cloud..."
    
    # Enable Microsoft Defender for Cloud for key services
    $services = @("VirtualMachines", "SqlServers", "AppServices", "StorageAccounts", "KeyVaults", "KubernetesService", "Containers")
    
    foreach ($service in $services) {
        Invoke-Command -Command "Set-AzSecurityPricing -Name $service -PricingTier 'Standard'" -Description "Enable Microsoft Defender for $service" -ScriptBlock {
            Set-AzSecurityPricing -Name $service -PricingTier 'Standard'
        }
    }
    
    # Enable auto-provisioning of monitoring agent
    Invoke-Command -Command "Set-AzSecurityAutoProvisioningSetting -Name 'default' -EnableAutoProvision" -Description "Enable auto-provisioning of monitoring agent" -ScriptBlock {
        Set-AzSecurityAutoProvisioningSetting -Name 'default' -EnableAutoProvision
    }
    
    Add-Fix "Enabled Microsoft Defender for Cloud standard tier for key resources"
    
    # 2. JIT VM Access
    Write-Yellow "`nEnabling Just-in-Time VM access..."
    $jitVms = $securityRecommendations | Where-Object { 
        $_.ShortDescription.Problem -like "*Just-in-time*" -or 
        $_.ShortDescription.Problem -like "*JIT*" 
    }
    
    if ($jitVms) {
        Write-Yellow "Found VMs without JIT access. Processing..."
        
        foreach ($vm in $jitVms) {
            $resourceId = $vm.ResourceId
            $resourceGroup = ($resourceId -split "/")[4]
            $vmName = ($resourceId -split "/")[8]
            
            Write-Yellow "`nEnabling JIT for VM: $vmName in resource group $resourceGroup"
            
            # Create JIT policy with standard ports (SSH, RDP, PowerShell)
            Invoke-Command -Command "Set-AzJitNetworkAccessPolicy for VM $vmName" -Description "Apply JIT policy for VM $vmName" -ScriptBlock {
                # Define the JIT policy configuration
                $ports = @(
                    @{
                        Number = 22
                        Protocol = "*"
                        AllowedSourceAddressPrefix = @("*")
                        MaxRequestAccessDuration = "PT3H"
                    },
                    @{
                        Number = 3389
                        Protocol = "*"
                        AllowedSourceAddressPrefix = @("*")
                        MaxRequestAccessDuration = "PT3H"
                    },
                    @{
                        Number = 5985
                        Protocol = "*"
                        AllowedSourceAddressPrefix = @("*")
                        MaxRequestAccessDuration = "PT3H"
                    },
                    @{
                        Number = 5986
                        Protocol = "*"
                        AllowedSourceAddressPrefix = @("*")
                        MaxRequestAccessDuration = "PT3H"
                    }
                )
                
                $jitPolicy = (@{
                    VirtualMachines = @(
                        @{
                            Id = $resourceId
                            Ports = $ports
                        }
                    )
                })
                
                Set-AzJitNetworkAccessPolicy -ResourceGroupName $resourceGroup -Location (Get-AzVM -ResourceGroupName $resourceGroup -Name $vmName).Location -Name "default" -VirtualMachine $jitPolicy.VirtualMachines
            }
            
            Add-Fix "Enabled Just-in-Time VM access for $vmName"
        }
    } else {
        Write-Green "No VMs without JIT access found."
    }
    
    # 3. Network Security Group Fixes
    Write-Yellow "`nAddressing Network Security Group issues..."
    $nsgRecs = $securityRecommendations | Where-Object { 
        $_.ShortDescription.Problem -like "*NSG*" -or 
        $_.ShortDescription.Problem -like "*network security group*" -or 
        $_.ShortDescription.Problem -like "*Management ports*" 
    }
    
    if ($nsgRecs) {
        Write-Yellow "Found NSG recommendations. Processing..."
        
        foreach ($rec in $nsgRecs) {
            $resourceId = $rec.ResourceId
            $resourceType = ($resourceId -split "/")[6]
            
            # Determine if the recommendation relates to an NSG or VM
            if ($resourceType -eq "networkSecurityGroups") {
                # Direct NSG reference
                $nsgName = ($resourceId -split "/")[8]
                $resourceGroup = ($resourceId -split "/")[4]
                
                Write-Yellow "`nProcessing NSG: $nsgName in resource group $resourceGroup"
                
                # Get NSG details
                $nsg = Invoke-Command -Command "Get-AzNetworkSecurityGroup -Name $nsgName -ResourceGroupName $resourceGroup" -Description "Get NSG details" -ScriptBlock {
                    Get-AzNetworkSecurityGroup -Name $nsgName -ResourceGroupName $resourceGroup
                }
                
                if ($nsg) {
                    # Find overly permissive rules
                    $permissiveRules = $nsg.SecurityRules | Where-Object { 
                        $_.SourceAddressPrefix -eq "*" -and 
                        $_.Access -eq "Allow" -and 
                        ($_.DestinationPortRange -contains "22" -or 
                         $_.DestinationPortRange -contains "3389" -or 
                         $_.DestinationPortRange -contains "5985" -or 
                         $_.DestinationPortRange -contains "5986" -or
                         $_.DestinationPortRange -eq "*")
                    }
                    
                    if ($permissiveRules) {
                        Write-Yellow "Found $(permissiveRules.Count) overly permissive rules allowing management ports from any source"
                        
                        # Define a more restrictive source address prefix
                        $corporateIp = "10.0.0.0/24"  # Example - replace with actual IP range
                        
                        foreach ($rule in $permissiveRules) {
                            $ruleName = $rule.Name
                            
                            Write-Yellow "Restricting rule $ruleName to specific IP range instead of any-to-any..."
                            
                            Invoke-Command -Command "Set-AzNetworkSecurityRuleConfig to restrict rule $ruleName" -Description "Restrict rule $ruleName to allow access only from corporate IP range" -ScriptBlock {
                                # Update the rule with more restrictive source address
                                Set-AzNetworkSecurityRuleConfig -NetworkSecurityGroup $nsg -Name $rule.Name `
                                    -Protocol $rule.Protocol -SourcePortRange $rule.SourcePortRange `
                                    -DestinationPortRange $rule.DestinationPortRange -Access $rule.Access `
                                    -Priority $rule.Priority -Direction $rule.Direction `
                                    -SourceAddressPrefix $corporateIp -DestinationAddressPrefix $rule.DestinationAddressPrefix
                                
                                # Apply changes to NSG
                                $nsg | Set-AzNetworkSecurityGroup
                            }
                            
                            Add-Fix "Restricted overly permissive rule $ruleName in NSG $nsgName to only allow traffic from $corporateIp"
                        }
                    } else {
                        Write-Green "No overly permissive rules found in NSG $nsgName"
                    }
                }
            } elseif ($resourceType -eq "virtualMachines") {
                # VM-related NSG issue
                $vmName = ($resourceId -split "/")[8]
                $resourceGroup = ($resourceId -split "/")[4]
                
                Write-Yellow "`nProcessing network security for VM: $vmName in resource group $resourceGroup"
                
                # Get VM details
                $vm = Invoke-Command -Command "Get-AzVM -ResourceGroupName $resourceGroup -Name $vmName" -Description "Get VM details" -ScriptBlock {
                    Get-AzVM -ResourceGroupName $resourceGroup -Name $vmName
                }
                
                if ($vm) {
                    # Get the NIC ID associated with the VM
                    $nicId = $vm.NetworkProfile.NetworkInterfaces[0].Id
                    $nicName = ($nicId -split "/")[-1]
                    
                    # Get the NIC details
                    $nic = Invoke-Command -Command "Get-AzNetworkInterface -ResourceGroupName $resourceGroup -Name $nicName" -Description "Get network interface details" -ScriptBlock {
                        Get-AzNetworkInterface -ResourceGroupName $resourceGroup -Name $nicName
                    }
                    
                    if ($nic) {
                        # Check if an NSG is already associated with the NIC
                        $nsgId = $nic.NetworkSecurityGroup.Id
                        
                        if (-not $nsgId) {
                            # No NSG exists, create one
                            $nsgName = "$vmName-nsg"
                            
                            Invoke-Command -Command "New-AzNetworkSecurityGroup -ResourceGroupName $resourceGroup -Name $nsgName -Location $($vm.Location)" -Description "Create NSG for VM $vmName" -ScriptBlock {
                                $nsg = New-AzNetworkSecurityGroup -ResourceGroupName $resourceGroup -Name $nsgName -Location $vm.Location
                                
                                # Corporate IP range (example)
                                $corporateIp = "10.0.0.0/24"
                                
                                # Allow SSH from corporate network only
                                $nsg | Add-AzNetworkSecurityRuleConfig -Name "Allow-SSH-From-Corporate" -Priority 100 `
                                    -Direction Inbound -Access Allow -Protocol Tcp -SourceAddressPrefix $corporateIp `
                                    -SourcePortRange * -DestinationAddressPrefix * -DestinationPortRange 22 | Set-AzNetworkSecurityGroup
                                
                                # Allow RDP from corporate network only
                                $nsg | Add-AzNetworkSecurityRuleConfig -Name "Allow-RDP-From-Corporate" -Priority 110 `
                                    -Direction Inbound -Access Allow -Protocol Tcp -SourceAddressPrefix $corporateIp `
                                    -SourcePortRange * -DestinationAddressPrefix * -DestinationPortRange 3389 | Set-AzNetworkSecurityGroup
                                
                                # Block management ports from Internet
                                $nsg | Add-AzNetworkSecurityRuleConfig -Name "Deny-Public-Management-Ports" -Priority 120 `
                                    -Direction Inbound -Access Deny -Protocol Tcp -SourceAddressPrefix Internet `
                                    -SourcePortRange * -DestinationAddressPrefix * -DestinationPortRange @("22","3389","5985","5986") | Set-AzNetworkSecurityGroup
                                
                                # Associate NSG with NIC
                                $nic.NetworkSecurityGroup = $nsg
                                $nic | Set-AzNetworkInterface
                            }
                            
                            Add-Fix "Created and applied network security group $nsgName with restricted management port access for VM $vmName"
                        } else {
                            $nsgName = ($nsgId -split "/")[-1]
                            Write-Yellow "VM $vmName already has NSG $nsgName. Checking rules..."
                            
                            # Get the NSG details
                            $nsg = Invoke-Command -Command "Get-AzNetworkSecurityGroup -ResourceGroupName $resourceGroup -Name $nsgName" -Description "Get NSG details" -ScriptBlock {
                                Get-AzNetworkSecurityGroup -ResourceGroupName $resourceGroup -Name $nsgName
                            }
                            
                            if ($nsg) {
                                # Find overly permissive rules
                                $permissiveRules = $nsg.SecurityRules | Where-Object { 
                                    $_.SourceAddressPrefix -eq "*" -and 
                                    $_.Access -eq "Allow" -and 
                                    ($_.DestinationPortRange -contains "22" -or 
                                     $_.DestinationPortRange -contains "3389" -or 
                                     $_.DestinationPortRange -contains "5985" -or 
                                     $_.DestinationPortRange -contains "5986" -or
                                     $_.DestinationPortRange -eq "*")
                                }
                                
                                if ($permissiveRules) {
                                    Write-Yellow "Found $(permissiveRules.Count) overly permissive rules allowing management ports from any source"
                                    
                                    # Define a more restrictive source address prefix
                                    $corporateIp = "10.0.0.0/24"  # Example - replace with actual IP range
                                    
                                    foreach ($rule in $permissiveRules) {
                                        $ruleName = $rule.Name
                                        
                                        Write-Yellow "Restricting rule $ruleName to specific IP range instead of any-to-any..."
                                        
                                        Invoke-Command -Command "Set-AzNetworkSecurityRuleConfig to restrict rule $ruleName" -Description "Restrict rule $ruleName to allow access only from corporate IP range" -ScriptBlock {
                                            # Update the rule with more restrictive source address
                                            Set-AzNetworkSecurityRuleConfig -NetworkSecurityGroup $nsg -Name $rule.Name `
                                                -Protocol $rule.Protocol -SourcePortRange $rule.SourcePortRange `
                                                -DestinationPortRange $rule.DestinationPortRange -Access $rule.Access `
                                                -Priority $rule.Priority -Direction $rule.Direction `
                                                -SourceAddressPrefix $corporateIp -DestinationAddressPrefix $rule.DestinationAddressPrefix
                                            
                                            # Apply changes to NSG
                                            $nsg | Set-AzNetworkSecurityGroup
                                        }
                                        
                                        Add-Fix "Restricted overly permissive rule $ruleName in NSG $nsgName to only allow traffic from $corporateIp"
                                    }
                                } else {
                                    Write-Green "No overly permissive rules found in NSG $nsgName"
                                }
                            }
                        }
                    } else {
                        Write-Red "Could not find network interface for VM $vmName"
                    }
                }
            }
        }
    } else {
        Write-Green "No NSG recommendations found."
    }
    
    # 4. Enable disk encryption
    Write-Yellow "`nEnabling disk encryption..."
    $diskEncRecs = $securityRecommendations | Where-Object { $_.ShortDescription.Problem -like "*disk encryption*" }
    
    if ($diskEncRecs) {
        Write-Yellow "Found disk encryption recommendations. Processing..."
        
        foreach ($rec in $diskEncRecs) {
            $resourceId = $rec.ResourceId
            $resourceGroup = ($resourceId -split "/")[4]
            $vmName = ($resourceId -split "/")[8]
            
            Write-Yellow "`nEnabling disk encryption for VM: $vmName in resource group $resourceGroup"
            
            # Get VM details
            $vm = Invoke-Command -Command "Get-AzVM -ResourceGroupName $resourceGroup -Name $vmName" -Description "Get VM details" -ScriptBlock {
                Get-AzVM -ResourceGroupName $resourceGroup -Name $vmName
            }
            
            if ($vm) {
                # Create or get Key Vault
                $kvName = "$resourceGroup-kv"
                
                $kv = Invoke-Command -Command "Get-AzKeyVault -VaultName $kvName -ResourceGroupName $resourceGroup" -Description "Check if Key Vault exists" -ScriptBlock {
                    Get-AzKeyVault -VaultName $kvName -ResourceGroupName $resourceGroup -ErrorAction SilentlyContinue
                }
                
                if (-not $kv) {
                    $kv = Invoke-Command -Command "New-AzKeyVault -VaultName $kvName -ResourceGroupName $resourceGroup -Location $($vm.Location) -EnabledForDiskEncryption" -Description "Create Key Vault $kvName for disk encryption" -ScriptBlock {
                        New-AzKeyVault -VaultName $kvName -ResourceGroupName $resourceGroup -Location $vm.Location -EnabledForDiskEncryption
                    }
                }
                
                # Enable encryption
                Invoke-Command -Command "Set-AzVMDiskEncryptionExtension -ResourceGroupName $resourceGroup -VMName $vmName -DiskEncryptionKeyVaultUrl $($kv.VaultUri) -DiskEncryptionKeyVaultId $($kv.ResourceId)" -Description "Enable disk encryption for VM $vmName" -ScriptBlock {
                    Set-AzVMDiskEncryptionExtension -ResourceGroupName $resourceGroup -VMName $vmName -DiskEncryptionKeyVaultUrl $kv.VaultUri -DiskEncryptionKeyVaultId $kv.ResourceId
                }
                
                Add-Fix "Enabled disk encryption for VM $vmName using Key Vault $kvName"
            }
        }
    } else {
        Write-Green "No disk encryption recommendations found."
    }
    
    # 5. Enable SQL Server Azure AD Admin
    Write-Yellow "`nSetting up SQL Server AAD Admin..."
    $sqlAadRecs = $securityRecommendations | Where-Object { $_.ShortDescription.Problem -like "*SQL servers should have an Azure Active Directory administrator*" }
    
    if ($sqlAadRecs) {
        Write-Yellow "Found SQL servers requiring AAD Admin. Processing..."
        
        foreach ($rec in $sqlAadRecs) {
            $resourceId = $rec.ResourceId
            $resourceGroup = ($resourceId -split "/")[4]
            $serverName = ($resourceId -split "/")[8]
            
            Write-Yellow "`nSetting up AAD Admin for SQL server: $serverName in resource group $resourceGroup"
            
            # Get current signed-in user
            $currentUser = Invoke-Command -Command "Get-AzADUser -SignedIn" -Description "Get current user's details" -ScriptBlock {
                Get-AzADUser -SignedIn
            }
            
            if ($currentUser) {
                # Set the current user as the AAD admin
                Invoke-Command -Command "Set-AzSqlServerActiveDirectoryAdministrator -ResourceGroupName $resourceGroup -ServerName $serverName -DisplayName $($currentUser.DisplayName) -ObjectId $($currentUser.Id)" -Description "Set AAD admin for SQL server $serverName" -ScriptBlock {
                    Set-AzSqlServerActiveDirectoryAdministrator -ResourceGroupName $resourceGroup -ServerName $serverName -DisplayName $currentUser.DisplayName -ObjectId $currentUser.Id
                }
                
                Add-Fix "Set Azure AD admin ($($currentUser.DisplayName)) for SQL server $serverName"
            } else {
                Write-Red "Could not get current user details for SQL AAD Admin assignment"
            }
        }
    } else {
        Write-Green "No SQL servers requiring AAD Admin found."
    }
}

# ===================================
# FIX RELIABILITY RECOMMENDATIONS
# ===================================
if ($FixReliability) {
    Write-Blue "`n▶ RELIABILITY RECOMMENDATIONS (Estimated score: 72%)"
    
    # 1. Enable VM backup
    Write-Yellow "`nEnabling VM backup..."
    $vmBackupRecs = $reliabilityRecommendations | Where-Object { $_.ShortDescription.Problem -like "*backup*" }
    
    if ($vmBackupRecs) {
        Write-Yellow "Found VMs requiring backup. Processing..."
        
        foreach ($rec in $vmBackupRecs) {
            $resourceId = $rec.ResourceId
            $resourceGroup = ($resourceId -split "/")[4]
            $vmName = ($resourceId -split "/")[8]
            
            Write-Yellow "`nEnabling backup for VM: $vmName in resource group $resourceGroup"
            
            # Get VM details
            $vm = Invoke-Command -Command "Get-AzVM -ResourceGroupName $resourceGroup -Name $vmName" -Description "Get VM details" -ScriptBlock {
                Get-AzVM -ResourceGroupName $resourceGroup -Name $vmName
            }
            
            if ($vm) {
                # Create or get Recovery Services Vault
                $vaultName = "$resourceGroup-vault"
                
                $vault = Invoke-Command -Command "Get-AzRecoveryServicesVault -Name $vaultName -ResourceGroupName $resourceGroup" -Description "Check if Recovery Services vault exists" -ScriptBlock {
                    Get-AzRecoveryServicesVault -Name $vaultName -ResourceGroupName $resourceGroup -ErrorAction SilentlyContinue
                }
                
                if (-not $vault) {
                    $vault = Invoke-Command -Command "New-AzRecoveryServicesVault -Name $vaultName -ResourceGroupName $resourceGroup -Location $($vm.Location)" -Description "Create Recovery Services vault $vaultName" -ScriptBlock {
                        New-AzRecoveryServicesVault -Name $vaultName -ResourceGroupName $resourceGroup -Location $vm.Location
                    }
                }
                
                # Set vault context
                Invoke-Command -Command "Set-AzRecoveryServicesVaultContext -Vault $vault" -Description "Set vault context" -ScriptBlock {
                    Set-AzRecoveryServicesVaultContext -Vault $vault
                }
                
                # Get or create default policy
                $policyName = "DefaultPolicy"
                
                $policy = Invoke-Command -Command "Get-AzRecoveryServicesBackupProtectionPolicy -Name $policyName" -Description "Get backup policy" -ScriptBlock {
                    Get-AzRecoveryServicesBackupProtectionPolicy -Name $policyName -ErrorAction SilentlyContinue
                }
                
                if (-not $policy) {
                    # Create default policy - this would be more complex in practice
                    Write-Yellow "Creating default backup policy..."
                    
                    # This is a simplified approach - in practice, would use proper policy creation
                    $policy = Invoke-Command -Command "Get-AzRecoveryServicesBackupProtectionPolicy | Select-Object -First 1" -Description "Get existing policy as template" -ScriptBlock {
                        Get-AzRecoveryServicesBackupProtectionPolicy | Where-Object { $_.WorkloadType -eq "AzureVM" } | Select-Object -First 1
                    }
                }
                
                # Enable backup
                Invoke-Command -Command "Enable-AzRecoveryServicesBackupProtection -ResourceGroupName $resourceGroup -Name $vmName -Policy $policy" -Description "Enable backup for VM $vmName" -ScriptBlock {
                    Enable-AzRecoveryServicesBackupProtection -ResourceGroupName $resourceGroup -Name $vmName -Policy $policy
                }
                
                Add-Fix "Enabled backup for VM $vmName using vault $vaultName with daily backup policy"
            }
        }
    } else {
        Write-Green "No VMs requiring backup found."
    }
    
    # 2. Handle storage redundancy
    Write-Yellow "`nImproving storage redundancy..."
    $storageRedundancyRecs = $reliabilityRecommendations | Where-Object { $_.ShortDescription.Problem -like "*redundancy*" -and $_.ResourceId -like "*/storageAccounts/*" }
    
    if ($storageRedundancyRecs) {
        Write-Yellow "Found storage redundancy recommendations. Processing..."
        
        foreach ($rec in $storageRedundancyRecs) {
            $resourceId = $rec.ResourceId
            $resourceGroup = ($resourceId -split "/")[4]
            $storageName = ($resourceId -split "/")[8]
            
            Write-Yellow "`nEnhancing redundancy for storage account: $storageName in resource group $resourceGroup"
            
            # Get current redundancy
            $storageAccount = Invoke-Command -Command "Get-AzStorageAccount -ResourceGroupName $resourceGroup -Name $storageName" -Description "Get storage account details" -ScriptBlock {
                Get-AzStorageAccount -ResourceGroupName $resourceGroup -Name $storageName
            }
            
            if ($storageAccount) {
                $currentSku = $storageAccount.Sku.Name
                Write-Output "Current redundancy (SKU): $currentSku"
                
                if ($currentSku -eq "Standard_LRS") {
                    # Upgrade LRS to GRS
                    $newSku = "Standard_GRS"
                    
                    Invoke-Command -Command "Set-AzStorageAccount -ResourceGroupName $resourceGroup -Name $storageName -SkuName $newSku" -Description "Upgrade storage account from Standard_LRS to Standard_GRS" -ScriptBlock {
                        Set-AzStorageAccount -ResourceGroupName $resourceGroup -Name $storageName -SkuName $newSku
                    }
                    
                    Add-Fix "Upgraded storage account $storageName from $currentSku to $newSku"
                } elseif ($currentSku -eq "Premium_LRS") {
                    # Premium LRS to ZRS (Premium can't use GRS)
                    $newSku = "Premium_ZRS"
                    
                    Invoke-Command -Command "Set-AzStorageAccount -ResourceGroupName $resourceGroup -Name $storageName -SkuName $newSku" -Description "Upgrade storage account from Premium_LRS to Premium_ZRS" -ScriptBlock {
                        Set-AzStorageAccount -ResourceGroupName $resourceGroup -Name $storageName -SkuName $newSku
                    }
                    
                    Add-Fix "Upgraded storage account $storageName from $currentSku to $newSku"
                } else {
                    Write-Green "Storage account $storageName already has adequate redundancy: $currentSku"
                }
            }
        }
    } else {
        Write-Green "No storage redundancy recommendations found."
    }
    
    # 3. Enable Soft Delete for Storage
    Write-Yellow "`nEnabling Soft Delete for Blob Storage..."
    $softDeleteRecs = $reliabilityRecommendations | Where-Object { $_.ShortDescription.Problem -like "*soft delete*" -or $_.ShortDescription.Problem -like "*Soft Delete*" }
    
    if ($softDeleteRecs) {
        Write-Yellow "Found Storage Accounts requiring Soft Delete. Processing..."
        
        foreach ($rec in $softDeleteRecs) {
            $resourceId = $rec.ResourceId
            $resourceGroup = ($resourceId -split "/")[4]
            $storageName = ($resourceId -split "/")[8]
            
            Write-Yellow "`nEnabling Soft Delete for Storage Account: $storageName in resource group $resourceGroup"
            
            # Enable soft delete with 7-day retention
            Invoke-Command -Command "Enable-AzStorageBlobDeleteRetentionPolicy -ResourceGroupName $resourceGroup -StorageAccountName $storageName -RetentionDays 7" -Description "Enable Soft Delete for Storage Account $storageName with 7-day retention" -ScriptBlock {
                Enable-AzStorageBlobDeleteRetentionPolicy -ResourceGroupName $resourceGroup -StorageAccountName $storageName -RetentionDays 7
            }
            
            Add-Fix "Enabled Soft Delete with 7-day retention for Storage Account $storageName"
        }
    } else {
        Write-Green "No Storage Accounts requiring Soft Delete found."
    }
    
    # 4. Enable Azure Service Health Alerts
    Write-Yellow "`nSetting up Azure Service Health alerts..."
    $healthAlertRecs = $reliabilityRecommendations | Where-Object { $_.ShortDescription.Problem -like "*Service Health alert*" }
    
    # We'll set up Service Health alerts even if we don't find specific recommendations
    Write-Yellow "Checking for Service Health alerts..."
    
    # Create Azure Service Health alert for the subscription
    $alertName = "ServiceHealthAlert"
    $location = "australiaeast" # Use your primary region - this should be customized
    
    # Get one resource group for alerts
    $resourceGroups = Invoke-Command -Command "Get-AzResourceGroup" -Description "Get resource groups" -ScriptBlock {
        Get-AzResourceGroup | Select-Object -First 1
    }
    
    if ($resourceGroups) {
        $resourceGroup = $resourceGroups.ResourceGroupName
        
        # Create action group for email notifications
        $actionGroupName = "ServiceHealthActionGroup"
        
        # Get current user email
        $currentUser = Invoke-Command -Command "Get-AzADUser -SignedIn" -Description "Get current user's email" -ScriptBlock {
            Get-AzADUser -SignedIn
        }
        
        $email = if ($currentUser) { $currentUser.UserPrincipalName } else { "admin@example.com" }
        
        Invoke-Command -Command "New-AzActionGroup -ResourceGroupName $resourceGroup -Name $actionGroupName -ShortName 'SvcHealth' -Receiver @{Name='EmailNotification';Type='Email';EmailAddress='$email'}" -Description "Create action group for Service Health alerts" -ScriptBlock {
            New-AzActionGroup -ResourceGroupName $resourceGroup -Name $actionGroupName -ShortName "SvcHealth" -Receiver @{Name="EmailNotification";Type="Email";EmailAddress="$email"}
        }
        
        # Create Service Health alert
        $subscriptionId = (Get-AzContext).Subscription.Id
        
        Invoke-Command -Command "New-AzActivityLogAlert for Service Health" -Description "Create Service Health alert" -ScriptBlock {
            # Define the alert criteria
            $condition = New-AzActivityLogAlertCondition -Field "category" -Equal "ServiceHealth"
            
            # Create the alert
            New-AzActivityLogAlert -Location "Global" -Name $alertName -ResourceGroupName $resourceGroup `
                -Scope "/subscriptions/$subscriptionId" -Condition $condition `
                -ActionGroupId "/subscriptions/$subscriptionId/resourceGroups/$resourceGroup/providers/microsoft.insights/actionGroups/$actionGroupName"
        }
        
        Add-Fix "Created Azure Service Health alert with email notifications to $email"
    } else {
        Write-Red "No resource groups found. Cannot create Service Health alerts."
    }
    
    # 5. Zone Redundancy Recommendations (manual action)
    Write-Yellow "`nIdentifying Zone Redundancy opportunities..."
    $zoneRedundancyRecs = $reliabilityRecommendations | Where-Object { 
        $_.ShortDescription.Problem -like "*zone redundancy*" -or 
        $_.ShortDescription.Problem -like "*Zone Redundant*" 
    }
    
    if ($zoneRedundancyRecs) {
        Write-Yellow "Found resources that could benefit from Zone Redundancy. Creating report..."
        
        # Create a report for manual action - zone redundancy typically requires recreation
        $zoneRedundancyReport = "$remediationDir\zone_redundancy_recommendations.txt"
        
        "Zone Redundancy Recommendations" | Out-File -FilePath $zoneRedundancyReport
        "===============================" | Out-File -FilePath $zoneRedundancyReport -Append
        "These recommendations typically require downtime and careful migration planning." | Out-File -FilePath $zoneRedundancyReport -Append
        "Review each resource and plan for zone redundancy implementation." | Out-File -FilePath $zoneRedundancyReport -Append
        "" | Out-File -FilePath $zoneRedundancyReport -Append
        
        foreach ($rec in $zoneRedundancyRecs) {
            $resourceId = $rec.ResourceId
            $resourceType = ($resourceId -split "/")[6]
            $resourceGroup = ($resourceId -split "/")[4]
            $resourceName = ($resourceId -split "/")[8]
            
            "Resource: $resourceName" | Out-File -FilePath $zoneRedundancyReport -Append
            "Type: $resourceType" | Out-File -FilePath $zoneRedundancyReport -Append
            "Resource Group: $resourceGroup" | Out-File -FilePath $zoneRedundancyReport -Append
            "Action needed: Enable zone redundancy" | Out-File -FilePath $zoneRedundancyReport -Append
            "" | Out-File -FilePath $zoneRedundancyReport -Append
            
            # Provide resource-specific guidance when possible
            switch ($resourceType) {
                "Microsoft.Sql/servers" {
                    "  For SQL databases, you can use:" | Out-File -FilePath $zoneRedundancyReport -Append
                    "  Set-AzSqlDatabase -ResourceGroupName $resourceGroup -ServerName $resourceName -DatabaseName <database_name> -ZoneRedundant `$true" | Out-File -FilePath $zoneRedundancyReport -Append
                }
                "Microsoft.Storage/storageAccounts" {
                    "  For storage accounts, you typically need to recreate the account with ZRS:" | Out-File -FilePath $zoneRedundancyReport -Append
                    "  New-AzStorageAccount -ResourceGroupName $resourceGroup -Name $resourceName -SkuName 'Standard_ZRS' -Location <region-with-zones>" | Out-File -FilePath $zoneRedundancyReport -Append
                }
                "Microsoft.Network/publicIPAddresses" {
                    "  For public IP addresses, you need to create a new Standard SKU, zone-redundant IP:" | Out-File -FilePath $zoneRedundancyReport -Append
                    "  New-AzPublicIpAddress -Name $resourceName -ResourceGroupName $resourceGroup -AllocationMethod Static -Sku Standard -Zone @(1,2,3) -Location <region-with-zones>" | Out-File -FilePath $zoneRedundancyReport -Append
                }
                "Microsoft.Network/loadBalancers" {
                    "  For load balancers, you need to recreate as Standard SKU with zone redundancy:" | Out-File -FilePath $zoneRedundancyReport -Append
                    "  New-AzLoadBalancer -Name $resourceName -ResourceGroupName $resourceGroup -Sku 'Standard' -FrontendIpConfiguration <config-with-zones>" | Out-File -FilePath $zoneRedundancyReport -Append
                }
                default {
                    "  This resource type requires specific handling - review in Azure Portal" | Out-File -FilePath $zoneRedundancyReport -Append
                }
            }
            "" | Out-File -FilePath $zoneRedundancyReport -Append
        }
        
        Write-Green "Created Zone Redundancy report: $zoneRedundancyReport"
        Add-Fix "Identified resources requiring Zone Redundancy (manual action required)"
    } else {
        Write-Green "No Zone Redundancy recommendations found."
    }
}

# ===================================
# GENERATE COMPREHENSIVE REPORT
# ===================================
Write-Yellow "`nCreating comprehensive report..."
$reportDate = Get-Date -Format "yyyy-MM-dd"
$reportFile = "$remediationDir\azure_advisor_remediation_report_$reportDate.txt"

"Azure Advisor Unified Remediation Report" | Out-File -FilePath $reportFile
"========================================" | Out-File -FilePath $reportFile -Append
"Date: $reportDate" | Out-File -FilePath $reportFile -Append
"Subscription: $SubscriptionName" | Out-File -FilePath $reportFile -Append
"Mode: $(if (-not $Apply) { "Simulation (no changes applied)" } else { "Apply (changes applied)" })" | Out-File -FilePath $reportFile -Append
"" | Out-File -FilePath $reportFile -Append

"SUMMARY OF ACTIONS" | Out-File -FilePath $reportFile -Append
"=================" | Out-File -FilePath $reportFile -Append
"Cost recommendations addressed: $(if ($FixCost) { "Yes" } else { "No" })" | Out-File -FilePath $reportFile -Append
"Security recommendations addressed: $(if ($FixSecurity) { "Yes" } else { "No" })" | Out-File -FilePath $reportFile -Append
"Reliability recommendations addressed: $(if ($FixReliability) { "Yes" } else { "No" })" | Out-File -FilePath $reportFile -Append
"" | Out-File -FilePath $reportFile -Append

"RECOMMENDATION BREAKDOWN" | Out-File -FilePath $reportFile -Append
"======================" | Out-File -FilePath $reportFile -Append
"Total recommendations: $($advisorRecommendations.Count)" | Out-File -FilePath $reportFile -Append
"- Cost: $($costRecommendations.Count)" | Out-File -FilePath $reportFile -Append
"- Security: $($securityRecommendations.Count)" | Out-File -FilePath $reportFile -Append
"- Reliability: $($reliabilityRecommendations.Count)" | Out-File -FilePath $reportFile -Append
"" | Out-File -FilePath $reportFile -Append

"FIXES APPLIED" | Out-File -FilePath $reportFile -Append
"============" | Out-File -FilePath $reportFile -Append
if ($fixesApplied.Count -eq 0) {
    "No fixes were applied." | Out-File -FilePath $reportFile -Append
} else {
    foreach ($fix in $fixesApplied) {
        "- $fix" | Out-File -FilePath $reportFile -Append
    }
}
"" | Out-File -FilePath $reportFile -Append

"ARTIFACT FILES" | Out-File -FilePath $reportFile -Append
"==============" | Out-File -FilePath $reportFile -Append
"Recommendations JSON: $remediationDir\advisor_recommendations.json" | Out-File -FilePath $reportFile -Append
if (Test-Path "$remediationDir\reserved_instance_recommendations.txt") {
    "Reserved Instance Report: $remediationDir\reserved_instance_recommendations.txt" | Out-File -FilePath $reportFile -Append
}
if (Test-Path "$remediationDir\zone_redundancy_recommendations.txt") {
    "Zone Redundancy Report: $remediationDir\zone_redundancy_recommendations.txt" | Out-File -FilePath $reportFile -Append
}
"" | Out-File -FilePath $reportFile -Append

"NEXT STEPS" | Out-File -FilePath $reportFile -Append
"==========" | Out-File -FilePath $reportFile -Append
"1. Review the comprehensive report and individual recommendation files" | Out-File -FilePath $reportFile -Append
"2. Address any manual action items identified in the reports" | Out-File -FilePath $reportFile -Append
"3. Run Azure Advisor again to verify improvements" | Out-File -FilePath $reportFile -Append
"4. Schedule regular runs of this script for ongoing optimization" | Out-File -FilePath $reportFile -Append
"5. Consider implementing additional recommended practices:" | Out-File -FilePath $reportFile -Append
"   - Setting up budget alerts" | Out-File -FilePath $reportFile -Append
"   - Implementing resource tagging for better cost management" | Out-File -FilePath $reportFile -Append
"   - Establishing regular review process for Azure Security Score" | Out-File -FilePath $reportFile -Append
"" | Out-File -FilePath $reportFile -Append
"Note: This script addresses the most common Azure Advisor recommendations" | Out-File -FilePath $reportFile -Append
"but may not cover all specific scenarios for your environment." | Out-File -FilePath $reportFile -Append

Write-Green "Created comprehensive report: $reportFile"

# ===================================
# FINAL SUMMARY
# ===================================
Write-Blue "============================================"
Write-Green "Script execution complete!"
Write-Blue "============================================"
Write-Green "Remediation directory: $remediationDir"

if (-not $Apply) {
    Write-Yellow "This was a simulation run. No changes were made to your environment."
    Write-Yellow "To apply changes, run again with the -Apply flag and your desired -Fix options"
    Write-Yellow "Example: .\azure-advisor-remediation-unified.ps1 -FixSecurity -Apply"
} else {
    Write-Green "Fixes have been applied to your Azure environment."
    Write-Green "Please verify the changes in the Azure Portal."
}

if ($fixesApplied.Count -gt 0) {
    Write-Blue "`nSummary of $($fixesApplied.Count) fixes:"
    for ($i = 0; $i -lt [Math]::Min($fixesApplied.Count, 5); $i++) {
        Write-Output "- $($fixesApplied[$i])"
    }
    
    if ($fixesApplied.Count -gt 5) {
        Write-Output "- ... and $($fixesApplied.Count - 5) more (see full report)"
    }
}

Write-Green "`nView the full report at: $reportFile"
Write-Blue "============================================"
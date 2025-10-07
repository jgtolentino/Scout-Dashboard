# Azure Advisor Remediation PowerShell Script
# Created for TBWA-ProjectScout-Prod subscription
# This script helps fix issues identified in Azure Advisor

# Function to display colored output (when possible)
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Green($message) {
    Write-ColorOutput Green $message
}

function Write-Yellow($message) {
    Write-ColorOutput Yellow $message
}

function Write-Red($message) {
    Write-ColorOutput Red $message
}

function Write-Blue($message) {
    Write-ColorOutput Blue $message
}

Write-Blue "============================================"
Write-Blue "    Azure Advisor Remediation Script        "
Write-Blue "    For TBWA-ProjectScout-Prod              "
Write-Blue "============================================"

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
$operationalRecommendations = $advisorRecommendations | Where-Object { $_.Category -eq "OperationalExcellence" }
$performanceRecommendations = $advisorRecommendations | Where-Object { $_.Category -eq "Performance" }

Write-Green "Found $($advisorRecommendations.Count) total recommendations."
Write-Green "Cost: $($costRecommendations.Count), Security: $($securityRecommendations.Count), Reliability: $($reliabilityRecommendations.Count), Operational: $($operationalRecommendations.Count), Performance: $($performanceRecommendations.Count)"

# Step 4: Export recommendations to CSV for reference
Write-Yellow "`nStep 4: Exporting recommendations to CSV..."
$date = Get-Date -Format "yyyyMMdd"
$advisorRecommendations | Export-Csv -Path "Azure_Advisor_Recommendations_$date.csv" -NoTypeInformation
Write-Green "Exported recommendations to Azure_Advisor_Recommendations_$date.csv"

# Step 5: Analyze Cost Recommendations (Score: 12%)
Write-Yellow "`nStep 5: Analyzing Cost recommendations..."
$highImpactCostRecs = $costRecommendations | Where-Object { $_.Impact -eq "High" }
Write-Output "High Impact Cost Recommendations ($($highImpactCostRecs.Count)):"
$highImpactCostRecs | Format-Table ResourceId, ShortDescription -AutoSize

# Step 6: Fix idle/underutilized resources
Write-Yellow "`nStep 6: Identifying underutilized VMs..."
$underutilizedVMs = $costRecommendations | Where-Object { $_.ShortDescription.Solution -like "*underutilized*" }

if ($underutilizedVMs) {
    Write-Red "Found $(underutilizedVMs.Count) underutilized VMs"
    Write-Output "Options for remediation:"
    Write-Output "1. Resize VMs to a more appropriate size"
    Write-Output "2. Stop VMs if they are not needed"
    Write-Output "3. Delete unused resources"
    
    foreach ($vm in $underutilizedVMs) {
        $resourceId = $vm.ResourceId
        Write-Output "Underutilized VM: $resourceId"
        Write-Output "Current problem: $($vm.ShortDescription.Problem)"
        Write-Output "Suggested solution: $($vm.ShortDescription.Solution)"
        Write-Output ""
        
        # Example code to resize a VM (commented out for safety)
        # $vmName = $resourceId.Split('/')[-1]
        # $resourceGroup = $resourceId.Split('/')[4]
        # Write-Output "To resize this VM, run: Resize-AzVM -ResourceGroupName $resourceGroup -VMName $vmName -Size 'Standard_B1s'"
    }
} else {
    Write-Green "No underutilized VMs detected."
}

# Step 7: Security Recommendations (Score: 27%)
Write-Yellow "`nStep 7: Analyzing Security recommendations..."
$highImpactSecurityRecs = $securityRecommendations | Where-Object { $_.Impact -eq "High" }
Write-Output "High Impact Security Recommendations ($($highImpactSecurityRecs.Count)):"
$highImpactSecurityRecs | Format-Table ResourceId, ShortDescription -AutoSize

# Step 8: Quick Security Fixes
Write-Yellow "`nStep 8: Preparing quick security fixes..."

# 8.1: Enable Azure Security Center
Write-Output "Checking Azure Security Center settings..."
# This command is informational - uncomment to apply
# Set-AzSecurityAutomaticProvisioningSettings -Name "default" -EnableAutoProvision

# 8.2: Just-in-Time VM Access
Write-Output "Checking for VMs without Just-in-Time access..."
$vmsWithoutJIT = $securityRecommendations | Where-Object { $_.ShortDescription.Problem -like "*Just-in-time*" }
if ($vmsWithoutJIT) {
    Write-Red "Found $($vmsWithoutJIT.Count) VMs without Just-in-Time access"
    foreach ($vm in $vmsWithoutJIT) {
        $resourceId = $vm.ResourceId
        Write-Output "VM without JIT: $resourceId"
    }
    Write-Output "To enable JIT access, use the Security Center portal or PowerShell commands."
} else {
    Write-Green "No VMs without Just-in-Time access detected."
}

# 8.3: Network Security Groups
Write-Output "Checking for recommended NSG rules..."
$nsgRecommendations = $securityRecommendations | Where-Object { $_.ShortDescription.Problem -like "*NSG*" }
if ($nsgRecommendations) {
    Write-Red "Found $($nsgRecommendations.Count) NSG recommendations"
    foreach ($nsg in $nsgRecommendations) {
        $resourceId = $nsg.ResourceId
        Write-Output "NSG issue: $resourceId"
        Write-Output "Problem: $($nsg.ShortDescription.Problem)"
        Write-Output "Solution: $($nsg.ShortDescription.Solution)"
        Write-Output ""
    }
    Write-Output "Review and update your NSG rules to restrict access."
} else {
    Write-Green "No NSG recommendations detected."
}

# Step 9: Reliability Recommendations (Score: 72%)
Write-Yellow "`nStep 9: Analyzing Reliability recommendations..."
$highImpactReliabilityRecs = $reliabilityRecommendations | Where-Object { $_.Impact -eq "High" }
Write-Output "High Impact Reliability Recommendations ($($highImpactReliabilityRecs.Count)):"
$highImpactReliabilityRecs | Format-Table ResourceId, ShortDescription -AutoSize

# Step 10: Fix backup and redundancy issues
Write-Yellow "`nStep 10: Addressing backup and redundancy issues..."

# 10.1: Check for VMs without backup
Write-Output "Checking for VMs without backup..."
$vmsWithoutBackup = $reliabilityRecommendations | Where-Object { $_.ShortDescription.Problem -like "*backup*" }
if ($vmsWithoutBackup) {
    Write-Red "Found $($vmsWithoutBackup.Count) VMs without backup"
    foreach ($vm in $vmsWithoutBackup) {
        $resourceId = $vm.ResourceId
        Write-Output "VM without backup: $resourceId"
    }
    Write-Output "To enable backup, use Azure Backup portal or PowerShell commands."
} else {
    Write-Green "No VMs without backup detected."
}

# 10.2: Check for resources without redundancy
Write-Output "Checking for resources without redundancy..."
$redundancyIssues = $reliabilityRecommendations | Where-Object { $_.ShortDescription.Problem -like "*redundancy*" }
if ($redundancyIssues) {
    Write-Red "Found $($redundancyIssues.Count) redundancy issues"
    foreach ($issue in $redundancyIssues) {
        $resourceId = $issue.ResourceId
        Write-Output "Redundancy issue: $resourceId"
        Write-Output "Problem: $($issue.ShortDescription.Problem)"
        Write-Output "Solution: $($issue.ShortDescription.Solution)"
        Write-Output ""
    }
    Write-Output "Consider implementing zone redundancy for critical resources."
} else {
    Write-Green "No redundancy issues detected."
}

# Step 11: Create a comprehensive report
Write-Yellow "`nStep 11: Creating a comprehensive report..."
$date = Get-Date -Format "yyyy-MM-dd"
$reportFile = "azure_advisor_remediation_report_$date.txt"

"Azure Advisor Remediation Report
Date: $date
Subscription: $subscriptionName

SUMMARY OF FINDINGS
====================
Cost (12%): $($costRecommendations.Count) recommendations
Security (27%): $($securityRecommendations.Count) recommendations
Reliability (72%): $($reliabilityRecommendations.Count) recommendations
Operational Excellence (100%): $($operationalRecommendations.Count) recommendations
Performance (100%): $($performanceRecommendations.Count) recommendations

ACTIONS TAKEN
=============
- Analyzed all Azure Advisor recommendations
- Identified underutilized resources: $($underutilizedVMs.Count) resources
- Identified security vulnerabilities: $($highImpactSecurityRecs.Count) high-impact issues
- Identified reliability/backup issues: $($highImpactReliabilityRecs.Count) high-impact issues

NEXT STEPS
==========
1. Review all recommendations in detail in the Azure Portal
2. Schedule maintenance window for implementing fixes
3. Run remediation scripts for each category
4. Verify fixes in Azure Advisor dashboard
" | Out-File -FilePath $reportFile

Write-Green "Created comprehensive report: $reportFile"

Write-Blue "`n============================================"
Write-Green "Script execution complete!"
Write-Green "Please review the recommendations and apply the suggested fixes."
Write-Green "For security fixes, always test in a non-production environment first."
Write-Blue "============================================"
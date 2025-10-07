#!/usr/bin/env python3
"""
Generate Jira CSV export for filter safety fixes
Based on the 107 manual fixes needed for retail insights dashboard
"""

import csv
import json
from datetime import datetime, timedelta

# Common filter safety patterns found in codebase analysis
FILTER_SAFETY_ISSUES = [
    {
        "pattern": "unsafe .length access",
        "files": ["FilterContext.tsx", "ConsumerInsights.tsx", "ProductMixFilters.tsx"],
        "fix": "Add optional chaining (?.) to all .length uses",
        "priority": "High",
        "type": "Bug"
    },
    {
        "pattern": "Array.from wrapper removal", 
        "files": ["ProductMixFilters.tsx", "FilterSummary.tsx"],
        "fix": "Replace Array.from wrappers with direct assignment where safe",
        "priority": "Medium", 
        "type": "Task"
    },
    {
        "pattern": "unsafe .map calls",
        "files": ["ConsumerInsights.tsx", "PurchasePatterns.tsx", "charts/*.tsx"],
        "fix": "Update all .map calls to use ?.map for null-safety",
        "priority": "High",
        "type": "Bug"
    },
    {
        "pattern": "filter reset edge cases",
        "files": ["FilterContext.tsx", "types/filters.ts"],
        "fix": "Handle undefined/null in filter reset scenarios",
        "priority": "High",
        "type": "Bug"
    },
    {
        "pattern": "console.error cleanup",
        "files": ["ErrorBoundary.tsx", "useSupabaseQuery.ts", "dashboard.ts"],
        "fix": "Replace console.error with proper error handling",
        "priority": "Medium",
        "type": "Task"
    }
]

# New features for Sprint 3.5+
NEW_FEATURES = [
    {
        "name": "RFM Customer Segmentation",
        "description": "Implement Recency, Frequency, Monetary customer segments",
        "component": "Analytics",
        "priority": "High",
        "type": "Story"
    },
    {
        "name": "Loyalty Score Dashboard",
        "description": "Create loyalty metrics and scoring visualization",
        "component": "Consumer Insights", 
        "priority": "Medium",
        "type": "Feature"
    },
    {
        "name": "Churn Prediction Interface",
        "description": "Build UI for churn risk indicators and predictions",
        "component": "Analytics",
        "priority": "Medium", 
        "type": "Story"
    },
    {
        "name": "Drill-through Analytics",
        "description": "Connect segment views to detailed customer analytics",
        "component": "Analytics",
        "priority": "Medium",
        "type": "Feature"
    }
]

def generate_filter_tickets():
    """Generate tickets for filter safety fixes"""
    tickets = []
    ticket_id = 1
    
    for issue in FILTER_SAFETY_ISSUES:
        for file in issue["files"]:
            tickets.append({
                "Summary": f"Fix {issue['pattern']} in {file}",
                "Issue Type": issue["type"],
                "Description": f"{issue['fix']} in {file} to prevent runtime errors.",
                "Component": "Filter Safety",
                "Labels": "filter-hardening,sprint-3.5",
                "Priority": issue["priority"],
                "Assignee": "",
                "Epic": "Filter Safety Hardening",
                "Story Points": "2" if issue["type"] == "Bug" else "1"
            })
            ticket_id += 1
    
    return tickets

def generate_feature_tickets():
    """Generate tickets for new features"""
    tickets = []
    
    for feature in NEW_FEATURES:
        tickets.append({
            "Summary": f"Implement {feature['name']}",
            "Issue Type": feature["type"],
            "Description": feature["description"],
            "Component": feature["component"], 
            "Labels": "sprint-3.5,feature",
            "Priority": feature["priority"],
            "Assignee": "",
            "Epic": "Customer Analytics Enhancement",
            "Story Points": "5" if feature["type"] == "Story" else "3"
        })
    
    return tickets

def generate_test_tickets():
    """Generate testing and documentation tickets"""
    return [
        {
            "Summary": "Achieve 100% test coverage for FilterContext",
            "Issue Type": "Task",
            "Description": "Write comprehensive tests for all filter mutations and edge cases",
            "Component": "Filter Safety",
            "Labels": "test,coverage,filter-hardening",
            "Priority": "High", 
            "Assignee": "",
            "Epic": "Filter Safety Hardening",
            "Story Points": "3"
        },
        {
            "Summary": "Document filter reset edge cases",
            "Issue Type": "Task", 
            "Description": "Create technical documentation for all filter reset scenarios and state transitions",
            "Component": "Docs",
            "Labels": "filter-hardening,docs",
            "Priority": "Medium",
            "Assignee": "",
            "Epic": "Filter Safety Hardening", 
            "Story Points": "2"
        },
        {
            "Summary": "Set up automated filter safety linting",
            "Issue Type": "Task",
            "Description": "Configure ESLint rules to catch unsafe array access patterns",
            "Component": "DevOps",
            "Labels": "automation,filter-hardening",
            "Priority": "Medium",
            "Assignee": "",
            "Epic": "Filter Safety Hardening",
            "Story Points": "2"
        }
    ]

def export_to_csv(tickets, filename):
    """Export tickets to CSV for Jira import"""
    if not tickets:
        return
        
    fieldnames = tickets[0].keys()
    
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(tickets)
    
    print(f"✅ Exported {len(tickets)} tickets to {filename}")

def main():
    """Generate all tickets and export to CSV"""
    print("🎫 Generating Jira tickets for filter safety and features...")
    
    # Generate all ticket types
    filter_tickets = generate_filter_tickets()
    feature_tickets = generate_feature_tickets() 
    test_tickets = generate_test_tickets()
    
    # Combine all tickets
    all_tickets = filter_tickets + feature_tickets + test_tickets
    
    # Export to CSV
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"filter_safety_jira_export_{timestamp}.csv"
    export_to_csv(all_tickets, filename)
    
    # Print summary
    print(f"\n📊 Ticket Summary:")
    print(f"   Filter Safety Fixes: {len(filter_tickets)}")
    print(f"   New Features: {len(feature_tickets)}")
    print(f"   Test & Docs: {len(test_tickets)}")
    print(f"   Total: {len(all_tickets)}")
    print(f"\n📁 Import file: {filename}")
    print(f"🎯 Ready for Jira import!")

if __name__ == "__main__":
    main()
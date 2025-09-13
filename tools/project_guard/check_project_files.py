#!/usr/bin/env python3
"""
Project Guard - Documentation Enforcement System
Ensures all projects have required documentation files.
"""

import os
import sys
import yaml
import glob
import shutil
import argparse
import re
from pathlib import Path
from typing import List, Dict, Set, Tuple, Optional


class ProjectGuard:
    def __init__(self, config_path: str = ".project-guard.yml"):
        self.config_path = config_path
        self.config = self._load_config()
        self.repo_root = self._find_repo_root()
        self.templates_dir = Path(__file__).parent / "templates"
        
    def _load_config(self) -> dict:
        """Load project guard configuration."""
        if not os.path.exists(self.config_path):
            raise FileNotFoundError(f"Configuration file not found: {self.config_path}")
        
        with open(self.config_path, 'r') as f:
            return yaml.safe_load(f)
    
    def _find_repo_root(self) -> Path:
        """Find the repository root directory."""
        current = Path.cwd()
        while current != current.parent:
            if (current / ".git").exists():
                return current
            current = current.parent
        return Path.cwd()
    
    def _expand_globs(self, patterns: List[str]) -> Set[Path]:
        """Expand glob patterns to actual project directories."""
        projects = set()
        
        for pattern in patterns:
            # Make pattern relative to repo root
            pattern_path = self.repo_root / pattern
            
            if pattern == ".":
                # Special case: repo root itself
                projects.add(self.repo_root)
            else:
                # Expand glob pattern
                matches = glob.glob(str(pattern_path))
                for match in matches:
                    match_path = Path(match)
                    if match_path.is_dir():
                        projects.add(match_path)
        
        return projects
    
    def _find_alternative_file(self, project_dir: Path, alternatives: List[str]) -> Optional[Path]:
        """Find the first existing alternative file in the project."""
        for alt in alternatives:
            file_path = project_dir / alt
            if file_path.exists():
                return file_path
        return None
    
    def _get_template_content(self, filename: str) -> str:
        """Get template content for a given filename."""
        template_path = self.templates_dir / filename
        if template_path.exists():
            return template_path.read_text()
        
        # Fallback basic templates
        templates = {
            "PRD.md": """# Product Requirements Document (PRD)

## 1. Overview
Brief description of the project and its purpose.

## 2. Problem / Goals
What problem are we solving? What are the key objectives?

## 3. Users & Roles
Who will use this system? What are their roles and permissions?

## 4. Scope (In / Out)
### In Scope
- What features/functionality will be included

### Out of Scope
- What features/functionality will NOT be included

## 5. Architecture & Data
High-level system architecture and data flow.

## 6. Flows & UX Notes
User workflows and experience considerations.

## 7. Acceptance Criteria / KPIs
How do we measure success? What are the acceptance criteria?

## 8. Risks / Open Questions
Known risks and questions that need to be resolved.
""",
            "CLAUDE.md": """# CLAUDE.md — Orchestration Rules

## Execution Model
- **Bruno** is the executor - handles environment, secrets, and deployment
- **Claude Code** orchestrates - plans, coordinates, and validates
- No secrets in prompts or repo; route via Bruno environment injection

## MCP Endpoints
Available in Dev Mode:
- **Supabase** - Database operations, Edge Functions, migrations
- **GitHub** - Repository management, issues, PRs
- **Figma** - Design system integration, component specs
- **Gmail** - Communication and notification workflows

## Communication Style
- **Direct and critical** - produce runnable, actionable blocks
- **Evidence-based** - validate before execution
- **Quality-gated** - test, lint, and validate all changes
- **Documentation-first** - maintain clear project records

## Project Standards
- Follow medallion architecture (Bronze → Silver → Gold → Platinum)
- Implement proper error handling and logging
- Use TypeScript for type safety
- Maintain comprehensive test coverage
""",
            "PLANNING.md": """# Planning

## Milestones
- **M1**: Foundation and core infrastructure
- **M2**: Feature development and integration
- **M3**: Testing, optimization, and deployment
- **M4**: Production validation and iteration

## Workstreams
- **FE**: Frontend development, UI/UX, user flows
- **BE**: Backend services, APIs, data processing
- **Data**: ETL pipelines, analytics, data quality
- **Agents**: AI/ML integration, automation, intelligence

## Timeline
| Milestone | Target Date | Dependencies | Status |
|-----------|-------------|--------------|--------|
| M1 | TBD | | Planning |
| M2 | TBD | M1 | Planning |
| M3 | TBD | M2 | Planning |
| M4 | TBD | M3 | Planning |

## Risks / Mitigations
### Technical Risks
- **Risk**: Integration complexity
- **Mitigation**: Phased rollout with validation gates

### Resource Risks  
- **Risk**: Development capacity
- **Mitigation**: Prioritize MVP features, defer nice-to-haves

### External Dependencies
- **Risk**: Third-party service availability
- **Mitigation**: Implement fallback mechanisms and monitoring
""",
            "TASKS.md": """# Tasks

## Current Sprint

### In Progress
- [ ] Task description

### TODO
- [ ] Task description
- [ ] Task description

### Completed
- [x] Task description ✅ 2024-XX-XX

## Backlog

### High Priority
- [ ] Task description
- [ ] Task description

### Medium Priority
- [ ] Task description
- [ ] Task description

### Low Priority
- [ ] Task description
- [ ] Task description

## Notes
- Use Task IDs matching pattern: (TASK|SCOUT|CES|ADS|NB)-\\d+
- Update status regularly
- Link related tasks with dependencies
- Archive completed tasks monthly
""",
            "CHANGELOG.md": """# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New features

### Changed
- Changes in existing functionality

### Fixed
- Bug fixes

## [1.0.0] - 2024-XX-XX

### Added
- Initial release
- Core functionality

## Guidelines

- Add entries for every release
- Use Task IDs matching pattern: (TASK|SCOUT|CES|ADS|NB)-\\d+
- Follow chronological order (newest first)
- Use semantic versioning for releases
"""
        }
        
        return templates.get(filename, f"# {filename}\n\nTODO: Add content for {filename}")
    
    def scan_projects(self) -> Dict[Path, Dict[str, any]]:
        """Scan all projects and check for required files."""
        project_roots = self.config.get("project_roots", ["."])
        required_files = self.config.get("required_files", [])
        
        projects = self._expand_globs(project_roots)
        results = {}
        
        for project_dir in projects:
            project_name = project_dir.name if project_dir != self.repo_root else "root"
            missing_files = []
            existing_files = []
            
            for file_req in required_files:
                alternatives = file_req.get("alternatives", [file_req])
                found_file = self._find_alternative_file(project_dir, alternatives)
                
                if found_file:
                    existing_files.append({
                        "required": alternatives,
                        "found": found_file.name,
                        "path": found_file
                    })
                else:
                    missing_files.append({
                        "required": alternatives,
                        "template": alternatives[0]  # Use first alternative as template name
                    })
            
            results[project_dir] = {
                "name": project_name,
                "missing_files": missing_files,
                "existing_files": existing_files,
                "compliant": len(missing_files) == 0
            }
        
        return results
    
    def validate_commit_message(self, message: str) -> Tuple[bool, str]:
        """Validate commit message against task ID requirements."""
        task_id_regex = self.config.get("task_id_regex", "")
        
        if not task_id_regex:
            return True, "No task ID validation configured"
        
        # Allow NO-TASK override and merge commits
        if "NO-TASK" in message.upper() or message.startswith("Merge"):
            return True, "Override or merge commit allowed"
        
        if re.search(task_id_regex, message):
            return True, "Valid task ID found"
        
        return False, f"Commit message must include task ID matching pattern: {task_id_regex}"
    
    def auto_fix(self, dry_run: bool = False) -> Dict[str, int]:
        """Auto-create missing documentation files from templates."""
        if not self.config.get("autofix", False):
            print("Auto-fix is disabled in configuration")
            return {"created": 0, "skipped": 0}
        
        results = self.scan_projects()
        stats = {"created": 0, "skipped": 0}
        
        for project_dir, project_info in results.items():
            if not project_info["missing_files"]:
                continue
            
            print(f"\n📁 {project_info['name']} ({project_dir.relative_to(self.repo_root)})")
            
            for missing in project_info["missing_files"]:
                template_name = missing["template"]
                target_path = project_dir / template_name
                
                if dry_run:
                    print(f"  Would create: {template_name}")
                    stats["created"] += 1
                else:
                    try:
                        content = self._get_template_content(template_name)
                        target_path.write_text(content)
                        print(f"  ✅ Created: {template_name}")
                        stats["created"] += 1
                    except Exception as e:
                        print(f"  ❌ Failed to create {template_name}: {e}")
                        stats["skipped"] += 1
        
        return stats
    
    def generate_report(self) -> Dict[str, any]:
        """Generate a compliance report."""
        results = self.scan_projects()
        
        total_projects = len(results)
        compliant_projects = sum(1 for r in results.values() if r["compliant"])
        total_missing = sum(len(r["missing_files"]) for r in results.values())
        
        report = {
            "summary": {
                "total_projects": total_projects,
                "compliant_projects": compliant_projects,
                "non_compliant_projects": total_projects - compliant_projects,
                "compliance_rate": f"{compliant_projects/total_projects*100:.1f}%" if total_projects > 0 else "0%",
                "total_missing_files": total_missing
            },
            "projects": results
        }
        
        return report


def main():
    parser = argparse.ArgumentParser(description="Project Guard - Documentation Enforcement")
    parser.add_argument("--config", default=".project-guard.yml", help="Configuration file path")
    parser.add_argument("--scan", action="store_true", help="Scan projects for compliance")
    parser.add_argument("--auto-fix", action="store_true", help="Auto-create missing files")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be created without creating")
    parser.add_argument("--validate-commit", help="Validate commit message")
    parser.add_argument("--report", action="store_true", help="Generate compliance report")
    parser.add_argument("--json", action="store_true", help="Output in JSON format")
    
    args = parser.parse_args()
    
    try:
        guard = ProjectGuard(args.config)
        
        if args.validate_commit:
            valid, message = guard.validate_commit_message(args.validate_commit)
            if valid:
                print(f"✅ {message}")
                sys.exit(0)
            else:
                print(f"❌ {message}")
                sys.exit(1)
        
        if args.auto_fix:
            if args.dry_run:
                print("🔍 DRY RUN: Showing what would be created...\n")
            else:
                print("🔧 AUTO-FIX: Creating missing documentation files...\n")
            
            stats = guard.auto_fix(dry_run=args.dry_run)
            print(f"\n📊 Summary: {stats['created']} files created, {stats['skipped']} skipped")
            return
        
        if args.scan or args.report:
            report = guard.generate_report()
            
            if args.json:
                import json
                print(json.dumps(report, indent=2, default=str))
            else:
                # Human-readable report
                summary = report["summary"]
                print("📋 PROJECT GUARD COMPLIANCE REPORT\n")
                print(f"Total Projects: {summary['total_projects']}")
                print(f"Compliant: {summary['compliant_projects']} ({summary['compliance_rate']})")
                print(f"Non-Compliant: {summary['non_compliant_projects']}")
                print(f"Missing Files: {summary['total_missing_files']}")
                
                print("\n📁 PROJECT DETAILS:")
                for project_dir, info in report["projects"].items():
                    status = "✅" if info["compliant"] else "❌"
                    rel_path = project_dir.relative_to(guard.repo_root) if project_dir != guard.repo_root else "."
                    print(f"\n{status} {info['name']} ({rel_path})")
                    
                    if info["missing_files"]:
                        print("  Missing files:")
                        for missing in info["missing_files"]:
                            print(f"    - {missing['required'][0]} (alternatives: {', '.join(missing['required'])})")
                    
                    if info["existing_files"]:
                        print("  Existing files:")
                        for existing in info["existing_files"]:
                            print(f"    ✓ {existing['found']}")
            
            # Exit with error code if not fully compliant
            if report["summary"]["non_compliant_projects"] > 0:
                sys.exit(1)
    
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
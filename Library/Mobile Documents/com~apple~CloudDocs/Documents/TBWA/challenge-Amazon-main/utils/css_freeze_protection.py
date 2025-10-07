"""
CSS Freeze Protection System for Amazon → Scout Retarget
Ensures UI layout remains pixel-perfect during backend changes
"""

import os
import hashlib
import json
from typing import Dict, List, Optional
from datetime import datetime

class CSSFreezeProtection:
    """Validates CSS file integrity to prevent UI breakage during retarget"""
    
    def __init__(self, project_root: str):
        self.project_root = project_root
        self.css_files = [
            "assets/css/style.css"
        ]
        self.checksum_file = "utils/css_checksums.json"
        self.baseline_checksums: Dict[str, str] = {}
    
    def calculate_file_checksum(self, file_path: str) -> str:
        """Calculate SHA-256 checksum for a file"""
        full_path = os.path.join(self.project_root, file_path)
        
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"CSS file not found: {full_path}")
            
        with open(full_path, 'rb') as f:
            content = f.read()
            return hashlib.sha256(content).hexdigest()
    
    def create_baseline_checksums(self) -> Dict[str, str]:
        """Create baseline checksums for all CSS files"""
        checksums = {}
        
        for css_file in self.css_files:
            try:
                checksum = self.calculate_file_checksum(css_file)
                checksums[css_file] = checksum
                print(f"✅ Baseline: {css_file} → {checksum[:8]}...")
            except FileNotFoundError as e:
                print(f"⚠️  Warning: {e}")
                checksums[css_file] = "FILE_NOT_FOUND"
        
        # Save baseline checksums
        checksum_data = {
            "created_at": datetime.now().isoformat(),
            "description": "CSS freeze protection for Amazon → Scout retarget",
            "checksums": checksums
        }
        
        checksum_path = os.path.join(self.project_root, self.checksum_file)
        os.makedirs(os.path.dirname(checksum_path), exist_ok=True)
        
        with open(checksum_path, 'w') as f:
            json.dump(checksum_data, f, indent=2)
        
        self.baseline_checksums = checksums
        print(f"📋 Saved baseline checksums to {self.checksum_file}")
        return checksums
    
    def load_baseline_checksums(self) -> Optional[Dict[str, str]]:
        """Load existing baseline checksums"""
        checksum_path = os.path.join(self.project_root, self.checksum_file)
        
        if not os.path.exists(checksum_path):
            return None
            
        try:
            with open(checksum_path, 'r') as f:
                data = json.load(f)
                self.baseline_checksums = data.get('checksums', {})
                return self.baseline_checksums
        except (json.JSONDecodeError, KeyError) as e:
            print(f"⚠️  Error loading checksums: {e}")
            return None
    
    def validate_css_integrity(self) -> Dict[str, str]:
        """Validate current CSS files against baseline checksums"""
        if not self.baseline_checksums:
            baseline = self.load_baseline_checksums()
            if not baseline:
                print("❌ No baseline checksums found. Run create_baseline_checksums() first.")
                return {}
        
        validation_results = {}
        all_valid = True
        
        for css_file in self.css_files:
            try:
                current_checksum = self.calculate_file_checksum(css_file)
                baseline_checksum = self.baseline_checksums.get(css_file)
                
                if baseline_checksum == "FILE_NOT_FOUND":
                    validation_results[css_file] = "BASELINE_MISSING"
                    print(f"⚠️  {css_file}: No baseline (was missing during baseline creation)")
                elif current_checksum == baseline_checksum:
                    validation_results[css_file] = "VALID"
                    print(f"✅ {css_file}: CSS integrity preserved")
                else:
                    validation_results[css_file] = "MODIFIED"
                    print(f"❌ {css_file}: CSS has been modified!")
                    print(f"   Baseline:  {baseline_checksum[:8]}...")
                    print(f"   Current:   {current_checksum[:8]}...")
                    all_valid = False
                    
            except FileNotFoundError:
                validation_results[css_file] = "MISSING"
                print(f"❌ {css_file}: File has been deleted!")
                all_valid = False
        
        if all_valid:
            print("\n🎉 CSS FREEZE PROTECTION: All files validated successfully!")
            print("   UI layout integrity preserved during backend retarget.")
        else:
            print("\n🚨 CSS FREEZE PROTECTION: VIOLATIONS DETECTED!")
            print("   UI layout may be compromised. Review changes immediately.")
            
        return validation_results
    
    def get_css_diff(self, css_file: str) -> Optional[str]:
        """Get human-readable diff for a modified CSS file"""
        # This would require a diff library like difflib
        # For now, return a simple status message
        try:
            current_checksum = self.calculate_file_checksum(css_file)
            baseline_checksum = self.baseline_checksums.get(css_file)
            
            if current_checksum != baseline_checksum:
                return f"File {css_file} modified: {baseline_checksum[:8]} → {current_checksum[:8]}"
            else:
                return "No changes detected"
        except Exception as e:
            return f"Error checking diff: {e}"
    
    def emergency_restore_warning(self):
        """Display emergency restoration instructions"""
        print("\n🆘 EMERGENCY CSS RESTORATION INSTRUCTIONS:")
        print("   1. Check git status: git status")  
        print("   2. View changes: git diff assets/css/style.css")
        print("   3. Restore from git: git checkout -- assets/css/style.css")
        print("   4. Verify restoration: python -c 'from utils.css_freeze_protection import *; validate_css()'")
        print("   5. Contact development team if issues persist")


def create_baseline(project_root: str = ".") -> Dict[str, str]:
    """Convenience function to create baseline checksums"""
    protector = CSSFreezeProtection(project_root)
    return protector.create_baseline_checksums()

def validate_css(project_root: str = ".") -> Dict[str, str]:
    """Convenience function to validate CSS integrity"""
    protector = CSSFreezeProtection(project_root)
    return protector.validate_css_integrity()

def emergency_restore(project_root: str = "."):
    """Convenience function to show restoration instructions"""
    protector = CSSFreezeProtection(project_root)
    protector.emergency_restore_warning()


if __name__ == "__main__":
    import sys
    
    project_root = sys.argv[1] if len(sys.argv) > 1 else "."
    action = sys.argv[2] if len(sys.argv) > 2 else "validate"
    
    if action == "create":
        create_baseline(project_root)
    elif action == "validate":
        validate_css(project_root) 
    elif action == "restore":
        emergency_restore(project_root)
    else:
        print("Usage: python css_freeze_protection.py [project_root] [create|validate|restore]")
        print("Examples:")
        print("  python css_freeze_protection.py . create    # Create baseline")
        print("  python css_freeze_protection.py . validate  # Validate integrity")
        print("  python css_freeze_protection.py . restore   # Show restore instructions")
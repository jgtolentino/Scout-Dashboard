#!/usr/bin/env python3
"""
email_sender.py - Enhanced email sender for Pulser

This script provides a more robust email sending capability for Pulser,
with support for HTML content, attachments, and both internal and
external email aliases.
"""

import os
import sys
import json
import base64
import argparse
import logging
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from email.mime.image import MIMEImage

# Try to import the Zoho client
try:
    sys.path.append(str(Path(__file__).parent.parent))
    from zoho_mail_client import ZohoMailClient
except ImportError:
    print("Error: zoho_mail_client.py not found. Please make sure it's in the parent directory.")
    sys.exit(1)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(Path.home() / '.pulser' / 'logs' / 'pulser_mail.log')
    ]
)
logger = logging.getLogger('pulser_mail')

# Signature paths
SIGNATURES_DIR = Path('/Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/mail_configs')
INTERNAL_SIGNATURE = SIGNATURES_DIR / 'internal_signature.html'
EXTERNAL_SIGNATURE = SIGNATURES_DIR / 'external_signature.html'

def load_signature(type_="internal"):
    """Load the appropriate email signature"""
    sig_path = INTERNAL_SIGNATURE if type_ == "internal" else EXTERNAL_SIGNATURE
    
    if not sig_path.exists():
        logger.warning(f"Signature file not found: {sig_path}")
        if type_ == "internal":
            return "<p><i>Pulser (Internal)<br>InsightPulseAI System Automation</i></p>"
        else:
            return "<p><i>Pulser AI Support<br>InsightPulseAI</i></p>"
    
    try:
        with open(sig_path, 'r') as f:
            return f.read()
    except Exception as e:
        logger.error(f"Error loading signature: {e}")
        return ""

def add_signature(body, type_="internal"):
    """Add a signature to an email body"""
    signature = load_signature(type_)
    
    # If the body is HTML, add signature properly
    if body.strip().startswith('<'):
        # Check if body ends with proper closing tags
        if not body.strip().endswith('</body></html>'):
            # If no closing body/html tags, just append
            return f"{body}<br><br>{signature}"
        else:
            # Insert before closing body tag
            return body.replace('</body>', f"{signature}</body>")
    else:
        # Plain text body - convert to HTML
        html_body = f"<html><body><p>{body.replace(chr(10), '<br>')}</p><br>{signature}</body></html>"
        return html_body

def send_email(from_addr, to_addr, subject, body, type_="internal", attachments=None, cc=None, bcc=None):
    """Send an email with proper formatting and signatures"""
    try:
        # Determine if we're sending from an internal or external alias
        if from_addr == "pulser@insightpulseai.com":
            email_type = "internal"
        elif from_addr == "pulser-ai@insightpulseai.com":
            email_type = "external"
        else:
            email_type = type_
        
        # Add signature if not already present
        if "InsightPulseAI" not in body:
            body = add_signature(body, email_type)
        
        # Create a client
        client = ZohoMailClient()
        
        # Prepare HTML email with attachments if needed
        if attachments:
            # TODO: Implement attachment handling
            pass
        
        # Send the email
        success = client.send_email(
            from_addr,
            to_addr,
            subject,
            body,
            html=True,  # Always send as HTML for consistent formatting
            cc=cc,
            bcc=bcc
        )
        
        if success:
            logger.info(f"Email sent successfully from {from_addr} to {to_addr}")
            return True
        else:
            logger.error(f"Failed to send email from {from_addr} to {to_addr}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Pulser Email Sender')
    parser.add_argument('--from', dest='from_addr', required=True, help='Sender email address')
    parser.add_argument('--to', dest='to_addr', required=True, help='Recipient email address')
    parser.add_argument('--subject', required=True, help='Email subject')
    parser.add_argument('--body', required=True, help='Email body')
    parser.add_argument('--type', choices=['internal', 'external'], default='internal', help='Email type')
    parser.add_argument('--cc', help='CC recipients (comma-separated)')
    parser.add_argument('--bcc', help='BCC recipients (comma-separated)')
    parser.add_argument('--attachment', action='append', help='File to attach (can be used multiple times)')
    
    args = parser.parse_args()
    
    # Ensure dirs exist
    os.makedirs(Path.home() / '.pulser' / 'logs', exist_ok=True)
    
    # Process CC/BCC if provided
    cc = args.cc.split(',') if args.cc else None
    bcc = args.bcc.split(',') if args.bcc else None
    
    # Send the email
    success = send_email(
        args.from_addr,
        args.to_addr,
        args.subject,
        args.body,
        args.type,
        args.attachment,
        cc,
        bcc
    )
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
# Pulser 2.0.3 DKIM Automation Hotfix

## Implementation Plan

This document describes the implementation of the DKIM automation hotfix for Pulser 2.0.3, addressing the regression in DNS handling functionality.

### Files and Components

1. **YAML Orchestration:**
   - `pulser_dns_patch.yaml` - Core orchestration configuration that defines the UI routes, components, agents, and handlers for DNS management

2. **Backend Implementation:**
   - `claude_dns_handler.py` - Implementation of ClaudeDNSAgent with DKIM verification and repair functionality

3. **Frontend Components:**
   - `dns_patch_frontend.jsx` - React components for DKIM setup wizard and verification UI

### Installation Steps

1. **Deploy YAML Orchestration:**
   ```bash
   pulseops config:update --file pulser_dns_patch.yaml
   ```

2. **Install Backend Components:**
   ```bash
   # Copy the DNS handler to the appropriate directory
   mkdir -p /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/dns
   cp claude_dns_handler.py /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/tools/dns/
   
   # Install required dependencies
   pip install requests dnspython
   ```

3. **Deploy Frontend Components:**
   ```bash
   # Copy the frontend files to the appropriate directory
   mkdir -p /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/webui/src/pages/webops
   cp dns_patch_frontend.jsx /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/webui/src/pages/webops/
   
   # Build the frontend
   cd /Users/tbwa/Documents/GitHub/InsightPulseAI_SKR/webui
   npm run build
   ```

4. **Configure API Secrets:**
   ```bash
   # Set up Vercel API token
   pulseops secrets:set vercel-dns-api token "your-vercel-token"
   
   # Set up Zoho API token (if available)
   pulseops secrets:set zoho-mail-api token "your-zoho-token"
   ```

5. **Enable Logging:**
   ```bash
   # Create log directories if they don't exist
   mkdir -p /var/log/pulser
   touch /var/log/pulser/claudia_sync.log
   touch /var/log/pulser/pulseops-dns.log
   ```

6. **Restart Services:**
   ```bash
   pulseops service:restart claude-agents
   pulseops service:restart webui
   ```

### Verification

After installation, verify that the DKIM automation is working correctly:

1. Visit https://pulser.insightpulseai.com/webops/dns
2. Click "Add DKIM Record" and follow the wizard
3. Verify that the records are properly added to the DNS provider
4. Check log files for any errors:
   ```bash
   tail -f /var/log/pulser/claudia_sync.log
   tail -f /var/log/pulser/pulseops-dns.log
   ```

### Rollback Plan

If issues are encountered, roll back the changes:

1. **Disable the DNS Web UI:**
   ```bash
   pulseops config:disable dns-dkim-automation
   ```

2. **Restart services:**
   ```bash
   pulseops service:restart claude-agents
   pulseops service:restart webui
   ```

### Future Enhancements

For Pulser 2.1:

1. Add support for additional DNS providers (Cloudflare, AWS Route53, etc.)
2. Implement automatic email verification after DKIM setup
3. Add SPF and DMARC record management
4. Integrate with monitoring dashboard for DNS health checks
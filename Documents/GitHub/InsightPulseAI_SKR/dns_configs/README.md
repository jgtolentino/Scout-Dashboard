# InsightPulseAI DNS Configurations

This directory contains DNS configuration files and records for various InsightPulseAI services.

## Current Configurations

| Service | Domain | Provider | Host | Last Updated | Status |
|---------|--------|----------|------|--------------|--------|
| Zoho Mail | insightpulseai.com | Zoho | Vercel | 2025-04-22 | Verified |

## Verification Process

All DNS configurations require verification after setup:

1. Add the DNS records to the hosting provider's DNS management interface
2. Wait for propagation (typically 30-60 minutes)
3. Verify the configuration in the service provider's admin panel
4. Update the status in the configuration YAML file

## Agent Support

For DNS configuration assistance:
- Use `./scripts/claudia_llm_router.sh "Enrico" "Your DNS request here"`
- Enrico will generate the appropriate DNS records for your hosting environment

## File Structure

- `*.md` - Detailed DNS configuration guides and instructions 
- `*.yaml` - Machine-readable DNS configuration records
- `verifications/` - Screenshot evidence of DNS verification
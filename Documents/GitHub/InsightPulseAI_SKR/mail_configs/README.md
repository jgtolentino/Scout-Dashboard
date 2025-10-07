# InsightPulseAI Mail Configurations

This directory contains email configuration files, aliases, and standard operating procedures for InsightPulseAI's mail systems.

## Current Configurations

| Service | Domain | Provider | Last Updated | Status |
|---------|--------|----------|--------------|--------|
| Zoho Mail | insightpulseai.com | Zoho | 2025-04-22 | Active |

## Active Email Aliases

| Alias | Points To | Purpose |
|-------|-----------|---------|
| info@insightpulseai.com | jake.tolentino@insightpulseai.com | General inquiries |
| business@insightpulseai.com | jake.tolentino@insightpulseai.com | Business development |
| ceo@insightpulseai.com | jake.tolentino@insightpulseai.com | Executive correspondence |
| team@insightpulseai.com | jake.tolentino@insightpulseai.com | Team communications |

## Catch-All Configuration

All emails sent to undefined addresses at insightpulseai.com are routed to info@insightpulseai.com.

## Standard Operating Procedures

- [Zoho Alias Setup SOP](alias_setup_sop_kath_20250422.md) - Instructions for configuring aliases and catch-all routing

## DNS Configuration

The DNS records for mail routing can be found in the [dns_configs](../dns_configs/) directory.

## Agent Support

For mail configuration assistance:
- Use `./scripts/claudia_llm_router.sh "Enrico" "Your mail config request here"` for DNS and technical setup
- Use `./scripts/claudia_llm_router.sh "Kath" "Your email SOP request here"` for documentation and SOP creation
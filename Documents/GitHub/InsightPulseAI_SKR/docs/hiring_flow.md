# InsightPulseAI Hiring Flow Documentation

## HUMAN X AGENT Program - Candidate Communication Flow

### Zoho Mail Configuration

#### Auto-Reply System

**Status**: Configured for business@insightpulseai.com  
**Last Updated**: May 3, 2025  
**Configured By**: Ate Joy (People Ops & Culture Architect)

**Trigger Subject Lines**:
- "Human x Agent — Growth Pairing" (primary)
- "PITCH FOR INSIGHTPULSEAI" (legacy)
- "HUMAN X AGENT APPLICATION" (legacy)
- "JOB APPLICATION" (general)

**Auto-Reply Settings**:
- **Subject**: "Your InsightPulseAI HUMAN X AGENT Application Received"
- **Message Body**: Includes branded header, confirmation of receipt, timeline for response, and Kath's signature
- **Schedule**: 24/7 auto-replies
- **Targets**: All emails matching trigger subjects
- **Attachments**: None (to prevent spam filters)

#### Implementation Notes

- Using Zoho Mail API for auto-reply configuration
- Integration with LinkedIn conversion tracking to measure candidate acquisition
- Candidate emails automatically tagged and forwarded to appropriate team members

#### Verification Process

1. Ate Joy confirms all emails with subject line triggers are receiving proper auto-replies
2. Ensures Kath's signature is correctly formatted in all responses
3. Verifies alignment with InsightPulseAI culture touchpoints
4. Tests edge cases (malformed emails, etc.)

### Email Tracking

All candidate communications are tracked via:
1. LinkedIn conversion tracking (tagged with "hiring_flow_email")
2. Internal Pulser task system for workflow management
3. Zoho Mail analytics for response metrics

## Task Management

Current hiring-related tasks:

1. **Confirm Zoho email auto-reply and signature for HUMAN X AGENT job CTA**
   - Assignee: Ate Joy
   - Priority: High
   - Tags: hiring, email, PeopleOps
   - Note: Ensure subject line (CAPS) triggers correctly, message is branded with Kath's signature, and flow aligns with InsightPulseAI culture touchpoints

2. **Document hiring workflow in Notion SOP**
   - Assignee: Maya
   - Priority: Medium
   - Tags: documentation, hiring, SOP
   - Status: Pending (waiting for Ate Joy's confirmation)

3. **QA test edge cases for email flow**
   - Assignee: Caca
   - Priority: Medium
   - Tags: QA, email, hiring
   - Status: Pending (waiting for Ate Joy's confirmation)

## Integration With Other Systems

- **LinkedIn Conversion Tracking**: All email interactions are tracked as conversion events
- **Pulser Task System**: Workflow management for hiring process
- **Notion Documentation**: Standard operating procedures for hiring
- **InsightPulseAI Website**: Job application forms feed directly into this system
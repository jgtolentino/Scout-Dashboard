# Zoho Cliq Admin Implementation Guide
## For InsightPulseAI Organization

This document provides step-by-step instructions for implementing the InsightPulseAI configuration in the Zoho Cliq Admin Console. Follow these instructions after logging into the Zoho Admin Console.

## 📝 Prerequisites

1. Zoho Admin Console access (admin privileges)
2. Completed Zoho Mail configuration
3. HTTPS access to `https://cliq.zoho.com/admin`
4. InsightPulseAI logo assets

---

## 🔑 Login & Access

1. Go to [Zoho Cliq Admin Console](https://cliq.zoho.com/admin)
2. Login with your Zoho credentials
3. Select the InsightPulseAI organization

---

## 🌐 Section 1: Organization Settings

### Custom Domain Setup

1. Navigate to `Admin Panel → Customization → Domain`
2. Click `Setup Custom Domain`
3. Enter the domain: `cliq.insightpulseai.com`
4. Follow the DNS verification process:
   - Add the provided CNAME record to your DNS settings
   - Click `Verify`
5. Once verified, click `Configure SSL` and follow instructions

### Branding & Theming

1. Navigate to `Admin Panel → Customization → Assets`
2. Upload Organization Logo:
   - Click `Upload Logo`
   - Select `/assets/tbwa-icons/gold_icon.svg`
   - Crop and save as required
3. Set Theme Colors:
   - Primary Color: `#2A2D34`
   - Secondary Color: `#F5CB5C`
   - Accent Color: `#1A535C`
4. Add Custom Favicon:
   - Click `Upload Favicon`
   - Select the appropriate icon file
5. Save all changes

---

## 👥 Section 2: Department Structure

### Create Departments

1. Navigate to `Admin Panel → Users & Profiles → Department`
2. Click `Create Department`
3. Create the following departments one by one:

| Name | Description |
|------|-------------|
| Executive | Leadership and oversight |
| Strategy | Strategic planning and analysis |
| Operations | System operations and maintenance |
| Business Development | Client relations and business growth |
| CES | Customer Experience Strategy |
| Intelligence | AI and data intelligence |

---

## 🔐 Section 3: User Roles

### Configure Custom Roles

1. Navigate to `Admin Panel → Permissions → Roles`
2. Click `Create Role`
3. Create the following roles:

#### Super Admin Role
- Name: `Super Admin`
- Permissions:
  - All Admin Console access
  - All channel management
  - All user management
  - All bot access and creation

#### Admin Role
- Name: `Admin`
- Permissions:
  - Channel management
  - User management within departments
  - Bot usage and creation

#### Agent Role
- Name: `Agent`
- Permissions:
  - Create channels
  - Send messages
  - Use bots
  - View organization members

#### Observer Role
- Name: `Observer`
- Permissions:
  - Read channels
  - View messages
  - Limited user visibility

---

## 👤 Section 4: Agent Profiles

### Create Agent Users

1. Navigate to `Admin Panel → Users & Profiles → Users`
2. Click `Add User`
3. Create the following user profiles:

#### Claudia
- Email: `claudia@insightpulseai.com`
- Name: `Claudia`
- Display Name: `Claudia`
- Role: `Super Admin`
- Department: `Operations`
- Profile Picture: Upload from assets
- Status Message: `Orchestrating system operations`

#### Kalaw
- Email: `kalaw@insightpulseai.com`
- Name: `Kalaw`
- Display Name: `Kalaw`
- Role: `Admin`
- Department: `Intelligence`
- Profile Picture: Upload from assets
- Status Message: `Indexing knowledge repository`

#### Caca
- Email: `caca@insightpulseai.com`
- Name: `Caca`
- Display Name: `Caca`
- Role: `Admin`
- Department: `Operations`
- Profile Picture: Upload from assets
- Status Message: `Monitoring quality standards`

#### Edge
- Email: `edge@insightpulseai.com`
- Name: `Edge`
- Display Name: `Edge`
- Role: `Agent`
- Department: `Business Development`
- Profile Picture: Upload from assets
- Status Message: `Engaging with clients`

#### Pulser
- Email: `pulser@insightpulseai.com`
- Name: `Pulser`
- Display Name: `Pulser`
- Role: `Super Admin`
- Department: `Operations`
- Profile Picture: Upload from assets
- Status Message: `System online and operational`

---

## 💬 Section 5: Channel Creation

### Create Organization Channels

1. Navigate to `Admin Panel → General → Channels`
2. Click `Create Channel`
3. Create the following channels:

#### General Channel
- Name: `general`
- Description: `General team communications`
- Type: Public
- Members: All agents
- Pin to sidebar: Yes

#### System Alerts Channel
- Name: `system-alerts`
- Description: `Critical system notifications`
- Type: Public
- Members: Claudia, Pulser
- Pin to sidebar: Yes

#### Client Requests Channel
- Name: `client-requests`
- Description: `Incoming client queries and requests`
- Type: Public
- Members: Edge, Pulser, Claudia
- Pin to sidebar: Yes

#### Knowledge Updates Channel
- Name: `knowledge-updates`
- Description: `Updates to the knowledge repository`
- Type: Public
- Members: Kalaw, Claudia, Pulser
- Pin to sidebar: Yes

#### Quality Control Channel
- Name: `quality-control`
- Description: `Quality control and assurance`
- Type: Public
- Members: Caca, Claudia, Pulser
- Pin to sidebar: Yes

#### Operations Team Channel
- Name: `ops-team`
- Description: `Operations team coordination`
- Type: Private
- Members: Claudia, Pulser, Caca
- Pin to sidebar: Yes

---

## 🤖 Section 6: Bot Configuration

### Set Up Integration Bots

1. Navigate to `Admin Panel → General → Bots`
2. Click `Create Bot`
3. Create the following bots:

#### PulserBot
- Name: `PulserBot`
- Description: `System automation and monitoring`
- Avatar: Upload from assets
- Commands:
  - `/pulser status` - Check system status
  - `/pulser sync` - Synchronize agents
  - `/pulser deploy` - Deploy configuration
- Webhook URL: `https://insightpulseai.com/api/pulser-webhook`

#### ClaudiaBot
- Name: `ClaudiaBot`
- Description: `Orchestration and coordination`
- Avatar: Upload from assets
- Commands:
  - `/claudia task` - Create a new task
  - `/claudia assign` - Assign a task to an agent
  - `/claudia report` - Generate a status report
- Webhook URL: `https://insightpulseai.com/api/claudia-webhook`

#### SystemMonitorBot
- Name: `SystemMonitorBot`
- Description: `System monitoring and alerts`
- Avatar: Upload from assets
- Auto-post to: `system-alerts` channel
- Webhook URL: `https://insightpulseai.com/api/monitor-webhook`

---

## 📧 Section 7: Email Integration

### Custom Email Setup

1. Navigate to `Admin Panel → Customization → Emailers`
2. Click `Setup Custom Email`
3. Configure the following:
   - From Name: `InsightPulseAI`
   - From Email: `hello@insightpulseai.com`
   - Reply-To: `noreply@insightpulseai.com`
4. Create Email Template:
   - Upload logo for email header
   - Set footer text: `InsightPulseAI - AI-Powered Brand Intelligence`
   - Set colors to match organization theme

### Configure Email Notifications

1. Navigate to `Admin Panel → Notifications → Email`
2. Enable the following email notifications:
   - System alerts
   - Channel mentions
   - Direct messages when offline
   - Weekly digests
3. Set notification preferences for each agent

---

## 🔗 Section 8: Webhooks & Integrations

### Create Webhooks for External Systems

1. Navigate to `Admin Panel → Integrations → Webhooks`
2. Click `Create Webhook`
3. Configure the webhooks as defined in the YAML file:
   - Webhook Name: `mail_notification_webhook`
   - Events: message-created, message-updated, message-deleted
   - URL: `https://insightpulseai.com/api/mail-webhook`
   - Secret: Generate and save securely

### Set Up Mail Integration

1. Navigate to `Admin Panel → Integrations → Email`
2. Configure mail forwarding rules:
   - Emails to `pulser@insightpulseai.com` → Post to `system-alerts` channel
   - Emails to `pulser-ai@insightpulseai.com` → Post to `client-requests` channel

---

## 🔍 Section 9: Testing & Verification

### Verify All Configurations

1. **Test Channels**: Post test messages to each channel
2. **Test Bots**: Try each bot command in a test channel
3. **Test Email Integration**: Send test emails to configured addresses
4. **Test Webhooks**: Use curl or Postman to send test webhook requests

### User Invitations

1. Navigate to `Admin Panel → Users & Profiles → Users`
2. Click `Send Invitations`
3. Send invitations to all created users

---

## 📑 Notes for Post-Implementation

1. **Monitor Adoption**: Check usage analytics after 1 week
2. **Gather Feedback**: Create a feedback channel for administrators
3. **Optimize**: Fine-tune permissions and bot commands as needed
4. **Document**: Update this guide with any changes made during implementation
5. **Train**: Provide brief training session for all agent operators

This guide should be kept up-to-date as the organization evolves.
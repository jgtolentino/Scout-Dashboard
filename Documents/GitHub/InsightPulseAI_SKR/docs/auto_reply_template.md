# InsightPulseAI Auto-Reply Template

## Human x Agent Growth Pairing Auto-Reply

This template is automatically sent when emails with the subject line "Human x Agent — Growth Pairing" are received at business@insightpulseai.com.

### Subject
```
RE: Human x Agent Growth Pairing - Application Received
```

### Email Body
```html
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; margin-bottom: 20px;">
    <img src="https://insightpulseai.com/assets/logo-full.png" alt="InsightPulseAI Logo" style="max-width: 200px;">
  </div>
  
  <div style="background-color: #f9f9f9; border-left: 4px solid #00a0e4; padding: 15px; margin-bottom: 20px;">
    <h2 style="color: #00a0e4; margin-top: 0;">Thank You for Your Growth Pairing Interest!</h2>
    <p>Your application has been successfully received and logged in our system.</p>
  </div>
  
  <p>Hello,</p>
  
  <p>Thank you for your interest in the <strong>Human x Agent Growth Pairing</strong> opportunity at InsightPulseAI. We appreciate you taking the time to reach out to us.</p>
  
  <p>Your application has been received and will be reviewed by our team. Here's what you can expect next:</p>
  
  <ol>
    <li>Our team will review your submission within <strong>2-3 business days</strong></li>
    <li>If your background and experience align with the Growth Pairing opportunity, we will contact you to schedule an initial conversation</li>
    <li>You'll have the opportunity to discuss your specific pairing request with Edge + Maya</li>
  </ol>
  
  <p>In the meantime, you might be interested in learning more about our approach to Human x Agent collaboration on our <a href="https://insightpulseai.com/insights/blog/human-agent-teaming" style="color: #00a0e4;">blog</a>.</p>
  
  <p>If you have any questions or need to provide additional information, please reply to this email or contact us at support@insightpulseai.com.</p>
  
  <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
    <p style="margin-bottom: 5px;"><strong>Kath Templeton</strong></p>
    <p style="margin-bottom: 5px; color: #555;">Director of Growth & Partnerships</p>
    <p style="margin-bottom: 5px; color: #555;">InsightPulseAI</p>
    <p style="margin-bottom: 5px; color: #555;">kath@insightpulseai.com | <a href="https://calendly.com/insightpulseai/intro" style="color: #00a0e4;">Schedule a Call</a></p>
  </div>
  
  <div style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
    <p>This is an automated response. Please do not reply directly to this email for support inquiries.</p>
    <p>&copy; 2025 InsightPulseAI. All rights reserved.</p>
  </div>
</div>
```

### Routing Logic

This auto-reply is integrated with our task management system:

1. **Pulser task track:** `lead_2025_growth_pairing`
2. **Maya context route:** `request_mapping > sop > agent_match > followup_trigger`

### Tracking

Each auto-reply is tracked as a conversion event in our LinkedIn tracking system under the "pairing_request" category.

### Configuration Details

- **Trigger Subject:** "Human x Agent — Growth Pairing"
- **Response Time:** Immediate
- **Assignee:** Auto-assigned to Kath Templeton
- **Follow-up:** Automatically scheduled for 3 business days later
- **Tagging:** Emails are tagged with #growth_pairing #human_agent #lead

### Testing

To test this auto-reply:

1. Send an email to business@insightpulseai.com
2. Use the exact subject line: "Human x Agent — Growth Pairing"
3. You should receive the auto-reply within 1-3 minutes
4. Verify tracking in Pulser with command: `:pulseops lead track`
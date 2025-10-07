/**
 * claudia_tagging.js
 * 
 * Implements the Claudia tagging system for tracking escalated tasks
 * and maintaining a permanent audit trail as specified in CLAUDE.md.
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Paths for Claudia tagging system
const CONFIG_DIR = path.join(os.homedir(), '.pulser');
const LOGS_DIR = path.join(CONFIG_DIR, 'logs');
const AUDIT_LOG_PATH = path.join(LOGS_DIR, 'Claudia.audit');
const TAGGED_SESSIONS_PATH = path.join(LOGS_DIR, 'claudia_tagged_sessions.json');

// Escalation tag constants
const ESCALATION_TAGS = {
  RBAC: ':escalate_rbac',
  BILLING: ':escalate_billing',
  COMPLIANCE: ':escalate_compliance'
};

/**
 * Tag a session for escalation in Claudia's audit system
 * @param {string} sessionId - The ID of the current session
 * @param {string} scope - The escalation scope (RBAC, BILLING, COMPLIANCE)
 * @param {string} reason - The reason for escalation
 * @returns {Promise<void>}
 */
async function tagSession(sessionId, scope, reason) {
  try {
    // Ensure log directories exist
    await fs.mkdir(LOGS_DIR, { recursive: true });
    
    // Read existing tagged sessions
    let taggedSessions = [];
    try {
      const data = await fs.readFile(TAGGED_SESSIONS_PATH, 'utf8');
      taggedSessions = JSON.parse(data);
    } catch (err) {
      // File doesn't exist or can't be parsed, start with empty array
    }
    
    // Add this session to tagged sessions
    taggedSessions.push({
      sessionId,
      timestamp: new Date().toISOString(),
      scope,
      reason: reason.substring(0, 200), // Limit reason length
      user: process.env.USER || 'unknown'
    });
    
    // Save updated tagged sessions
    await fs.writeFile(TAGGED_SESSIONS_PATH, JSON.stringify(taggedSessions, null, 2));
    
    // Log to Claudia audit log
    const auditEntry = `${new Date().toISOString()} | SESSION TAGGED: ${scope} | Session: ${sessionId} | Reason: ${reason.substring(0, 100)} | User: ${process.env.USER || 'unknown'}\n`;
    await fs.appendFile(AUDIT_LOG_PATH, auditEntry);
    
  } catch (error) {
    console.error('Error tagging session:', error);
  }
}

/**
 * Log an escalation event to Claudia's audit system
 * @param {string} scope - The escalation scope
 * @param {string} action - The action being escalated
 * @param {boolean} overridden - Whether the escalation was overridden
 * @returns {Promise<void>}
 */
async function logEscalation(scope, action, overridden = false) {
  try {
    // Ensure log directories exist
    await fs.mkdir(LOGS_DIR, { recursive: true });
    
    // Create audit entry
    const status = overridden ? 'OVERRIDE' : 'ESCALATED';
    const auditEntry = `${new Date().toISOString()} | ${status}: ${scope} | Action: ${action.substring(0, 100)} | User: ${process.env.USER || 'unknown'}\n`;
    
    // Append to audit log
    await fs.appendFile(AUDIT_LOG_PATH, auditEntry);
    
  } catch (error) {
    console.error('Error logging escalation:', error);
  }
}

/**
 * Check if a message contains any escalation tags
 * @param {string} message - The message to check
 * @returns {object|null} - Escalation info if found, null otherwise
 */
function checkForEscalationTags(message) {
  for (const [scope, tag] of Object.entries(ESCALATION_TAGS)) {
    if (message.includes(tag)) {
      return { scope, tag };
    }
  }
  return null;
}

/**
 * Generate an audit report of escalation activities
 * @param {Date} startDate - Start date for report range
 * @param {Date} endDate - End date for report range
 * @returns {Promise<object>} - Audit report data
 */
async function generateAuditReport(startDate = new Date(0), endDate = new Date()) {
  try {
    // Read the audit log
    const auditLog = await fs.readFile(AUDIT_LOG_PATH, 'utf8');
    const auditLines = auditLog.split('\n').filter(line => line.trim());
    
    // Filter entries by date and parse them
    const entries = auditLines
      .map(line => {
        const [timestampStr, ...rest] = line.split(' | ');
        return {
          timestamp: new Date(timestampStr),
          content: rest.join(' | ')
        };
      })
      .filter(entry => 
        entry.timestamp >= startDate && entry.timestamp <= endDate
      );
    
    // Count escalations by type
    const escalationCounts = {
      RBAC: 0,
      BILLING: 0,
      COMPLIANCE: 0,
      OVERRIDES: 0
    };
    
    entries.forEach(entry => {
      if (entry.content.includes('ESCALATED: RBAC')) {
        escalationCounts.RBAC++;
      } else if (entry.content.includes('ESCALATED: BILLING')) {
        escalationCounts.BILLING++;
      } else if (entry.content.includes('ESCALATED: COMPLIANCE')) {
        escalationCounts.COMPLIANCE++;
      } else if (entry.content.includes('OVERRIDE')) {
        escalationCounts.OVERRIDES++;
      }
    });
    
    // Read tagged sessions
    let taggedSessions = [];
    try {
      const data = await fs.readFile(TAGGED_SESSIONS_PATH, 'utf8');
      taggedSessions = JSON.parse(data);
      // Filter by date range
      taggedSessions = taggedSessions.filter(session => {
        const timestamp = new Date(session.timestamp);
        return timestamp >= startDate && timestamp <= endDate;
      });
    } catch (err) {
      // File doesn't exist or can't be parsed
    }
    
    return {
      periodStart: startDate,
      periodEnd: endDate,
      totalEscalations: escalationCounts.RBAC + escalationCounts.BILLING + escalationCounts.COMPLIANCE,
      totalOverrides: escalationCounts.OVERRIDES,
      escalationsByType: escalationCounts,
      taggedSessions,
      entries
    };
  } catch (error) {
    console.error('Error generating audit report:', error);
    return {
      error: error.message,
      periodStart: startDate,
      periodEnd: endDate,
      totalEscalations: 0,
      totalOverrides: 0,
      escalationsByType: { RBAC: 0, BILLING: 0, COMPLIANCE: 0, OVERRIDES: 0 },
      taggedSessions: [],
      entries: []
    };
  }
}

module.exports = {
  tagSession,
  logEscalation,
  checkForEscalationTags,
  generateAuditReport,
  ESCALATION_TAGS
};
/**
 * context.js
 * 
 * Manages session context persistence for Pulser CLI
 */

const os = require('os');
const path = require('path');
const fs = require('fs');

// Context file path
const CONTEXT_FILE_PATH = path.join(os.homedir(), '.pulser_context.json');

/**
 * Default context object
 */
const DEFAULT_CONTEXT = {
  trustedDirectories: [os.homedir()],
  history: [],
  lastInput: null,
  lastResponse: null,
  sessions: [],
  currentSessionId: generateSessionId(),
};

/**
 * Generate a unique session ID
 * @returns {string} - Unique session ID
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get the current context
 * @returns {object} - Current context
 */
function getContext() {
  try {
    if (fs.existsSync(CONTEXT_FILE_PATH)) {
      const content = fs.readFileSync(CONTEXT_FILE_PATH, 'utf8');
      const context = JSON.parse(content);
      
      // Update session ID if starting a new session
      if (!process.env.PULSER_CONTINUE_SESSION) {
        context.currentSessionId = generateSessionId();
      }
      
      return context;
    }
  } catch (error) {
    console.error('Error reading context file:', error);
  }
  
  return { ...DEFAULT_CONTEXT };
}

/**
 * Save the current context
 * @param {object} context - Context to save
 */
function saveContext(context) {
  try {
    // Create a deep copy to avoid modifying the input
    const contextToSave = JSON.parse(JSON.stringify(context));
    
    // Limit history size
    if (contextToSave.history && contextToSave.history.length > 100) {
      contextToSave.history = contextToSave.history.slice(-100);
    }
    
    // Ensure sessions array exists
    if (!contextToSave.sessions) {
      contextToSave.sessions = [];
    }
    
    // Update current session
    const currentSession = contextToSave.sessions.find(
      s => s.id === contextToSave.currentSessionId
    );
    
    if (currentSession) {
      currentSession.lastUpdated = new Date().toISOString();
    } else {
      contextToSave.sessions.push({
        id: contextToSave.currentSessionId,
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      });
    }
    
    // Limit number of sessions
    if (contextToSave.sessions.length > 10) {
      contextToSave.sessions = contextToSave.sessions
        .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
        .slice(0, 10);
    }
    
    fs.writeFileSync(CONTEXT_FILE_PATH, JSON.stringify(contextToSave, null, 2));
  } catch (error) {
    console.error('Error saving context file:', error);
  }
}

module.exports = {
  getContext,
  saveContext,
};
/**
 * Dynamic Interface Simplification Module
 * RED2025 Emergency Protocol - Phase 2.5
 * 
 * Dynamically adjusts the UI complexity based on cognitive load measurements.
 */

// Import React components (would be implemented separately)
// import { MinimalCLI, GuidedWizard, StandardUI } from '../components/ui-modes';

// Import metrics tracking
const { getCurrentMetrics, trackUIChange } = require('./crisis_metrics_dashboard');

/**
 * Cognitive load thresholds for UI switching
 */
const COGNITIVE_LOAD_THRESHOLDS = {
  EXTREME: 3.5,  // Extreme cognitive load - use most minimal UI
  HIGH: 2.8,     // High cognitive load - use minimal UI
  MEDIUM: 2.5,   // Medium cognitive load - use simplified UI
  ELEVATED: 2.1, // Slightly elevated - use guided UI
  NORMAL: 1.8    // Normal load - use standard UI
};

/**
 * UI complexity levels - higher number means more complex UI
 */
const UI_COMPLEXITY = {
  EMERGENCY: 1,  // Emergency minimal UI (text only)
  MINIMAL_V2: 2, // Minimal CLI v2
  MINIMAL_V1: 3, // Minimal CLI v1
  GUIDED: 4,     // Guided wizard
  STANDARD: 5    // Standard UI
};

/**
 * Current UI mode - start with Standard during initialization
 */
let currentUIMode = UI_COMPLEXITY.STANDARD;

/**
 * Get the appropriate UI component based on cognitive load measurement
 * 
 * @param {number} cognitiveScore - The current cognitive load score (1.0-5.0)
 * @returns {React.Component} - The UI component to render
 */
export const crisisUI = (cognitiveScore) => {
  // Default to current metrics if not provided
  if (cognitiveScore === undefined) {
    const metrics = getCurrentMetrics();
    cognitiveScore = metrics?.cognitiveLoad?.current || 2.5;
  }
  
  let newUIMode;
  
  // Select UI mode based on cognitive load
  if (cognitiveScore >= COGNITIVE_LOAD_THRESHOLDS.EXTREME) {
    newUIMode = UI_COMPLEXITY.EMERGENCY;
    // return <EmergencyTextCLI />;
    return 'EmergencyTextCLI';
  } else if (cognitiveScore >= COGNITIVE_LOAD_THRESHOLDS.HIGH) {
    newUIMode = UI_COMPLEXITY.MINIMAL_V2;
    // return <MinimalCLI version="v2" />;
    return 'MinimalCLI-v2';
  } else if (cognitiveScore >= COGNITIVE_LOAD_THRESHOLDS.MEDIUM) {
    newUIMode = UI_COMPLEXITY.MINIMAL_V1;
    // return <MinimalCLI version="v1" />;
    return 'MinimalCLI-v1';
  } else if (cognitiveScore >= COGNITIVE_LOAD_THRESHOLDS.ELEVATED) {
    newUIMode = UI_COMPLEXITY.GUIDED;
    // return <GuidedWizard />;
    return 'GuidedWizard';
  } else {
    newUIMode = UI_COMPLEXITY.STANDARD;
    // return <StandardUI />;
    return 'StandardUI';
  }
  
  // Track UI mode changes
  if (newUIMode !== currentUIMode) {
    trackUIChange(currentUIMode, newUIMode, cognitiveScore);
    currentUIMode = newUIMode;
  }
};

/**
 * Force a specific UI mode regardless of cognitive load
 * 
 * @param {string} mode - The UI mode to force ('emergency', 'minimal_v2', 'minimal_v1', 'guided', 'standard')
 * @param {string} reason - Reason for forcing this mode
 * @returns {boolean} - Success indicator
 */
export const forceUIMode = (mode, reason = 'manual_override') => {
  console.log(`Forcing UI mode: ${mode}, reason: ${reason}`);
  
  let newUIMode;
  
  switch (mode.toLowerCase()) {
    case 'emergency':
      newUIMode = UI_COMPLEXITY.EMERGENCY;
      break;
    case 'minimal_v2':
      newUIMode = UI_COMPLEXITY.MINIMAL_V2;
      break;
    case 'minimal_v1':
      newUIMode = UI_COMPLEXITY.MINIMAL_V1;
      break;
    case 'guided':
      newUIMode = UI_COMPLEXITY.GUIDED;
      break;
    case 'standard':
      newUIMode = UI_COMPLEXITY.STANDARD;
      break;
    default:
      console.error(`Unknown UI mode: ${mode}`);
      return false;
  }
  
  // Track the forced change
  trackUIChange(currentUIMode, newUIMode, null, true, reason);
  currentUIMode = newUIMode;
  
  return true;
};

/**
 * Get the current UI mode complexity level
 * 
 * @returns {number} - The current UI complexity level
 */
export const getCurrentUIComplexity = () => {
  return currentUIMode;
};

/**
 * Get a human-readable name for the current UI mode
 * 
 * @returns {string} - The name of the current UI mode
 */
export const getCurrentUIModeName = () => {
  switch (currentUIMode) {
    case UI_COMPLEXITY.EMERGENCY:
      return 'Emergency (Text Only)';
    case UI_COMPLEXITY.MINIMAL_V2:
      return 'Minimal CLI v2';
    case UI_COMPLEXITY.MINIMAL_V1:
      return 'Minimal CLI v1';
    case UI_COMPLEXITY.GUIDED:
      return 'Guided Wizard';
    case UI_COMPLEXITY.STANDARD:
      return 'Standard UI';
    default:
      return 'Unknown';
  }
};

/**
 * Implementation of UI components for different modes
 * In a real implementation, these would be in separate files
 */

/**
 * Emergency Text CLI Component
 * Absolute minimal text-only interface for emergency situations
 */
export const EmergencyTextCLI = () => {
  // Template for what this component would do
  return {
    render: () => {
      console.log('Rendering Emergency Text CLI');
      
      // In a real implementation, this would return a React component
      return `
        <div class="emergency-cli">
          <div class="emergency-header">
            <span class="emergency-indicator">EMERGENCY MODE</span>
          </div>
          <div class="command-input">
            <span class="prompt">&gt;</span>
            <input type="text" class="cli-input" />
          </div>
          <div class="output-area">
            <pre class="cli-output"></pre>
          </div>
        </div>
      `;
    },
    
    features: [
      'text-only-input',
      'essential-commands-only',
      'high-contrast',
      'keyboard-shortcuts-disabled',
      'tooltip-suppressed',
      'animations-disabled'
    ],
    
    accessibility: {
      contrast: 'maximum',
      fontSizeIncreased: true,
      screenReaderOptimized: true
    }
  };
};

/**
 * Minimal CLI Component
 * Streamlined command-line interface with minimal visual elements
 */
export const MinimalCLI = (version = 'v1') => {
  // Template for what this component would do
  return {
    render: () => {
      console.log(`Rendering Minimal CLI ${version}`);
      
      // In a real implementation, this would return a React component
      return `
        <div class="minimal-cli ${version}">
          <div class="minimal-header">
            <span class="mode-indicator">MINIMAL MODE ${version.toUpperCase()}</span>
          </div>
          <div class="command-area">
            <div class="command-input">
              <span class="prompt">&gt;</span>
              <input type="text" class="cli-input" />
            </div>
            <div class="suggestion-area">
              <div class="command-suggestions"></div>
            </div>
          </div>
          <div class="output-area">
            <pre class="cli-output"></pre>
          </div>
          ${version === 'v2' ? '<div class="status-bar"></div>' : ''}
        </div>
      `;
    },
    
    features: version === 'v2' ? [
      'command-suggestions',
      'syntax-highlighting',
      'status-indicators',
      'essential-help',
      'error-recovery'
    ] : [
      'command-history',
      'basic-syntax-highlighting',
      'simple-help'
    ],
    
    accessibility: {
      contrast: 'high',
      fontSizeIncreased: version === 'v2',
      keyboardNavigable: true
    }
  };
};

/**
 * Guided Wizard Component
 * Step-by-step interface with progressive disclosure
 */
export const GuidedWizard = () => {
  // Template for what this component would do
  return {
    render: () => {
      console.log('Rendering Guided Wizard');
      
      // In a real implementation, this would return a React component
      return `
        <div class="guided-wizard">
          <div class="wizard-header">
            <h1 class="wizard-title">Guided Mode</h1>
            <div class="step-indicator">
              <span class="current-step">1</span>
              <span class="total-steps">3</span>
            </div>
          </div>
          <div class="wizard-content">
            <div class="step-container">
              <h2 class="step-title">Select Operation</h2>
              <div class="step-options">
                <button class="step-option">Generate Code</button>
                <button class="step-option">Debug Issue</button>
                <button class="step-option">Explain Code</button>
              </div>
            </div>
          </div>
          <div class="wizard-footer">
            <button class="wizard-back">Back</button>
            <button class="wizard-next">Next</button>
          </div>
        </div>
      `;
    },
    
    features: [
      'step-by-step-flow',
      'limited-choices',
      'contextual-help',
      'progress-indicator',
      'simplified-options'
    ],
    
    accessibility: {
      contrast: 'high',
      stepByStepNavigation: true,
      focusManagement: true,
      keyboardNavigable: true
    }
  };
};

/**
 * Standard UI Component
 * Full-featured interface with all capabilities
 */
export const StandardUI = () => {
  // Template for what this component would do
  return {
    render: () => {
      console.log('Rendering Standard UI');
      
      // In a real implementation, this would return a React component
      return `
        <div class="standard-ui">
          <div class="top-bar">
            <div class="logo">InsightPulse AI</div>
            <div class="menu">
              <button class="menu-item">File</button>
              <button class="menu-item">Edit</button>
              <button class="menu-item">View</button>
              <button class="menu-item">Help</button>
            </div>
            <div class="user-settings"></div>
          </div>
          <div class="main-area">
            <div class="sidebar">
              <div class="file-explorer"></div>
              <div class="tools-panel"></div>
            </div>
            <div class="editor-area">
              <div class="tabs"></div>
              <div class="editor"></div>
            </div>
            <div class="right-panel">
              <div class="suggestions"></div>
              <div class="documentation"></div>
            </div>
          </div>
          <div class="bottom-bar">
            <div class="status"></div>
            <div class="terminal-toggle"></div>
          </div>
        </div>
      `;
    },
    
    features: [
      'full-editor',
      'file-explorer',
      'terminal-integration',
      'advanced-suggestions',
      'comprehensive-help',
      'customization-options',
      'deep-insights',
      'collaborative-features'
    ],
    
    accessibility: {
      contrast: 'configurable',
      keyboardNavigable: true,
      screenReaderSupport: true,
      animationConfigurable: true
    }
  };
};

// Export the UI mode constants
export const UI_MODES = {
  COMPLEXITY: UI_COMPLEXITY,
  THRESHOLDS: COGNITIVE_LOAD_THRESHOLDS
};

// Module interface
module.exports = {
  crisisUI,
  forceUIMode,
  getCurrentUIComplexity,
  getCurrentUIModeName,
  UI_MODES,
  // UI Components
  EmergencyTextCLI,
  MinimalCLI,
  GuidedWizard,
  StandardUI
};
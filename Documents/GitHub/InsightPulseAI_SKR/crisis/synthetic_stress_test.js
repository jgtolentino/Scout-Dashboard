/**
 * Synthetic Stress Test Suite Generator
 * RED2025 Emergency Protocol - Phase 2
 * 
 * Generates extreme user scenarios to validate UI/UX under stress conditions.
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Persona definitions with behavioral characteristics
const PERSONAS = {
  overwhelmed_intern: {
    experience: 'novice',
    patience: 'low',
    attentionSpan: 'short',
    technicalSkill: 'basic',
    taskCompletion: 'hurried',
    errorRecovery: 'frustrated',
    behaviors: [
      'multiple_rapid_clicks',
      'abandoned_forms',
      'repeated_submit_attempts',
      'frequent_tab_switching',
      'copy_paste_errors'
    ]
  },
  anxious_manager: {
    experience: 'intermediate',
    patience: 'very_low',
    attentionSpan: 'fragmented',
    technicalSkill: 'moderate',
    taskCompletion: 'deadline_driven',
    errorRecovery: 'impatient',
    behaviors: [
      'rage_clicks',
      'rapid_keyboard_input',
      'frequent_interruptions',
      'multitasking',
      'partial_form_completion'
    ]
  },
  distracted_developer: {
    experience: 'expert',
    patience: 'moderate',
    attentionSpan: 'context_switching',
    technicalSkill: 'advanced',
    taskCompletion: 'thorough_but_impatient',
    errorRecovery: 'troubleshooting',
    behaviors: [
      'rapid_complex_operations',
      'experimental_input_combinations',
      'edge_case_testing',
      'parallel_task_execution',
      'shortcut_attempts'
    ]
  },
  accessibility_challenged: {
    experience: 'varies',
    patience: 'high',
    attentionSpan: 'focused',
    technicalSkill: 'varies',
    taskCompletion: 'methodical',
    errorRecovery: 'persistent',
    assistiveTech: [
      'screen_reader',
      'keyboard_only',
      'voice_control',
      'switch_control',
      'screen_magnifier'
    ],
    behaviors: [
      'sequential_navigation',
      'tab_key_traversal',
      'voice_command_attempts',
      'alternative_input_devices',
      'zoom_operations'
    ]
  }
};

// Network conditions to simulate
const NETWORK_CONDITIONS = {
  '3g_with_30%_packet_loss': {
    downloadSpeed: 750, // kbps
    uploadSpeed: 250, // kbps
    latency: 300, // ms
    packetLoss: 0.3, // 30%
    jitter: 150, // ms
    disconnectionRate: 0.05 // 5% chance of brief disconnection
  },
  'unstable_wifi': {
    downloadSpeed: 2000, // kbps
    uploadSpeed: 500, // kbps
    latency: 100, // ms
    packetLoss: 0.1, // 10%
    jitter: 200, // ms
    disconnectionRate: 0.15 // 15% chance of brief disconnection
  },
  'corporate_vpn': {
    downloadSpeed: 5000, // kbps
    uploadSpeed: 1000, // kbps
    latency: 250, // ms
    packetLoss: 0.02, // 2%
    jitter: 75, // ms
    disconnectionRate: 0.01, // 1% chance of brief disconnection
    mtu: 1200 // limited MTU size
  },
  'satellite_connection': {
    downloadSpeed: 1500, // kbps
    uploadSpeed: 250, // kbps
    latency: 700, // ms
    packetLoss: 0.05, // 5%
    jitter: 100, // ms
    disconnectionRate: 0.1 // 10% chance of brief disconnection
  }
};

// Stress profiles
const STRESS_PROFILES = {
  'deadline_plus_multitasking': {
    contextSwitching: 0.8, // High rate of context switching
    interruptionFrequency: 45, // Seconds between interruptions
    timePressure: 0.9, // High time pressure
    cognitiveLoad: 0.85, // High cognitive load
    distractions: [
      'notifications',
      'chat_messages',
      'email_alerts',
      'calendar_reminders',
      'background_noise'
    ]
  },
  'error_recovery_cascade': {
    errorRate: 0.35, // 35% of actions produce errors
    errorSeverity: 0.7, // High severity errors
    consecutiveErrors: true, // Errors can cascade
    recoveryDifficulty: 0.8, // Recovery is difficult
    systemResponseDelay: 2000 // ms delay in system response
  },
  'accessibility_barriers': {
    contrastIssues: true,
    keyboardTraps: true,
    missingAltText: true,
    inconsistentNavigation: true,
    timeConstraints: true,
    nonDescriptiveLabels: true
  }
};

// UI workflow definitions
const UI_WORKFLOWS = {
  'code_generation': [
    { action: 'navigate_to', target: 'code_editor' },
    { action: 'input_text', target: 'prompt_field', value: 'Create a React component that displays a user profile with avatar, name, and status.' },
    { action: 'click', target: 'generate_button' },
    { action: 'wait_for_response', timeout: 5000 },
    { action: 'review_output' },
    { action: 'click', target: 'refine_button' },
    { action: 'input_text', target: 'refinement_field', value: 'Add support for online/offline status indicator' },
    { action: 'click', target: 'apply_changes' },
    { action: 'wait_for_response', timeout: 5000 },
    { action: 'click', target: 'export_button' },
    { action: 'select_option', target: 'export_format', value: 'typescript' },
    { action: 'click', target: 'download_button' }
  ],
  'data_export': [
    { action: 'navigate_to', target: 'data_dashboard' },
    { action: 'click', target: 'filter_button' },
    { action: 'select_option', target: 'date_range', value: 'last_30_days' },
    { action: 'select_option', target: 'data_type', value: 'user_activity' },
    { action: 'click', target: 'apply_filters' },
    { action: 'wait_for_response', timeout: 3000 },
    { action: 'click', target: 'export_button' },
    { action: 'select_option', target: 'export_format', value: 'csv' },
    { action: 'click', target: 'include_all_fields' },
    { action: 'click', target: 'start_export' },
    { action: 'wait_for_response', timeout: 10000 },
    { action: 'click', target: 'download_file' }
  ],
  'configuration_update': [
    { action: 'navigate_to', target: 'settings' },
    { action: 'click', target: 'advanced_settings' },
    { action: 'toggle', target: 'enable_experimental', value: true },
    { action: 'input_text', target: 'api_key', value: 'sk-12345abcdef' },
    { action: 'select_option', target: 'model_version', value: 'latest' },
    { action: 'click', target: 'performance_tab' },
    { action: 'input_number', target: 'max_tokens', value: 2048 },
    { action: 'input_number', target: 'temperature', value: 0.7 },
    { action: 'click', target: 'save_changes' },
    { action: 'wait_for_response', timeout: 2000 },
    { action: 'click', target: 'confirm_dialog' }
  ]
};

// Synthetic Test Generator Class
class SyntheticTestGenerator {
  constructor(options = {}) {
    this.options = {
      outputDir: './test/ux-crisis-scenarios',
      scenarioCount: 50,
      ...options
    };
    
    this.ensureOutputDir();
  }
  
  // Ensure output directory exists
  ensureOutputDir() {
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
  }
  
  // Generate a synthetic test scenario
  generateScenario(options) {
    const {
      persona = 'overwhelmed_intern',
      environment = '3g_with_30%_packet_loss',
      stressProfile = 'deadline_plus_multitasking',
      workflow = 'code_generation'
    } = options;
    
    // Get the persona, environment, stress profile, and workflow definitions
    const personaData = PERSONAS[persona] || PERSONAS.overwhelmed_intern;
    const environmentData = NETWORK_CONDITIONS[environment] || NETWORK_CONDITIONS['3g_with_30%_packet_loss'];
    const stressData = STRESS_PROFILES[stressProfile] || STRESS_PROFILES.deadline_plus_multitasking;
    const workflowSteps = UI_WORKFLOWS[workflow] || UI_WORKFLOWS.code_generation;
    
    // Generate scenario ID
    const scenarioId = `crisis-${persona}-${workflow}-${uuidv4().substring(0, 8)}`;
    
    // Build the scenario
    const scenario = {
      id: scenarioId,
      metadata: {
        created: new Date().toISOString(),
        type: 'crisis_scenario',
        protocol: 'RED2025'
      },
      configuration: {
        persona,
        environment,
        stressProfile,
        workflow
      },
      personaDetails: personaData,
      environmentDetails: environmentData,
      stressDetails: stressData,
      steps: this.generateSteps(workflowSteps, personaData, stressData, environmentData)
    };
    
    return scenario;
  }
  
  // Generate workflow steps with modifications based on persona and stress
  generateSteps(baseSteps, persona, stress, environment) {
    const modifiedSteps = [];
    
    // Track stateful information
    let hasEncounteredError = false;
    let frustrationLevel = 0;
    let consecutiveErrors = 0;
    
    // Process each base step
    for (let i = 0; i < baseSteps.length; i++) {
      const step = { ...baseSteps[i] };
      
      // Apply persona behaviors
      if (persona.behaviors && persona.behaviors.length > 0) {
        step.behaviors = this.applyPersonaBehaviors(step, persona, frustrationLevel);
      }
      
      // Apply network conditions
      if (step.action === 'wait_for_response' || step.action === 'click') {
        step.networkConditions = this.applyNetworkConditions(environment);
      }
      
      // Apply stress factors
      step.stressFactors = this.applyStressFactors(step, stress, hasEncounteredError, consecutiveErrors);
      
      // Determine if this step will encounter an error
      const willEncounterError = this.willStepFail(step, stress, hasEncounteredError, consecutiveErrors);
      
      if (willEncounterError) {
        hasEncounteredError = true;
        consecutiveErrors++;
        frustrationLevel += 0.2 * consecutiveErrors;
        
        // Add error details
        step.error = this.generateErrorDetails(step, stress);
        
        // Add recovery attempts based on persona's error recovery style
        step.recoveryAttempts = this.generateRecoveryAttempts(persona, stress, consecutiveErrors);
      } else {
        consecutiveErrors = 0;
        frustrationLevel = Math.max(0, frustrationLevel - 0.1);
      }
      
      // Add potential interruptions
      if (stress.interruptionFrequency && Math.random() < 0.3) {
        step.interruptions = this.generateInterruptions(stress);
      }
      
      // Add step timing based on persona and environment
      step.timing = this.calculateStepTiming(step, persona, environment, hasEncounteredError);
      
      modifiedSteps.push(step);
      
      // Add potential context switches between steps
      if (stress.contextSwitching && Math.random() < stress.contextSwitching) {
        modifiedSteps.push(this.generateContextSwitch(stress));
      }
      
      // Add potential rage clicks or repeated actions after errors
      if (hasEncounteredError && frustrationLevel > 0.5 && step.action === 'click') {
        modifiedSteps.push(...this.generateFrustrationActions(step, frustrationLevel));
      }
    }
    
    return modifiedSteps;
  }
  
  // Apply persona behaviors to a step
  applyPersonaBehaviors(step, persona, frustrationLevel) {
    const behaviors = [];
    const { action } = step;
    
    // Select applicable behaviors based on the step type
    const applicableBehaviors = persona.behaviors.filter(behavior => {
      if (action === 'click' && ['multiple_rapid_clicks', 'rage_clicks'].includes(behavior)) {
        return true;
      }
      if (action === 'input_text' && ['rapid_keyboard_input', 'copy_paste_errors'].includes(behavior)) {
        return true;
      }
      if (['wait_for_response', 'review_output'].includes(action) && 
          ['frequent_tab_switching', 'context_switching'].includes(behavior)) {
        return true;
      }
      if (action === 'navigate_to' && ['frequent_interruptions', 'multitasking'].includes(behavior)) {
        return true;
      }
      return false;
    });
    
    // Randomly select behaviors based on frustration level
    const behaviorCount = Math.floor(Math.random() * 3) + (frustrationLevel > 0.5 ? 1 : 0);
    for (let i = 0; i < behaviorCount && i < applicableBehaviors.length; i++) {
      const randomIndex = Math.floor(Math.random() * applicableBehaviors.length);
      const behavior = applicableBehaviors[randomIndex];
      
      if (!behaviors.includes(behavior)) {
        behaviors.push(behavior);
      }
    }
    
    return behaviors;
  }
  
  // Apply network conditions to a step
  applyNetworkConditions(environment) {
    // Clone environment data
    const conditions = { ...environment };
    
    // Add some randomness to the conditions
    conditions.latency += Math.floor(Math.random() * conditions.jitter);
    conditions.packetLoss *= (0.8 + Math.random() * 0.4); // +/- 20%
    
    // Chance of temporary disconnection
    conditions.temporaryDisconnection = Math.random() < conditions.disconnectionRate;
    
    return conditions;
  }
  
  // Apply stress factors to a step
  applyStressFactors(step, stress, hasEncounteredError, consecutiveErrors) {
    const factors = {};
    
    if (stress.timePressure) {
      factors.timePressure = stress.timePressure;
    }
    
    if (stress.cognitiveLoad) {
      factors.cognitiveLoad = stress.cognitiveLoad;
    }
    
    // Increase cognitive load after errors
    if (hasEncounteredError) {
      factors.cognitiveLoad = (factors.cognitiveLoad || 0.5) + (0.1 * consecutiveErrors);
    }
    
    // Add random distractions
    if (stress.distractions && stress.distractions.length > 0 && Math.random() < 0.3) {
      const randomIndex = Math.floor(Math.random() * stress.distractions.length);
      factors.distraction = stress.distractions[randomIndex];
    }
    
    return factors;
  }
  
  // Determine if a step will fail
  willStepFail(step, stress, hasEncounteredError, consecutiveErrors) {
    // Base error probability from stress profile
    let errorProbability = stress.errorRate || 0.1;
    
    // Increase probability if already encountering errors (cascade effect)
    if (hasEncounteredError && stress.consecutiveErrors) {
      errorProbability += 0.1 * consecutiveErrors;
    }
    
    // Network-dependent actions have higher failure rate
    if (step.action === 'wait_for_response' || step.action === 'click') {
      errorProbability += 0.1;
    }
    
    // Steps with network conditions can fail based on packet loss
    if (step.networkConditions && step.networkConditions.packetLoss > 0.2) {
      errorProbability += 0.15;
    }
    
    return Math.random() < errorProbability;
  }
  
  // Generate error details for a step
  generateErrorDetails(step, stress) {
    const errorTypes = {
      'click': ['element_not_found', 'element_not_clickable', 'action_timeout'],
      'input_text': ['input_validation_failed', 'field_disabled'],
      'wait_for_response': ['timeout', 'network_error', 'server_error'],
      'select_option': ['option_not_found', 'select_disabled'],
      'navigate_to': ['page_not_found', 'navigation_blocked']
    };
    
    const commonErrors = ['unknown_error', 'permission_denied'];
    
    // Get applicable error types
    const applicableErrors = errorTypes[step.action] || commonErrors;
    
    // Select an error type
    const errorType = applicableErrors[Math.floor(Math.random() * applicableErrors.length)];
    
    // Generate error message
    let errorMessage;
    switch (errorType) {
      case 'timeout':
        errorMessage = 'The operation timed out. Please try again.';
        break;
      case 'network_error':
        errorMessage = 'A network error occurred. Please check your connection.';
        break;
      case 'server_error':
        errorMessage = 'The server encountered an error. Please try again later.';
        break;
      case 'element_not_found':
        errorMessage = `Could not find element: ${step.target}`;
        break;
      case 'element_not_clickable':
        errorMessage = `Element is not clickable: ${step.target}`;
        break;
      case 'input_validation_failed':
        errorMessage = 'The input is invalid. Please check your entry.';
        break;
      case 'option_not_found':
        errorMessage = `Option not found: ${step.value}`;
        break;
      default:
        errorMessage = 'An unexpected error occurred.';
    }
    
    // Build error details
    return {
      type: errorType,
      message: errorMessage,
      visible: Math.random() < 0.5, // 50% chance of visible error
      recoverable: Math.random() < 0.7, // 70% chance of recoverable error
      severity: Math.random() < stress.errorSeverity ? 'high' : 'medium'
    };
  }
  
  // Generate recovery attempts for a failed step
  generateRecoveryAttempts(persona, stress, consecutiveErrors) {
    const recoveryStyle = persona.errorRecovery || 'frustrated';
    const recoveryAttempts = [];
    
    // Determine number of attempts based on recovery style and consecutive errors
    let attemptCount;
    switch (recoveryStyle) {
      case 'frustrated':
        attemptCount = Math.min(3, consecutiveErrors + 1);
        break;
      case 'impatient':
        attemptCount = Math.min(2, consecutiveErrors + 1);
        break;
      case 'troubleshooting':
        attemptCount = Math.min(4, consecutiveErrors + 2);
        break;
      case 'persistent':
        attemptCount = Math.min(5, consecutiveErrors + 3);
        break;
      default:
        attemptCount = 2;
    }
    
    // Generate recovery attempts
    for (let i = 0; i < attemptCount; i++) {
      let attempt;
      
      // Different personas have different recovery strategies
      if (recoveryStyle === 'frustrated' || recoveryStyle === 'impatient') {
        // Frustrated users repeat the same action or rage click
        attempt = {
          type: i === 0 ? 'repeat_action' : 'rage_click',
          delay: 500 + Math.random() * 1000
        };
      } else if (recoveryStyle === 'troubleshooting') {
        // Troubleshooters try different approaches
        const strategies = [
          'repeat_action',
          'refresh_page',
          'try_alternative',
          'check_documentation',
          'debug_console'
        ];
        attempt = {
          type: strategies[Math.min(i, strategies.length - 1)],
          delay: 1000 + Math.random() * 2000
        };
      } else {
        // Persistent users methodically try options
        const strategies = [
          'repeat_action',
          'wait_and_retry',
          'clear_and_retry',
          'try_alternative',
          'seek_help'
        ];
        attempt = {
          type: strategies[Math.min(i, strategies.length - 1)],
          delay: 1500 + Math.random() * 3000
        };
      }
      
      // Add increasing frustration with each attempt
      attempt.frustrationLevel = Math.min(1.0, 0.2 + (i * 0.2));
      
      recoveryAttempts.push(attempt);
    }
    
    return recoveryAttempts;
  }
  
  // Generate interruptions based on stress profile
  generateInterruptions(stress) {
    const interruptions = [];
    
    if (!stress.distractions || stress.distractions.length === 0) {
      return interruptions;
    }
    
    const interruptionCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < interruptionCount; i++) {
      const randomIndex = Math.floor(Math.random() * stress.distractions.length);
      const type = stress.distractions[randomIndex];
      
      interruptions.push({
        type,
        time: Math.floor(Math.random() * 5000), // Random time within step
        duration: 1000 + Math.random() * 3000, // 1-4 seconds
        attentionShift: 0.3 + Math.random() * 0.5 // 30-80% attention shift
      });
    }
    
    return interruptions;
  }
  
  // Calculate timing for a step based on persona and conditions
  calculateStepTiming(step, persona, environment, hasEncounteredError) {
    // Base timing depends on action type
    let baseTime;
    switch (step.action) {
      case 'click':
        baseTime = 500;
        break;
      case 'input_text':
        baseTime = 1000 + (step.value ? step.value.length * 50 : 0);
        break;
      case 'select_option':
        baseTime = 800;
        break;
      case 'wait_for_response':
        baseTime = step.timeout || 3000;
        break;
      case 'review_output':
        baseTime = 3000;
        break;
      default:
        baseTime = 1000;
    }
    
    // Adjust based on persona's experience
    const experienceMultiplier = {
      'novice': 2.0,
      'intermediate': 1.3,
      'expert': 0.8,
      'varies': 1.5
    }[persona.experience] || 1.0;
    
    // Adjust based on persona's patience
    const patienceMultiplier = {
      'very_low': 0.7,
      'low': 0.8,
      'moderate': 1.0,
      'high': 1.2
    }[persona.patience] || 1.0;
    
    // Network condition impact
    let networkMultiplier = 1.0;
    if (environment && (step.action === 'wait_for_response' || step.action === 'click')) {
      networkMultiplier = 1.0 + (environment.latency / 1000);
      
      if (environment.temporaryDisconnection) {
        networkMultiplier += 3.0; // Add 3 seconds for temporary disconnection
      }
    }
    
    // Increase time if errors occurred
    const errorMultiplier = hasEncounteredError ? 1.5 : 1.0;
    
    // Calculate total time
    const totalTime = baseTime * experienceMultiplier * patienceMultiplier * networkMultiplier * errorMultiplier;
    
    // Add randomness (+/- 20%)
    const randomizedTime = totalTime * (0.8 + Math.random() * 0.4);
    
    return {
      base: baseTime,
      total: Math.floor(randomizedTime),
      factors: {
        experience: experienceMultiplier,
        patience: patienceMultiplier,
        network: networkMultiplier,
        error: errorMultiplier
      }
    };
  }
  
  // Generate a context switch event
  generateContextSwitch(stress) {
    const contextSwitchTypes = [
      'notification_check',
      'email_check',
      'chat_response',
      'phone_call',
      'colleague_interruption',
      'browser_tab_switch'
    ];
    
    const type = contextSwitchTypes[Math.floor(Math.random() * contextSwitchTypes.length)];
    
    return {
      action: 'context_switch',
      type,
      duration: 5000 + Math.random() * 25000, // 5-30 seconds
      attentionCost: 0.2 + Math.random() * 0.4, // 20-60% attention cost
      recoveryTime: 2000 + Math.random() * 8000 // 2-10 seconds to refocus
    };
  }
  
  // Generate frustration actions after errors
  generateFrustrationActions(step, frustrationLevel) {
    const actions = [];
    
    if (frustrationLevel > 0.7) {
      // High frustration leads to rage clicks
      const clickCount = Math.floor(frustrationLevel * 10);
      
      actions.push({
        action: 'rage_click',
        target: step.target,
        count: clickCount,
        interval: 100 + Math.random() * 200
      });
    } else if (frustrationLevel > 0.4) {
      // Moderate frustration leads to repeated attempts
      actions.push({
        action: 'repeat_action',
        originalAction: step.action,
        target: step.target,
        value: step.value
      });
    }
    
    return actions;
  }
  
  // Generate a batch of test scenarios
  generateScenarios(options = {}) {
    const scenarios = [];
    const count = options.count || this.options.scenarioCount;
    
    // Set up distribution of scenarios across different configurations
    const personaKeys = Object.keys(PERSONAS);
    const environmentKeys = Object.keys(NETWORK_CONDITIONS);
    const stressKeys = Object.keys(STRESS_PROFILES);
    const workflowKeys = Object.keys(UI_WORKFLOWS);
    
    for (let i = 0; i < count; i++) {
      // Select configurations with some weighting toward problematic combinations
      const persona = personaKeys[Math.floor(Math.random() * personaKeys.length)];
      const environment = environmentKeys[Math.floor(Math.random() * environmentKeys.length)];
      const stressProfile = stressKeys[Math.floor(Math.random() * stressKeys.length)];
      const workflow = workflowKeys[Math.floor(Math.random() * workflowKeys.length)];
      
      const scenario = this.generateScenario({
        persona,
        environment,
        stressProfile,
        workflow
      });
      
      scenarios.push(scenario);
    }
    
    return scenarios;
  }
  
  // Save scenarios to disk
  saveScenarios(scenarios) {
    for (const scenario of scenarios) {
      const filePath = path.join(this.options.outputDir, `${scenario.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(scenario, null, 2));
    }
    
    // Create an index file
    const index = scenarios.map(s => ({
      id: s.id,
      persona: s.configuration.persona,
      environment: s.configuration.environment,
      stressProfile: s.configuration.stressProfile,
      workflow: s.configuration.workflow,
      stepCount: s.steps.length
    }));
    
    const indexPath = path.join(this.options.outputDir, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    
    return {
      scenarioCount: scenarios.length,
      indexPath,
      outputDir: this.options.outputDir
    };
  }
  
  // Generate and save scenarios
  generate(options = {}) {
    console.log('Generating synthetic stress test scenarios...');
    
    const scenarios = this.generateScenarios(options);
    const result = this.saveScenarios(scenarios);
    
    console.log(`Generated ${result.scenarioCount} scenarios in ${result.outputDir}`);
    console.log(`Index file: ${result.indexPath}`);
    
    return result;
  }
}

// Export the class and utilities
module.exports = {
  SyntheticTestGenerator,
  PERSONAS,
  NETWORK_CONDITIONS,
  STRESS_PROFILES,
  UI_WORKFLOWS
};
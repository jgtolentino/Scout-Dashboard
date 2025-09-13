/**
 * Progressive Disclosure UI Pattern Implementation
 * RED2025 Emergency Protocol - Phase 1
 * 
 * This implementation replaces the current overloaded interface with a step-by-step
 * wizard approach to reduce cognitive load.
 */

// Core wizard component that manages steps
class ProgressiveWizard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentStep: 0,
      maxStepsVisited: 0,
      data: {},
      errors: {},
      isProcessing: false
    };
  }

  // Move to the next step
  nextStep = () => {
    const { currentStep, maxStepsVisited } = this.state;
    const nextStep = currentStep + 1;
    
    this.setState({
      currentStep: nextStep,
      maxStepsVisited: Math.max(maxStepsVisited, nextStep)
    });
    
    // Track step transition for analytics
    trackUserJourney({
      action: 'wizard_next_step',
      from_step: currentStep,
      to_step: nextStep,
      time_on_step: this.getTimeOnCurrentStep()
    });
  };

  // Move to the previous step
  prevStep = () => {
    const { currentStep } = this.state;
    const prevStep = currentStep - 1;
    
    if (prevStep >= 0) {
      this.setState({ currentStep: prevStep });
      
      // Track step transition for analytics
      trackUserJourney({
        action: 'wizard_prev_step',
        from_step: currentStep,
        to_step: prevStep,
        time_on_step: this.getTimeOnCurrentStep()
      });
    }
  };

  // Jump to a specific step
  jumpToStep = (stepIndex) => {
    const { currentStep, maxStepsVisited } = this.state;
    
    // Only allow jumping to visited steps or the next available step
    if (stepIndex <= maxStepsVisited + 1 && stepIndex >= 0) {
      this.setState({ currentStep: stepIndex });
      
      // Track step jump for analytics
      trackUserJourney({
        action: 'wizard_jump_step',
        from_step: currentStep,
        to_step: stepIndex,
        time_on_step: this.getTimeOnCurrentStep()
      });
    }
  };

  // Update data from step components
  updateData = (newData) => {
    this.setState(prevState => ({
      data: { ...prevState.data, ...newData }
    }));
  };

  // Update validation errors
  updateErrors = (stepIndex, errors) => {
    this.setState(prevState => ({
      errors: { ...prevState.errors, [stepIndex]: errors }
    }));
  };

  // Calculate time spent on current step
  getTimeOnCurrentStep = () => {
    const now = new Date();
    const timeSpent = now - this.stepEnteredTime;
    return timeSpent;
  };

  // Log step entry for timing
  componentDidUpdate(prevProps, prevState) {
    if (prevState.currentStep !== this.state.currentStep) {
      this.stepEnteredTime = new Date();
    }
  }

  componentDidMount() {
    this.stepEnteredTime = new Date();
  }

  render() {
    const { currentStep, data, errors, isProcessing } = this.state;
    const { steps, onComplete } = this.props;
    
    // Current step component
    const StepComponent = steps[currentStep];
    
    // Check if current step has errors
    const hasErrors = errors[currentStep] && Object.keys(errors[currentStep]).length > 0;
    
    // Determine if we can proceed to next step
    const canProceed = !hasErrors && !isProcessing;
    
    return (
      <div className="progressive-wizard" role="dialog" aria-labelledby="wizard-title">
        {/* Accessibility announcement for screen readers */}
        <div className="sr-only" aria-live="polite">
          Step {currentStep + 1} of {steps.length}
        </div>
        
        {/* Progress indicator */}
        <div className="wizard-progress" aria-hidden="true">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`step-indicator ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              onClick={() => this.jumpToStep(index)}
              role="button"
              aria-label={`Go to step ${index + 1}: ${step.title}`}
              tabIndex={index <= this.state.maxStepsVisited ? 0 : -1}
            >
              <span className="step-number">{index + 1}</span>
              <span className="step-title">{step.title}</span>
            </div>
          ))}
        </div>
        
        {/* Current step content */}
        <div className="step-content">
          <h2 id="wizard-title">{steps[currentStep].title}</h2>
          
          {/* Help text with progressive disclosure */}
          <details className="help-details">
            <summary>Need help with this step?</summary>
            <div className="help-content">
              {steps[currentStep].helpText}
            </div>
          </details>
          
          <StepComponent 
            data={data}
            updateData={this.updateData}
            updateErrors={(errors) => this.updateErrors(currentStep, errors)}
          />
          
          {/* Error summary for accessibility */}
          {hasErrors && (
            <div className="error-summary" role="alert">
              <h3>Please fix the following errors:</h3>
              <ul>
                {Object.entries(errors[currentStep]).map(([field, error]) => (
                  <li key={field}>
                    <a href={`#${field}`}>{error}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Navigation buttons */}
        <div className="wizard-navigation">
          {currentStep > 0 && (
            <button 
              type="button"
              onClick={this.prevStep}
              className="btn-previous"
              disabled={isProcessing}
            >
              Previous
            </button>
          )}
          
          {currentStep < steps.length - 1 ? (
            <button 
              type="button"
              onClick={this.nextStep}
              className="btn-next"
              disabled={!canProceed}
            >
              Next
            </button>
          ) : (
            <button 
              type="button"
              onClick={() => onComplete(data)}
              className="btn-complete"
              disabled={!canProceed}
            >
              Complete
            </button>
          )}
          
          {/* Contextual help based on current state */}
          {hasErrors && (
            <button 
              type="button"
              className="btn-help"
              onClick={() => this.showContextualHelp(errors[currentStep])}
            >
              Get Help
            </button>
          )}
        </div>
      </div>
    );
  }
}

// Example implementation for code input step
const CodeInputStep = ({ data, updateData, updateErrors }) => {
  const [code, setCode] = useState(data.code || '');
  const [isValidating, setIsValidating] = useState(false);
  
  // Validate code input
  const validateCode = async (value) => {
    setIsValidating(true);
    
    try {
      const result = await codeValidator.validate(value);
      
      if (result.isValid) {
        updateErrors({});
        updateData({ code: value });
      } else {
        updateErrors({
          code: result.errorMessage
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
      updateErrors({
        code: 'An error occurred while validating your code.'
      });
    } finally {
      setIsValidating(false);
    }
  };
  
  // Debounced validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (code) {
        validateCode(code);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [code]);
  
  return (
    <div className="step-code-input">
      <label htmlFor="code-editor">Enter your code:</label>
      <div className="code-editor-container">
        <CodeEditor
          id="code-editor"
          value={code}
          onChange={setCode}
          language="javascript"
          aria-describedby="code-help"
          theme="vs-dark"
        />
        <p id="code-help" className="input-help">
          Enter JavaScript, Python, or TypeScript code for processing.
        </p>
      </div>
      
      {isValidating && (
        <div className="validation-indicator" aria-live="polite">
          Validating your code...
        </div>
      )}
    </div>
  );
};

// Example implementation for test configuration step
const TestConfigStep = ({ data, updateData, updateErrors }) => {
  const [config, setConfig] = useState(data.testConfig || {
    runUnitTests: true,
    runIntegrationTests: false,
    environment: 'development'
  });
  
  const handleChange = (field, value) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    updateData({ testConfig: newConfig });
  };
  
  return (
    <div className="step-test-config">
      <fieldset>
        <legend>Test Configuration</legend>
        
        <div className="form-group">
          <input
            type="checkbox"
            id="unit-tests"
            checked={config.runUnitTests}
            onChange={(e) => handleChange('runUnitTests', e.target.checked)}
          />
          <label htmlFor="unit-tests">Run unit tests</label>
        </div>
        
        <div className="form-group">
          <input
            type="checkbox"
            id="integration-tests"
            checked={config.runIntegrationTests}
            onChange={(e) => handleChange('runIntegrationTests', e.target.checked)}
          />
          <label htmlFor="integration-tests">Run integration tests</label>
        </div>
        
        <div className="form-group">
          <label htmlFor="environment">Test Environment:</label>
          <select
            id="environment"
            value={config.environment}
            onChange={(e) => handleChange('environment', e.target.value)}
          >
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
        </div>
      </fieldset>
    </div>
  );
};

// Example implementation for deployment options step
const DeploymentOptionsStep = ({ data, updateData, updateErrors }) => {
  const [deployOptions, setDeployOptions] = useState(data.deployOptions || {
    target: 'local',
    autoPublish: false,
    notifyTeam: false
  });
  
  const handleChange = (field, value) => {
    const newOptions = { ...deployOptions, [field]: value };
    setDeployOptions(newOptions);
    updateData({ deployOptions: newOptions });
  };
  
  // Advanced options with progressive disclosure
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  return (
    <div className="step-deployment-options">
      <fieldset>
        <legend>Deployment Options</legend>
        
        <div className="form-group">
          <label htmlFor="deploy-target">Deployment Target:</label>
          <select
            id="deploy-target"
            value={deployOptions.target}
            onChange={(e) => handleChange('target', e.target.value)}
          >
            <option value="local">Local Environment</option>
            <option value="dev">Development Server</option>
            <option value="staging">Staging Environment</option>
            <option value="production">Production</option>
          </select>
        </div>
        
        {/* Progressive disclosure of advanced options */}
        <button 
          type="button"
          className="btn-advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-expanded={showAdvanced}
          aria-controls="advanced-options"
        >
          {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
        </button>
        
        {showAdvanced && (
          <div id="advanced-options" className="advanced-options">
            <div className="form-group">
              <input
                type="checkbox"
                id="auto-publish"
                checked={deployOptions.autoPublish}
                onChange={(e) => handleChange('autoPublish', e.target.checked)}
              />
              <label htmlFor="auto-publish">Auto-publish after deployment</label>
            </div>
            
            <div className="form-group">
              <input
                type="checkbox"
                id="notify-team"
                checked={deployOptions.notifyTeam}
                onChange={(e) => handleChange('notifyTeam', e.target.checked)}
              />
              <label htmlFor="notify-team">Notify team after deployment</label>
            </div>
            
            {/* Only show CI/CD options for non-local deployments */}
            {deployOptions.target !== 'local' && (
              <div className="form-group">
                <input
                  type="checkbox"
                  id="run-ci-cd"
                  checked={deployOptions.runCiCd || false}
                  onChange={(e) => handleChange('runCiCd', e.target.checked)}
                />
                <label htmlFor="run-ci-cd">Run CI/CD pipeline</label>
              </div>
            )}
          </div>
        )}
      </fieldset>
    </div>
  );
};

// Usage example
const CodeGenWizard = () => {
  const handleComplete = (data) => {
    console.log('Wizard completed with data:', data);
    // Process the complete data...
  };

  const steps = [
    {
      component: CodeInputStep,
      title: 'Code Input',
      helpText: 'Enter the code you want to process. We support JavaScript, Python, and TypeScript.'
    },
    {
      component: TestConfigStep,
      title: 'Test Configuration',
      helpText: 'Configure how your code will be tested.'
    },
    {
      component: DeploymentOptionsStep,
      title: 'Deployment Options',
      helpText: 'Configure where and how your code will be deployed.'
    }
  ];

  return (
    <ProgressiveWizard 
      steps={steps}
      onComplete={handleComplete}
    />
  );
};

export default CodeGenWizard;
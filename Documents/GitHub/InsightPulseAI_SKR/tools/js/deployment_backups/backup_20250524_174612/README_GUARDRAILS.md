# CI/CD and AI Patch Workflow Guardrails

This document describes the automated guardrails implemented to ensure code quality, security, and reliability in the InsightPulseAI project, especially when working with AI-assisted code changes.

## 1. Prompt-to-Test Feedback Loop

Automatically run tests when AI-generated code changes are made and feed failures back to AI for correction.

### Usage

```bash
# Use the AI test loop script to automatically fix issues
node scripts/ai-test-loop.js src/utils/helpers.js "Fix the date formatting bug"

# Or use a structured prompt template
node scripts/ai-test-loop.js --template=.prompts/bug-fix-template.md src/utils/helpers.js
```

### Integration Points

- Pre-commit hook that detects `:clodrep` commands and runs tests
- AI test loop script that can iteratively improve code until tests pass
- Automatic error capture for feedback to AI

## 2. Schema & Contract Validation

JSON Schema validations for critical configuration files.

### Available Schemas

- `schemas/staticwebapp.schema.json` - Validates Azure Static Web Apps configuration
- `schemas/dlt.schema.json` - Validates Data Lake Transfer pipeline specifications

### Usage

```bash
# Validate a configuration file manually
npx ajv validate -s schemas/staticwebapp.schema.json -d deploy-advisor-fixed/staticwebapp.config.json

# Schema validation is also integrated into the pre-commit hook
```

## 3. Static Analysis & Linters

Automated code quality checks to prevent introducing new issues.

### Configured Linters

- ESLint for JavaScript code quality
- Prettier for code formatting
- StyleLint for CSS styling

### Configuration Files

- `.eslintrc.json` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `.stylelintrc.json` - StyleLint configuration

### Usage

```bash
# Run ESLint manually
npx eslint "**/*.{js,jsx,ts,tsx}"

# Run Prettier manually
npx prettier --write "**/*.{js,jsx,ts,tsx,json,css,md}"

# These checks are also integrated into pre-commit hooks and CI/CD pipeline
```

## 4. Canary & Feature-Flag Deployments

Gradual rollout of new features to reduce risk.

### Feature Flag System

- Feature flag management in `utils/feature-flags.js`
- Environment variable overrides with `REACT_APP_ENABLE_*` prefix
- LocalStorage overrides for local development

### Canary Deployment

```bash
# Deploy to canary environment with new features enabled
./scripts/deploy-canary.sh

# Promote canary to production after successful testing
./scripts/promote-to-production.sh
```

## 5. Immutable Golden Baselines

Maintain known-good versions of the codebase for rollback.

### Usage

```bash
# Create a golden baseline of the current state
./scripts/create-golden-baseline.sh

# Verify changes against a golden baseline
./scripts/verify-against-golden.sh

# Roll back to a golden baseline
./scripts/rollback-to-golden.sh golden-20250515123456
```

## 6. Prompt Templates & Guard Prompting

Structured AI prompts with built-in verification steps.

### Available Templates

- `.prompts/patch-template.md` - For small, focused code changes
- `.prompts/feature-template.md` - For implementing new features
- `.prompts/refactor-template.md` - For code refactoring
- `.prompts/bug-fix-template.md` - For fixing bugs

### Usage

```bash
# Apply a template to generate a prompt
node scripts/apply-prompt-template.js .prompts/patch-template.md src/utils/helpers.js

# Use a template with the AI test loop
node scripts/ai-test-loop.js --template=.prompts/bug-fix-template.md src/utils/helpers.js
```

## 7. Operational Telemetry & Alerting

Monitoring system to detect issues in production.

### Telemetry

- Application performance monitoring in `utils/telemetry.js`
- Instrumentation for tracking:
  - Page load times
  - API response times
  - Component render times
  - Error rates
  - Feature usage

### Alerting

```bash
# Set up Azure monitoring alerts
node scripts/setup-azure-alerts.js --resource-group=InsightPulseAI-RG --app-name=scout-dashboard
```

## CI/CD Pipeline Integration

All these guardrails are integrated into the CI/CD pipeline in `.github/workflows/ci.yml`:

1. **Validation Phase**:
   - Runs linters and schema validation
   - Checks code formatting

2. **Test Phase**:
   - Runs unit and integration tests
   - Generates test coverage reports

3. **Canary Phase**:
   - Builds and deploys to a canary environment
   - Enables feature flags for testing

4. **Monitoring Phase**:
   - Runs smoke tests against the canary deployment
   - Monitors for errors or performance issues

5. **Production Phase**:
   - Promotes to production after successful monitoring
   - Creates a golden tag for potential rollback

## Best Practices

1. **Always use templates for AI prompts**: They include built-in verification steps and constraints.
2. **Create golden baselines before major changes**: Makes rollback easier if issues are discovered.
3. **Deploy to canary first**: Never deploy directly to production, especially for AI-assisted changes.
4. **Verify schema changes**: Any modification to configuration files should be validated against schemas.
5. **Run the AI test loop locally**: Fix test failures before committing AI-generated code.

## Troubleshooting

If you encounter issues with the guardrails:

1. **Pre-commit hooks not running**: Make sure Husky is installed and initialized. Run `npx husky install`.
2. **Schema validation failing**: Check your configuration files against the JSON schemas in the `schemas/` directory.
3. **AI test loop getting stuck**: Try with a different prompt or template, or increase the max iterations.
4. **Canary deployment issues**: Check the Azure Portal for more detailed error messages.

For more help, contact the development team.
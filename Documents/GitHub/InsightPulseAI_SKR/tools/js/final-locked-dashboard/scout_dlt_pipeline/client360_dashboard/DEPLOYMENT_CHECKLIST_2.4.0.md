# Client360 Dashboard v2.4.0 Deployment Checklist

Use this checklist to ensure a smooth deployment of Client360 Dashboard v2.4.0.

## Pre-Deployment Checks

### Resource Verification
- [ ] Azure subscription has sufficient quota for additional AI services
- [ ] Resource group `tbwa-client360-dashboard` exists and is accessible
- [ ] Azure OpenAI service is provisioned and accessible
- [ ] Key Vault is accessible and can be updated
- [ ] Static Web App has available deployment slots

### Environment Preparation
- [ ] Development environment updated to Node.js 16+
- [ ] Azure CLI 2.40+ installed
- [ ] Deployment scripts have execute permissions
- [ ] Git repository is up to date
- [ ] v2.4.0 tag exists in repository

### Configuration Review
- [ ] `.env.production` file created with v2.4.0 settings
- [ ] Azure OpenAI API keys are valid and active
- [ ] Embeddings model is properly deployed
- [ ] Environment variables match deployment requirements
- [ ] Feature flags set correctly for v2.4.0 features

### Package Verification
- [ ] All required v2.4.0 files present in `deploy_v2.4.0` directory
- [ ] Version references in files consistently show v2.4.0
- [ ] New AI engine components are included
- [ ] Enhanced map components are included
- [ ] User personalization framework files are included
- [ ] No temporary or debug files included in package

## Deployment Execution

### Resource Setup
- [ ] Deploy new Azure OpenAI models if needed
- [ ] Update Key Vault secrets with new values
- [ ] Ensure storage accounts have sufficient capacity
- [ ] Create backup of v2.3.3 configuration

### Deployment Process
- [ ] Run diff-aware deployment from v2.3.3 to v2.4.0
- [ ] Update Azure Static Web App settings
- [ ] Configure CORS settings if needed
- [ ] Check deployment logs for errors
- [ ] Verify all files deployed correctly

### Post-Deployment Verification
- [ ] Run `verify_v2.4.0_deployment.sh` without errors
- [ ] Confirm dashboard loads with v2.4.0 in footer
- [ ] Test AI insights panel with both simulation and live modes
- [ ] Verify multi-model capabilities function correctly
- [ ] Test map component with new layers
- [ ] Create and save user preferences
- [ ] Verify load time improvements meet targets

## Feature Testing

### AI Engine
- [ ] Toggle between simulation and live mode works
- [ ] Quick insights generation works (< 5 seconds)
- [ ] Detailed insights generation works (< 20 seconds)
- [ ] Embeddings-based search functions correctly
- [ ] Streaming responses display properly
- [ ] Fallbacks engage when primary model unavailable
- [ ] AI model attribution shows in insights

### Map Component
- [ ] New layer controls function properly
- [ ] GeoJSON loading is faster than v2.3.3
- [ ] Region selection works at all levels
- [ ] Heatmap visualization renders correctly
- [ ] Location search finds expected results
- [ ] Map filters sync with global dashboard filters
- [ ] Layer switching preserves current view where appropriate

### User Personalization
- [ ] User preferences save correctly
- [ ] Dashboard layouts can be customized and saved
- [ ] Filter presets can be saved and applied
- [ ] Recent views history tracks correctly
- [ ] Export templates can be created and used
- [ ] Settings sync between browser sessions

### Performance Metrics
- [ ] Initial load time < 2 seconds (target: 1.7s)
- [ ] Map rendering time < 1 second
- [ ] AI insights panel loading < 0.5 seconds
- [ ] Filter application < 200ms
- [ ] Full page interactivity < 3 seconds
- [ ] Memory usage < 150MB

## Monitoring Setup

- [ ] Azure Application Insights configured for v2.4.0
- [ ] Custom events added for new AI models
- [ ] Performance metrics dashboard updated
- [ ] Alerts configured for critical components
- [ ] Error logging enabled for new components
- [ ] Usage tracking implemented for new features

## Rollback Preparation

- [ ] Backup of v2.3.3 files verified
- [ ] Rollback script tested in staging environment
- [ ] Rollback instructions documented and shared with team
- [ ] Database/storage compatibility confirmed for rollback
- [ ] User communication plan ready in case of rollback

## Communication

- [ ] Update internal documentation with v2.4.0 features
- [ ] Prepare announcement for dashboard users
- [ ] Schedule training sessions for key features
- [ ] Update support knowledge base
- [ ] Prepare quick reference guide for new features

## Final Approval

- [ ] Product owner sign-off received
- [ ] QA testing complete and passed
- [ ] Security review complete
- [ ] Performance testing results meet targets
- [ ] All items in this checklist verified

## Post-Deployment Tasks

- [ ] Monitor error logs for 24 hours after deployment
- [ ] Collect initial user feedback
- [ ] Review performance metrics after 24 hours
- [ ] Conduct post-deployment review meeting
- [ ] Archive deployment artifacts
- [ ] Update roadmap with completed items

## Notes

Use this section to document any special considerations or issues encountered during deployment:

```
Deployment start time: _________________
Deployment completed: _________________
Deployed by: _________________________
Verified by: _________________________
```
# CLAUDE.md — Neural DataBank Orchestration Rules

## Execution Model
- **Bruno** is the executor - handles environment, secrets, and deployment
- **Claude Code** orchestrates - plans, coordinates, and validates
- **Neural Agents** provide specialized AI capabilities via 4-layer architecture
- No secrets in prompts or repo; route via Bruno environment injection

## MCP Endpoints
Available in Dev Mode:
- **Supabase** - Database operations, Edge Functions, migrations
- **MindsDB** - ML model training, prediction, and management via MCP server
- **GitHub** - Repository management, issues, PRs
- **Figma** - Design system integration, component specs
- **Gmail** - Communication and notification workflows

## Neural DataBank Agent Orchestration

### **Bronze Agent** - Data Ingestion Orchestration
- **Purpose**: Raw data collection and initial processing coordination
- **Triggers**: New data sources, ingestion failures, schema evolution
- **Tools**: MinIO management, Apache Iceberg operations, data validation
- **Handoffs**: Silver Agent for data quality promotion

### **Silver Agent** - Data Quality Orchestration  
- **Purpose**: Business-ready data transformation and quality assurance
- **Triggers**: Bronze data availability, quality gate failures, schema changes
- **Tools**: dbt transformations, Supabase operations, quality metrics
- **Handoffs**: Gold Agent for aggregation promotion

### **Gold Agent** - Business Intelligence Orchestration
- **Purpose**: KPI calculation and materialized view management
- **Triggers**: Silver data updates, business metric changes, refresh schedules  
- **Tools**: SQL optimization, materialized views, caching strategies
- **Handoffs**: Platinum Agent for AI enhancement

### **Platinum Agent** - AI Enhancement Orchestration
- **Purpose**: ML model inference, predictions, and intelligent insights
- **Triggers**: Gold data availability, model retraining, prediction requests
- **Tools**: MindsDB MCP, GPT-4 integration, model monitoring
- **Handoffs**: Dashboard rendering with AI-enhanced visualizations

## AI Router Integration Patterns

### **Intent Classification Workflow**
```typescript
// 1. Natural Language → Intent
const classifyIntent = async (query: string, context: FilterContext) => {
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: normalizeQuery(query)
  });
  
  const similarities = await vectorSearch(embedding.data[0].embedding);
  const intent = await classifyBusinessIntent(query, similarities);
  
  return { intent, confidence: intent.confidence, route: intent.primaryRoute };
};

// 2. Route to Appropriate Agent
const routeToAgent = (intent: Intent, context: Context) => {
  const routingMatrix = {
    'executive': () => goldAgent.getKPIs(context),
    'trends': () => goldAgent.getTimeSeries(context),  
    'product': () => silverAgent.getProductMix(context),
    'consumer': () => silverAgent.getDemographics(context),
    'predictions': () => platinumAgent.getForecasts(context),
    'recommendations': () => platinumAgent.getInsights(context)
  };
  
  return routingMatrix[intent.primary]();
};
```

### **Caching Coordination**
```typescript
// Multi-layer cache coordination across agents
const cacheStrategy = {
  bronze: { ttl: '1h', invalidation: 'append_only' },
  silver: { ttl: '30m', invalidation: 'quality_score_change' },
  gold: { ttl: '15m', invalidation: 'kpi_recalc' },
  platinum: { ttl: '5m', invalidation: 'model_prediction' }
};

const coordinatedCacheInvalidation = async (layer: DataLayer, event: ChangeEvent) => {
  const dependentLayers = getDependentLayers(layer);
  await Promise.all(
    dependentLayers.map(l => invalidateCache(l, event.changeId))
  );
};
```

## MindsDB MCP Server Orchestration

### **Model Lifecycle Management**
- **Training Triggers**: Data drift detection, performance degradation, schedule-based
- **Validation Pipeline**: Automated A/B testing, performance benchmarking, approval gates
- **Deployment Strategy**: Blue-green deployment with traffic splitting
- **Monitoring Integration**: Real-time performance tracking, alerting, rollback triggers

### **MCP Tool Orchestration**
```python
# Coordinate MCP tools across ML workflow
@mcp_server.call_tool("orchestrate_training")
async def orchestrate_ml_training(model_config: dict):
    # 1. Validate data quality
    quality_check = await mcp_server.call_tool("analyze_data", {
        "table": model_config["training_table"],
        "quality_gates": model_config["quality_requirements"]
    })
    
    if quality_check["quality_score"] < 0.95:
        return {"status": "failed", "reason": "Data quality below threshold"}
    
    # 2. Create model
    model_result = await mcp_server.call_tool("create_model", model_config)
    
    # 3. Validate performance
    performance = await mcp_server.call_tool("predict", {
        "model": model_config["name"],
        "validation_data": model_config["validation_set"]
    })
    
    # 4. Deploy if passing gates
    if performance["accuracy"] >= model_config["min_accuracy"]:
        await deploy_model_to_production(model_config["name"])
        return {"status": "success", "model_id": model_result["model_id"]}
    
    return {"status": "failed", "reason": "Model performance below threshold"}
```

## Communication Style
- **Direct and critical** - produce runnable, actionable blocks with AI insights
- **Evidence-based** - validate with data and model predictions before execution
- **Quality-gated** - test, lint, validate, and AI-score all changes
- **Documentation-first** - maintain clear project records with AI-generated summaries

## AI-Enhanced Project Standards

### **Medallion Architecture Compliance**
- **Bronze → Silver → Gold → Platinum** data flow with AI checkpoints
- **Quality Gates**: Automated data quality scoring and ML-powered anomaly detection
- **Schema Evolution**: AI-assisted impact analysis for schema changes
- **Performance Optimization**: ML-powered query optimization and caching strategies

### **Neural DataBank Integration Requirements**
- **Model Versioning**: All ML models must use semantic versioning with performance tracking
- **Prediction Confidence**: Minimum 0.9 confidence for production recommendations
- **Explainability**: SHAP/LIME integration for model interpretability
- **Bias Detection**: Automated fairness testing across demographic segments

### **AI Assistant Integration**
- **QuickSpec Validation**: All generated charts must pass safety and performance checks
- **Natural Language Processing**: Multi-language support with cultural context awareness
- **Rate Limiting**: Intelligent rate limiting based on query complexity and user patterns
- **Security Boundaries**: Strict whitelisting with intelligent error suggestions

### **Development Workflow with AI**
```typescript
// AI-enhanced development workflow
const aiEnhancedWorkflow = {
  // 1. Code Review with AI
  codeReview: async (pullRequest: PR) => {
    const aiReview = await platinumAgent.reviewCode({
      diff: pullRequest.diff,
      context: pullRequest.context,
      standards: PROJECT_STANDARDS
    });
    
    return {
      suggestions: aiReview.improvements,
      riskScore: aiReview.riskAssessment,
      autoFixable: aiReview.autoFixSuggestions
    };
  },
  
  // 2. Test Generation
  testGeneration: async (component: Component) => {
    const tests = await platinumAgent.generateTests({
      component: component.code,
      coverage: 'comprehensive',
      framework: 'jest'
    });
    
    return tests.testSuite;
  },
  
  // 3. Documentation Enhancement
  docGeneration: async (codebase: Codebase) => {
    const docs = await platinumAgent.enhanceDocumentation({
      codebase: codebase.summary,
      audience: 'developer',
      includeExamples: true
    });
    
    return docs.enhancedDocumentation;
  }
};
```

## Error Handling & Recovery

### **AI-Powered Incident Response**
- **Automatic Diagnosis**: ML models analyze error patterns and suggest root causes
- **Intelligent Rollback**: AI determines optimal rollback strategy based on impact analysis
- **Predictive Alerts**: Anomaly detection for preventing issues before they occur
- **Self-Healing**: Automated recovery procedures with ML-powered decision making

### **Model Fallback Strategies**
```python
class ModelFallbackOrchestrator:
    def __init__(self):
        self.fallback_chain = [
            'primary_model',
            'secondary_model', 
            'cached_predictions',
            'statistical_baseline',
            'business_rules'
        ]
    
    async def get_prediction_with_fallback(self, input_data: dict):
        for model_name in self.fallback_chain:
            try:
                result = await self.get_prediction(model_name, input_data)
                if result['confidence'] >= self.min_confidence[model_name]:
                    return result
            except Exception as e:
                logger.warning(f"Model {model_name} failed: {e}")
                continue
        
        # Ultimate fallback: return business rule-based result
        return self.get_business_rule_prediction(input_data)
```

## Quality Assurance with AI

### **Automated Testing Enhancement**
- **AI Test Generation**: Comprehensive test suite generation based on code analysis
- **Performance Prediction**: ML models predict performance impact of code changes
- **Security Scanning**: AI-powered vulnerability detection and remediation suggestions
- **Accessibility Auditing**: Automated WCAG compliance checking with improvement suggestions

### **Continuous Monitoring**
- **Model Drift Detection**: Automated detection of data/concept drift in ML models
- **Performance Degradation Alerts**: Real-time monitoring of system and model performance
- **Data Quality Monitoring**: Continuous validation of data quality across all layers
- **User Experience Analytics**: AI-powered analysis of user interaction patterns

## Integration Checkpoints

### **Pre-Deployment Validation**
1. **Data Quality Check**: Bronze → Silver transformation validation
2. **Model Performance Check**: Platinum layer model accuracy validation  
3. **Integration Testing**: End-to-end workflow testing with AI components
4. **Performance Benchmarking**: Load testing with ML inference overhead
5. **Security Validation**: AI-assisted security scanning and vulnerability assessment

### **Post-Deployment Monitoring**
1. **Real-Time Performance**: Model inference latency and accuracy monitoring
2. **Data Pipeline Health**: Bronze → Silver → Gold → Platinum flow monitoring
3. **User Experience Metrics**: AI Assistant usage patterns and satisfaction scores
4. **Business Impact Tracking**: KPI improvement attribution to AI enhancements

This orchestration framework ensures seamless integration between traditional development workflows and the AI-enhanced Neural DataBank architecture, maintaining high quality while leveraging the full power of machine learning and intelligent automation.
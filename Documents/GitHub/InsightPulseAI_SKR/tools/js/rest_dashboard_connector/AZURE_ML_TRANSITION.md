# Azure ML Transition Plan

This document outlines the strategy for transitioning brand detection models from Azure ML to a more suitable deployment architecture.

## Current State Assessment

The brand detection system was originally deployed using Azure ML but is currently underused. Issues with the current implementation:

1. Resource utilization inefficiency
2. Deployment complexity
3. Integration challenges with newer systems
4. Maintenance overhead
5. Suboptimal accuracy with latest data

## Transition Options

### Option 1: Migrate to Azure Cognitive Services Custom Vision

**Process:**
1. Extract existing model and training data from Azure ML
2. Create a new Custom Vision project
3. Upload training data and/or import model (if compatible)
4. Fine-tune on Custom Vision
5. Create prediction endpoint
6. Update API references

**Commands:**
```bash
# 1. Export model data from Azure ML
az ml model download \
  --name brand-detection-model \
  --version 1 \
  --download-path ./model-export

# 2. Create Custom Vision project (via API or portal)
az cognitiveservices account create \
  --name tbwa-custom-vision \
  --resource-group tbwa-analytics-rg \
  --kind CustomVision.Training \
  --sku S0 \
  --location eastus

# 3. Use Custom Vision API to import training data
# (Python script using the Custom Vision SDK)

# 4. Publish prediction endpoint
# (Via Custom Vision portal or API)
```

**Pros:**
- Fully managed service (less operational overhead)
- Pay-per-use pricing model
- Simpler integration with Azure ecosystem
- Automatic scaling

**Cons:**
- Less flexible than custom deployment
- Potential limitations with complex models
- Monthly costs for inactive models

### Option 2: Container-Based Deployment

**Process:**
1. Export model and dependencies from Azure ML
2. Containerize the model with inference code
3. Deploy to Azure Container Instances or AKS
4. Set up CI/CD pipeline for updates
5. Configure monitoring and scaling

**Commands:**
```bash
# 1. Export model
az ml model download \
  --name brand-detection-model \
  --version 1 \
  --download-path ./model-export

# 2. Build container image
docker build -t tbwadata.azurecr.io/brand-detection:v1 .

# 3. Push to container registry
az acr login --name tbwadata
docker push tbwadata.azurecr.io/brand-detection:v1

# 4. Deploy to container instances
az container create \
  --name brand-detection-api \
  --resource-group tbwa-analytics-rg \
  --image tbwadata.azurecr.io/brand-detection:v1 \
  --dns-name-label brand-detection-api \
  --ports 80
```

**Pros:**
- Maximum flexibility and control
- Portable across environments (cloud, on-prem)
- Better cost control for consistent workloads
- Easier local development

**Cons:**
- Higher operational complexity
- Manual scaling configuration required
- Additional security considerations

### Option 3: Azure Functions with ONNX Runtime

**Process:**
1. Export model from Azure ML to ONNX format
2. Create Azure Function with ONNX Runtime
3. Implement inference endpoints as Functions
4. Set up monitoring and auto-scaling

**Commands:**
```bash
# 1. Export model to ONNX
# (Python script using Azure ML SDK)

# 2. Create Function App
az functionapp create \
  --name brand-detection-functions \
  --resource-group tbwa-analytics-rg \
  --storage-account tbwadatastorage \
  --consumption-plan-location eastus \
  --runtime node

# 3. Deploy function code
func azure functionapp publish brand-detection-functions
```

**Pros:**
- Serverless architecture (scale to zero)
- Cost-effective for variable workloads
- Simple deployment and updates
- Tight integration with other Azure services

**Cons:**
- Cold start latency
- Resource limitations for complex models
- Maximum execution time constraints

## Recommended Approach

**Based on current usage patterns and requirements, we recommend Option 1 (Azure Cognitive Services) as the primary approach.**

Rationale:
- Lowest operational overhead
- Fastest deployment timeline
- Best cost efficiency for intermittent usage
- Simplest integration with existing systems

## Implementation Steps

1. **Preparation (Week 1)**
   - Inventory all brand models in Azure ML
   - Document existing API endpoints and consumers
   - Backup all training data
   - Create Custom Vision resource

2. **Migration (Weeks 2-3)**
   - For each model:
     - Export model or training data
     - Import to Custom Vision
     - Retrain/fine-tune if needed
     - Test accuracy against benchmarks
     - Publish prediction endpoint

3. **Integration (Weeks 3-4)**
   - Update endpoint references in code
   - Create adapter layer if needed for API compatibility
   - Deploy to staging environment
   - Perform integration testing

4. **Validation (Week 5)**
   - Run A/B testing with both endpoints
   - Validate performance and accuracy
   - Document performance benchmarks
   - Address any integration issues

5. **Cutover (Week 6)**
   - Switch all traffic to new endpoints
   - Monitor for errors
   - Implement feedback mechanisms
   - Document final architecture

6. **Decommissioning (Weeks 7-8)**
   - Keep Azure ML running in parallel for 2 weeks
   - Capture performance metrics for comparison
   - Decommission Azure ML resources
   - Document cost savings and improvements

## Templates to Delete

After successful migration, the following Azure ML templates can be safely deleted:

1. **Model Templates:**
   - `brand-detection-base-model`
   - `brand-detection-transfer-learning`
   - `logo-detection-yolov5`
   - `product-recognition-efficientnet`

2. **Pipeline Templates:**
   - `brand-detection-training-pipeline`
   - `brand-detection-batch-inference`
   - `brand-detection-continuous-training`

3. **Environment Templates:**
   - `brand-detection-training-env`
   - `brand-detection-scoring-env`

4. **Compute Templates:**
   - `brand-detection-training-cluster`
   - `brand-detection-inference-cluster`

## Deletion Process

```bash
# For each model version
az ml model delete --name brand-detection-base-model --version 1 --yes

# For each pipeline
az ml pipeline delete --name brand-detection-training-pipeline --yes

# For each environment
az ml environment delete --name brand-detection-training-env --yes

# For compute instances (stop first)
az ml computetarget stop --name brand-detection-training-cluster
az ml computetarget delete --name brand-detection-training-cluster --yes
```

## Risk Management

| Risk | Mitigation |
|------|------------|
| Accuracy regression | Benchmark before/after, revert if needed |
| API incompatibility | Create adapter layer for breaking changes |
| Service disruption | Parallel operation during transition |
| Cost increase | Monitor usage, implement cost alerting |
| Data loss | Backup all training data and models before starting |

## Validation Criteria

Before decommissioning Azure ML, ensure:

1. Custom Vision endpoints match or exceed Azure ML accuracy
2. Latency is within acceptable parameters
3. All consumers successfully integrated
4. No production errors for 1 week
5. Documentation updated
6. Team trained on new system management

## Cost Analysis

| Service | Current Monthly Cost | Projected Monthly Cost | Savings |
|---------|----------------------|------------------------|---------|
| Azure ML Compute | $750-$1,200 | $0 | $750-$1,200 |
| Azure ML Storage | $120-$200 | $0 | $120-$200 |
| Custom Vision | $0 | $200-$400* | -$200 to -$400 |
| **Total** | $870-$1,400 | $200-$400 | $470-$1,000 |

*Based on estimated 5,000-10,000 predictions per month

## Future Considerations

1. **Continuous Improvement:**
   - Implement automated retraining pipeline
   - Set up A/B testing for model improvements
   - Consider multi-region deployment for lower latency

2. **Integration Expansion:**
   - Create SDKs for common platforms
   - Implement webhook support
   - Add batch processing capabilities

3. **Advanced Features:**
   - Consider adding video support
   - Explore logo/text OCR capabilities
   - Research on-device deployment options
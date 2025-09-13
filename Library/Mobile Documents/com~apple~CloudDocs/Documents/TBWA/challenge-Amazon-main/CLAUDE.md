# CLAUDE.md - Scout Data Retargeting Orchestrator Contract

## Core Directive

Transform Amazon Dashboard to Scout Analytics Dashboard while preserving award-winning UI/UX. All sensitive operations must be routed through :bruno execution handler.

## Orchestration Rules

### 1. Data Layer Transformation

- **Primary Data Source**: `scout.gold_*` views via Supabase
- **Fallback**: CSV data for offline/demo mode
- **Cache Strategy**: 60-second stale time for React Query hooks
- **Batch Operations**: Use parquet format for datasets >100MB

### 2. UI Preservation Contract

- **DO NOT MODIFY**: Theme colors (#f79500, #040506), layout structure, chart types
- **PRESERVE**: Card components, sidebar navigation, responsive behavior
- **ENHANCE ONLY**: Data bindings, filter logic, AI recommendations

### 3. Sensitive Operations (:bruno routing)

All operations marked with :bruno must be executed externally:

- Database schema modifications
- Production deployments
- API key management
- User data access
- Edge function deployments

### 4. JSON Prompting Contracts

Machine-readable responses required for:

```json
{
  "InsightSpec": {
    "insight": "string",
    "confidence": "number (0-1)",
    "evidence": "array<DataPoint>",
    "recommendation": "string"
  },
  "RecommendationSpec": {
    "product_recommendations": "array<Product>",
    "rationale": "string",
    "expected_impact": "MetricImpact"
  },
  "SavedQuerySpec": {
    "query_name": "string",
    "sql": "string",
    "parameters": "object",
    "cache_ttl": "number"
  }
}
```

### 5. Quality Gates

- **Validation**: All data transformations must pass schema validation
- **Testing**: 80% coverage for DAL, 60% for UI components
- **Performance**: <3s load time, <500ms filter response
- **Accessibility**: WCAG 2.1 AA compliance maintained

## Integration Points

### Existing Scout Integration

- ✅ CSVClient with Scout transaction schema
- ✅ SupabaseClient with edge function support
- ✅ ScoutFilterComponents with regional dimensions
- ✅ AI recommendations via sari-sari-expert-advanced

### Remaining Work

- ⏳ Complete migration to Supabase primary
- ⏳ Implement SavedQuerySpec caching
- ⏳ Add persona-based recommendations
- ⏳ Integrate behavior_signals tracking

## Execution Protocol

```bash
# All :bruno operations must use this pattern
:bruno execute --context "scout-retarget" --operation "[OPERATION]" --params "[PARAMS]"
```

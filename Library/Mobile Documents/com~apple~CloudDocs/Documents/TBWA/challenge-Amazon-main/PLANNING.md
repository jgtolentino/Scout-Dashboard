# PLANNING.md - Scout Schema Retargeting Strategy

## Executive Summary

Retarget Amazon Dashboard to Scout Analytics Dashboard, leveraging existing Scout DAL integration while enhancing with full Supabase capabilities and AI-powered insights.

## Current State Analysis

### Existing Scout Integration

1. **Data Access Layer**
   - CSVClient: Fully implemented with Scout schema
   - SupabaseClient: Basic implementation ready
   - Filter system: Complete Scout dimensions

2. **UI Components**
   - Purchase Overview: Using Scout transactions
   - Sentiment Analysis: Ready for Scout reviews
   - Recommendations: Supabase Edge Functions integrated

3. **Data Schema Alignment**
   ```python
   # Current mapping
   Amazon Schema → Scout Schema
   Order Date → transaction_date
   Purchase Total → total_amount
   Category → category (aligned)
   Survey ResponseID → customer_id
   ```

## Architecture Strategy

### Phase 1: Data Layer Enhancement (Week 1)

- Switch primary data source to SupabaseClient
- Implement connection pooling and retry logic
- Add comprehensive error handling
- Cache strategy with React Query

### Phase 2: Advanced Analytics (Week 2)

- Integrate `scout.gold_recommendations` view
- Implement `scout.gold_behavior_signals` tracking
- Add persona-based segmentation
- Enhanced AI recommendations with context

### Phase 3: Performance Optimization (Week 3)

- Implement parquet-based data loading for large datasets
- Add progressive data loading
- Optimize filter queries with indexes
- Implement query result caching

## Technical Decisions

### Data Access Strategy

```typescript
// Primary: Supabase with fallback to CSV
const client = new DataAccessLayer({
  primary: SupabaseClient,
  fallback: CSVClient,
  cache: ReactQueryCache,
  ttl: 60000, // 60 seconds
});
```

### State Management

- **Global Filters**: Session storage with cross-page sync
- **Local State**: Component-level for UI interactions
- **Server State**: React Query for data fetching

### AI Integration

```python
# Edge Function routing
ENDPOINTS = {
  'recommendations': '/sari-sari-expert-advanced',
  'insights': '/scout-insights-generator',
  'predictions': '/behavior-predictor'
}
```

## Risk Mitigation

### Data Migration Risks

- **Risk**: Data inconsistency during transition
- **Mitigation**: Dual-mode operation with validation

### Performance Risks

- **Risk**: Slow queries on large datasets
- **Mitigation**: Implement pagination and virtual scrolling

### Integration Risks

- **Risk**: Edge function timeouts
- **Mitigation**: Implement circuit breaker pattern

## Success Metrics

- Load time: <3 seconds
- Filter response: <500ms
- AI recommendation accuracy: >75%
- User session duration: >5 minutes
- Data freshness: <60 seconds

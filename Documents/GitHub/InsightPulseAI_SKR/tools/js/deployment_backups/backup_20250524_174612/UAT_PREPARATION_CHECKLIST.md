# Scout Dashboard UAT Preparation Checklist

## 📋 Pre-UAT Requirements

### 1. ✅ Complete Feature Development
- [x] Sprint 05: Transaction Trends (merged)
- [x] Sprint 06: Product Mix Analysis (merged) 
- [ ] Sprint 07: Consumer Behavior Analysis (PR #4 - pending merge)
- [ ] Sprint 08: Customer Profiling (PR #5 - pending merge)

### 2. 🔄 PR Status
- [ ] Review and merge PR #4 (Consumer Behavior)
- [ ] Review and merge PR #5 (Customer Profiling)
- [ ] Ensure all CI checks pass

### 3. 🗄️ Database Migrations
Execute in order after PRs are merged:
```sql
-- Already applied:
-- 05_sprint_heatmap_transaction_density.sql
-- 06_sprint_product_mix_analysis.sql (if exists)

-- To apply:
-- 07_sprint_consumer_behavior_analysis.sql
-- 08_sprint_customer_profiling.sql
-- 09_seed_tbwa_smp_brands.sql
-- 10_data_quality_tracking.sql (embedded in migration 08)
```

### 4. 📊 Data Seeding
```bash
# After migrations are complete:
node data/update_sim_data_with_tbwa_brands.js
```

### 5. 🚀 UAT Deployment
- [ ] Tag release: `git tag v1.0.0-uat`
- [ ] Deploy to UAT environment:
  ```bash
  # Azure Static Web App deployment
  swa deploy ./final-locked-dashboard/scout_dlt_pipeline/client360_dashboard/deploy \
    --env uat \
    --app-name scout-dashboard-uat
  ```

### 6. 👥 UAT Access Setup
- [ ] Create UAT user accounts
- [ ] Configure access permissions
- [ ] Share UAT URL with testers
- [ ] Provide test credentials

### 7. 📈 UAT Test Data Requirements
- [ ] 1,000+ transactions across 4 barangays
- [ ] 5 product categories with TBWA brands
- [ ] Mixed customer demographics
- [ ] 30-day historical data
- [ ] Edge device telemetry data

## 🧪 UAT Test Scenarios

### Module Testing
1. **Transaction Trends**
   - [ ] Heatmap displays correctly
   - [ ] Time filters work (hourly, daily)
   - [ ] Geographic drill-down functions

2. **Product Mix Analysis**
   - [ ] TBWA brands appear in filters
   - [ ] Category breakdown accurate
   - [ ] Store-level constraints visible

3. **Consumer Behavior**
   - [ ] Purchase patterns display
   - [ ] Sentiment trends update
   - [ ] Request patterns correlate

4. **Customer Profiling**
   - [ ] Segmentation displays correctly
   - [ ] Demographics filter properly
   - [ ] Lifetime value calculations accurate

### Integration Testing
- [ ] Cross-module filter persistence
- [ ] Data consistency across modules
- [ ] SIM/Live toggle functionality
- [ ] Export functionality

### Performance Testing
- [ ] Page load < 3 seconds
- [ ] Dashboard refresh < 2 seconds
- [ ] Concurrent user support (10+)

## 🐛 UAT Defect Tracking

| ID | Module | Description | Severity | Status |
|----|--------|-------------|----------|--------|
| | | | | |

## ✅ UAT Sign-off Criteria

- [ ] All critical defects resolved
- [ ] Performance benchmarks met
- [ ] Data accuracy validated
- [ ] User acceptance received from:
  - [ ] Operations Manager
  - [ ] Store Managers
  - [ ] Data Analysts
  - [ ] Business Stakeholders

## 📅 UAT Timeline

- **Start Date**: [TBD after PR merges]
- **Duration**: 5 business days
- **Sign-off Target**: [TBD]
- **Production Release**: [TBD]

## 🚀 Post-UAT Actions

1. [ ] Apply UAT fixes to main branch
2. [ ] Create production release tag
3. [ ] Deploy to production
4. [ ] Monitor production metrics
5. [ ] Schedule Sprint 09 planning

---

**Next Sprint Ideas** (Sprint 09):
- Churn Prediction Enhancements
- Promo Effectiveness Dashboard
- Inventory Optimization
- Voice-of-Customer Sentiment
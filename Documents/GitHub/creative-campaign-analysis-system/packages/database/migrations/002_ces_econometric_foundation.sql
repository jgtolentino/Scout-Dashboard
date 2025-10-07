-- TBWA Creative Effectiveness Score (CES) - Econometric Foundation
-- Version: 002_ces_econometric
-- Description: Ground-up CES rebuild with feature importance and Bayesian modeling

BEGIN TRANSACTION;

-- ADLS2 Medallion Bronze Layer: Raw Campaign Data Registry
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='campaignDataRegistry' AND xtype='U')
BEGIN
    CREATE TABLE campaignDataRegistry (
        registry_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        campaign_id UNIQUEIDENTIFIER NOT NULL,
        data_source NVARCHAR(50) NOT NULL, -- 'adls2_bronze', 'google_drive', 'figma', 'social_api'
        data_type NVARCHAR(50) NOT NULL, -- 'creative_asset', 'performance_metric', 'audience_data'
        raw_data_path NVARCHAR(500),
        extraction_method NVARCHAR(100), -- 'nlp_bert', 'clip_embedding', 'facial_coding_ai'
        processing_status NVARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
        bronze_to_silver_rules NVARCHAR(MAX), -- JSON with transformation rules
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        processed_at DATETIME2
    );
    
    CREATE INDEX IX_campaignDataRegistry_campaign ON campaignDataRegistry(campaign_id);
    CREATE INDEX IX_campaignDataRegistry_source ON campaignDataRegistry(data_source);
    CREATE INDEX IX_campaignDataRegistry_status ON campaignDataRegistry(processing_status);
    
    PRINT 'Created table: campaignDataRegistry';
END

-- Feature Taxonomy: Structured feature extraction framework
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='featureTaxonomy' AND xtype='U')
BEGIN
    CREATE TABLE featureTaxonomy (
        feature_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        feature_category NVARCHAR(50) NOT NULL, -- 'content', 'visual_primacy', 'emotional_resonance', 'message_clarity', 'context_alignment'
        feature_name NVARCHAR(100) NOT NULL,
        extraction_method NVARCHAR(100) NOT NULL, -- 'bert_nlp', 'clip_embedding', 'facial_coding', 'readability_score'
        business_impact_mapping NVARCHAR(255), -- 'brand_recall', 'message_retention', 'attention_capture'
        feature_importance_weight FLOAT DEFAULT 0.0,
        validation_method NVARCHAR(100), -- 'shap_analysis', 'permutation_test', 'daivid_benchmark'
        is_actionable BIT DEFAULT 1, -- Can creative teams act on this feature?
        econometric_significance FLOAT DEFAULT 0.0, -- P-value from Bayesian model
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE()
    );
    
    CREATE INDEX IX_featureTaxonomy_category ON featureTaxonomy(feature_category);
    CREATE INDEX IX_featureTaxonomy_importance ON featureTaxonomy(feature_importance_weight);
    CREATE INDEX IX_featureTaxonomy_actionable ON featureTaxonomy(is_actionable);
    
    -- Insert core feature taxonomy
    INSERT INTO featureTaxonomy (feature_category, feature_name, extraction_method, business_impact_mapping, is_actionable) VALUES
    ('content', 'brand_mention_frequency', 'bert_nlp', 'brand_recall', 1),
    ('content', 'benefit_statement_clarity', 'readability_score', 'message_retention', 1),
    ('visual_primacy', 'hero_shot_duration', 'clip_embedding', 'attention_capture', 1),
    ('visual_primacy', 'color_contrast_ratio', 'saliency_mapping', 'view_duration', 1),
    ('emotional_resonance', 'facial_expression_intensity', 'facial_coding_ai', 'brand_affinity', 1),
    ('emotional_resonance', 'audio_sentiment_score', 'audio_sentiment_analysis', 'emotional_engagement', 1),
    ('message_clarity', 'flesch_reading_ease', 'readability_score', 'comprehension', 1),
    ('message_clarity', 'call_to_action_prominence', 'rule_based_detection', 'conversion_intent', 1),
    ('context_alignment', 'trend_relevance_score', 'semantic_similarity', 'timeliness', 1),
    ('context_alignment', 'brief_alignment_score', 'semantic_similarity', 'strategic_relevance', 1);
    
    PRINT 'Created table: featureTaxonomy with core features';
END

-- Campaign Feature Extractions: Store extracted feature values
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='campaignFeatures' AND xtype='U')
BEGIN
    CREATE TABLE campaignFeatures (
        extraction_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        campaign_id UNIQUEIDENTIFIER NOT NULL,
        asset_id UNIQUEIDENTIFIER, -- Reference to specific creative asset
        feature_id UNIQUEIDENTIFIER NOT NULL,
        feature_value FLOAT NOT NULL,
        confidence_score FLOAT DEFAULT 0.0, -- AI extraction confidence
        extraction_context NVARCHAR(MAX), -- JSON with extraction metadata
        shap_value FLOAT, -- SHAP importance for this specific extraction
        contribution_to_outcome FLOAT, -- Direct attribution to campaign performance
        extracted_at DATETIME2 DEFAULT GETUTCDATE(),
        
        FOREIGN KEY (feature_id) REFERENCES featureTaxonomy(feature_id)
    );
    
    CREATE INDEX IX_campaignFeatures_campaign ON campaignFeatures(campaign_id);
    CREATE INDEX IX_campaignFeatures_feature ON campaignFeatures(feature_id);
    CREATE INDEX IX_campaignFeatures_value ON campaignFeatures(feature_value);
    CREATE INDEX IX_campaignFeatures_shap ON campaignFeatures(shap_value);
    
    PRINT 'Created table: campaignFeatures';
END

-- Econometric Model Results: Bayesian hierarchical model outputs
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='econometricModels' AND xtype='U')
BEGIN
    CREATE TABLE econometricModels (
        model_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        model_name NVARCHAR(100) NOT NULL, -- 'ces_bayesian_v1', 'engagement_prediction', 'roi_forecast'
        model_type NVARCHAR(50) NOT NULL, -- 'hierarchical_bayesian', 'mixed_effects', 'ensemble'
        feature_weights NVARCHAR(MAX), -- JSON with posterior distributions of feature weights
        hyperparameters NVARCHAR(MAX), -- JSON with model hyperparameters
        validation_metrics NVARCHAR(MAX), -- JSON with cross-validation results
        shap_global_importance NVARCHAR(MAX), -- JSON with global SHAP feature importance
        business_impact_coefficients NVARCHAR(MAX), -- JSON mapping features to business outcomes
        model_performance NVARCHAR(MAX), -- JSON with R², MAE, prediction intervals
        training_data_period NVARCHAR(50), -- '2023-Q1_to_2024-Q4'
        is_production_model BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        last_retrained_at DATETIME2
    );
    
    CREATE INDEX IX_econometricModels_name ON econometricModels(model_name);
    CREATE INDEX IX_econometricModels_production ON econometricModels(is_production_model);
    
    PRINT 'Created table: econometricModels';
END

-- CES Predictions: Model-generated effectiveness scores
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cesPredictions' AND xtype='U')
BEGIN
    CREATE TABLE cesPredictions (
        prediction_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        campaign_id UNIQUEIDENTIFIER NOT NULL,
        model_id UNIQUEIDENTIFIER NOT NULL,
        ces_score FLOAT NOT NULL, -- Main CES score (0-100)
        prediction_interval_lower FLOAT, -- 95% confidence interval lower bound
        prediction_interval_upper FLOAT, -- 95% confidence interval upper bound
        outcome_predictions NVARCHAR(MAX), -- JSON with specific outcome predictions
        feature_contributions NVARCHAR(MAX), -- JSON with SHAP explanations
        confidence_level FLOAT DEFAULT 0.95,
        prediction_context NVARCHAR(MAX), -- JSON with prediction metadata
        actual_outcomes NVARCHAR(MAX), -- JSON with realized performance (post-campaign)
        prediction_accuracy FLOAT, -- Measured accuracy vs. actual
        generated_at DATETIME2 DEFAULT GETUTCDATE(),
        validated_at DATETIME2,
        
        FOREIGN KEY (model_id) REFERENCES econometricModels(model_id)
    );
    
    CREATE INDEX IX_cesPredictions_campaign ON cesPredictions(campaign_id);
    CREATE INDEX IX_cesPredictions_model ON cesPredictions(model_id);
    CREATE INDEX IX_cesPredictions_score ON cesPredictions(ces_score);
    CREATE INDEX IX_cesPredictions_accuracy ON cesPredictions(prediction_accuracy);
    
    PRINT 'Created table: cesPredictions';
END

-- DAIVID Integration: External benchmarking data
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='daividIntegration' AND xtype='U')
BEGIN
    CREATE TABLE daividIntegration (
        daivid_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        campaign_id UNIQUEIDENTIFIER NOT NULL,
        asset_id UNIQUEIDENTIFIER,
        visual_attention_score FLOAT, -- DAIVID attention metrics
        emotional_impact_index FLOAT, -- DAIVID emotion analysis
        brand_power_score FLOAT, -- DAIVID brand impact assessment
        message_clarity_rating FLOAT, -- DAIVID comprehension metrics
        daivid_overall_score FLOAT, -- Composite DAIVID score
        calibration_factor FLOAT DEFAULT 1.0, -- Factor to align with internal CES
        benchmark_quartile INT, -- 1-4 quartile vs. DAIVID database
        category_benchmark NVARCHAR(100), -- Industry/category specific benchmark
        daivid_insights NVARCHAR(MAX), -- JSON with DAIVID recommendations
        sync_timestamp DATETIME2 DEFAULT GETUTCDATE(),
        expires_at DATETIME2 -- DAIVID data retention period
    );
    
    CREATE INDEX IX_daividIntegration_campaign ON daividIntegration(campaign_id);
    CREATE INDEX IX_daividIntegration_overall_score ON daividIntegration(daivid_overall_score);
    CREATE INDEX IX_daividIntegration_quartile ON daividIntegration(benchmark_quartile);
    
    PRINT 'Created table: daividIntegration';
END

-- Creative Scorecards: Actionable insights for creative teams
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='creativeScorecard' AND xtype='U')
BEGIN
    CREATE TABLE creativeScorecard (
        scorecard_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        campaign_id UNIQUEIDENTIFIER NOT NULL,
        asset_id UNIQUEIDENTIFIER,
        overall_impact_score FLOAT NOT NULL, -- 0-10 scale
        feature_scores NVARCHAR(MAX), -- JSON with individual feature scores
        creative_recommendations NVARCHAR(MAX), -- JSON with actionable recommendations
        expected_lift_estimates NVARCHAR(MAX), -- JSON with predicted performance improvements
        priority_actions NVARCHAR(MAX), -- JSON with prioritized action items
        decision_tree_path NVARCHAR(MAX), -- JSON with creative decision logic
        simulation_results NVARCHAR(MAX), -- JSON with "what-if" scenario outcomes
        stakeholder_targeting NVARCHAR(50), -- 'creative_team', 'strategist', 'account_manager'
        confidence_in_recommendations FLOAT DEFAULT 0.0,
        generated_at DATETIME2 DEFAULT GETUTCDATE(),
        acted_upon_at DATETIME2,
        measured_impact NVARCHAR(MAX) -- JSON with post-implementation results
    );
    
    CREATE INDEX IX_creativeScorecard_campaign ON creativeScorecard(campaign_id);
    CREATE INDEX IX_creativeScorecard_score ON creativeScorecard(overall_impact_score);
    CREATE INDEX IX_creativeScorecard_stakeholder ON creativeScorecard(stakeholder_targeting);
    
    PRINT 'Created table: creativeScorecard';
END

-- Model Performance Tracking: Continuous model validation
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='modelPerformanceTracking' AND xtype='U')
BEGIN
    CREATE TABLE modelPerformanceTracking (
        tracking_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        model_id UNIQUEIDENTIFIER NOT NULL,
        evaluation_period NVARCHAR(50), -- 'weekly', 'monthly', 'quarterly'
        prediction_accuracy_metrics NVARCHAR(MAX), -- JSON with MAE, RMSE, R²
        feature_stability_scores NVARCHAR(MAX), -- JSON tracking feature importance drift
        business_impact_validation NVARCHAR(MAX), -- JSON with actual vs. predicted business outcomes
        model_drift_indicators NVARCHAR(MAX), -- JSON with data drift and concept drift metrics
        retraining_recommendations NVARCHAR(MAX), -- JSON with retraining triggers and suggestions
        benchmark_comparisons NVARCHAR(MAX), -- JSON comparing to DAIVID and other benchmarks
        stakeholder_feedback NVARCHAR(MAX), -- JSON with user feedback on model outputs
        evaluation_timestamp DATETIME2 DEFAULT GETUTCDATE(),
        
        FOREIGN KEY (model_id) REFERENCES econometricModels(model_id)
    );
    
    CREATE INDEX IX_modelPerformanceTracking_model ON modelPerformanceTracking(model_id);
    CREATE INDEX IX_modelPerformanceTracking_period ON modelPerformanceTracking(evaluation_period);
    CREATE INDEX IX_modelPerformanceTracking_timestamp ON modelPerformanceTracking(evaluation_timestamp);
    
    PRINT 'Created table: modelPerformanceTracking';
END

COMMIT TRANSACTION;

-- Grant permissions for application user
GRANT SELECT, INSERT, UPDATE, DELETE ON campaignDataRegistry TO [TBWA];
GRANT SELECT, INSERT, UPDATE, DELETE ON featureTaxonomy TO [TBWA];
GRANT SELECT, INSERT, UPDATE, DELETE ON campaignFeatures TO [TBWA];
GRANT SELECT, INSERT, UPDATE, DELETE ON econometricModels TO [TBWA];
GRANT SELECT, INSERT, UPDATE, DELETE ON cesPredictions TO [TBWA];
GRANT SELECT, INSERT, UPDATE, DELETE ON daividIntegration TO [TBWA];
GRANT SELECT, INSERT, UPDATE, DELETE ON creativeScorecard TO [TBWA];
GRANT SELECT, INSERT, UPDATE, DELETE ON modelPerformanceTracking TO [TBWA];

PRINT 'CES Econometric Foundation schema deployment completed successfully';
PRINT 'Core CES tables created: campaignDataRegistry, featureTaxonomy, campaignFeatures, econometricModels, cesPredictions, daividIntegration, creativeScorecard, modelPerformanceTracking';
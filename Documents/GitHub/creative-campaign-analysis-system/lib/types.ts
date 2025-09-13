// Types for TBWA Creative Campaign Analysis System
export interface CampaignDocument {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  createdTime: string;
  modifiedTime: string;
  driveId: string;
  path: string;
  campaignName?: string;
  clientName?: string;
  fileType: 'video' | 'image' | 'presentation' | 'document' | 'other';
}

export interface CreativeFeatures {
  // Content Features
  content_value_proposition_clear: boolean;
  content_urgency_triggers: boolean;
  content_social_proof: boolean;
  content_narrative_construction: boolean;
  
  // Design Features  
  design_visual_hierarchy: boolean;
  design_motion_graphics: boolean;
  design_color_psychology: boolean;
  design_visual_distinctiveness: boolean;
  design_mobile_optimization: boolean;
  design_responsive_design: boolean;
  
  // Messaging Features
  messaging_action_oriented_language: boolean;
  messaging_benefit_focused_headlines: boolean;
  messaging_message_clarity: boolean;
  messaging_emotional_connection: boolean;
  
  // Targeting Features
  targeting_behavioral_precision: boolean;
  targeting_lookalike_optimization: boolean;
  targeting_values_based_targeting: boolean;
  targeting_lifestyle_segmentation: boolean;
  
  // Channel Features
  channel_cross_channel_consistency: boolean;
  channel_platform_optimization: boolean;
  channel_multi_format_adaptation: boolean;
  channel_digital_native_design: boolean;
  
  // Detected Features (from file analysis)
  detected_storytelling: boolean;
  detected_emotional_appeal: boolean;
  detected_call_to_action: boolean;
  detected_brand_integration: boolean;
  detected_social_proof: boolean;
  detected_personalization: boolean;
  detected_interactive: boolean;
}

export interface BusinessOutcomes {
  // Engagement Outcomes
  outcome_engagement_high_engagement: boolean;
  outcome_engagement_creative_breakthrough: boolean;
  outcome_engagement_brand_sentiment_positive: boolean;
  outcome_engagement_social_sharing: boolean;
  outcome_engagement_video_completion_high: boolean;
  
  // Conversion Outcomes
  outcome_conversion_direct_conversion: boolean;
  outcome_conversion_sales_lift: boolean;
  outcome_conversion_foot_traffic: boolean;
  outcome_conversion_purchase_intent: boolean;
  outcome_conversion_lead_generation: boolean;
  outcome_conversion_consideration_lift: boolean;
  
  // Brand Outcomes
  outcome_brand_brand_recall: boolean;
  outcome_brand_brand_equity_lift: boolean;
  outcome_brand_top_of_mind: boolean;
  outcome_brand_brand_differentiation: boolean;
  outcome_brand_cultural_relevance: boolean;
  outcome_brand_brand_trust: boolean;
  outcome_brand_brand_authenticity: boolean;
  
  // Efficiency Outcomes
  outcome_efficiency_media_efficiency: boolean;
  outcome_efficiency_roi_positive: boolean;
  outcome_efficiency_cost_optimization: boolean;
  
  // Behavioral Outcomes
  outcome_behavioral_consideration_behavior: boolean;
  outcome_behavioral_research_intent: boolean;
  outcome_behavioral_purchase_behavior: boolean;
  outcome_behavioral_brand_switching: boolean;
  outcome_behavioral_advocacy_behavior: boolean;
  
  // Business Focus Areas
  business_conversion_focus: boolean;
  business_awareness_focus: boolean;
  business_engagement_focus: boolean;
  business_retention_focus: boolean;
  business_acquisition_focus: boolean;
  business_branding_focus: boolean;
}

export interface CampaignComposition {
  video_heavy_campaign: boolean;
  image_rich_campaign: boolean;
  strategic_campaign: boolean;
  comprehensive_execution: boolean;
  total_video_count: number;
  total_image_count: number;
  total_presentation_count: number;
  total_file_count: number;
}

export interface CampaignAnalysis {
  creative_features: CreativeFeatures;
  business_outcomes: BusinessOutcomes;
  campaign_composition: CampaignComposition;
  confidence_score: number;
  analysis_timestamp: string;
}
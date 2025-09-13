// TBWA Creative Campaign RAG System - Enhanced ETL Pipeline
// Following CES Architecture Pattern + Creative Campaign Analysis

// File: lib/types.ts
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

// File: lib/creative-feature-analyzer.ts
export class CreativeFeatureAnalyzer {
  
  async analyzeCreativeFeatures(
    document: CampaignDocument,
    textContent: string,
    campaignFiles: CampaignDocument[]
  ): Promise<CreativeFeatures> {
    
    const filename = document.filename.toLowerCase();
    const content = textContent.toLowerCase();
    
    return {
      // Content Features
      content_value_proposition_clear: this.detectValueProposition(content, filename),
      content_urgency_triggers: this.detectUrgencyTriggers(content, filename),
      content_social_proof: this.detectSocialProof(content, filename),
      content_narrative_construction: this.detectNarrativeConstruction(content, filename),
      
      // Design Features
      design_visual_hierarchy: this.detectVisualHierarchy(document, content),
      design_motion_graphics: this.detectMotionGraphics(document, filename),
      design_color_psychology: this.detectColorPsychology(content, filename),
      design_visual_distinctiveness: this.detectVisualDistinctiveness(content, filename),
      design_mobile_optimization: this.detectMobileOptimization(content, filename),
      design_responsive_design: this.detectResponsiveDesign(content, filename),
      
      // Messaging Features
      messaging_action_oriented_language: this.detectActionOrientedLanguage(content),
      messaging_benefit_focused_headlines: this.detectBenefitFocusedHeadlines(content),
      messaging_message_clarity: this.detectMessageClarity(content),
      messaging_emotional_connection: this.detectEmotionalConnection(content, filename),
      
      // Targeting Features
      targeting_behavioral_precision: this.detectBehavioralPrecision(content, filename),
      targeting_lookalike_optimization: this.detectLookalikeOptimization(content),
      targeting_values_based_targeting: this.detectValuesBasedTargeting(content, filename),
      targeting_lifestyle_segmentation: this.detectLifestyleSegmentation(content, filename),
      
      // Channel Features
      channel_cross_channel_consistency: this.detectCrossChannelConsistency(campaignFiles),
      channel_platform_optimization: this.detectPlatformOptimization(content, filename),
      channel_multi_format_adaptation: this.detectMultiFormatAdaptation(campaignFiles),
      channel_digital_native_design: this.detectDigitalNativeDesign(content, filename),
      
      // Detected Features
      detected_storytelling: this.detectStorytelling(content, filename),
      detected_emotional_appeal: this.detectEmotionalAppeal(content, filename),
      detected_call_to_action: this.detectCallToAction(content, filename),
      detected_brand_integration: this.detectBrandIntegration(content, filename),
      detected_social_proof: this.detectSocialProof(content, filename),
      detected_personalization: this.detectPersonalization(content, filename),
      detected_interactive: this.detectInteractive(content, filename),
    };
  }

  private detectValueProposition(content: string, filename: string): boolean {
    const vpKeywords = ['benefit', 'value', 'advantage', 'solution', 'unique', 'better', 'best', 'only'];
    return vpKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private detectUrgencyTriggers(content: string, filename: string): boolean {
    const urgencyKeywords = ['now', 'today', 'limited', 'hurry', 'deadline', 'expires', 'last chance', 'urgent'];
    return urgencyKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private detectSocialProof(content: string, filename: string): boolean {
    const socialProofKeywords = ['award', 'testimonial', 'review', 'rated', 'winner', 'trusted', 'proven', 'customers'];
    return socialProofKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private detectNarrativeConstruction(content: string, filename: string): boolean {
    const narrativeKeywords = ['story', 'journey', 'experience', 'adventure', 'discovery', 'transformation'];
    return narrativeKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private detectVisualHierarchy(document: CampaignDocument, content: string): boolean {
    return document.fileType === 'video' || content.includes('video') || content.includes('visual');
  }

  private detectMotionGraphics(document: CampaignDocument, filename: string): boolean {
    return document.fileType === 'video' || filename.includes('motion') || filename.includes('animated');
  }

  private detectColorPsychology(content: string, filename: string): boolean {
    const colorKeywords = ['color', 'brand', 'visual', 'palette', 'scheme'];
    return colorKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private detectVisualDistinctiveness(content: string, filename: string): boolean {
    const distinctiveKeywords = ['unique', 'distinctive', 'standout', 'bold', 'creative', 'innovative'];
    return distinctiveKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private detectMobileOptimization(content: string, filename: string): boolean {
    const mobileKeywords = ['mobile', 'responsive', 'app', 'smartphone', 'ios', 'android'];
    return mobileKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private detectResponsiveDesign(content: string, filename: string): boolean {
    const responsiveKeywords = ['responsive', 'adaptive', 'multi-format', 'cross-platform'];
    return responsiveKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private detectActionOrientedLanguage(content: string): boolean {
    const actionKeywords = ['buy', 'get', 'try', 'start', 'discover', 'learn', 'join', 'subscribe', 'download'];
    return actionKeywords.some(keyword => content.includes(keyword));
  }

  private detectBenefitFocusedHeadlines(content: string): boolean {
    const benefitKeywords = ['save', 'earn', 'gain', 'improve', 'boost', 'increase', 'reduce', 'enhance'];
    return benefitKeywords.some(keyword => content.includes(keyword));
  }

  private detectMessageClarity(content: string): boolean {
    // Simple heuristic: shorter, clearer messages
    const words = content.split(' ').length;
    return words < 100 && !content.includes('complex') && !content.includes('complicated');
  }

  private detectEmotionalConnection(content: string, filename: string): boolean {
    const emotionalKeywords = ['feel', 'love', 'happy', 'excited', 'proud', 'confident', 'emotional', 'heart'];
    return emotionalKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private detectBehavioralPrecision(content: string, filename: string): boolean {
    const behavioralKeywords = ['targeting', 'audience', 'behavior', 'data', 'analytics', 'precision'];
    return behavioralKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private detectLookalikeOptimization(content: string): boolean {
    const lookalikeKeywords = ['lookalike', 'similar', 'audience', 'modeling', 'optimization'];
    return lookalikeKeywords.some(keyword => content.includes(keyword));
  }

  private detectValuesBasedTargeting(content: string, filename: string): boolean {
    const valuesKeywords = ['values', 'purpose', 'mission', 'beliefs', 'sustainability', 'social'];
    return valuesKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private detectLifestyleSegmentation(content: string, filename: string): boolean {
    const lifestyleKeywords = ['lifestyle', 'fashion', 'food', 'travel', 'fitness', 'luxury', 'premium'];
    return lifestyleKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private detectCrossChannelConsistency(campaignFiles: CampaignDocument[]): boolean {
    const channels = ['social', 'digital', 'tv', 'print', 'radio', 'outdoor'];
    const detectedChannels = channels.filter(channel => 
      campaignFiles.some(file => file.filename.toLowerCase().includes(channel))
    );
    return detectedChannels.length >= 2;
  }

  private detectPlatformOptimization(content: string, filename: string): boolean {
    const platformKeywords = ['facebook', 'instagram', 'youtube', 'linkedin', 'twitter', 'tiktok', 'platform'];
    return platformKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private detectMultiFormatAdaptation(campaignFiles: CampaignDocument[]): boolean {
    const formats = new Set(campaignFiles.map(file => file.fileType));
    return formats.size >= 3;
  }

  private detectDigitalNativeDesign(content: string, filename: string): boolean {
    const digitalKeywords = ['digital', 'online', 'web', 'app', 'interactive', 'modern'];
    return digitalKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private detectStorytelling(content: string, filename: string): boolean {
    const storyKeywords = ['story', 'narrative', 'chapter', 'journey', 'tale', 'episode'];
    return storyKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private detectEmotionalAppeal(content: string, filename: string): boolean {
    const emotionalKeywords = ['emotional', 'feelings', 'heart', 'passion', 'inspiration', 'motivation'];
    return emotionalKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private detectCallToAction(content: string, filename: string): boolean {
    const ctaKeywords = ['cta', 'call to action', 'button', 'click', 'tap', 'swipe', 'action'];
    return ctaKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private detectBrandIntegration(content: string, filename: string): boolean {
    const brandKeywords = ['brand', 'logo', 'identity', 'guidelines', 'assets', 'trademark'];
    return brandKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private detectPersonalization(content: string, filename: string): boolean {
    const personalKeywords = ['personal', 'custom', 'individual', 'tailored', 'your', 'you'];
    return personalKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private detectInteractive(content: string, filename: string): boolean {
    const interactiveKeywords = ['interactive', 'engage', 'click', 'swipe', 'touch', 'experience'];
    return interactiveKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }
}

// File: lib/business-outcome-analyzer.ts
export class BusinessOutcomeAnalyzer {

  async analyzeBusinessOutcomes(
    document: CampaignDocument,
    textContent: string,
    campaignFiles: CampaignDocument[],
    creativeFeatures: CreativeFeatures
  ): Promise<BusinessOutcomes> {
    
    const filename = document.filename.toLowerCase();
    const content = textContent.toLowerCase();
    
    return {
      // Engagement Outcomes
      outcome_engagement_high_engagement: this.predictHighEngagement(creativeFeatures, content),
      outcome_engagement_creative_breakthrough: this.predictCreativeBreakthrough(content, filename),
      outcome_engagement_brand_sentiment_positive: this.predictPositiveSentiment(content, creativeFeatures),
      outcome_engagement_social_sharing: this.predictSocialSharing(content, creativeFeatures),
      outcome_engagement_video_completion_high: this.predictVideoCompletion(document, creativeFeatures),
      
      // Conversion Outcomes
      outcome_conversion_direct_conversion: this.predictDirectConversion(content, creativeFeatures),
      outcome_conversion_sales_lift: this.predictSalesLift(content, filename),
      outcome_conversion_foot_traffic: this.predictFootTraffic(content, filename),
      outcome_conversion_purchase_intent: this.predictPurchaseIntent(content, creativeFeatures),
      outcome_conversion_lead_generation: this.predictLeadGeneration(content, creativeFeatures),
      outcome_conversion_consideration_lift: this.predictConsiderationLift(content, creativeFeatures),
      
      // Brand Outcomes
      outcome_brand_brand_recall: this.predictBrandRecall(creativeFeatures, content),
      outcome_brand_brand_equity_lift: this.predictBrandEquityLift(content, creativeFeatures),
      outcome_brand_top_of_mind: this.predictTopOfMind(content, creativeFeatures),
      outcome_brand_brand_differentiation: this.predictBrandDifferentiation(creativeFeatures, content),
      outcome_brand_cultural_relevance: this.predictCulturalRelevance(content, filename),
      outcome_brand_brand_trust: this.predictBrandTrust(content, creativeFeatures),
      outcome_brand_brand_authenticity: this.predictBrandAuthenticity(content, creativeFeatures),
      
      // Efficiency Outcomes
      outcome_efficiency_media_efficiency: this.predictMediaEfficiency(campaignFiles, creativeFeatures),
      outcome_efficiency_roi_positive: this.predictPositiveROI(content, creativeFeatures),
      outcome_efficiency_cost_optimization: this.predictCostOptimization(campaignFiles, content),
      
      // Behavioral Outcomes
      outcome_behavioral_consideration_behavior: this.predictConsiderationBehavior(content, filename),
      outcome_behavioral_research_intent: this.predictResearchIntent(content, creativeFeatures),
      outcome_behavioral_purchase_behavior: this.predictPurchaseBehavior(content, creativeFeatures),
      outcome_behavioral_brand_switching: this.predictBrandSwitching(content, creativeFeatures),
      outcome_behavioral_advocacy_behavior: this.predictAdvocacyBehavior(content, creativeFeatures),
      
      // Business Focus Areas
      business_conversion_focus: this.detectConversionFocus(content, filename),
      business_awareness_focus: this.detectAwarenessFocus(content, filename),
      business_engagement_focus: this.detectEngagementFocus(content, filename),
      business_retention_focus: this.detectRetentionFocus(content, filename),
      business_acquisition_focus: this.detectAcquisitionFocus(content, filename),
      business_branding_focus: this.detectBrandingFocus(content, filename),
    };
  }

  private predictHighEngagement(features: CreativeFeatures, content: string): boolean {
    let score = 0;
    if (features.detected_storytelling) score += 2;
    if (features.detected_emotional_appeal) score += 2;
    if (features.detected_interactive) score += 2;
    if (features.design_motion_graphics) score += 1;
    if (content.includes('award') || content.includes('viral')) score += 2;
    return score >= 4;
  }

  private predictCreativeBreakthrough(content: string, filename: string): boolean {
    const breakthroughKeywords = ['award', 'breakthrough', 'innovative', 'first', 'revolutionary', 'unique'];
    return breakthroughKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private predictPositiveSentiment(content: string, features: CreativeFeatures): boolean {
    return features.messaging_emotional_connection && 
           features.content_value_proposition_clear &&
           !content.includes('negative') && !content.includes('problem');
  }

  private predictSocialSharing(content: string, features: CreativeFeatures): boolean {
    return features.detected_storytelling && 
           features.detected_emotional_appeal &&
           (content.includes('share') || content.includes('viral') || content.includes('social'));
  }

  private predictVideoCompletion(document: CampaignDocument, features: CreativeFeatures): boolean {
    return document.fileType === 'video' && 
           features.design_motion_graphics &&
           features.detected_storytelling;
  }

  private predictDirectConversion(content: string, features: CreativeFeatures): boolean {
    return features.messaging_action_oriented_language &&
           features.detected_call_to_action &&
           (content.includes('buy') || content.includes('purchase') || content.includes('order'));
  }

  private predictSalesLift(content: string, filename: string): boolean {
    const salesKeywords = ['sales', 'revenue', 'conversion', 'purchase', 'buy', 'order'];
    return salesKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private predictFootTraffic(content: string, filename: string): boolean {
    const footTrafficKeywords = ['store', 'visit', 'location', 'restaurant', 'retail', 'outlet'];
    return footTrafficKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private predictPurchaseIntent(content: string, features: CreativeFeatures): boolean {
    return features.content_value_proposition_clear &&
           features.messaging_benefit_focused_headlines &&
           (content.includes('consider') || content.includes('interested') || content.includes('want'));
  }

  private predictLeadGeneration(content: string, features: CreativeFeatures): boolean {
    return features.detected_call_to_action &&
           (content.includes('signup') || content.includes('register') || content.includes('contact') || content.includes('learn more'));
  }

  private predictConsiderationLift(content: string, features: CreativeFeatures): boolean {
    return features.content_value_proposition_clear &&
           features.messaging_benefit_focused_headlines &&
           !features.messaging_action_oriented_language;
  }

  private predictBrandRecall(features: CreativeFeatures, content: string): boolean {
    return features.design_visual_distinctiveness &&
           features.detected_brand_integration &&
           (content.includes('memorable') || content.includes('distinctive'));
  }

  private predictBrandEquityLift(content: string, features: CreativeFeatures): boolean {
    return features.content_value_proposition_clear &&
           features.design_visual_distinctiveness &&
           (content.includes('premium') || content.includes('quality') || content.includes('leader'));
  }

  private predictTopOfMind(content: string, features: CreativeFeatures): boolean {
    return features.design_visual_distinctiveness &&
           features.detected_storytelling &&
           (content.includes('first') || content.includes('leader') || content.includes('top'));
  }

  private predictBrandDifferentiation(features: CreativeFeatures, content: string): boolean {
    return features.design_visual_distinctiveness &&
           features.content_value_proposition_clear &&
           (content.includes('unique') || content.includes('different') || content.includes('only'));
  }

  private predictCulturalRelevance(content: string, filename: string): boolean {
    const culturalKeywords = ['culture', 'trend', 'moment', 'relevant', 'current', 'timely'];
    return culturalKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private predictBrandTrust(content: string, features: CreativeFeatures): boolean {
    return features.content_social_proof &&
           features.outcome_brand_brand_authenticity &&
           (content.includes('trust') || content.includes('reliable') || content.includes('proven'));
  }

  private predictBrandAuthenticity(content: string, features: CreativeFeatures): boolean {
    return features.targeting_values_based_targeting &&
           features.detected_storytelling &&
           (content.includes('authentic') || content.includes('genuine') || content.includes('real'));
  }

  private predictMediaEfficiency(files: CampaignDocument[], features: CreativeFeatures): boolean {
    return features.channel_multi_format_adaptation && files.length >= 10;
  }

  private predictPositiveROI(content: string, features: CreativeFeatures): boolean {
    return features.messaging_action_oriented_language &&
           features.content_value_proposition_clear &&
           (content.includes('roi') || content.includes('return') || content.includes('efficient'));
  }

  private predictCostOptimization(files: CampaignDocument[], content: string): boolean {
    return files.length >= 15 && content.includes('efficient');
  }

  private predictConsiderationBehavior(content: string, filename: string): boolean {
    const considerationKeywords = ['consider', 'research', 'compare', 'evaluate', 'learn'];
    return considerationKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private predictResearchIntent(content: string, features: CreativeFeatures): boolean {
    return features.content_value_proposition_clear &&
           (content.includes('information') || content.includes('details') || content.includes('learn'));
  }

  private predictPurchaseBehavior(content: string, features: CreativeFeatures): boolean {
    return features.messaging_action_oriented_language &&
           features.detected_call_to_action;
  }

  private predictBrandSwitching(content: string, features: CreativeFeatures): boolean {
    return features.content_value_proposition_clear &&
           (content.includes('switch') || content.includes('change') || content.includes('better'));
  }

  private predictAdvocacyBehavior(content: string, features: CreativeFeatures): boolean {
    return features.targeting_values_based_targeting &&
           features.detected_emotional_appeal &&
           (content.includes('share') || content.includes('recommend') || content.includes('advocate'));
  }

  // Business Focus Detection Methods
  private detectConversionFocus(content: string, filename: string): boolean {
    const conversionKeywords = ['conversion', 'sale', 'purchase', 'buy', 'order', 'convert'];
    return conversionKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private detectAwarenessFocus(content: string, filename: string): boolean {
    const awarenessKeywords = ['awareness', 'launch', 'introduce', 'new', 'discover', 'meet'];
    return awarenessKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private detectEngagementFocus(content: string, filename: string): boolean {
    const engagementKeywords = ['engagement', 'interact', 'participate', 'join', 'connect', 'engage'];
    return engagementKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private detectRetentionFocus(content: string, filename: string): boolean {
    const retentionKeywords = ['retention', 'loyalty', 'repeat', 'return', 'member', 'subscriber'];
    return retentionKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private detectAcquisitionFocus(content: string, filename: string): boolean {
    const acquisitionKeywords = ['acquisition', 'new customer', 'signup', 'register', 'join', 'get'];
    return acquisitionKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }

  private detectBrandingFocus(content: string, filename: string): boolean {
    const brandingKeywords = ['brand', 'identity', 'image', 'reputation', 'perception', 'positioning'];
    return brandingKeywords.some(keyword => content.includes(keyword) || filename.includes(keyword));
  }
}

// File: lib/campaign-composition-analyzer.ts
export class CampaignCompositionAnalyzer {

  analyzeCampaignComposition(campaignFiles: CampaignDocument[]): CampaignComposition {
    const videoCount = campaignFiles.filter(f => f.fileType === 'video').length;
    const imageCount = campaignFiles.filter(f => f.fileType === 'image').length;
    const presentationCount = campaignFiles.filter(f => f.fileType === 'presentation').length;
    const totalCount = campaignFiles.length;

    return {
      video_heavy_campaign: videoCount >= 3,
      image_rich_campaign: imageCount >= 10,
      strategic_campaign: presentationCount >= 1,
      comprehensive_execution: totalCount >= 20,
      total_video_count: videoCount,
      total_image_count: imageCount,
      total_presentation_count: presentationCount,
      total_file_count: totalCount
    };
  }
}

// File: lib/tbwa-creative-rag-engine.ts - Main orchestrator
import { getConnection } from './database';
import { GoogleDriveExtractor } from './google-drive-extractor';
import { CreativeFeatureAnalyzer } from './creative-feature-analyzer';
import { BusinessOutcomeAnalyzer } from './business-outcome-analyzer';
import { CampaignCompositionAnalyzer } from './campaign-composition-analyzer';
import { createEmbedding, generateCreativeInsights } from './azure-openai';
import { CampaignDocument, CampaignAnalysis } from './types';
import sql from 'mssql';

export class TBWACreativeRAGEngine {
  private driveExtractor: GoogleDriveExtractor;
  private featureAnalyzer: CreativeFeatureAnalyzer;
  private outcomeAnalyzer: BusinessOutcomeAnalyzer;
  private compositionAnalyzer: CampaignCompositionAnalyzer;

  constructor() {
    this.driveExtractor = new GoogleDriveExtractor();
    this.featureAnalyzer = new CreativeFeatureAnalyzer();
    this.outcomeAnalyzer = new BusinessOutcomeAnalyzer();
    this.compositionAnalyzer = new CampaignCompositionAnalyzer();
  }

  async processCampaignDrive(folderId?: string): Promise<{ processed: number; errors: number }> {
    let processed = 0;
    let errors = 0;

    try {
      const documents = await this.driveExtractor.extractDocuments(folderId);
      console.log(`Found ${documents.length} campaign documents to process`);

      // Group documents by campaign (using folder structure)
      const campaignGroups = this.groupDocumentsByCampaign(documents);

      for (const [campaignName, campaignFiles] of campaignGroups.entries()) {
        try {
          console.log(`Processing campaign: ${campaignName} (${campaignFiles.length} files)`);
          
          for (const doc of campaignFiles) {
            const features = await this.driveExtractor.extractFeatures(doc);
            await this.storeCampaignDocument(doc, features, campaignFiles);
            processed++;
          }
          
          console.log(`✓ Processed campaign: ${campaignName}`);
        } catch (error) {
          console.error(`✗ Error processing campaign ${campaignName}:`, error);
          errors++;
        }
      }
    } catch (error) {
      console.error('Error in processCampaignDrive:', error);
      throw error;
    }

    return { processed, errors };
  }

  private groupDocumentsByCampaign(documents: CampaignDocument[]): Map<string, CampaignDocument[]> {
    const groups = new Map<string, CampaignDocument[]>();
    
    for (const doc of documents) {
      // Extract campaign name from path or filename
      const campaignName = this.extractCampaignName(doc);
      
      if (!groups.has(campaignName)) {
        groups.set(campaignName, []);
      }
      groups.get(campaignName)!.push(doc);
    }
    
    return groups;
  }

  private extractCampaignName(doc: CampaignDocument): string {
    // Try to extract campaign name from path or filename
    const pathParts = doc.path.split('/');
    if (pathParts.length > 1) {
      return pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
    }
    
    // Fallback to filename prefix
    const filenameParts = doc.filename.split('_');
    return filenameParts[0] || 'unknown_campaign';
  }

  private classifyFileType(doc: CampaignDocument): 'video' | 'image' | 'presentation' | 'document' | 'other' {
    const filename = doc.filename.toLowerCase();
    const mimeType = doc.mimeType.toLowerCase();
    
    if (mimeType.includes('video') || filename.includes('.mp4') || filename.includes('.mov')) {
      return 'video';
    }
    if (mimeType.includes('image') || filename.includes('.jpg') || filename.includes('.png')) {
      return 'image';
    }
    if (mimeType.includes('presentation') || filename.includes('.ppt')) {
      return 'presentation';
    }
    if (mimeType.includes('document') || filename.includes('.doc')) {
      return 'document';
    }
    return 'other';
  }

  async queryCampaignInsights(
    question: string,
    filters: {
      campaign?: string;
      client?: string;
      creative_feature?: string;
      business_outcome?: string;
    } = {},
    limit: number = 5
  ): Promise<{
    answer: string;
    sources: any[];
    analysis: any;
    metadata: any;
  }> {
    try {
      // Create query embedding
      const queryEmbedding = await createEmbedding(question);
      
      // Search for relevant campaign chunks
      const relevantChunks = await this.searchSimilarCampaigns(queryEmbedding, filters, limit);
      
      // Generate insights using Azure OpenAI
      const context = relevantChunks.map(chunk => chunk.content).join('\n\n');
      const answer = await generateCreativeInsights(context, question);
      
      // Get campaign analysis
      const analysis = await this.getCampaignAnalysis(filters);
      
      return {
        answer,
        sources: relevantChunks,
        analysis,
        metadata: {
          query: question,
          filters,
          resultsCount: relevantChunks.length
        }
      };
    } catch (error) {
      console.error('Error in queryCampaignInsights:', error);
      throw error;
    }
  }

  private async searchSimilarCampaigns(
    queryEmbedding: number[],
    filters: any,
    limit: number
  ): Promise<any[]> {
    const connection = await getConnection();
    
    let whereClause = '';
    const request = connection.request()
      .input('limit', sql.Int, limit);

    if (filters.campaign) {
      whereClause += ' AND cd.campaign_name = @campaign';
      request.input('campaign', sql.NVarChar, filters.campaign);
    }

    if (filters.client) {
      whereClause += ' AND cd.client_name = @client';
      request.input('client', sql.NVarChar, filters.client);
    }

    const result = await request.query(`
      SELECT TOP (@limit)
        dc.content,
        cd.filename,
        cd.campaign_name,
        cd.client_name,
        ca.creative_features,
        ca.business_outcomes,
        dc.created_at
      FROM document_chunks dc
      JOIN campaign_documents cd ON dc.document_id = cd.document_id
      LEFT JOIN campaign_analysis ca ON dc.document_id = ca.document_id
      WHERE 1=1 ${whereClause}
      ORDER BY dc.created_at DESC
    `);

    return result.recordset.map((row: any) => ({
      content: row.content || '',
      source: row.filename || '',
      campaign: row.campaign_name || '',
      client: row.client_name || '',
      creative_features: row.creative_features ? JSON.parse(row.creative_features) : {},
      business_outcomes: row.business_outcomes ? JSON.parse(row.business_outcomes) : {},
      timestamp: row.created_at || ''
    }));
  }

  private async getCampaignAnalysis(filters: any): Promise<any> {
    const connection = await getConnection();
    
    let whereClause = '';
    const request = connection.request();

    if (filters.campaign) {
      whereClause += ' AND cd.campaign_name = @campaign';
      request.input('campaign', sql.NVarChar, filters.campaign);
    }

    const result = await request.query(`
      SELECT 
        ca.creative_features,
        ca.business_outcomes,
        ca.campaign_composition,
        COUNT(*) as file_count
      FROM campaign_analysis ca
      JOIN campaign_documents cd ON ca.document_id = cd.document_id
      WHERE 1=1 ${whereClause}
      GROUP BY ca.creative_features, ca.business_outcomes, ca.campaign_composition
    `);

    return result.recordset.map((row: any) => ({
      creative_features: row.creative_features ? JSON.parse(row.creative_features) : {},
      business_outcomes: row.business_outcomes ? JSON.parse(row.business_outcomes) : {},
      campaign_composition: row.campaign_composition ? JSON.parse(row.campaign_composition) : {},
      file_count: row.file_count
    }));
  }

  private async storeCampaignDocument(
    metadata: CampaignDocument,
    features: any,
    campaignFiles: CampaignDocument[]
  ): Promise<void> {
    const connection = await getConnection();
    const transaction = new sql.Transaction(connection);
    
    try {
      await transaction.begin();

      // Classify file type
      metadata.fileType = this.classifyFileType(metadata);
      metadata.campaignName = this.extractCampaignName(metadata);

      // Store campaign document
      await transaction.request()
        .input('documentId', sql.NVarChar, metadata.id)
        .input('filename', sql.NVarChar, metadata.filename)
        .input('mimeType', sql.NVarChar, metadata.mimeType)
        .input('size', sql.BigInt, metadata.size)
        .input('createdTime', sql.DateTime2, new Date(metadata.createdTime))
        .input('modifiedTime', sql.DateTime2, new Date(metadata.modifiedTime))
        .input('driveId', sql.NVarChar, metadata.driveId)
        .input('path', sql.NVarChar, metadata.path)
        .input('campaignName', sql.NVarChar, metadata.campaignName)
        .input('fileType', sql.NVarChar, metadata.fileType)
        .query(`
          MERGE campaign_documents AS target
          USING (SELECT @documentId as document_id) AS source
          ON target.document_id = source.document_id
          WHEN MATCHED THEN
            UPDATE SET filename = @filename, modified_time = @modifiedTime, processed_at = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (document_id, filename, mime_type, size, created_time, modified_time, drive_id, path, campaign_name, file_type)
            VALUES (@documentId, @filename, @mimeType, @size, @createdTime, @modifiedTime, @driveId, @path, @campaignName, @fileType);
        `);

      // Analyze creative features and business outcomes
      const creativeFeatures = await this.featureAnalyzer.analyzeCreativeFeatures(
        metadata, features.textContent, campaignFiles
      );
      
      const businessOutcomes = await this.outcomeAnalyzer.analyzeBusinessOutcomes(
        metadata, features.textContent, campaignFiles, creativeFeatures
      );
      
      const campaignComposition = this.compositionAnalyzer.analyzeCampaignComposition(campaignFiles);

      // Store campaign analysis
      await transaction.request()
        .input('documentId', sql.NVarChar, metadata.id)
        .input('creativeFeatures', sql.NVarChar, JSON.stringify(creativeFeatures))
        .input('businessOutcomes', sql.NVarChar, JSON.stringify(businessOutcomes))
        .input('campaignComposition', sql.NVarChar, JSON.stringify(campaignComposition))
        .input('confidenceScore', sql.Decimal, 0.85)
        .query(`
          INSERT INTO campaign_analysis 
          (document_id, creative_features, business_outcomes, campaign_composition, confidence_score)
          VALUES (@documentId, @creativeFeatures, @businessOutcomes, @campaignComposition, @confidenceScore)
        `);

      // Create and store embeddings
      if (features.textContent.trim()) {
        await this.createAndStoreEmbeddings(transaction, metadata.id, features.textContent);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private async createAndStoreEmbeddings(
    transaction: sql.Transaction,
    documentId: string,
    textContent: string
  ): Promise<void> {
    const chunks = this.splitIntoChunks(textContent, 1000, 200);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await createEmbedding(chunk);
      const chunkId = `${documentId}_chunk_${i}`;
      
      await transaction.request()
        .input('documentId', sql.NVarChar, documentId)
        .input('chunkId', sql.NVarChar, chunkId)
        .input('content', sql.NVarChar, chunk)
        .input('embedding', sql.NVarChar, JSON.stringify(embedding))
        .input('chunkIndex', sql.Int, i)
        .query(`
          INSERT INTO document_chunks (document_id, chunk_id, content, embedding, chunk_index)
          VALUES (@documentId, @chunkId, @content, @embedding, @chunkIndex)
        `);
    }
  }

  private splitIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start += chunkSize - overlap;
    }
    
    return chunks;
  }
}
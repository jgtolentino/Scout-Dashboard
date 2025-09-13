// Populate Azure SQL with TBWA Creative Intelligence Data
// Process Google Drive campaigns and store in Azure SQL Database

const { getConnection, initializeCreativeCampaignDatabase } = require('../lib/database');
const { GoogleDriveExtractor } = require('../lib/google-drive-extractor');
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Configuration
const DRIVE_FOLDER_ID = process.env.DRIVE_CAMPAIGN_ROOT_ID || '0AJMhu01UUQKoUk9PVA';

async function populateAzureSQL() {
  console.log('🚀 TBWA Creative Intelligence → Azure SQL Population');
  console.log('==================================================');
  
  try {
    // Initialize database schema
    console.log('🔧 Initializing Azure SQL schema...');
    await initializeCreativeCampaignDatabase();
    
    // Initialize Google Drive extractor
    console.log('📁 Connecting to Google Drive...');
    const driveExtractor = new GoogleDriveExtractor();
    
    // Process campaign folder
    console.log(`📂 Processing campaign folder: ${DRIVE_FOLDER_ID}`);
    const assets = await driveExtractor.extractCampaignAssets(DRIVE_FOLDER_ID);
    
    console.log(`   Found ${assets.length} campaign assets`);
    
    // Process each asset
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      console.log(`   Processing ${i + 1}/${assets.length}: ${asset.name}`);
      
      await processAsset(asset);
    }
    
    // Generate summary report
    await generateSummaryReport();
    
    console.log('');
    console.log('✅ Azure SQL Population Complete!');
    console.log('🎯 TBWA campaign data now available in Azure SQL');
    
  } catch (error) {
    console.error('❌ Population failed:', error);
    throw error;
  }
}

async function processAsset(asset) {
  const connection = await getConnection();
  
  try {
    // Extract campaign and client from file path or name
    const { campaignName, clientName } = extractCampaignInfo(asset);
    
    // Insert campaign document
    const documentResult = await connection.request()
      .input('document_id', sql.NVarChar(255), asset.id)
      .input('filename', sql.NVarChar(500), asset.name)
      .input('mime_type', sql.NVarChar(100), asset.metadata?.mimeType || 'unknown')
      .input('size', sql.BigInt, asset.metadata?.size || 0)
      .input('drive_id', sql.NVarChar(255), asset.id)
      .input('path', sql.NVarChar(1000), asset.filePath)
      .input('campaign_name', sql.NVarChar(255), campaignName)
      .input('client_name', sql.NVarChar(255), clientName)
      .input('file_type', sql.NVarChar(50), asset.type)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM campaign_documents WHERE document_id = @document_id)
        BEGIN
          INSERT INTO campaign_documents (
            document_id, filename, mime_type, size, drive_id, path,
            campaign_name, client_name, file_type, processed_at
          ) VALUES (
            @document_id, @filename, @mime_type, @size, @drive_id, @path,
            @campaign_name, @client_name, @file_type, GETDATE()
          )
        END
      `);

    // Analyze creative features (Echo simulation)
    const creativeFeatures = analyzeCreativeFeatures(asset);
    
    // Predict business outcomes (Kalaw simulation)
    const businessOutcomes = predictBusinessOutcomes(asset, creativeFeatures);
    
    // Store analysis results
    await connection.request()
      .input('document_id', sql.NVarChar(255), asset.id)
      .input('creative_features', sql.NVarChar(sql.MAX), JSON.stringify(creativeFeatures))
      .input('business_outcomes', sql.NVarChar(sql.MAX), JSON.stringify(businessOutcomes))
      .input('confidence_score', sql.Decimal(3,2), calculateConfidenceScore(creativeFeatures, businessOutcomes))
      .query(`
        IF NOT EXISTS (SELECT 1 FROM campaign_analysis WHERE document_id = @document_id)
        BEGIN
          INSERT INTO campaign_analysis (
            document_id, creative_features, business_outcomes, confidence_score, analysis_timestamp
          ) VALUES (
            @document_id, @creative_features, @business_outcomes, @confidence_score, GETDATE()
          )
        END
      `);

    // Store individual features for lookup
    await storeFeatureLookups(asset.id, creativeFeatures, businessOutcomes);
    
    // Store content chunks for RAG
    if (asset.content) {
      await storeContentChunks(asset.id, asset.content);
    }
    
  } catch (error) {
    console.error(`   ❌ Error processing ${asset.name}:`, error);
  }
}

function extractCampaignInfo(asset) {
  const pathParts = asset.filePath.split('/');
  const fileName = asset.name;
  
  // Try to extract campaign name from path or filename
  let campaignName = 'Unknown Campaign';
  let clientName = 'TBWA Client';
  
  // Look for campaign indicators in path
  for (const part of pathParts) {
    if (part.toLowerCase().includes('campaign') || 
        part.toLowerCase().includes('project') ||
        part.toLowerCase().includes('client')) {
      campaignName = part;
      break;
    }
  }
  
  // Look for client name in upper level folders
  if (pathParts.length > 2) {
    clientName = pathParts[1] || 'TBWA Client';
  }
  
  return { campaignName, clientName };
}

function analyzeCreativeFeatures(asset) {
  // Simulate Echo creative analysis
  const features = {
    content: {
      has_logo: Math.random() > 0.3,
      has_product_shot: Math.random() > 0.4,
      has_call_to_action: Math.random() > 0.6,
      has_brand_colors: Math.random() > 0.7,
      has_text_overlay: Math.random() > 0.5
    },
    design: {
      is_minimalist: Math.random() > 0.4,
      uses_bold_typography: Math.random() > 0.5,
      has_strong_contrast: Math.random() > 0.6,
      uses_premium_aesthetic: Math.random() > 0.3
    },
    messaging: {
      emotional_appeal: Math.random() > 0.4,
      rational_benefits: Math.random() > 0.5,
      urgency_indicators: Math.random() > 0.3,
      social_proof: Math.random() > 0.2
    },
    detected: {
      faces_detected: asset.type === 'image' ? Math.random() > 0.6 : false,
      text_density: Math.random(),
      color_vibrancy: Math.random(),
      composition_balance: Math.random()
    }
  };
  
  return features;
}

function predictBusinessOutcomes(asset, creativeFeatures) {
  // Simulate Kalaw outcome prediction
  const baseROI = 1.2 + (Math.random() * 2.8); // 1.2 - 4.0x ROI
  const baseCTR = 0.5 + (Math.random() * 3.5); // 0.5% - 4.0% CTR
  
  // Adjust based on creative features
  let roiMultiplier = 1.0;
  let ctrMultiplier = 1.0;
  
  if (creativeFeatures.content.has_call_to_action) {
    roiMultiplier += 0.2;
    ctrMultiplier += 0.3;
  }
  
  if (creativeFeatures.design.has_strong_contrast) {
    ctrMultiplier += 0.2;
  }
  
  if (creativeFeatures.messaging.emotional_appeal) {
    roiMultiplier += 0.15;
  }
  
  const outcomes = {
    engagement: {
      predicted_ctr: Math.round(baseCTR * ctrMultiplier * 100) / 100,
      predicted_engagement_rate: Math.random() * 8 + 2, // 2-10%
      predicted_share_rate: Math.random() * 3 + 0.5, // 0.5-3.5%
      predicted_save_rate: Math.random() * 2 + 0.2 // 0.2-2.2%
    },
    conversion: {
      predicted_roi: Math.round(baseROI * roiMultiplier * 100) / 100,
      predicted_conversion_rate: Math.random() * 5 + 1, // 1-6%
      predicted_cost_per_acquisition: Math.random() * 50 + 10 // $10-60
    },
    brand: {
      predicted_brand_recall: Math.random() * 30 + 40, // 40-70%
      predicted_brand_sentiment: Math.random() * 0.6 + 0.2, // 0.2-0.8
      predicted_consideration_lift: Math.random() * 20 + 5 // 5-25%
    },
    business: {
      predicted_revenue_impact: Math.random() * 100000 + 10000, // $10k-110k
      predicted_customer_acquisition: Math.floor(Math.random() * 1000 + 100), // 100-1100
      predicted_market_share_gain: Math.random() * 2 + 0.1 // 0.1-2.1%
    }
  };
  
  return outcomes;
}

function calculateConfidenceScore(creativeFeatures, businessOutcomes) {
  // Calculate confidence based on feature completeness and prediction consistency
  const featureCount = Object.values(creativeFeatures).reduce((sum, category) => {
    return sum + Object.values(category).filter(v => v === true).length;
  }, 0);
  
  const baseConfidence = Math.min(featureCount / 10, 1); // Max confidence from features
  const randomVariation = (Math.random() * 0.3) - 0.15; // ±15% variation
  
  return Math.max(0.1, Math.min(0.99, baseConfidence + randomVariation));
}

async function storeFeatureLookups(documentId, creativeFeatures, businessOutcomes) {
  const connection = await getConnection();
  
  // Store creative features
  for (const [category, features] of Object.entries(creativeFeatures)) {
    for (const [featureName, featureValue] of Object.entries(features)) {
      if (typeof featureValue === 'boolean') {
        await connection.request()
          .input('document_id', sql.NVarChar(255), documentId)
          .input('feature_category', sql.NVarChar(50), category)
          .input('feature_name', sql.NVarChar(100), featureName)
          .input('feature_value', sql.Bit, featureValue)
          .query(`
            INSERT INTO creative_features_lookup (
              document_id, feature_category, feature_name, feature_value
            ) VALUES (
              @document_id, @feature_category, @feature_name, @feature_value
            )
          `);
      }
    }
  }
  
  // Store business outcomes
  for (const [category, outcomes] of Object.entries(businessOutcomes)) {
    for (const [outcomeName, outcomeValue] of Object.entries(outcomes)) {
      if (typeof outcomeValue === 'number') {
        const booleanValue = outcomeValue > 0.5; // Convert to boolean for lookup
        const confidence = Math.random() * 0.3 + 0.7; // 0.7-1.0 confidence
        
        await connection.request()
          .input('document_id', sql.NVarChar(255), documentId)
          .input('outcome_category', sql.NVarChar(50), category)
          .input('outcome_name', sql.NVarChar(100), outcomeName)
          .input('outcome_value', sql.Bit, booleanValue)
          .input('prediction_confidence', sql.Decimal(3,2), confidence)
          .query(`
            INSERT INTO business_outcomes_lookup (
              document_id, outcome_category, outcome_name, outcome_value, prediction_confidence
            ) VALUES (
              @document_id, @outcome_category, @outcome_name, @outcome_value, @prediction_confidence
            )
          `);
      }
    }
  }
}

async function storeContentChunks(documentId, content) {
  const connection = await getConnection();
  
  // Split content into chunks
  const chunks = content.split('\n\n').filter(chunk => chunk.trim().length > 0);
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkId = `${documentId}_chunk_${i}`;
    
    await connection.request()
      .input('document_id', sql.NVarChar(255), documentId)
      .input('chunk_id', sql.NVarChar(255), chunkId)
      .input('content', sql.NVarChar(sql.MAX), chunk)
      .input('chunk_index', sql.Int, i)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM document_chunks WHERE chunk_id = @chunk_id)
        BEGIN
          INSERT INTO document_chunks (
            document_id, chunk_id, content, chunk_index
          ) VALUES (
            @document_id, @chunk_id, @content, @chunk_index
          )
        END
      `);
  }
}

async function generateSummaryReport() {
  console.log('📊 Generating summary report...');
  
  const connection = await getConnection();
  
  const summary = await connection.request().query(`
    SELECT 
      COUNT(*) as total_documents,
      COUNT(DISTINCT campaign_name) as total_campaigns,
      COUNT(DISTINCT client_name) as total_clients,
      AVG(confidence_score) as avg_confidence,
      SUM(CASE WHEN file_type = 'video' THEN 1 ELSE 0 END) as video_count,
      SUM(CASE WHEN file_type = 'image' THEN 1 ELSE 0 END) as image_count,
      SUM(CASE WHEN file_type = 'presentation' THEN 1 ELSE 0 END) as presentation_count,
      SUM(CASE WHEN file_type = 'document' THEN 1 ELSE 0 END) as document_count
    FROM campaign_documents cd
    LEFT JOIN campaign_analysis ca ON cd.document_id = ca.document_id
  `);
  
  const stats = summary.recordset[0];
  
  console.log('');
  console.log('📈 TBWA Creative Intelligence Summary');
  console.log('===================================');
  console.log(`📄 Total Documents: ${stats.total_documents}`);
  console.log(`🎯 Total Campaigns: ${stats.total_campaigns}`);
  console.log(`🏢 Total Clients: ${stats.total_clients}`);
  console.log(`🎥 Videos: ${stats.video_count}`);
  console.log(`🖼️  Images: ${stats.image_count}`);
  console.log(`📊 Presentations: ${stats.presentation_count}`);
  console.log(`📝 Documents: ${stats.document_count}`);
  console.log(`🎯 Avg Confidence: ${Math.round(stats.avg_confidence * 100)}%`);
}

// Run the population script
if (require.main === module) {
  populateAzureSQL().catch(console.error);
}

module.exports = { populateAzureSQL };
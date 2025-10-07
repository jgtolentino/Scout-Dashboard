/**
 * Shelf Detection and Analysis Function
 * Uses computer vision to analyze retail shelf presence from uploaded images
 */

const { ComputerVisionClient } = require("@azure/cognitiveservices-computervision");
const { ApiKeyCredentials } = require("@azure/ms-rest-js");
const { BlobServiceClient } = require("@azure/storage-blob");
const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");
const sharp = require("sharp");
const fetch = require("node-fetch");

// Configuration
const KEY_VAULT_NAME = process.env.KEY_VAULT_NAME || "tbwa-market-intelligence";
const KEY_VAULT_URI = `https://${KEY_VAULT_NAME}.vault.azure.net`;
const STORAGE_ACCOUNT = process.env.STORAGE_ACCOUNT || "tbwadata";
const BRONZE_CONTAINER = "bronze";
const CUSTOM_VISION_ENDPOINT = process.env.CUSTOM_VISION_ENDPOINT || "https://tbwa-product-detection.cognitiveservices.azure.com/";
const PLACER_API_ENDPOINT = process.env.PLACER_API_ENDPOINT || "https://api.placer.ai/v1";

// Product recognition model settings
const MODEL_CONFIDENCE_THRESHOLD = 0.65;

// Confidence scoring weights for triangulation
const SIGNAL_WEIGHTS = {
  visualDetection: 0.45,
  shelfPosition: 0.20,
  competitorProximity: 0.15,
  socialSignals: 0.10,
  trafficCorrelation: 0.10
};

/**
 * Main function handler
 */
module.exports = async function (context, req) {
  try {
    // Validate request
    if (!req.body || !req.body.imageUrl) {
      context.res = {
        status: 400,
        body: { error: "Request must include 'imageUrl'" }
      };
      return;
    }

    const imageUrl = req.body.imageUrl;
    const brandName = req.body.brandName;
    const storeId = req.body.storeId;
    const storeLocation = req.body.storeLocation;
    const captureTime = req.body.captureTime || new Date().toISOString();
    
    // Get API credentials from Key Vault
    const credential = new DefaultAzureCredential();
    const secretClient = new SecretClient(KEY_VAULT_URI, credential);
    
    // Get CV API key
    const cvApiKeySecret = await secretClient.getSecret("custom-vision-api-key");
    const cvApiKey = cvApiKeySecret.value;
    
    // Get Placer API key (for foot traffic correlation)
    const placerApiKeySecret = await secretClient.getSecret("placer-api-key");
    const placerApiKey = placerApiKeySecret.value;
    
    // Get Brandwatch API credentials (for social signal correlation)
    const brandwatchCredsSecret = await secretClient.getSecret("brandwatch-api-credentials");
    const brandwatchCreds = brandwatchCredsSecret.value;
    
    // Initialize Computer Vision client
    const cvCredentials = new ApiKeyCredentials({ inHeader: { "Ocp-Apim-Subscription-Key": cvApiKey } });
    const cvClient = new ComputerVisionClient(cvCredentials, CUSTOM_VISION_ENDPOINT);
    
    // Process image and detect products
    context.log(`Processing image for shelf detection: ${imageUrl}`);
    
    // Analyze the image
    const [
      visionResults,
      preprocessedImageBuffer
    ] = await analyzeShelfImage(cvClient, imageUrl, brandName);
    
    // Store the analyzed image and results in Bronze layer
    const imagePath = await storeProcessedImage(preprocessedImageBuffer, storeId, captureTime);
    await storeDetectionResults(visionResults, storeId, brandName, imagePath, captureTime);
    
    // Get complementary signals for triangulation
    const footTrafficData = await getFootTrafficData(storeId, placerApiKey);
    const socialSignals = await getSocialSignals(brandName, storeLocation, brandwatchCreds);
    
    // Triangulate signals for higher confidence
    const triangulatedResults = triangulateSignals(
      visionResults,
      footTrafficData,
      socialSignals,
      brandName,
      storeId
    );
    
    // Return the combined results
    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: {
        shelfAnalysis: triangulatedResults,
        analyzedImageUrl: `https://${STORAGE_ACCOUNT}.blob.core.windows.net/${BRONZE_CONTAINER}/${imagePath}`,
        captureTime,
        storeId,
        storeLocation,
        brandName
      }
    };
  } catch (error) {
    context.log.error(`Error in shelf detection: ${error.message}`);
    context.res = {
      status: 500,
      body: { error: `Error processing shelf image: ${error.message}` }
    };
  }
};

/**
 * Process and analyze a shelf image
 * @param {ComputerVisionClient} cvClient - Computer Vision client
 * @param {string} imageUrl - URL of the image to analyze
 * @param {string} targetBrand - Brand to focus on
 * @returns {Promise<[object, Buffer]>} - Analysis results and preprocessed image
 */
async function analyzeShelfImage(cvClient, imageUrl, targetBrand) {
  // Download the image
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  
  const imageBuffer = await response.buffer();
  
  // Preprocess the image to enhance detection
  const preprocessedImage = await preprocessImage(imageBuffer);
  
  // Analyze with Computer Vision for general scene understanding
  const generalAnalysis = await cvClient.analyzeImage(preprocessedImage, {
    visualFeatures: ["Objects", "Brands", "Tags", "Text"]
  });
  
  // Analyze with Custom Vision for product-specific detection
  const customModelName = targetBrand ? `${targetBrand.toLowerCase()}_products` : 'retail_products';
  const customVisionResults = await callCustomVisionModel(preprocessedImage, customModelName);
  
  // Measure shelf metrics
  const shelfMetrics = calculateShelfMetrics(
    customVisionResults.predictions,
    generalAnalysis,
    targetBrand
  );
  
  // Return combined results and the preprocessed image
  return [
    {
      shelfMetrics,
      detectedProducts: customVisionResults.predictions.filter(p => p.probability >= MODEL_CONFIDENCE_THRESHOLD),
      sceneContext: {
        brands: generalAnalysis.brands || [],
        objects: generalAnalysis.objects || [],
        tags: generalAnalysis.tags || [],
        text: extractTextLines(generalAnalysis.text || {})
      },
      confidence: calculateOverallConfidence(customVisionResults, generalAnalysis, targetBrand)
    },
    preprocessedImage
  ];
}

/**
 * Preprocess image to improve detection quality
 * @param {Buffer} imageBuffer - Original image
 * @returns {Buffer} - Preprocessed image
 */
async function preprocessImage(imageBuffer) {
  // Use sharp for image preprocessing
  return await sharp(imageBuffer)
    // Normalize brightness and contrast
    .normalize()
    // Modest sharpening to enhance product edges
    .sharpen({ sigma: 1.2 })
    // Ensure reasonable size for analysis
    .resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
    // Output as high-quality JPEG
    .jpeg({ quality: 90 })
    .toBuffer();
}

/**
 * Call Custom Vision model for product detection
 * @param {Buffer} imageBuffer - Image to analyze
 * @param {string} modelName - Name of the Custom Vision model to use
 * @returns {Promise<object>} - Detection results
 */
async function callCustomVisionModel(imageBuffer, modelName) {
  // In a real implementation, this would call the Custom Vision prediction API
  // For this example, we'll simulate a response based on the model name
  
  // Simulated product detection results
  const simulatedBrands = {
    globe_products: ["Globe Prepaid", "Globe Postpaid", "Globe At Home", "Globe TM"],
    smart_products: ["Smart Prepaid", "Smart Postpaid", "Smart Infinity", "TNT"],
    jollibee_products: ["Chickenjoy", "Jolly Spaghetti", "Yumburger", "Peach Mango Pie"],
    mcdonalds_products: ["Big Mac", "McChicken", "French Fries", "McFlurry"],
    retail_products: ["Shampoo", "Soap", "Toothpaste", "Snacks", "Beverages"]
  };
  
  const brandProducts = simulatedBrands[modelName] || simulatedBrands.retail_products;
  
  // Create simulated predictions based on the model
  const predictions = brandProducts.map(product => {
    const probability = 0.5 + (Math.random() * 0.4); // 0.5-0.9 range
    return {
      tagName: product,
      probability,
      boundingBox: {
        left: Math.random() * 0.6,
        top: Math.random() * 0.6,
        width: 0.2 + (Math.random() * 0.2),
        height: 0.1 + (Math.random() * 0.2)
      }
    };
  });
  
  // Sort by probability descending
  predictions.sort((a, b) => b.probability - a.probability);
  
  return {
    predictions,
    modelName,
    created: new Date().toISOString()
  };
}

/**
 * Calculate shelf presence metrics from detection results
 * @param {Array} predictions - Product predictions
 * @param {object} generalAnalysis - General image analysis results
 * @param {string} targetBrand - Brand to focus on
 * @returns {object} - Shelf metrics
 */
function calculateShelfMetrics(predictions, generalAnalysis, targetBrand) {
  // Filter predictions for target brand
  const targetPredictions = targetBrand 
    ? predictions.filter(p => p.tagName.toLowerCase().includes(targetBrand.toLowerCase()))
    : predictions;
  
  // Calculate total product area
  const totalProductArea = predictions.reduce((sum, p) => {
    return sum + (p.boundingBox.width * p.boundingBox.height);
  }, 0);
  
  // Calculate target brand area
  const targetBrandArea = targetPredictions.reduce((sum, p) => {
    return sum + (p.boundingBox.width * p.boundingBox.height);
  }, 0);
  
  // Calculate share of shelf
  const shareOfShelf = totalProductArea > 0 
    ? (targetBrandArea / totalProductArea) * 100 
    : 0;
  
  // Calculate average height position (lower number = higher on shelf = better)
  const avgPositionScore = targetPredictions.length > 0
    ? targetPredictions.reduce((sum, p) => sum + p.boundingBox.top, 0) / targetPredictions.length
    : 0.5;
  
  // Convert to position score (0-100, higher is better)
  const positionScore = 100 - (avgPositionScore * 100);
  
  // Count facings
  const facings = targetPredictions.length;
  
  // Detect pricing if available
  const pricingText = extractPricingInfo(generalAnalysis.text, targetPredictions);
  
  // Detect competing brands
  const competingBrands = generalAnalysis.brands
    ? generalAnalysis.brands
        .filter(b => b.name.toLowerCase() !== targetBrand.toLowerCase())
        .map(b => ({ name: b.name, confidence: b.confidence }))
    : [];
  
  return {
    shareOfShelf: parseFloat(shareOfShelf.toFixed(1)),
    facings,
    positionScore: parseFloat(positionScore.toFixed(1)),
    positionQuality: categorizeShelfPosition(avgPositionScore),
    pricingInfo: pricingText,
    competingBrands,
    competitorProximity: calculateCompetitorProximity(targetPredictions, predictions, targetBrand)
  };
}

/**
 * Categorize shelf position
 * @param {number} positionValue - Position value (0-1, 0=top)
 * @returns {string} - Position category
 */
function categorizeShelfPosition(positionValue) {
  if (positionValue < 0.25) return "Top Shelf (Premium)";
  if (positionValue < 0.5) return "Eye Level (Optimal)";
  if (positionValue < 0.75) return "Waist Level (Good)";
  return "Bottom Shelf (Poor)";
}

/**
 * Calculate proximity to competitor products
 * @param {Array} targetProducts - Target brand products
 * @param {Array} allProducts - All detected products
 * @param {string} targetBrand - Target brand name
 * @returns {object} - Competitor proximity score
 */
function calculateCompetitorProximity(targetProducts, allProducts, targetBrand) {
  if (targetProducts.length === 0 || allProducts.length <= targetProducts.length) {
    return { score: 0, level: "No competitors detected" };
  }
  
  // Filter for competitor products
  const competitorProducts = allProducts.filter(p => 
    !p.tagName.toLowerCase().includes(targetBrand.toLowerCase()) &&
    p.probability >= MODEL_CONFIDENCE_THRESHOLD
  );
  
  if (competitorProducts.length === 0) {
    return { score: 0, level: "No competitors detected" };
  }
  
  // Calculate minimum distance to each competitor product
  let totalMinDistance = 0;
  let closestCompetitor = null;
  let closestDistance = 1.0;
  
  for (const targetProduct of targetProducts) {
    let minDistance = 1.0;
    let closestProduct = null;
    
    for (const competitorProduct of competitorProducts) {
      const distance = calculateBoxDistance(targetProduct.boundingBox, competitorProduct.boundingBox);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestProduct = competitorProduct;
      }
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestCompetitor = competitorProduct;
      }
    }
    
    totalMinDistance += minDistance;
  }
  
  // Average minimum distance
  const avgMinDistance = totalMinDistance / targetProducts.length;
  
  // Convert to proximity score (0-100, higher means closer to competitors)
  const proximityScore = 100 - (avgMinDistance * 100);
  
  // Determine proximity level
  let proximityLevel;
  if (proximityScore > 80) proximityLevel = "Very High (Direct Competition)";
  else if (proximityScore > 60) proximityLevel = "High";
  else if (proximityScore > 40) proximityLevel = "Medium";
  else if (proximityScore > 20) proximityLevel = "Low";
  else proximityLevel = "Very Low (Isolated)";
  
  return {
    score: parseFloat(proximityScore.toFixed(1)),
    level: proximityLevel,
    closestCompetitor: closestCompetitor ? closestCompetitor.tagName : null,
    closestDistance: parseFloat(closestDistance.toFixed(3))
  };
}

/**
 * Calculate distance between two bounding boxes
 * @param {object} box1 - First bounding box
 * @param {object} box2 - Second bounding box
 * @returns {number} - Distance between boxes (0-1)
 */
function calculateBoxDistance(box1, box2) {
  const box1CenterX = box1.left + (box1.width / 2);
  const box1CenterY = box1.top + (box1.height / 2);
  const box2CenterX = box2.left + (box2.width / 2);
  const box2CenterY = box2.top + (box2.height / 2);
  
  // Calculate Euclidean distance between centers (normalized 0-1)
  const distance = Math.sqrt(
    Math.pow(box1CenterX - box2CenterX, 2) +
    Math.pow(box1CenterY - box2CenterY, 2)
  );
  
  return Math.min(distance, 1.0);
}

/**
 * Extract pricing information from text detection
 * @param {object} textResults - Text detection results
 * @param {Array} targetProducts - Target products detected
 * @returns {Array} - Extracted pricing info
 */
function extractPricingInfo(textResults, targetProducts) {
  if (!textResults || !textResults.lines) {
    return [];
  }
  
  const priceRegex = /(?:₱|P|PHP)?\s*\d+(?:[,.]\d+)?/gi;
  const prices = [];
  
  // Extract all price-like text
  for (const line of textResults.lines) {
    const matches = line.text.match(priceRegex);
    if (matches) {
      // For each price found, check proximity to a product
      for (const match of matches) {
        const lineBox = line.boundingBox;
        
        // Find closest product to this price
        let closestProduct = null;
        let minDistance = 0.2; // Maximum distance threshold
        
        for (const product of targetProducts) {
          const distance = calculateBoxDistance(lineBox, product.boundingBox);
          if (distance < minDistance) {
            minDistance = distance;
            closestProduct = product;
          }
        }
        
        if (closestProduct) {
          prices.push({
            price: match.trim(),
            productName: closestProduct.tagName,
            confidence: line.confidence
          });
        }
      }
    }
  }
  
  return prices;
}

/**
 * Extract text lines from OCR results
 * @param {object} textResults - Text detection results
 * @returns {Array} - Extracted text lines
 */
function extractTextLines(textResults) {
  if (!textResults || !textResults.lines) {
    return [];
  }
  
  return textResults.lines.map(line => ({
    text: line.text,
    confidence: line.confidence,
    boundingBox: line.boundingBox
  }));
}

/**
 * Calculate overall confidence score for detection
 * @param {object} customVisionResults - Custom Vision results
 * @param {object} generalAnalysis - General analysis results
 * @param {string} targetBrand - Target brand
 * @returns {object} - Confidence score and factors
 */
function calculateOverallConfidence(customVisionResults, generalAnalysis, targetBrand) {
  // Get average detection confidence
  const detectionConfidence = customVisionResults.predictions.length > 0
    ? customVisionResults.predictions.reduce((sum, p) => sum + p.probability, 0) / customVisionResults.predictions.length
    : 0;
  
  // Check if target brand is in general brands detected
  const brandDetected = generalAnalysis.brands
    ? generalAnalysis.brands.some(b => b.name.toLowerCase() === targetBrand.toLowerCase())
    : false;
  
  // Check image quality factors
  const imageQualityFactors = {
    hasTags: generalAnalysis.tags && generalAnalysis.tags.length > 0,
    hasObjects: generalAnalysis.objects && generalAnalysis.objects.length > 0,
    hasText: generalAnalysis.text && generalAnalysis.text.lines && generalAnalysis.text.lines.length > 0
  };
  
  // Calculate quality score
  const qualityScore = (
    (imageQualityFactors.hasTags ? 0.3 : 0) +
    (imageQualityFactors.hasObjects ? 0.3 : 0) +
    (imageQualityFactors.hasText ? 0.2 : 0) +
    (brandDetected ? 0.2 : 0)
  );
  
  // Combined confidence score
  const combinedScore = (detectionConfidence * 0.7) + (qualityScore * 0.3);
  
  // Map to confidence level
  let confidenceLevel;
  if (combinedScore >= 0.8) confidenceLevel = "Very High";
  else if (combinedScore >= 0.65) confidenceLevel = "High";
  else if (combinedScore >= 0.5) confidenceLevel = "Medium";
  else if (combinedScore >= 0.35) confidenceLevel = "Low";
  else confidenceLevel = "Very Low";
  
  return {
    score: parseFloat((combinedScore * 100).toFixed(1)),
    level: confidenceLevel,
    factors: {
      detectionConfidence: parseFloat((detectionConfidence * 100).toFixed(1)),
      imageQuality: parseFloat((qualityScore * 100).toFixed(1)),
      brandDetected
    }
  };
}

/**
 * Store processed image in blob storage
 * @param {Buffer} imageBuffer - Processed image buffer
 * @param {string} storeId - Store identifier
 * @param {string} captureTime - Image capture timestamp
 * @returns {Promise<string>} - Blob path
 */
async function storeProcessedImage(imageBuffer, storeId, captureTime) {
  const credential = new DefaultAzureCredential();
  const blobServiceClient = new BlobServiceClient(
    `https://${STORAGE_ACCOUNT}.blob.core.windows.net`,
    credential
  );
  
  const containerClient = blobServiceClient.getContainerClient(BRONZE_CONTAINER);
  await containerClient.createIfNotExists();
  
  // Format timestamp for path
  const timestamp = new Date(captureTime).toISOString().replace(/:/g, '-').replace(/\..+/, '');
  
  // Create blob path with store and timestamp
  const blobPath = `shelf_images/${storeId}/${timestamp}.jpg`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
  
  // Upload image
  await blockBlobClient.upload(imageBuffer, imageBuffer.length, {
    blobHTTPHeaders: {
      blobContentType: "image/jpeg"
    }
  });
  
  return blobPath;
}

/**
 * Store detection results in blob storage
 * @param {object} results - Detection results
 * @param {string} storeId - Store identifier
 * @param {string} brandName - Brand name
 * @param {string} imagePath - Path to the stored image
 * @param {string} captureTime - Image capture timestamp
 * @returns {Promise<void>}
 */
async function storeDetectionResults(results, storeId, brandName, imagePath, captureTime) {
  const credential = new DefaultAzureCredential();
  const blobServiceClient = new BlobServiceClient(
    `https://${STORAGE_ACCOUNT}.blob.core.windows.net`,
    credential
  );
  
  const containerClient = blobServiceClient.getContainerClient(BRONZE_CONTAINER);
  
  // Format timestamp for path
  const timestamp = new Date(captureTime).toISOString().replace(/:/g, '-').replace(/\..+/, '');
  
  // Create results object with metadata
  const resultsObject = {
    storeId,
    brandName,
    captureTime,
    analysisTime: new Date().toISOString(),
    imagePath,
    results
  };
  
  // Create blob path for results
  const blobPath = `shelf_analysis/${storeId}/${timestamp}.json`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
  
  // Upload results
  const content = JSON.stringify(resultsObject, null, 2);
  await blockBlobClient.upload(content, content.length, {
    blobHTTPHeaders: {
      blobContentType: "application/json"
    }
  });
}

/**
 * Get foot traffic data for the store
 * @param {string} storeId - Store identifier
 * @param {string} apiKey - Placer API key
 * @returns {Promise<object>} - Foot traffic data
 */
async function getFootTrafficData(storeId, apiKey) {
  // For demo purposes, simulate foot traffic data
  // In a real implementation, this would call the Placer.ai API
  
  return {
    totalVisits: 1200 + Math.floor(Math.random() * 800),
    percentChange: -5 + Math.floor(Math.random() * 20),
    averageDuration: 15 + Math.floor(Math.random() * 10),
    peakHours: [
      { hour: 12, visits: 150 + Math.floor(Math.random() * 50) },
      { hour: 17, visits: 180 + Math.floor(Math.random() * 60) },
      { hour: 18, visits: 160 + Math.floor(Math.random() * 40) }
    ],
    dayOfWeekDistribution: {
      Monday: 0.12,
      Tuesday: 0.11,
      Wednesday: 0.13,
      Thursday: 0.15,
      Friday: 0.18,
      Saturday: 0.20,
      Sunday: 0.11
    },
    trafficDensity: 0.65 + (Math.random() * 0.2),
    confidenceScore: 80 + Math.floor(Math.random() * 15)
  };
}

/**
 * Get social signals for brand and location
 * @param {string} brandName - Brand name
 * @param {string} location - Store location
 * @param {string} credentials - API credentials
 * @returns {Promise<object>} - Social signals data
 */
async function getSocialSignals(brandName, location, credentials) {
  // For demo purposes, simulate social data
  // In a real implementation, this would call the Brandwatch API
  
  const cityName = location && location.city ? location.city : "Manila";
  
  return {
    totalMentions: 350 + Math.floor(Math.random() * 300),
    mentionsWithStockTerms: 45 + Math.floor(Math.random() * 30),
    sentimentDistribution: {
      positive: 0.65 + (Math.random() * 0.15),
      neutral: 0.25 + (Math.random() * 0.1),
      negative: 0.05 + (Math.random() * 0.05)
    },
    locationMentions: [
      { name: cityName, count: 120 + Math.floor(Math.random() * 80) },
      { name: "Online Store", count: 80 + Math.floor(Math.random() * 40) }
    ],
    stockKeywords: {
      inStock: 28 + Math.floor(Math.random() * 12),
      outOfStock: 8 + Math.floor(Math.random() * 8),
      available: 35 + Math.floor(Math.random() * 15),
      soldOut: 5 + Math.floor(Math.random() * 5)
    },
    confidence: 75 + Math.floor(Math.random() * 20)
  };
}

/**
 * Triangulate signals for higher confidence
 * @param {object} visionResults - Computer vision results
 * @param {object} footTrafficData - Foot traffic data
 * @param {object} socialSignals - Social signals data
 * @param {string} brandName - Brand name
 * @param {string} storeId - Store identifier
 * @returns {object} - Triangulated results
 */
function triangulateSignals(visionResults, footTrafficData, socialSignals, brandName, storeId) {
  // Extract key metrics
  const shelfShare = visionResults.shelfMetrics.shareOfShelf;
  const facings = visionResults.shelfMetrics.facings;
  const positionScore = visionResults.shelfMetrics.positionScore;
  const competitorProximity = visionResults.shelfMetrics.competitorProximity.score;
  
  // Calculate stock availability score (0-100)
  const visualDetectionScore = (shelfShare * 0.6) + (facings > 0 ? 40 : 0);
  
  // Calculate traffic factor
  const trafficFactor = footTrafficData.percentChange > 0 ? 
    Math.min(footTrafficData.percentChange / 2, 10) : 0;
  
  // Calculate social signal factor
  const socialStockScore = calculateSocialStockScore(socialSignals);
  
  // Calculate overall availability score with weighted factors
  const availabilityScore = 
    (visualDetectionScore * SIGNAL_WEIGHTS.visualDetection) +
    (positionScore * SIGNAL_WEIGHTS.shelfPosition) +
    (competitorProximity * SIGNAL_WEIGHTS.competitorProximity) +
    (socialStockScore * SIGNAL_WEIGHTS.socialSignals) +
    (trafficFactor * SIGNAL_WEIGHTS.trafficCorrelation);
  
  // Map to inventory level
  const inventoryLevel = mapScoreToInventoryLevel(availabilityScore);
  
  // Calculate days to restock prediction
  const daysToRestock = calculateRestockPrediction(
    availabilityScore,
    footTrafficData.percentChange,
    facings
  );
  
  // Calculate overall confidence
  const confidenceFactors = {
    visualDetection: visionResults.confidence.score,
    footTraffic: footTrafficData.confidenceScore,
    socialSignals: socialSignals.confidence
  };
  
  const overallConfidence = calculateSignalConfidence(confidenceFactors);
  
  return {
    productAvailability: {
      score: parseFloat(availabilityScore.toFixed(1)),
      level: inventoryLevel,
      restockPrediction: daysToRestock > 0 ? 
        `Approximately ${daysToRestock} days` : 
        "Immediate restock recommended"
    },
    shelfMetrics: visionResults.shelfMetrics,
    confidence: {
      score: parseFloat(overallConfidence.score.toFixed(1)),
      level: overallConfidence.level,
      factors: confidenceFactors
    },
    signalContributions: {
      visualDetection: parseFloat((visualDetectionScore * SIGNAL_WEIGHTS.visualDetection).toFixed(1)),
      shelfPosition: parseFloat((positionScore * SIGNAL_WEIGHTS.shelfPosition).toFixed(1)),
      competitorProximity: parseFloat((competitorProximity * SIGNAL_WEIGHTS.competitorProximity).toFixed(1)),
      socialSignals: parseFloat((socialStockScore * SIGNAL_WEIGHTS.socialSignals).toFixed(1)),
      trafficFactor: parseFloat((trafficFactor * SIGNAL_WEIGHTS.trafficCorrelation).toFixed(1))
    }
  };
}

/**
 * Calculate social stock score from social signals
 * @param {object} socialSignals - Social signals data
 * @returns {number} - Stock score (0-100)
 */
function calculateSocialStockScore(socialSignals) {
  if (!socialSignals || !socialSignals.stockKeywords) {
    return 50; // Neutral score if no data
  }
  
  const keywords = socialSignals.stockKeywords;
  const positive = keywords.inStock + keywords.available;
  const negative = keywords.outOfStock + keywords.soldOut;
  const total = positive + negative;
  
  if (total === 0) {
    return 50; // Neutral score if no specific keywords
  }
  
  // Calculate positive percentage and convert to 0-100 score
  return (positive / total) * 100;
}

/**
 * Map availability score to inventory level
 * @param {number} score - Availability score (0-100)
 * @returns {string} - Inventory level category
 */
function mapScoreToInventoryLevel(score) {
  if (score >= 80) return "Well Stocked";
  if (score >= 60) return "Adequately Stocked";
  if (score >= 40) return "Limited Stock";
  if (score >= 20) return "Low Stock";
  return "Critical Stock / Out of Stock";
}

/**
 * Calculate restock prediction in days
 * @param {number} availabilityScore - Availability score (0-100)
 * @param {number} trafficTrend - Traffic trend percentage
 * @param {number} facings - Number of product facings
 * @returns {number} - Estimated days until restock needed
 */
function calculateRestockPrediction(availabilityScore, trafficTrend, facings) {
  if (availabilityScore < 20 || facings === 0) {
    return 0; // Immediate restock
  }
  
  // Base days based on availability
  let baseDays = Math.floor(availabilityScore / 10);
  
  // Adjust for traffic trend
  const trafficFactor = trafficTrend > 0 ? 
    Math.max(1 - (trafficTrend / 100), 0.7) : 
    Math.min(1 + (Math.abs(trafficTrend) / 100), 1.3);
  
  // Adjust for facings
  const facingsFactor = facings > 0 ? 
    Math.min(facings / 3, 1.5) : 1;
  
  // Calculate final prediction
  const adjustedDays = baseDays * trafficFactor * facingsFactor;
  
  return Math.max(Math.round(adjustedDays), 0);
}

/**
 * Calculate confidence score for triangulated signals
 * @param {object} factors - Confidence factors for each signal
 * @returns {object} - Overall confidence score and level
 */
function calculateSignalConfidence(factors) {
  // Weighted confidence score
  const weights = {
    visualDetection: 0.5,
    footTraffic: 0.3,
    socialSignals: 0.2
  };
  
  let weightedScore = 0;
  let weightSum = 0;
  
  // Calculate weighted score
  Object.entries(factors).forEach(([key, value]) => {
    if (weights[key] && value) {
      weightedScore += weights[key] * value;
      weightSum += weights[key];
    }
  });
  
  // Normalize score
  const normalizedScore = weightSum > 0 ? 
    (weightedScore / weightSum) : 50;
  
  // Map to confidence levels
  let level;
  if (normalizedScore >= 80) level = "Very High";
  else if (normalizedScore >= 65) level = "High";
  else if (normalizedScore >= 50) level = "Medium";
  else if (normalizedScore >= 35) level = "Low";
  else level = "Very Low";
  
  return { score: normalizedScore, level };
}
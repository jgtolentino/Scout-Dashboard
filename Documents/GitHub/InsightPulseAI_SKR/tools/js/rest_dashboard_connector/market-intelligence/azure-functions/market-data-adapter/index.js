/**
 * Market Data Adapter Function
 * Connects to various market intelligence APIs and standardizes their responses
 */

const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");
const { BlobServiceClient } = require("@azure/storage-blob");
const fetch = require("node-fetch");

// Azure Key Vault for secure credential storage
const KEY_VAULT_NAME = process.env.KEY_VAULT_NAME || "tbwa-market-intelligence";
const KEY_VAULT_URI = `https://${KEY_VAULT_NAME}.vault.azure.net`;

// ADLS Gen2 storage for bronze layer
const STORAGE_ACCOUNT = process.env.STORAGE_ACCOUNT || "tbwadata";
const BRONZE_CONTAINER = "bronze";

// API provider configurations
const PROVIDERS = {
  bloomberg: {
    baseUrl: "https://api.bloomberg.com/market-data/v1",
    keyVaultSecretName: "bloomberg-api-key",
    headers: {
      "Content-Type": "application/json"
    },
    transformFunction: transformBloombergData
  },
  spglobal: {
    baseUrl: "https://api.spglobal.com/marketplace/api/v1",
    keyVaultSecretName: "spglobal-api-key",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    transformFunction: transformSpGlobalData
  },
  brandwatch: {
    baseUrl: "https://api.brandwatch.com/oauth/token",
    keyVaultSecretName: "brandwatch-api-credentials",
    headers: {
      "Content-Type": "application/json"
    },
    transformFunction: transformBrandwatchData
  },
  crunchbase: {
    baseUrl: "https://api.crunchbase.com/api/v4",
    keyVaultSecretName: "crunchbase-api-key",
    headers: {
      "Content-Type": "application/json"
    },
    transformFunction: transformCrunchbaseData
  }
};

// Cache settings
const CACHE_DURATION_SECONDS = 3600; // 1 hour

/**
 * Main function handler
 */
module.exports = async function (context, req) {
  try {
    // Extract parameters
    const provider = req.params.provider;
    const entity = req.query.entity;
    const timeRange = req.query.timeRange || "30d";
    const dataType = req.query.dataType || "summary";
    
    // Validate provider
    if (!PROVIDERS[provider]) {
      context.res = {
        status: 400,
        body: { error: `Invalid provider: ${provider}. Valid options are: ${Object.keys(PROVIDERS).join(", ")}` }
      };
      return;
    }

    // Validate required parameters
    if (!entity) {
      context.res = {
        status: 400,
        body: { error: "Missing required parameter: entity" }
      };
      return;
    }

    // Check cache
    const cacheKey = `${provider}_${entity}_${dataType}_${timeRange}`;
    const cachedData = await checkCache(cacheKey);
    if (cachedData) {
      context.log.info(`Cache hit for ${cacheKey}`);
      context.res = {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: cachedData
      };
      return;
    }

    // Get API credentials from Key Vault
    const credential = new DefaultAzureCredential();
    const secretClient = new SecretClient(KEY_VAULT_URI, credential);
    const secretName = PROVIDERS[provider].keyVaultSecretName;
    const secretResponse = await secretClient.getSecret(secretName);
    const apiCredentials = secretResponse.value;

    // Prepare to make API call
    const providerConfig = PROVIDERS[provider];
    let apiUrl, requestOptions;

    // Build appropriate request for each provider
    switch(provider) {
      case 'bloomberg':
        apiUrl = `${providerConfig.baseUrl}/companies/search?query=${encodeURIComponent(entity)}`;
        requestOptions = {
          method: 'GET',
          headers: {
            ...providerConfig.headers,
            'Authorization': `Bearer ${apiCredentials}`
          }
        };
        break;

      case 'spglobal':
        apiUrl = `${providerConfig.baseUrl}/companies/${encodeURIComponent(entity)}/fundamentals`;
        requestOptions = {
          method: 'GET',
          headers: {
            ...providerConfig.headers,
            'x-api-key': apiCredentials
          }
        };
        break;

      case 'brandwatch':
        // Brandwatch requires OAuth token flow
        const tokenResponse = await fetch(`${providerConfig.baseUrl}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `grant_type=client_credentials&client_id=${apiCredentials.split(':')[0]}&client_secret=${apiCredentials.split(':')[1]}`
        });
        const tokenData = await tokenResponse.json();
        
        apiUrl = `https://api.brandwatch.com/projects/1234/brandmentions/summary?query=${encodeURIComponent(entity)}&startDate=${getFormattedDate(timeRange)}`;
        requestOptions = {
          method: 'GET',
          headers: {
            ...providerConfig.headers,
            'Authorization': `Bearer ${tokenData.access_token}`
          }
        };
        break;

      case 'crunchbase':
        apiUrl = `${providerConfig.baseUrl}/entities/organizations/${encodeURIComponent(entity.toLowerCase())}`;
        requestOptions = {
          method: 'GET',
          headers: {
            ...providerConfig.headers,
            'X-cb-user-key': apiCredentials
          }
        };
        break;

      default:
        throw new Error(`Provider ${provider} not implemented`);
    }

    // Make the API request
    context.log.info(`Requesting data from ${apiUrl}`);
    const response = await fetch(apiUrl, requestOptions);

    if (!response.ok) {
      throw new Error(`API error (${response.status}): ${await response.text()}`);
    }

    // Parse and transform the data
    const rawData = await response.json();
    
    // Save raw data to Bronze layer
    await saveToBronzeLayer(provider, entity, rawData);

    // Transform the data using provider-specific transformation
    const transformedData = providerConfig.transformFunction(rawData, entity, dataType);

    // Cache the transformed data
    await storeInCache(cacheKey, transformedData, CACHE_DURATION_SECONDS);

    // Return the transformed data
    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: transformedData
    };
  } catch (error) {
    context.log.error(`Error processing market data request: ${error.message}`);
    context.res = {
      status: 500,
      body: { error: `Error fetching market data: ${error.message}` }
    };
  }
};

/**
 * Check if data exists in cache
 * @param {string} key - Cache key
 * @returns {Promise<object|null>} - Cached data or null
 */
async function checkCache(key) {
  try {
    const credential = new DefaultAzureCredential();
    const blobServiceClient = new BlobServiceClient(
      `https://${STORAGE_ACCOUNT}.blob.core.windows.net`,
      credential
    );
    
    const containerClient = blobServiceClient.getContainerClient("cache");
    const blobClient = containerClient.getBlobClient(`market-data/${key}.json`);
    
    const blobExists = await blobClient.exists();
    if (!blobExists) {
      return null;
    }
    
    // Check if blob is expired
    const properties = await blobClient.getProperties();
    const createdTime = properties.createdOn || new Date(0);
    const now = new Date();
    const ageSeconds = (now.getTime() - createdTime.getTime()) / 1000;
    
    if (ageSeconds > CACHE_DURATION_SECONDS) {
      return null;
    }
    
    // Retrieve and parse the cached data
    const downloadResponse = await blobClient.download();
    const downloaded = await streamToString(downloadResponse.readableStreamBody);
    return JSON.parse(downloaded);
  } catch (error) {
    console.error(`Cache retrieval error: ${error.message}`);
    return null;
  }
}

/**
 * Store data in cache
 * @param {string} key - Cache key
 * @param {object} data - Data to cache
 * @param {number} expirySeconds - Cache expiry in seconds
 */
async function storeInCache(key, data, expirySeconds) {
  try {
    const credential = new DefaultAzureCredential();
    const blobServiceClient = new BlobServiceClient(
      `https://${STORAGE_ACCOUNT}.blob.core.windows.net`,
      credential
    );
    
    const containerClient = blobServiceClient.getContainerClient("cache");
    await containerClient.createIfNotExists();
    
    const blobClient = containerClient.getBlockBlobClient(`market-data/${key}.json`);
    const content = JSON.stringify(data);
    
    const options = {
      metadata: {
        expires: (Date.now() + (expirySeconds * 1000)).toString()
      }
    };
    
    await blobClient.upload(content, content.length, options);
  } catch (error) {
    console.error(`Cache storage error: ${error.message}`);
  }
}

/**
 * Save raw API response to Bronze layer
 * @param {string} provider - API provider
 * @param {string} entity - Entity being queried
 * @param {object} data - Raw API response
 */
async function saveToBronzeLayer(provider, entity, data) {
  try {
    const credential = new DefaultAzureCredential();
    const blobServiceClient = new BlobServiceClient(
      `https://${STORAGE_ACCOUNT}.blob.core.windows.net`,
      credential
    );
    
    const containerClient = blobServiceClient.getContainerClient(BRONZE_CONTAINER);
    
    // Use ISO date for partitioning
    const today = new Date().toISOString().split('T')[0];
    const blobPath = `market_intelligence/${provider}/${today}/${entity.toLowerCase()}_${Date.now()}.json`;
    
    const blobClient = containerClient.getBlockBlobClient(blobPath);
    const content = JSON.stringify(data);
    
    await blobClient.upload(content, content.length);
  } catch (error) {
    console.error(`Error saving to Bronze layer: ${error.message}`);
  }
}

/**
 * Helper to convert stream to string
 * @param {ReadableStream} readableStream - Stream to convert
 * @returns {Promise<string>} - Stream content
 */
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
      chunks.push(data.toString());
    });
    readableStream.on("end", () => {
      resolve(chunks.join(""));
    });
    readableStream.on("error", reject);
  });
}

/**
 * Get formatted date string for time range
 * @param {string} timeRange - Time range (e.g., "30d" for 30 days)
 * @returns {string} - Formatted date
 */
function getFormattedDate(timeRange) {
  const now = new Date();
  const days = parseInt(timeRange.replace(/[^0-9]/g, "")) || 30;
  const pastDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  return pastDate.toISOString().split('T')[0];
}

// Transformation functions for each provider

function transformBloombergData(data, entity, dataType) {
  // Basic transformation for Bloomberg data
  const result = {
    provider: "Bloomberg",
    entity: entity,
    retrievedAt: new Date().toISOString(),
    dataType: dataType
  };

  if (dataType === "summary") {
    if (data.results && data.results.length > 0) {
      const companyData = data.results[0];
      result.data = {
        name: companyData.name || entity,
        ticker: companyData.ticker || null,
        exchange: companyData.exchange || null,
        industry: companyData.industry || null,
        sector: companyData.sector || null,
        marketCap: companyData.marketCap || null,
        price: companyData.price || null,
        change: companyData.change || null,
        percentChange: companyData.percentChange || null
      };
    } else {
      result.data = { name: entity, message: "No data found" };
    }
  } else if (dataType === "financials") {
    // Extract financial metrics
    result.data = {
      revenue: extractFinancialMetric(data, "revenue"),
      netIncome: extractFinancialMetric(data, "netIncome"),
      eps: extractFinancialMetric(data, "eps"),
      peRatio: extractFinancialMetric(data, "peRatio")
    };
  }

  return result;
}

function transformSpGlobalData(data, entity, dataType) {
  // Basic transformation for S&P Global data
  const result = {
    provider: "S&P Global",
    entity: entity,
    retrievedAt: new Date().toISOString(),
    dataType: dataType
  };

  if (dataType === "summary") {
    result.data = {
      name: data.companyName || entity,
      industry: data.industry || null,
      subIndustry: data.subIndustry || null,
      region: data.region || null,
      country: data.country || null,
      marketCap: data.marketCap || null,
      creditRating: data.creditRating || null
    };
  } else if (dataType === "industry") {
    // Extract industry metrics
    result.data = {
      peers: Array.isArray(data.peers) ? data.peers.map(peer => ({
        name: peer.name,
        marketCap: peer.marketCap
      })) : [],
      industryMetrics: data.industryMetrics || {},
      industryTrends: data.industryTrends || {}
    };
  }

  return result;
}

function transformBrandwatchData(data, entity, dataType) {
  // Basic transformation for Brandwatch data
  const result = {
    provider: "Brandwatch",
    entity: entity,
    retrievedAt: new Date().toISOString(),
    dataType: dataType
  };

  if (dataType === "summary") {
    const mentions = data.mentions || { total: 0, positive: 0, negative: 0, neutral: 0 };
    const sentiment = mentions.total > 0 ? 
      ((mentions.positive / mentions.total) * 100).toFixed(1) : 0;
    
    result.data = {
      totalMentions: mentions.total,
      positiveMentions: mentions.positive,
      negativeMentions: mentions.negative,
      neutralMentions: mentions.neutral,
      sentimentScore: parseFloat(sentiment),
      topSources: data.topSources || [],
      topLocations: data.topLocations || []
    };
  } else if (dataType === "trends") {
    // Extract trend data
    result.data = {
      mentionsTrend: data.mentionsTrend || [],
      sentimentTrend: data.sentimentTrend || [],
      topHashtags: data.topHashtags || [],
      topInfluencers: data.topInfluencers || []
    };
  }

  return result;
}

function transformCrunchbaseData(data, entity, dataType) {
  // Basic transformation for Crunchbase data
  const result = {
    provider: "Crunchbase",
    entity: entity,
    retrievedAt: new Date().toISOString(),
    dataType: dataType
  };

  const properties = data.properties || {};

  if (dataType === "summary") {
    result.data = {
      name: properties.name || entity,
      description: properties.short_description || null,
      website: properties.website_url || null,
      founded: properties.founded_on || null,
      headquarters: properties.headquarters_locations?.[0]?.location_identifiers?.join(', ') || null,
      employeeCount: properties.employee_count || null,
      funding: properties.total_funding_usd || null,
      status: properties.status || null,
      categories: properties.categories?.map(c => c.category_name) || []
    };
  } else if (dataType === "funding") {
    // Extract funding rounds
    result.data = {
      totalFunding: properties.total_funding_usd || null,
      fundingRounds: data.funding_rounds?.map(round => ({
        date: round.announced_on,
        amount: round.money_raised_usd,
        series: round.investment_type,
        investors: round.investors?.map(inv => inv.name) || []
      })) || []
    };
  }

  return result;
}

// Helper function to extract financial metrics
function extractFinancialMetric(data, metricName) {
  if (!data.financials || !Array.isArray(data.financials)) {
    return null;
  }
  
  const financials = data.financials;
  const metric = financials.find(f => f.name === metricName);
  
  if (!metric) {
    return null;
  }
  
  return {
    value: metric.value,
    unit: metric.unit,
    period: metric.period
  };
}
# Sari-Sari Store SMS Advisory System

## Overview

The Sari-Sari Store SMS Advisory System provides micro-retailers with actionable business intelligence and inventory recommendations via SMS, helping them optimize operations while strengthening brand relationships as part of corporate social responsibility (CSR) initiatives.

## Business Value

| Stakeholder | Value Proposition |
|-------------|-------------------|
| **Sari-Sari Store Owners** | • Inventory optimization<br>• Sales trend insights<br>• Promotion awareness<br>• Reduced stockouts<br>• Business growth support |
| **Brands** | • Micro-retailer loyalty<br>• Last-mile market intelligence<br>• CSR impact metrics<br>• Rural market penetration<br>• Direct small business engagement |
| **Distributors** | • Optimized delivery routes<br>• Reduced returns<br>• Strengthened retailer relationships<br>• Improved forecasting<br>• Higher fill rates |
| **Consumers** | • Better product availability<br>• Access to promotions<br>• Improved shopping experience<br>• Community economic development |

## System Architecture

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Data Sources │────▶│ Advisory Core │────▶│ SMS Gateway   │
└───────────────┘     └───────────────┘     └───────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Market Intel │     │  Advisory AI  │     │ Telco Partners│
│  Proxy Signals│     │  Generation   │     │ Globe/Smart   │
└───────────────┘     └───────────────┘     └───────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────┐
│               Response Handling System                    │
├───────────────┬───────────────┬────────────┬─────────────┤
│ SMS Responses │   WhatsApp    │ USSD Codes │ Call Center │
└───────────────┴───────────────┴────────────┴─────────────┘
```

## Key Features

### 1. Inventory Advisory

SMS messages with inventory recommendations:

```
SMART STORE TIPS: Good AM Maria! 
Based on trends, your area may need 
more BRAND X COFFEE (₱7 size) this 
week. Sales up 15% in your barangay. 
Text ORDER to 2345 for distributor 
contact. Reply HELP for support.
```

### 2. Seasonal Trend Alerts

Proactive alerts for seasonal demand changes:

```
SMART STORE TIPS: Hi Juan! School 
opening next week. Consider stocking: 
1. Small notebooks (↑30%)
2. Pencils/pens (↑25%)
3. Juice drinks (↑20%)
Reply INFO for supplier contacts.
```

### 3. Promotion Awareness

Notification of brand promotions:

```
BRAND Y PROMO ALERT: Get 1 FREE case 
of Brand Y Soap for every 3 cases 
ordered this week! Your customers 
buy 20% more during promos. Valid 
May 15-20. Text ORDER to 2345 to 
participate.
```

### 4. Micro-Training Tips

Business advice in bite-sized format:

```
BUSINESS TIP #12: Track your 5 most 
sold items daily. Order when stock 
reaches half. This simple system 
increased profits by 12% for stores 
like yours! Reply MORE for additional 
tips.
```

### 5. Weather-Related Advisories

Preparation for weather impacts:

```
WEATHER ADVISORY: Heavy rain expected 
in your area next 3 days. Typically 
increases demand for: candles, instant 
noodles, canned goods. Consider adding 
to your inventory. Stay safe!
```

## Technical Implementation

### 1. SMS Gateway Integration

```javascript
/**
 * Send SMS advisory to store owner
 * @param {Object} store - Store information
 * @param {string} messageType - Type of advisory
 * @param {Object} data - Data for message
 */
async function sendSmsAdvisory(store, messageType, data) {
  try {
    // Generate message content
    const message = generateAdvisoryMessage(store, messageType, data);
    
    // Select SMS provider based on store owner's carrier
    const smsProvider = selectSmsProvider(store.phoneProvider);
    
    // Log advisory for tracking
    await logAdvisory(store.id, messageType, message);
    
    // Send via appropriate SMS gateway
    const result = await smsProvider.sendMessage({
      to: store.phoneNumber,
      message: message,
      senderId: 'STOREALERT',
      messageId: generateMessageId(store.id, messageType),
      callbackUrl: `${API_BASE_URL}/sms/callback`
    });
    
    // Track delivery status
    await trackMessageDelivery(result.messageId, 'sent');
    
    return {
      success: true,
      messageId: result.messageId,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`SMS Advisory Error: ${error.message}`);
    
    // Log failure
    await logError(store.id, messageType, error.message);
    
    return {
      success: false,
      error: error.message
    };
  }
}
```

### 2. Advisory Generation Engine

```javascript
/**
 * Generate inventory advisory for store
 * @param {string} storeId - Store identifier
 * @returns {Promise<Object>} Advisory data
 */
async function generateInventoryAdvisory(storeId) {
  // Get store information
  const store = await getStoreInfo(storeId);
  
  // Get regional trends from proxy signals
  const regionalTrends = await getRegionalTrends(store.region);
  
  // Get store's previous orders
  const storeOrders = await getStoreOrderHistory(storeId);
  
  // Get store's product mix
  const productMix = await getStoreProductMix(storeId);
  
  // Identify opportunities based on regional trends vs store inventory
  const opportunities = identifyInventoryOpportunities(
    regionalTrends,
    storeOrders,
    productMix
  );
  
  // Prioritize top opportunities
  const prioritizedOpportunities = prioritizeOpportunities(opportunities);
  
  // Select top recommendation
  const topRecommendation = prioritizedOpportunities[0];
  
  // Create advisory data
  return {
    store,
    recommendationType: 'inventory',
    productName: topRecommendation.productName,
    brandName: topRecommendation.brandName,
    skuSize: topRecommendation.skuSize,
    trendPercentage: topRecommendation.trendPercentage,
    reason: topRecommendation.reason,
    actionCode: `ORDER-${topRecommendation.productId}`
  };
}
```

### 3. Response Handling System

```javascript
/**
 * Process incoming SMS responses
 * @param {Object} request - SMS callback data
 * @returns {Promise<Object>} Response
 */
async function processIncomingSms(request) {
  try {
    const { from, text, messageId } = request;
    
    // Normalize message text
    const normalizedText = text.trim().toUpperCase();
    
    // Find the store by phone number
    const store = await findStoreByPhone(from);
    
    if (!store) {
      return {
        success: false,
        error: 'Store not found'
      };
    }
    
    // Find the original message this is responding to
    const originalMessage = await findOriginalMessage(messageId);
    
    // Process based on response keyword
    if (normalizedText.startsWith('ORDER')) {
      return await processOrderRequest(store, normalizedText, originalMessage);
    } 
    else if (normalizedText === 'HELP') {
      return await sendHelpInformation(store);
    }
    else if (normalizedText === 'INFO') {
      return await sendSupplierInformation(store, originalMessage);
    }
    else if (normalizedText === 'MORE') {
      return await sendAdditionalTips(store, originalMessage);
    }
    else if (normalizedText === 'STOP') {
      return await unsubscribeStore(store);
    }
    else {
      // Unknown command
      return await sendUnknownCommandResponse(store);
    }
  } catch (error) {
    console.error(`Error processing incoming SMS: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}
```

### 4. Store Filtering & Segmentation

```javascript
/**
 * Target stores for advisory campaign
 * @param {Object} campaign - Campaign configuration
 * @returns {Promise<Array>} Targeted stores
 */
async function targetStoresForCampaign(campaign) {
  // Start with base criteria
  let query = {
    isActive: true,
    subscribedToAdvisory: true
  };
  
  // Add region filter if specified
  if (campaign.regionFilter) {
    query.region = { $in: campaign.regionFilter };
  }
  
  // Add product filter if specified
  if (campaign.productFilter) {
    query.productMix = { $elemMatch: { id: { $in: campaign.productFilter } } };
  }
  
  // Add store size filter if specified
  if (campaign.storeSizeFilter) {
    query.storeSize = { $in: campaign.storeSizeFilter };
  }
  
  // Add store score filter if specified
  if (campaign.minStoreScore) {
    query.storeScore = { $gte: campaign.minStoreScore };
  }
  
  // Add last contact filter (avoid contacting too frequently)
  if (campaign.minDaysSinceLastContact) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - campaign.minDaysSinceLastContact);
    query.lastContactDate = { $lt: cutoffDate };
  }
  
  // Query stores
  const stores = await queryStores(query);
  
  // Apply advanced filtering (if needed)
  const filteredStores = campaign.advancedFiltering ? 
    applyAdvancedFiltering(stores, campaign) : stores;
  
  // Cap the number of stores if specified
  const cappedStores = campaign.maxStores ? 
    filteredStores.slice(0, campaign.maxStores) : filteredStores;
  
  return cappedStores;
}
```

### 5. Impact Measurement

```javascript
/**
 * Measure campaign impact
 * @param {string} campaignId - Campaign identifier
 * @returns {Promise<Object>} Impact metrics
 */
async function measureCampaignImpact(campaignId) {
  // Get campaign details
  const campaign = await getCampaignDetails(campaignId);
  
  // Get all advisories sent in this campaign
  const advisories = await getAdvisoriesByCampaign(campaignId);
  
  // Get response data
  const responses = await getResponsesForAdvisories(advisories.map(a => a.id));
  
  // Get order data (for stores that placed orders from this campaign)
  const orders = await getOrdersFromCampaign(campaignId);
  
  // Group stores by response type
  const storeGroups = groupStoresByResponse(advisories, responses);
  
  // Get baseline metrics (pre-campaign)
  const baselineMetrics = await getBaselineMetrics(campaign.targetStores);
  
  // Get post-campaign metrics
  const postCampaignMetrics = await getPostCampaignMetrics(campaign.targetStores);
  
  // Calculate metrics changes
  const metricChanges = calculateMetricChanges(baselineMetrics, postCampaignMetrics);
  
  // Calculate overall impact
  const impact = {
    // Engagement metrics
    deliveryRate: (advisories.filter(a => a.status === 'delivered').length / advisories.length) * 100,
    responseRate: (responses.length / advisories.length) * 100,
    orderConversionRate: (orders.length / advisories.length) * 100,
    
    // Business impact
    averageOrderValue: calculateAverageOrderValue(orders),
    totalOrderValue: calculateTotalOrderValue(orders),
    productMixChange: calculateProductMixChange(baselineMetrics.productMix, postCampaignMetrics.productMix),
    
    // Store segments
    storeSegmentImpact: calculateSegmentImpact(metricChanges, campaign.storeSegments),
    
    // ROI calculation
    campaignCost: calculateCampaignCost(campaign, advisories),
    estimatedROI: calculateEstimatedROI(calculateTotalOrderValue(orders), calculateCampaignCost(campaign, advisories))
  };
  
  return impact;
}
```

## Store Enrollment Process

### 1. Initial Recruitment

Distributor sales representatives enroll store owners during regular visits:
- Explain program benefits
- Collect store details (location, size, product mix)
- Register mobile number
- Obtain consent for SMS advisories

### 2. Self-Registration Via USSD

Store owners can self-register:
```
*123*STORE# (on Globe)
*808*STORE# (on Smart)
```

The USSD flow collects:
- Store name
- Owner name
- Location (barangay)
- Primary product categories
- Daily customer count

### 3. SMS Welcome Series

After registration, a 5-message welcome series:

**Day 1: Welcome**
```
Welcome to SMART STORE TIPS! You'll 
receive free inventory advice & 
business tips to help grow your 
store. Msg&data rates apply. Reply 
HELP anytime. Reply Y to confirm.
```

**Day 2: Program Explanation**
```
SMART STORE TIPS: We analyze trends 
from 5,000+ stores to help you stock 
what sells. 2 msgs/week, always free. 
Text ORDER for stock, HELP for support, 
or STOP to end msgs.
```

**Day 3: First Tip**
```
BUSINESS TIP #1: Want to sell more? 
Place best-selling products at eye 
level where customers easily see them. 
Stores using this tip report 8% higher 
sales! Reply MORE for next tip.
```

**Day 5: Inventory Advice**
```
INVENTORY ALERT: Stores in your area 
are selling more BRAND X SACHETS 
this month (+15%). Consider stocking 
more to meet customer demand. Text 
ORDER to connect with distributor.
```

**Day 7: Feedback Request**
```
How useful are these messages? Reply:
1: Very useful
2: Somewhat useful
3: Not useful
Your feedback helps us improve our 
service to you. Thank you!
```

## Advisory Types & Triggers

| Advisory Type | Trigger | Frequency | Example |
|---------------|---------|-----------|---------|
| **Inventory Opportunity** | Regional sales trend detected | Weekly | "Sales of BRAND X SOAP increased 20% in your area. Consider stocking more." |
| **Seasonal Preparation** | Upcoming seasonal event | Monthly | "Fiesta season starts next month. Increase snacks & drinks inventory by May 15." |
| **Weather Advisory** | Severe weather forecast | As needed | "Typhoon expected in 3 days. Stock up on candles, batteries, canned goods." |
| **New Product Alert** | Brand product launch | As needed | "New BRAND Y COFFEE (₱8) available from distributor. High demand expected." |
| **Business Education** | Scheduled in content calendar | Bi-weekly | "BUSINESS TIP: Keeping inventory records increased profits 15% for stores like yours." |
| **Promotion Alert** | Brand trade promotion | As needed | "Buy 10 cases of BRAND Z, get 1 free! Offer ends Sunday. Text ORDER to participate." |

## CSR Impact Measurement

### For Brands

Track contribution to UN Sustainable Development Goals:
- **SDG 1**: No Poverty (microenterprise support)
- **SDG 5**: Gender Equality (female store owner empowerment)
- **SDG 8**: Decent Work and Economic Growth (small business development)

### Metrics to Track

1. **Economic Impact**
   - Average revenue increase for participating stores
   - Reduction in stockout frequency
   - Increase in product variety

2. **Digital Inclusion**
   - Digital literacy improvement
   - First-time use of digital business tools
   - Technology adoption rate

3. **Business Knowledge**
   - Implementation of business practices
   - Increase in business confidence (survey)
   - Reference to advisory content in decision-making

4. **Community Impact**
   - Product availability in underserved areas
   - Local economic multiplier effect
   - Community resilience during disruptions

## Implementation Phases

### Phase 1: Pilot (2-3 months)
- Select 500 stores in 3 regions
- Implement basic advisory types
- Manual content generation
- SMS-only communication

### Phase 2: Expansion (3-6 months)
- Scale to 5,000 stores across 10 regions
- Add automated content generation
- Implement response handling
- Add WhatsApp channel option

### Phase 3: Full Deployment (6-12 months)
- National rollout to 50,000+ stores
- Fully automated advisory system
- Multi-channel communication
- Advanced analytics and impact measurement

## Budget Considerations

| Component | Setup Cost | Monthly Operational Cost |
|-----------|------------|--------------------------|
| SMS Gateway Integration | $5,000-$8,000 | $0.005-$0.02 per message |
| Advisory Engine Development | $15,000-$25,000 | $1,000-$2,000 |
| Store Database & Segmentation | $8,000-$12,000 | $500-$1,000 |
| Analytics & Reporting | $10,000-$15,000 | $800-$1,500 |
| Program Management | $5,000-$8,000 | $2,000-$4,000 |

Estimated cost per store per month: $0.50-$1.20

## Success Criteria

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Store Enrollment | 10,000 in Year 1 | Registration database |
| Message Delivery Rate | >95% | SMS gateway reports |
| Response Rate | >25% | Incoming message logs |
| Action Rate (ORDER/INFO) | >10% | Response tracking |
| Reported Sales Impact | >5% increase | Store surveys |
| Satisfaction Score | >8/10 | SMS feedback surveys |
| Brand Perception Lift | >15% | Before/after surveys |

## Brand Participation Model

### Option 1: Consortium Model
Multiple brands jointly fund the initiative, sharing costs and insights.

**Benefits:**
- Lower cost per brand
- Broader store coverage
- Higher message diversity

### Option 2: Brand-Specific Program
Individual brand operates program for stores carrying their products.

**Benefits:**
- Complete brand control
- Direct relationship with store owners
- Exclusive promotion opportunities

### Option 3: Hybrid Model
Base program funded by consortium with premium brand-specific messages.

**Benefits:**
- Cost efficiency of shared infrastructure
- Flexibility for brand-specific campaigns
- Tiered participation options

## Content Generation Approach

### Initial Content Library

Develop a starter library of:
- 50 inventory advisory templates
- 30 business education tips
- 20 seasonal preparation advisories
- 15 weather-related advisory templates
- 10 promotional message templates

### AI-Assisted Content Generation

Use AI to personalize advisories based on:
- Store profile (size, location, history)
- Current market trends from proxy signals
- Weather forecasts
- Seasonal events
- Store performance data

```javascript
/**
 * Generate personalized message content
 * @param {Object} storeData - Store information
 * @param {Object} marketData - Market trend data
 * @param {string} templateType - Type of message
 * @returns {string} Personalized message
 */
function generatePersonalizedMessage(storeData, marketData, templateType) {
  // Select appropriate template
  const template = selectTemplate(templateType, storeData.region);
  
  // Get store-specific variables
  const storeVariables = {
    ownerName: storeData.ownerName,
    storeName: storeData.storeName,
    region: storeData.region,
    topProducts: storeData.topProducts.slice(0, 3),
    lastOrderDate: formatDate(storeData.lastOrderDate)
  };
  
  // Get market trend variables
  const marketVariables = {
    trendingProducts: marketData.trendingProducts.slice(0, 3),
    topGrowthCategory: marketData.topGrowthCategory,
    localEvents: marketData.localEvents,
    weatherForecast: marketData.weatherForecast
  };
  
  // Personalize message by replacing variables in template
  let message = template;
  
  // Replace store variables
  Object.entries(storeVariables).forEach(([key, value]) => {
    message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  
  // Replace market variables
  Object.entries(marketVariables).forEach(([key, value]) => {
    message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  
  // Ensure message is within SMS length limits (160 chars)
  if (message.length > 160) {
    message = truncateToSmsLength(message);
  }
  
  return message;
}
```

---

This blueprint provides a comprehensive framework for implementing an SMS Advisory System for sari-sari store owners as part of brand CSR activities, leveraging existing market intelligence data to provide valuable business insights to micro-retailers while strengthening brand relationships at the last mile of distribution.
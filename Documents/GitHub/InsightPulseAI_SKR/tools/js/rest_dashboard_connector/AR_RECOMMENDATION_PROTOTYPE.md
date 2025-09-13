# AR Recommendation System Prototype

This document outlines the prototype implementation for the in-store Augmented Reality recommendation system using proxy signals.

## System Overview

The AR Recommendation System creates an interactive shopping experience by overlaying product information, availability signals, and personalized recommendations directly in the user's field of view as they browse store shelves.

![AR System Architecture](https://via.placeholder.com/800x400?text=AR+System+Architecture)

## Core Components

### 1. Mobile Application

**Platform Options:**
- Cross-platform (React Native with Viro AR)
- Native iOS (ARKit)
- Native Android (ARCore)

**Key Features:**
- Camera-based product detection
- Real-time AR overlay
- Personalized recommendations
- Shelf availability indicators
- Product comparison
- Wayfinding to related products
- Social proof integration

### 2. Product Recognition

**Recognition Approaches:**
1. **Image-based Recognition**: 
   - Detects products based on packaging
   - Works with traditional retail shelves
   - Requires large training dataset

2. **Marker-assisted Recognition**:
   - Uses subtle shelf markers (for testing/initial deployment)
   - More reliable than pure image recognition
   - Requires store cooperation for deployment

3. **Hybrid Approach**:
   - Combines markers for location/section
   - Uses image recognition for specific products
   - Best balance of accuracy and deployment ease

**Recognition Flow:**
```
Camera Feed → Image Processing → Product Detection → Position Tracking → AR Anchor Creation
```

### 3. Proxy Signal Integration

The AR system leverages the same proxy signals for inventory that power our dashboards:

**Availability Signals:**
- Social media mentions of stock status
- Foot traffic patterns
- Visual shelf analysis
- Search trend data
- Review volume trends

**Integration Points:**
- Real-time API access to proxy signal aggregator
- Local caching for offline functionality
- Periodic updates based on location

### 4. Recommendation Engine

**Recommendation Factors:**
- Product the user is currently viewing
- User's purchase history (if available)
- Product complementarity
- Trending items
- Current promotions
- Estimated availability
- User preferences

**Algorithm Types:**
- Collaborative filtering
- Content-based filtering
- Knowledge-based recommendations
- Hybrid approaches

## Technical Implementation

### Mobile App Frontend (React Native)

```javascript
// Key components structure
import React, { useState, useEffect } from 'react';
import { ViroARScene, ViroARSceneNavigator, ViroNode, ViroText, ViroImage } from '@viro-community/react-viro';

// AR Scene component for product detection and overlay
const ARProductScene = () => {
  const [detectedProducts, setDetectedProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Process camera frames for product detection
  const onARFrameUpdate = (frame) => {
    if (isProcessing) return;
    
    // Process every 10th frame for performance
    if (frame.frameNumber % 10 === 0) {
      setIsProcessing(true);
      
      // Detect products in the current frame
      detectProducts(frame.image)
        .then(products => {
          setDetectedProducts(products);
          // Fetch recommendations for detected products
          return fetchRecommendations(products);
        })
        .then(recs => {
          setRecommendations(recs);
        })
        .finally(() => {
          setIsProcessing(false);
        });
    }
  };
  
  // Render AR overlays for each detected product
  const renderProductOverlays = () => {
    return detectedProducts.map((product, index) => (
      <ViroNode
        key={`product-${index}`}
        position={product.position}
        rotation={product.rotation}
        scale={[0.5, 0.5, 0.5]}>
        
        {/* Product info card */}
        <ViroImage
          source={require('./assets/product-card.png')}
          width={1.5}
          height={0.8}
          position={[0, 0.4, 0]}
        />
        
        {/* Product name */}
        <ViroText
          text={product.name}
          width={2}
          height={0.5}
          position={[0, 0.6, 0]}
          style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center' }}
        />
        
        {/* Availability indicator */}
        <ViroText
          text={`Availability: ${product.availabilityText}`}
          width={2}
          height={0.5}
          position={[0, 0.4, 0]}
          style={{ 
            fontSize: 12, 
            textAlign: 'center',
            color: getAvailabilityColor(product.availabilityScore)
          }}
        />
        
        {/* Price */}
        <ViroText
          text={`₱${product.price}`}
          width={2}
          height={0.5}
          position={[0, 0.2, 0]}
          style={{ fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}
        />
        
        {/* Recommendation button */}
        <ViroImage
          source={require('./assets/recommendation-button.png')}
          width={0.4}
          height={0.4}
          position={[0.5, 0.2, 0]}
          onClick={() => showRecommendations(product.id)}
        />
      </ViroNode>
    ));
  };
  
  // Render the AR scene
  return (
    <ViroARScene onTrackingUpdated={onARFrameUpdate}>
      {renderProductOverlays()}
      {/* Recommendation panels appear when a product is selected */}
      {recommendations.length > 0 && renderRecommendationPanel()}
    </ViroARScene>
  );
};

// Main app component
const ARShoppingApp = () => {
  return (
    <ViroARSceneNavigator
      initialScene={{
        scene: ARProductScene,
      }}
      style={{ flex: 1 }}
    />
  );
};

export default ARShoppingApp;
```

### Backend API (Azure Functions)

```javascript
// Product Recognition API
module.exports = async function (context, req) {
  try {
    // Get image data from request
    const imageBase64 = req.body && req.body.image;
    if (!imageBase64) {
      context.res = {
        status: 400,
        body: { error: "Missing image data" }
      };
      return;
    }
    
    // Decode image
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    
    // Detect products using Computer Vision
    const recognizedProducts = await detectProductsInImage(imageBuffer);
    
    // Get availability signals for detected products
    const productsWithAvailability = await enrichWithAvailabilityData(
      recognizedProducts,
      req.body.storeId,
      req.body.location
    );
    
    // Return enriched product data
    context.res = {
      status: 200,
      body: {
        products: productsWithAvailability
      }
    };
  } catch (error) {
    context.log.error(`Error processing image: ${error.message}`);
    context.res = {
      status: 500,
      body: { error: `Failed to process image: ${error.message}` }
    };
  }
};
```

### Recommendation API (Azure Functions)

```javascript
// Recommendation API
module.exports = async function (context, req) {
  try {
    // Get product IDs from request
    const productIds = req.body && req.body.productIds;
    const userId = req.body && req.body.userId;
    const storeId = req.body && req.body.storeId;
    
    if (!productIds || !productIds.length) {
      context.res = {
        status: 400,
        body: { error: "Missing product IDs" }
      };
      return;
    }
    
    // Get recommendations based on products, user, and store
    const recommendations = await getRecommendations(
      productIds,
      userId,
      storeId
    );
    
    // Enrich recommendations with availability data
    const enrichedRecommendations = await enrichWithAvailabilityData(
      recommendations,
      storeId
    );
    
    // Return recommendations
    context.res = {
      status: 200,
      body: {
        recommendations: enrichedRecommendations
      }
    };
  } catch (error) {
    context.log.error(`Error getting recommendations: ${error.message}`);
    context.res = {
      status: 500,
      body: { error: `Failed to get recommendations: ${error.message}` }
    };
  }
};

// Get product recommendations
async function getRecommendations(productIds, userId, storeId) {
  // Combine multiple recommendation techniques
  const [
    contentBasedRecs,
    collaborativeRecs,
    personalizedRecs,
    availabilityRecs
  ] = await Promise.all([
    getContentBasedRecommendations(productIds),
    getCollaborativeRecommendations(productIds),
    userId ? getPersonalizedRecommendations(userId, productIds) : [],
    getAvailabilityBasedRecommendations(storeId, productIds)
  ]);
  
  // Blend recommendations with weighted scoring
  const blendedRecs = blendRecommendations(
    contentBasedRecs,
    collaborativeRecs,
    personalizedRecs,
    availabilityRecs
  );
  
  return blendedRecs.slice(0, 5); // Return top 5 recommendations
}
```

## Automated Reporting & Delivery

### Report Types

1. **Store Manager Reports**
   - Generated daily at closing
   - Includes AR engagement metrics
   - Highlights inventory discrepancies
   - Recommends shelf adjustments

2. **Brand Performance Reports**
   - Weekly generation schedule
   - AR vs Non-AR engagement comparison
   - Share of shelf vs share of recommendation
   - Impact of availability on recommendations

3. **Recommendation Effectiveness**
   - Biweekly generation
   - Conversion rates of AR recommendations
   - A/B testing results
   - Recommendation algorithm performance

### Report Delivery System

```javascript
// Automated report generation and delivery
module.exports = async function (context, myTimer) {
  const timeStamp = new Date().toISOString();
  context.log(`Report generation timer triggered at ${timeStamp}`);
  
  try {
    // Determine which reports to generate today
    const reportsToGenerate = determineReportsForToday();
    
    // Generate each report
    const generatedReports = await Promise.all(
      reportsToGenerate.map(async report => {
        context.log(`Generating ${report.type} report for ${report.scope}`);
        
        // Gather report data
        const reportData = await gatherReportData(report);
        
        // Generate report in specified format
        const reportContent = await generateReport(report.type, reportData, report.format);
        
        // Return report metadata
        return {
          id: generateReportId(),
          type: report.type,
          scope: report.scope,
          format: report.format,
          content: reportContent,
          timestamp: timeStamp,
          recipients: report.recipients
        };
      })
    );
    
    // Deliver reports to recipients
    const deliveryResults = await Promise.all(
      generatedReports.map(report => 
        deliverReport(report)
      )
    );
    
    // Log results
    context.log(`Generated and delivered ${generatedReports.length} reports`);
    context.log(`Delivery results: ${JSON.stringify(deliveryResults)}`);
  } catch (error) {
    context.log.error(`Error generating reports: ${error.message}`);
  }
};

// Deliver report to recipients
async function deliverReport(report) {
  const deliveryResults = [];
  
  // For each recipient
  for (const recipient of report.recipients) {
    try {
      // Determine delivery method(s)
      const deliveryMethods = recipient.deliveryMethods || ['email'];
      
      // Deliver via each method
      for (const method of deliveryMethods) {
        switch (method) {
          case 'email':
            await sendReportByEmail(report, recipient);
            break;
          case 'teams':
            await postReportToTeams(report, recipient);
            break;
          case 'dashboard':
            await publishReportToDashboard(report, recipient);
            break;
        }
      }
      
      deliveryResults.push({
        recipient: recipient.id,
        status: 'success'
      });
    } catch (error) {
      deliveryResults.push({
        recipient: recipient.id,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  return deliveryResults;
}
```

## Prototype Roadmap

### Phase 1: POC (4-6 weeks)
- Develop basic AR product recognition
- Implement simple overlay UI
- Connect to proxy signals API
- Test in controlled environment

### Phase 2: Internal Testing (6-8 weeks)
- Add store navigation support
- Implement recommendation engine
- Create reporting framework
- Test with field agents in select stores

### Phase 3: Limited Pilot (8-10 weeks)
- Deploy to 3-5 test stores
- Collect user feedback
- Refine UI/UX based on usage
- Optimize performance and accuracy

### Phase 4: Refined Prototype (10-12 weeks)
- Add personalization features
- Implement A/B testing framework
- Connect to loyalty program
- Deploy to 10-15 stores

## Prototype Success Metrics

| Metric | Target | Method |
|--------|--------|--------|
| Product Recognition Accuracy | >85% | Manual validation |
| Time to Recognize | <1.5s | Performance testing |
| UI Response Time | <250ms | Performance testing |
| User Session Length | >2min | App analytics |
| Recommendation CTR | >15% | App analytics |
| Report Delivery Success | >99% | System logs |

## Technical Requirements

- iOS 14+ or Android 9+
- Device with ARKit/ARCore support
- Azure Function consumption plan
- Azure Cognitive Services (Custom Vision)
- Azure Storage Account (Blob Storage)
- Azure App Service (Web API)
- Power BI Pro (for reporting)

## Data Privacy Considerations

- Camera data processed on-device where possible
- No images stored without explicit consent
- User preferences stored with consent only
- Anonymized analytics for product improvement
- Clear privacy policy in app and website
- Data retention policies enforced

---

This prototype blueprint provides the foundation for developing the AR recommendation system that leverages our existing proxy signals for retail performance.
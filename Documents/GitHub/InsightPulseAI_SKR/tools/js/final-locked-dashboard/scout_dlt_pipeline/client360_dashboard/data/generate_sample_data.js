/**
 * Sample Data Generator for Client360 Dashboard Testing
 * 
 * This script generates 100 sample records for various tables in the database
 * to support smoke and unit testing.
 */

const fs = require('fs');
const path = require('path');

// Utility functions
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};
const formatDate = (date) => {
  return date.toISOString().replace('T', ' ').substring(0, 19);
};

// Data arrays for randomization
const brandNames = [
  'Mega Brand', 'Super Clean', 'Quick Snack', 'Fresh Foods', 'Sparkle', 
  'Golden Foods', 'Tasty Treats', 'Natural Choice', 'Pure Products', 'Royal Goods',
  'Ultra Care', 'Premium Select', 'Sunshine', 'Silver Line', 'Morning Fresh',
  'Tropical Delight', 'Family Choice', 'Value Pack', 'Island Breeze', 'Daily Essentials'
];

const categories = [
  'Food', 'Beverage', 'Cleaning', 'Personal Care', 'Household',
  'Snacks', 'Dairy', 'Canned Goods', 'Frozen', 'Baking',
  'Health', 'Beauty', 'Baby Care', 'Pet Care', 'Paper Products'
];

const productNames = [
  'Dish Soap', 'Laundry Detergent', 'Shampoo', 'Toothpaste', 'Coffee',
  'Tea', 'Cookies', 'Crackers', 'Milk', 'Bread', 'Cereal', 'Rice',
  'Pasta', 'Canned Tuna', 'Canned Beans', 'Soap', 'Body Wash',
  'Toilet Paper', 'Paper Towels', 'Facial Tissue', 'Baby Wipes',
  'Diapers', 'Dog Food', 'Cat Food', 'Soft Drink', 'Juice', 'Water',
  'Chips', 'Candy', 'Chocolate', 'Ice Cream', 'Yogurt', 'Cheese',
  'Butter', 'Eggs', 'Frozen Pizza', 'Frozen Vegetables', 'Flour',
  'Sugar', 'Salt', 'Pepper', 'Cooking Oil', 'Vinegar', 'Soy Sauce',
  'Ketchup', 'Mustard', 'Mayonnaise', 'Jam', 'Peanut Butter', 'Honey'
];

const storeNames = [
  'Central Store', 'Downtown Market', 'Neighborhood Mart', 'Family Grocery', 'Quick Shop',
  'Super Saver', 'Value Mart', 'Fresh Market', 'Corner Store', 'Daily Needs',
  'Local Grocer', 'Community Store', 'Main Street Market', 'Village Shop', 'Express Mart'
];

const locations = [
  'Manila', 'Quezon City', 'Cebu', 'Davao', 'Makati', 
  'Pasig', 'Taguig', 'Pasay', 'Paranaque', 'Mandaluyong',
  'Caloocan', 'Las Piñas', 'Muntinlupa', 'Valenzuela', 'Navotas'
];

const storeSizes = ['Small', 'Medium', 'Large', 'Extra Large'];
const emotions = ['Happy', 'Neutral', 'Interested', 'Satisfied', 'Thoughtful', 'Surprised', 'Concerned'];
const genders = ['Male', 'Female', 'Other', 'Unknown'];
const deviceIDs = Array.from({length: 10}, (_, i) => `DEVICE-${1000 + i}`);
const eventTypes = ['Startup', 'Shutdown', 'Connection', 'Disconnection', 'Error', 'Warning', 'Status', 'Heartbeat'];
const detectedObjects = ['Person', 'Product', 'Shelf', 'Display', 'Cart', 'Basket', 'Cash Register', 'Door', 'Window'];
const requestMethods = ['Direct Request', 'Comparison', 'Inquiry', 'Recommendation', 'Price Check', 'Availability Check'];

// Generate sample stores
const generateStores = (count) => {
  const stores = [];
  for (let i = 1; i <= count; i++) {
    stores.push({
      StoreID: i,
      StoreName: `${randomChoice(storeNames)} #${i}`,
      Location: randomChoice(locations),
      Size: randomChoice(storeSizes),
      GeoLatitude: randomFloat(14.4, 14.8, 6),
      GeoLongitude: randomFloat(120.9, 121.1, 6),
      ManagerName: `Manager ${i}`,
      ManagerContactInfo: `manager${i}@example.com`,
      DeviceName: `Store Device ${i}`,
      DeviceID: randomChoice(deviceIDs)
    });
  }
  return stores;
};

// Generate sample brands
const generateBrands = (count) => {
  const brands = [];
  for (let i = 1; i <= count; i++) {
    brands.push({
      BrandID: i,
      BrandName: brandNames[i - 1] || `Brand ${i}`,
      Category: randomChoice(categories),
      Variations: JSON.stringify([`${brandNames[i - 1] || `Brand ${i}`} Original`, `${brandNames[i - 1] || `Brand ${i}`} Extra`]),
      IsMonitored: Math.random() > 0.3 ? 1 : 0
    });
  }
  return brands;
};

// Generate sample products
const generateProducts = (count, brandCount) => {
  const products = [];
  for (let i = 1; i <= count; i++) {
    products.push({
      ProductID: i,
      ProductName: productNames[i - 1] || `Product ${i}`,
      Category: randomChoice(categories),
      Aliases: JSON.stringify([`${productNames[i - 1] || `Product ${i}`} Alt`, `${productNames[i - 1] || `Product ${i}`} 2`]),
      BrandID: randomInt(1, brandCount)
    });
  }
  return products;
};

// Generate sample customers
const generateCustomers = (count) => {
  const customers = [];
  for (let i = 1; i <= count; i++) {
    const facialID = `FACE-${1000 + i}`;
    customers.push({
      FacialID: facialID,
      Age: randomInt(18, 75),
      Gender: randomChoice(genders),
      Emotion: randomChoice(emotions),
      LastUpdateDate: formatDate(randomDate(new Date(2025, 0, 1), new Date()))
    });
  }
  return customers;
};

// Generate sample interactions
const generateInteractions = (count, storeCount, productCount) => {
  const interactions = [];
  for (let i = 1; i <= count; i++) {
    const interactionID = `INT-${10000 + i}`;
    const transactionDate = randomDate(new Date(2025, 0, 1), new Date());
    
    interactions.push({
      InteractionID: interactionID,
      StoreID: randomInt(1, storeCount),
      ProductID: randomInt(1, productCount),
      TransactionDate: formatDate(transactionDate),
      DeviceID: randomChoice(deviceIDs),
      FacialID: `FACE-${1000 + randomInt(1, 50)}`,
      Gender: randomChoice(genders),
      Age: randomInt(18, 75),
      EmotionalState: randomChoice(emotions),
      TranscriptionText: `Customer asking about ${randomChoice(productNames)}. ${Math.random() > 0.5 ? 'Mentioned price comparison.' : 'Asked about promotions.'}`
    });
  }
  return interactions;
};

// Generate sample transaction items
const generateTransactionItems = (interactionCount, productCount) => {
  const items = [];
  let itemId = 1;
  
  for (let i = 1; i <= interactionCount; i++) {
    const interactionID = `INT-${10000 + i}`;
    const itemCount = randomInt(1, 5);
    
    for (let j = 0; j < itemCount; j++) {
      items.push({
        TransactionItemID: itemId++,
        InteractionID: interactionID,
        ProductID: randomInt(1, productCount),
        Quantity: randomInt(1, 5),
        UnitPrice: randomFloat(10, 500, 2),
        RequestSequence: j,
        RequestMethod: randomChoice(requestMethods)
      });
    }
  }
  
  return items;
};

// Generate device logs
const generateDeviceLogs = (count, storeCount) => {
  const logs = [];
  for (let i = 1; i <= count; i++) {
    logs.push({
      LogID: i,
      DeviceID: randomChoice(deviceIDs),
      StoreID: randomInt(1, storeCount),
      EventTimestamp: formatDate(randomDate(new Date(2025, 0, 1), new Date())),
      EventType: randomChoice(eventTypes),
      Payload: JSON.stringify({
        status: Math.random() > 0.8 ? 'error' : 'success',
        details: `Event details for log ${i}`,
        value: randomInt(0, 100)
      })
    });
  }
  return logs;
};

// Generate vision detections
const generateVisionDetections = (count, storeCount) => {
  const detections = [];
  for (let i = 1; i <= count; i++) {
    detections.push({
      DetectionID: i,
      StoreID: randomInt(1, storeCount),
      DeviceID: randomChoice(deviceIDs),
      Timestamp: formatDate(randomDate(new Date(2025, 0, 1), new Date())),
      DetectedObject: randomChoice(detectedObjects),
      Confidence: randomFloat(0.5, 1.0, 4),
      ImageURL: `https://storage.example.com/images/detection-${i}.jpg`
    });
  }
  return detections;
};

// Generate transcriptions
const generateTranscriptions = (count, storeCount) => {
  const transcriptions = [];
  for (let i = 1; i <= count; i++) {
    transcriptions.push({
      TranscriptID: i,
      StoreID: randomInt(1, storeCount),
      FacialID: `FACE-${1000 + randomInt(1, 50)}`,
      DeviceID: randomChoice(deviceIDs),
      Timestamp: formatDate(randomDate(new Date(2025, 0, 1), new Date())),
      TranscriptText: `${randomChoice([
        "I'm looking for",
        "Do you have",
        "Where can I find",
        "How much is",
        "Is this on sale"
      ])} ${randomChoice(productNames)}? ${randomChoice([
        "Thank you.",
        "I appreciate your help.",
        "I'll take that.",
        "That's all I needed.",
        "Let me think about it."
      ])}`,
      AudioURL: `https://storage.example.com/audio/transcript-${i}.wav`,
      Language: 'en-PH'
    });
  }
  return transcriptions;
};

// Generate session matches
const generateSessionMatches = (count, interactionCount, transcriptionCount, detectionCount) => {
  const matches = [];
  for (let i = 1; i <= count; i++) {
    const interactionID = `INT-${10000 + randomInt(1, interactionCount)}`;
    
    matches.push({
      SessionMatchID: i,
      InteractionID: interactionID,
      TranscriptID: randomInt(1, transcriptionCount),
      DetectionID: randomInt(1, detectionCount),
      MatchConfidence: randomFloat(0.6, 1.0, 4),
      TimeOffsetMs: randomInt(0, 5000),
      MatchMethod: 'TimestampCorrelation',
      CreatedAt: formatDate(new Date())
    });
  }
  return matches;
};

// Generate sales interaction brands
const generateSalesInteractionBrands = (count, brandCount) => {
  const interactionBrands = [];
  for (let i = 1; i <= count; i++) {
    const interactionID = `INT-${10000 + randomInt(1, 100)}`;
    
    interactionBrands.push({
      BrandID: randomInt(1, brandCount),
      InteractionID: interactionID,
      BrandName: brandNames[randomInt(0, brandNames.length - 1)],
      Confidence: randomFloat(0.7, 1.0, 4),
      Source: randomChoice(['Audio', 'Visual', 'Combined']),
      CreatedAt: formatDate(new Date())
    });
  }
  return interactionBrands;
};

// Generate all data
const generateAllData = () => {
  const storeCount = 15;
  const brandCount = 20;
  const productCount = 50;
  const customerCount = 50;
  const interactionCount = 100;
  const logCount = 100;
  const detectionCount = 100;
  const transcriptionCount = 100;
  const sessionMatchCount = 100;
  const interactionBrandCount = 100;
  
  const data = {
    stores: generateStores(storeCount),
    brands: generateBrands(brandCount),
    products: generateProducts(productCount, brandCount),
    customers: generateCustomers(customerCount),
    interactions: generateInteractions(interactionCount, storeCount, productCount),
    transactionItems: generateTransactionItems(interactionCount, productCount),
    deviceLogs: generateDeviceLogs(logCount, storeCount),
    visionDetections: generateVisionDetections(detectionCount, storeCount),
    transcriptions: generateTranscriptions(transcriptionCount, storeCount),
    sessionMatches: generateSessionMatches(sessionMatchCount, interactionCount, transcriptionCount, detectionCount),
    salesInteractionBrands: generateSalesInteractionBrands(interactionBrandCount, brandCount)
  };
  
  return data;
};

// Generate SQL INSERT statements
const generateSqlInserts = (data) => {
  let sql = '';
  
  // Stores
  sql += 'DELETE FROM dbo.Stores;\n';
  sql += 'GO\n\n';
  sql += 'SET IDENTITY_INSERT dbo.Stores ON;\n';
  sql += 'GO\n\n';
  data.stores.forEach(store => {
    sql += `INSERT INTO dbo.Stores (StoreID, StoreName, Location, Size, GeoLatitude, GeoLongitude, ManagerName, ManagerContactInfo, DeviceName, DeviceID) VALUES (
      ${store.StoreID}, 
      N'${store.StoreName}', 
      N'${store.Location}', 
      N'${store.Size}', 
      ${store.GeoLatitude}, 
      ${store.GeoLongitude}, 
      N'${store.ManagerName}', 
      N'${store.ManagerContactInfo}', 
      N'${store.DeviceName}', 
      N'${store.DeviceID}');\n`;
  });
  sql += '\nSET IDENTITY_INSERT dbo.Stores OFF;\n';
  sql += 'GO\n\n';
  
  // Brands
  sql += 'DELETE FROM dbo.Brands;\n';
  sql += 'GO\n\n';
  sql += 'SET IDENTITY_INSERT dbo.Brands ON;\n';
  sql += 'GO\n\n';
  data.brands.forEach(brand => {
    sql += `INSERT INTO dbo.Brands (BrandID, BrandName, Category, Variations, IsMonitored) VALUES (
      ${brand.BrandID}, 
      N'${brand.BrandName}', 
      N'${brand.Category}', 
      N'${brand.Variations}', 
      ${brand.IsMonitored});\n`;
  });
  sql += '\nSET IDENTITY_INSERT dbo.Brands OFF;\n';
  sql += 'GO\n\n';
  
  // Products
  sql += 'DELETE FROM dbo.Products;\n';
  sql += 'GO\n\n';
  sql += 'SET IDENTITY_INSERT dbo.Products ON;\n';
  sql += 'GO\n\n';
  data.products.forEach(product => {
    sql += `INSERT INTO dbo.Products (ProductID, ProductName, Category, Aliases, BrandID) VALUES (
      ${product.ProductID}, 
      N'${product.ProductName}', 
      N'${product.Category}', 
      N'${product.Aliases}', 
      ${product.BrandID});\n`;
  });
  sql += '\nSET IDENTITY_INSERT dbo.Products OFF;\n';
  sql += 'GO\n\n';
  
  // Customers
  sql += 'DELETE FROM dbo.Customers;\n';
  sql += 'GO\n\n';
  data.customers.forEach(customer => {
    sql += `INSERT INTO dbo.Customers (FacialID, Age, Gender, Emotion, LastUpdateDate) VALUES (
      N'${customer.FacialID}', 
      ${customer.Age}, 
      N'${customer.Gender}', 
      N'${customer.Emotion}', 
      '${customer.LastUpdateDate}');\n`;
  });
  sql += 'GO\n\n';
  
  // Sales Interactions
  sql += 'DELETE FROM dbo.SalesInteractions;\n';
  sql += 'GO\n\n';
  data.interactions.forEach(interaction => {
    sql += `INSERT INTO dbo.SalesInteractions (InteractionID, StoreID, ProductID, TransactionDate, DeviceID, FacialID, Gender, Age, EmotionalState, TranscriptionText) VALUES (
      '${interaction.InteractionID}', 
      ${interaction.StoreID}, 
      ${interaction.ProductID}, 
      '${interaction.TransactionDate}', 
      N'${interaction.DeviceID}', 
      N'${interaction.FacialID}', 
      N'${interaction.Gender}', 
      ${interaction.Age}, 
      N'${interaction.EmotionalState}', 
      N'${interaction.TranscriptionText}');\n`;
  });
  sql += 'GO\n\n';
  
  // Transaction Items
  sql += 'DELETE FROM dbo.TransactionItems;\n';
  sql += 'GO\n\n';
  sql += 'SET IDENTITY_INSERT dbo.TransactionItems ON;\n';
  sql += 'GO\n\n';
  data.transactionItems.forEach(item => {
    sql += `INSERT INTO dbo.TransactionItems (TransactionItemID, InteractionID, ProductID, Quantity, UnitPrice, RequestSequence, RequestMethod) VALUES (
      ${item.TransactionItemID}, 
      '${item.InteractionID}', 
      ${item.ProductID}, 
      ${item.Quantity}, 
      ${item.UnitPrice}, 
      ${item.RequestSequence}, 
      '${item.RequestMethod}');\n`;
  });
  sql += '\nSET IDENTITY_INSERT dbo.TransactionItems OFF;\n';
  sql += 'GO\n\n';
  
  // Device Logs
  sql += 'DELETE FROM dbo.bronze_device_logs;\n';
  sql += 'GO\n\n';
  sql += 'SET IDENTITY_INSERT dbo.bronze_device_logs ON;\n';
  sql += 'GO\n\n';
  data.deviceLogs.forEach(log => {
    sql += `INSERT INTO dbo.bronze_device_logs (LogID, DeviceID, StoreID, EventTimestamp, EventType, Payload) VALUES (
      ${log.LogID}, 
      '${log.DeviceID}', 
      ${log.StoreID}, 
      '${log.EventTimestamp}', 
      '${log.EventType}', 
      N'${log.Payload}');\n`;
  });
  sql += '\nSET IDENTITY_INSERT dbo.bronze_device_logs OFF;\n';
  sql += 'GO\n\n';
  
  // Vision Detections
  sql += 'DELETE FROM dbo.bronze_vision_detections;\n';
  sql += 'GO\n\n';
  sql += 'SET IDENTITY_INSERT dbo.bronze_vision_detections ON;\n';
  sql += 'GO\n\n';
  data.visionDetections.forEach(detection => {
    sql += `INSERT INTO dbo.bronze_vision_detections (DetectionID, StoreID, DeviceID, Timestamp, DetectedObject, Confidence, ImageURL) VALUES (
      ${detection.DetectionID}, 
      ${detection.StoreID}, 
      '${detection.DeviceID}', 
      '${detection.Timestamp}', 
      N'${detection.DetectedObject}', 
      ${detection.Confidence}, 
      N'${detection.ImageURL}');\n`;
  });
  sql += '\nSET IDENTITY_INSERT dbo.bronze_vision_detections OFF;\n';
  sql += 'GO\n\n';
  
  // Transcriptions
  sql += 'DELETE FROM dbo.bronze_transcriptions;\n';
  sql += 'GO\n\n';
  sql += 'SET IDENTITY_INSERT dbo.bronze_transcriptions ON;\n';
  sql += 'GO\n\n';
  data.transcriptions.forEach(transcript => {
    sql += `INSERT INTO dbo.bronze_transcriptions (TranscriptID, StoreID, FacialID, DeviceID, Timestamp, TranscriptText, AudioURL, Language) VALUES (
      ${transcript.TranscriptID}, 
      ${transcript.StoreID}, 
      '${transcript.FacialID}', 
      '${transcript.DeviceID}', 
      '${transcript.Timestamp}', 
      N'${transcript.TranscriptText}', 
      N'${transcript.AudioURL}', 
      '${transcript.Language}');\n`;
  });
  sql += '\nSET IDENTITY_INSERT dbo.bronze_transcriptions OFF;\n';
  sql += 'GO\n\n';
  
  // Session Matches
  sql += 'DELETE FROM dbo.SessionMatches;\n';
  sql += 'GO\n\n';
  sql += 'SET IDENTITY_INSERT dbo.SessionMatches ON;\n';
  sql += 'GO\n\n';
  data.sessionMatches.forEach(match => {
    sql += `INSERT INTO dbo.SessionMatches (SessionMatchID, InteractionID, TranscriptID, DetectionID, MatchConfidence, TimeOffsetMs, MatchMethod, CreatedAt) VALUES (
      ${match.SessionMatchID}, 
      '${match.InteractionID}', 
      ${match.TranscriptID}, 
      ${match.DetectionID}, 
      ${match.MatchConfidence}, 
      ${match.TimeOffsetMs}, 
      '${match.MatchMethod}', 
      '${match.CreatedAt}');\n`;
  });
  sql += '\nSET IDENTITY_INSERT dbo.SessionMatches OFF;\n';
  sql += 'GO\n\n';
  
  // Sales Interaction Brands
  sql += 'DELETE FROM dbo.SalesInteractionBrands;\n';
  sql += 'GO\n\n';
  sql += 'SET IDENTITY_INSERT dbo.SalesInteractionBrands ON;\n';
  sql += 'GO\n\n';
  data.salesInteractionBrands.forEach((brand, index) => {
    sql += `INSERT INTO dbo.SalesInteractionBrands (BrandID, InteractionID, BrandName, Confidence, Source, CreatedAt) VALUES (
      ${index + 1}, 
      '${brand.InteractionID}', 
      N'${brand.BrandName}', 
      ${brand.Confidence}, 
      '${brand.Source}', 
      '${brand.CreatedAt}');\n`;
  });
  sql += '\nSET IDENTITY_INSERT dbo.SalesInteractionBrands OFF;\n';
  sql += 'GO\n\n';
  
  return sql;
};

// Generate JSON data
const generateJsonData = (data) => {
  return JSON.stringify(data, null, 2);
};

// Generate all data
const data = generateAllData();

// Output directory
const outputDir = path.join(__dirname, 'sample_data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Save SQL file
const sqlContent = generateSqlInserts(data);
fs.writeFileSync(path.join(outputDir, 'sample_data.sql'), sqlContent);

// Save JSON file
const jsonContent = generateJsonData(data);
fs.writeFileSync(path.join(outputDir, 'sample_data.json'), jsonContent);

console.log('Sample data generated successfully!');
console.log(`SQL file saved to: ${path.join(outputDir, 'sample_data.sql')}`);
console.log(`JSON file saved to: ${path.join(outputDir, 'sample_data.json')}`);

// Also create a simplified JSON file with just the first 5 records of each type for quick testing
const simplifiedData = {};
Object.keys(data).forEach(key => {
  simplifiedData[key] = data[key].slice(0, 5);
});
fs.writeFileSync(path.join(outputDir, 'sample_data_simplified.json'), JSON.stringify(simplifiedData, null, 2));
console.log(`Simplified JSON file saved to: ${path.join(outputDir, 'sample_data_simplified.json')}`);

// Create a script to load this data for quick use in browser demos
const loaderJs = `
/**
 * Sample Data Loader
 * This script loads the sample data into memory for dashboard testing
 */

// Sample data loading function
function loadSampleData() {
  return ${JSON.stringify(data)};
}

// Make it available globally for use in dashboards
window.sampleData = loadSampleData();
console.log('Sample data loaded successfully!', window.sampleData);
`;

fs.writeFileSync(path.join(outputDir, 'sample_data_loader.js'), loaderJs);
console.log(`Loader JavaScript file saved to: ${path.join(outputDir, 'sample_data_loader.js')}`);
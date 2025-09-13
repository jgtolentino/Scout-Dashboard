/**
 * TBWA\SMP Brands Data Generator
 * Generates realistic FMCG transaction data with time-based patterns
 */

const tbwaBrands = require('../tbwa_smp_brands.json');

// Time-based weight patterns for different product categories
const TIME_PATTERNS = {
    'Beverage': {
        '06:00-09:00': 1.5,  // Morning rush
        '12:00-14:00': 1.8,  // Lunch time
        '15:00-17:00': 1.3,  // Afternoon
        'default': 1.0
    },
    'Snack': {
        '10:00-11:00': 1.3,  // Morning snack
        '14:00-17:00': 2.0,  // Afternoon snacking peak
        '19:00-21:00': 1.5,  // Evening snacks
        'default': 1.0
    },
    'Dairy': {
        '06:00-09:00': 2.0,  // Breakfast
        '16:00-18:00': 1.3,  // After school
        'default': 1.0
    },
    'Household': {
        '09:00-12:00': 1.8,  // Morning cleaning
        '13:00-16:00': 1.5,  // Afternoon chores
        'default': 1.0
    },
    'Personal Care': {
        '18:00-20:00': 1.5,  // Evening routines
        'default': 1.0
    }
};

// Day of week patterns
const DAY_PATTERNS = {
    'Beverage': { weekday: 1.0, weekend: 1.2 },
    'Snack': { weekday: 0.9, weekend: 1.3 },
    'Dairy': { weekday: 1.1, weekend: 0.9 },
    'Household': { weekday: 0.8, weekend: 1.5 },
    'Personal Care': { weekday: 1.0, weekend: 1.1 }
};

// Seasonal patterns (Philippines seasons)
const SEASONAL_PATTERNS = {
    'Beverage': { 
        'hot': 1.5,     // March-May
        'rainy': 1.0,   // June-November
        'cool': 0.8     // December-February
    },
    'Snack': {
        'hot': 1.1,
        'rainy': 1.0,
        'cool': 1.2
    }
};

class TBWABrandsGenerator {
    constructor() {
        this.brands = tbwaBrands.brands;
        this.categories = tbwaBrands.categories;
        this.allProducts = this._flattenProducts();
    }

    _flattenProducts() {
        const products = [];
        this.brands.forEach(brand => {
            brand.SubBrands.forEach(product => {
                products.push({
                    ...product,
                    BrandID: brand.BrandID,
                    BrandName: brand.BrandName,
                    BrandCategory: brand.Category
                });
            });
        });
        return products;
    }

    getCurrentSeason() {
        const month = new Date().getMonth() + 1;
        if (month >= 3 && month <= 5) return 'hot';
        if (month >= 6 && month <= 11) return 'rainy';
        return 'cool';
    }

    getTimeSlot(hour) {
        if (hour >= 6 && hour < 9) return '06:00-09:00';
        if (hour >= 9 && hour < 12) return '09:00-12:00';
        if (hour >= 10 && hour < 11) return '10:00-11:00';
        if (hour >= 12 && hour < 14) return '12:00-14:00';
        if (hour >= 13 && hour < 16) return '13:00-16:00';
        if (hour >= 14 && hour < 17) return '14:00-17:00';
        if (hour >= 15 && hour < 17) return '15:00-17:00';
        if (hour >= 16 && hour < 18) return '16:00-18:00';
        if (hour >= 18 && hour < 20) return '18:00-20:00';
        if (hour >= 19 && hour < 21) return '19:00-21:00';
        return 'default';
    }

    getProductWeight(product, timestamp) {
        const date = new Date(timestamp);
        const hour = date.getHours();
        const dayOfWeek = date.getDay();
        const timeSlot = this.getTimeSlot(hour);
        const season = this.getCurrentSeason();
        
        let weight = 1.0;

        // Apply time pattern
        const categoryPatterns = TIME_PATTERNS[product.SubCategory] || TIME_PATTERNS[product.BrandCategory];
        if (categoryPatterns) {
            weight *= categoryPatterns[timeSlot] || categoryPatterns.default || 1.0;
        }

        // Apply day pattern
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const dayPattern = DAY_PATTERNS[product.BrandCategory];
        if (dayPattern) {
            weight *= isWeekend ? dayPattern.weekend : dayPattern.weekday;
        }

        // Apply seasonal pattern
        const seasonalPattern = SEASONAL_PATTERNS[product.BrandCategory];
        if (seasonalPattern) {
            weight *= seasonalPattern[season] || 1.0;
        }

        // Brand-specific boosts
        if (product.BrandName === 'Del Monte Philippines') weight *= 1.2; // Market leader
        if (product.ProductName.includes('Fit \'n Right')) weight *= 1.3; // Health trend
        if (product.ProductName.includes('Smart C+') && hour >= 7 && hour <= 9) weight *= 1.5; // Morning drink

        return weight;
    }

    // Sari-sari stores typically stock these popular items only
    getSariSariProducts() {
        return this.allProducts.filter(product => 
            ['DM001', 'DM003', 'DM005',  // Del Monte juice, sauce, Fit n Right
             'OS001', 'OS002', 'OS005',  // Oishi crackers, ridges, Smart C
             'AK001', 'AK002',           // Alaska evap and condensed milk
             'PP001', 'PP006'            // Champion detergent, Pride dishwashing
            ].includes(product.ProductID)
        );
    }

    generateTransaction(storeId, timestamp, storeType = 'sari-sari') {
        // For sari-sari stores, only use limited product selection
        const availableProducts = storeType === 'sari-sari' 
            ? this.getSariSariProducts() 
            : this.allProducts;

        // Calculate weights for available products
        const weightedProducts = availableProducts.map(product => ({
            product,
            weight: this.getProductWeight(product, timestamp)
        }));

        // Sort by weight and select top candidates
        weightedProducts.sort((a, b) => b.weight - a.weight);
        const topProducts = weightedProducts.slice(0, 5);

        // Sari-sari stores typically have smaller transactions (1-3 items)
        const maxItems = storeType === 'sari-sari' ? 3 : 5;
        const itemCount = Math.floor(Math.random() * (maxItems - 1)) + 1;
        const selectedProducts = [];
        
        for (let i = 0; i < itemCount; i++) {
            const randomIndex = Math.floor(Math.random() * Math.min(3, topProducts.length));
            const selected = topProducts[randomIndex];
            
            // Sari-sari stores sell smaller quantities
            const maxQty = storeType === 'sari-sari' ? 2 : 3;
            const quantity = Math.floor(Math.random() * maxQty) + 1;
            
            selectedProducts.push({
                ProductID: selected.product.ProductID,
                ProductName: selected.product.ProductName,
                BrandID: selected.product.BrandID,
                BrandName: selected.product.BrandName,
                Quantity: quantity,
                UnitPrice: selected.product.DefaultPrice,
                SubTotal: selected.product.DefaultPrice * quantity
            });
        }

        const totalAmount = selectedProducts.reduce((sum, item) => sum + item.SubTotal, 0);

        return {
            StoreID: storeId,
            StoreType: storeType,
            TransactionDate: timestamp,
            Items: selectedProducts,
            TransactionAmount: totalAmount,
            ItemCount: selectedProducts.length,
            DataSource: 'simulation',
            IsSimulated: true
        };
    }

    generateBulkTransactions(storeIds, startDate, endDate, transactionsPerDay = 100) {
        const transactions = [];
        const currentDate = new Date(startDate);
        const end = new Date(endDate);

        while (currentDate <= end) {
            for (let i = 0; i < transactionsPerDay; i++) {
                // Distribute transactions throughout the day with realistic patterns
                const hour = this._generateHourWithPattern();
                const minute = Math.floor(Math.random() * 60);
                
                const timestamp = new Date(currentDate);
                timestamp.setHours(hour, minute, 0, 0);

                const storeId = storeIds[Math.floor(Math.random() * storeIds.length)];
                const transaction = this.generateTransaction(storeId, timestamp);
                
                transactions.push(transaction);
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return transactions;
    }

    _generateHourWithPattern() {
        // Store operating hours with transaction density
        const hourWeights = {
            6: 0.5, 7: 1.0, 8: 1.5, 9: 2.0, 10: 2.5,
            11: 2.5, 12: 3.0, 13: 3.0, 14: 2.5, 15: 2.5,
            16: 3.0, 17: 3.5, 18: 3.0, 19: 2.5, 20: 2.0,
            21: 1.0
        };

        const totalWeight = Object.values(hourWeights).reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;

        for (const [hour, weight] of Object.entries(hourWeights)) {
            random -= weight;
            if (random <= 0) return parseInt(hour);
        }

        return 12; // Default to noon
    }

    generateAIInsights(transactions) {
        const insights = [];
        
        // Analyze snack patterns
        const snackTransactions = transactions.filter(t => 
            t.Items.some(item => item.BrandName === 'Oishi')
        );
        
        const afternoonSnacks = snackTransactions.filter(t => {
            const hour = new Date(t.TransactionDate).getHours();
            return hour >= 14 && hour <= 17;
        });

        if (afternoonSnacks.length > snackTransactions.length * 0.4) {
            insights.push({
                type: 'pattern',
                category: 'snacks',
                insight: 'Oishi snacks show 40% higher sales during 2-5 PM. Consider afternoon bundle promotions.',
                confidence: 0.85
            });
        }

        // Analyze milk patterns
        const milkTransactions = transactions.filter(t =>
            t.Items.some(item => item.BrandName === 'Alaska')
        );

        const morningMilk = milkTransactions.filter(t => {
            const hour = new Date(t.TransactionDate).getHours();
            return hour >= 6 && hour <= 9;
        });

        if (morningMilk.length > milkTransactions.length * 0.35) {
            insights.push({
                type: 'pattern',
                category: 'dairy',
                insight: 'Alaska milk products peak during breakfast hours. Stock displays near breakfast items.',
                confidence: 0.78
            });
        }

        // Cross-sell opportunities
        const delMonteWithSnacks = transactions.filter(t =>
            t.Items.some(item => item.BrandName === 'Del Monte Philippines') &&
            t.Items.some(item => item.BrandName === 'Oishi')
        );

        if (delMonteWithSnacks.length > transactions.length * 0.1) {
            insights.push({
                type: 'cross-sell',
                category: 'bundle',
                insight: 'Del Monte beverages frequently purchased with Oishi snacks. Create combo deals.',
                confidence: 0.72
            });
        }

        return insights;
    }
}

// Export for use in other modules
module.exports = TBWABrandsGenerator;

// Example usage
if (require.main === module) {
    const generator = new TBWABrandsGenerator();
    
    // Generate sample transactions
    const storeIds = [1, 2, 3, 4, 5];
    const transactions = generator.generateBulkTransactions(
        storeIds,
        '2025-05-01',
        '2025-05-23',
        50
    );

    console.log(`Generated ${transactions.length} transactions`);
    console.log('\nSample transaction:', JSON.stringify(transactions[0], null, 2));

    // Generate insights
    const insights = generator.generateAIInsights(transactions);
    console.log('\nAI Insights:', JSON.stringify(insights, null, 2));
}
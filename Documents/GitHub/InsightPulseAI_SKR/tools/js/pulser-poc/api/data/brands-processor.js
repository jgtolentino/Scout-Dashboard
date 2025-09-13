// Brand Data Processor
// Handles aggregation and analysis of brands data

class BrandsProcessor {
  constructor(data) {
    this.data = data;
  }

  // KPI Calculations
  getKPIs() {
    const totalRevenue = this.data.reduce((sum, item) => sum + item.value, 0);
    const topBrand = this.data.reduce((max, item) => item.value > max.value ? item : max);
    const fastestGrowth = this.data.reduce((max, item) => item.pct_change > max.pct_change ? item : max);
    
    // Category aggregation
    const categoryTotals = {};
    this.data.forEach(item => {
      if (!categoryTotals[item.category]) {
        categoryTotals[item.category] = 0;
      }
      categoryTotals[item.category] += item.value;
    });
    
    const topCategory = Object.entries(categoryTotals)
      .reduce((max, [cat, val]) => val > max.value ? {category: cat, value: val} : max, 
              {category: '', value: 0});

    return {
      totalRevenue,
      topBrand: {
        name: topBrand.brand,
        value: topBrand.value,
        category: topBrand.category
      },
      fastestGrowth: {
        name: fastestGrowth.brand,
        change: fastestGrowth.pct_change,
        category: fastestGrowth.category
      },
      topCategory: {
        name: topCategory.category,
        value: topCategory.value
      }
    };
  }

  // Get trends data grouped by brand and date
  getTrends(brands = null, dateRange = 30) {
    // Filter by brands if specified
    let filtered = brands ? this.data.filter(item => brands.includes(item.brand)) : this.data;
    
    // Group by date and brand
    const trends = {};
    filtered.forEach(item => {
      const date = item.timestamp.split('T')[0];
      if (!trends[date]) trends[date] = {};
      if (!trends[date][item.brand]) trends[date][item.brand] = 0;
      trends[date][item.brand] += item.value;
    });

    // Convert to array format for charts
    return Object.entries(trends).map(([date, brands]) => ({
      date,
      ...brands
    }));
  }

  // Get market share by brand or category
  getMarketShare(groupBy = 'brand', limit = 10) {
    const totals = {};
    const grandTotal = this.data.reduce((sum, item) => sum + item.value, 0);
    
    this.data.forEach(item => {
      const key = groupBy === 'brand' ? item.brand : item.category;
      if (!totals[key]) totals[key] = 0;
      totals[key] += item.value;
    });

    // Calculate percentages and sort
    const shares = Object.entries(totals)
      .map(([name, value]) => ({
        name,
        value,
        percentage: (value / grandTotal * 100).toFixed(2)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);

    // Add "Others" if needed
    const topTotal = shares.reduce((sum, item) => sum + item.value, 0);
    if (topTotal < grandTotal) {
      shares.push({
        name: 'Others',
        value: grandTotal - topTotal,
        percentage: ((grandTotal - topTotal) / grandTotal * 100).toFixed(2)
      });
    }

    return shares;
  }

  // Get fastest movers (top gainers and losers)
  getFastestMovers(limit = 5) {
    const sorted = [...this.data].sort((a, b) => b.pct_change - a.pct_change);
    
    return {
      gainers: sorted.slice(0, limit).map(item => ({
        brand: item.brand,
        category: item.category,
        change: item.pct_change,
        value: item.value
      })),
      losers: sorted.slice(-limit).reverse().map(item => ({
        brand: item.brand,
        category: item.category,
        change: item.pct_change,
        value: item.value
      }))
    };
  }

  // Get brand leaderboard
  getLeaderboard(category = null, limit = 10) {
    let filtered = category ? 
      this.data.filter(item => item.category === category) : 
      this.data;

    // Aggregate by brand
    const brandTotals = {};
    filtered.forEach(item => {
      if (!brandTotals[item.brand]) {
        brandTotals[item.brand] = {
          value: 0,
          category: item.category,
          avgChange: 0,
          count: 0
        };
      }
      brandTotals[item.brand].value += item.value;
      brandTotals[item.brand].avgChange += item.pct_change;
      brandTotals[item.brand].count += 1;
    });

    // Calculate averages and sort
    return Object.entries(brandTotals)
      .map(([brand, data]) => ({
        brand,
        category: data.category,
        value: data.value,
        avgChange: (data.avgChange / data.count).toFixed(2),
        rank: 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }

  // Get AI insights
  getInsights() {
    const insights = [];
    const movers = this.getFastestMovers();
    const marketShare = this.getMarketShare('brand', 5);

    // Insight 1: Biggest gainer
    if (movers.gainers.length > 0) {
      const top = movers.gainers[0];
      insights.push({
        type: 'growth',
        title: 'Fastest Growing Brand',
        message: `${top.brand} is up ${top.change}% this period, showing strong momentum in the ${top.category} category.`,
        priority: 'high'
      });
    }

    // Insight 2: Close competition
    for (let i = 0; i < marketShare.length - 1; i++) {
      const diff = Math.abs(parseFloat(marketShare[i].percentage) - parseFloat(marketShare[i + 1].percentage));
      if (diff < 2) {
        insights.push({
          type: 'competition',
          title: 'Tight Competition',
          message: `${marketShare[i].name} and ${marketShare[i + 1].name} are within ${diff.toFixed(1)}% market share, indicating intense competition.`,
          priority: 'medium'
        });
        break;
      }
    }

    // Insight 3: Category trend
    const categoryData = this.getMarketShare('category');
    if (categoryData.length > 0) {
      insights.push({
        type: 'category',
        title: 'Category Leader',
        message: `${categoryData[0].name} dominates with ${categoryData[0].percentage}% of total market value.`,
        priority: 'low'
      });
    }

    return insights;
  }

  // Get categories list
  getCategories() {
    return [...new Set(this.data.map(item => item.category))];
  }

  // Get brands list
  getBrands() {
    return [...new Set(this.data.map(item => item.brand))].sort();
  }
}

module.exports = BrandsProcessor;
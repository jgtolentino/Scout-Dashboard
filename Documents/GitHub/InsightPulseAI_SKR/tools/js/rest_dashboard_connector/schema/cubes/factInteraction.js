cube(`FactInteraction`, {
  sql: `
    SELECT * FROM "gold"."scout_semantic_fact_interaction"
  `,
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [brandId, interactionId, interactionDate]
    },
    
    interactionTotal: {
      sql: `interaction_value`,
      type: `sum`
    },
    
    averageInteractionValue: {
      sql: `interaction_value`,
      type: `avg`
    }
  },
  
  dimensions: {
    interactionId: {
      sql: `interaction_id`,
      type: `string`,
      primaryKey: true
    },
    
    brandId: {
      sql: `brand_id`,
      type: `string`
    },
    
    interactionType: {
      sql: `interaction_type`,
      type: `string`
    },
    
    interactionDate: {
      sql: `interaction_date`,
      type: `time`
    },
    
    channelId: {
      sql: `channel_id`,
      type: `string`
    },
    
    sentimentScore: {
      sql: `sentiment_score`,
      type: `number`
    }
  },
  
  preAggregations: {
    // Pre-aggregation definitions
    brandByDay: {
      measures: [count, interactionTotal],
      dimensions: [brandId],
      timeDimension: interactionDate,
      granularity: `day`
    }
  }
});
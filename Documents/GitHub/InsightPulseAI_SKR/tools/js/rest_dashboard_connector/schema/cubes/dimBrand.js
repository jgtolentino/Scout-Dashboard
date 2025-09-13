cube(`DimBrand`, {
  sql: `
    SELECT * FROM "gold"."scout_semantic_dim_brand"
  `,
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [brandId, brandName]
    }
  },
  
  dimensions: {
    brandId: {
      sql: `brand_id`,
      type: `string`,
      primaryKey: true
    },
    
    brandName: {
      sql: `brand_name`,
      type: `string`
    },
    
    brandCategory: {
      sql: `brand_category`,
      type: `string`
    },
    
    brandRegion: {
      sql: `brand_region`,
      type: `string`
    }
  }
});
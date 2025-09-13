cube(`BrandInteractions`, {
  extends: FactInteraction,
  joins: {
    DimBrand: {
      relationship: `belongsTo`,
      sql: `${CUBE.brandId} = ${DimBrand.brandId}`
    }
  }
});
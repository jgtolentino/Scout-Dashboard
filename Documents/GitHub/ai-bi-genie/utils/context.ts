export async function getCESContext({ brand, region, dateRange }: { brand: string, region: string, dateRange: string }) {
  return `Brand: ${brand}, Region: ${region}, Date Range: ${dateRange}`
} 
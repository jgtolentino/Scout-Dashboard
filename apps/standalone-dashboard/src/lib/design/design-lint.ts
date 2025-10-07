// Basic design lint functions for the v7 system
export function lintConfig(config: any) {
  const issues: Array<{ level: string; code: string; message: string }> = [];
  
  // Check navigation completeness
  for (const nav of (config.navigation || [])) {
    if (!nav.path && !config.pages?.[nav.id]) {
      issues.push({
        level: "error",
        code: "NAV_MISSING_PAGE",
        message: `Navigation '${nav.id}' has no corresponding page`
      });
    }
  }
  
  return issues;
}

export function lintRuntime(page: any, data: any) {
  const issues: Array<{ level: string; code: string; message: string }> = [];
  
  // Check for missing data
  for (const block of (page.layout || [])) {
    if (block.data?.rpc && !data) {
      issues.push({
        level: "warn",
        code: "MISSING_DATA",
        message: `Block with RPC '${block.data.rpc}' has no data`
      });
    }
  }
  
  return issues;
}
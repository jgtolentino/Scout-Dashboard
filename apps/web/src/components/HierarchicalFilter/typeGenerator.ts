import fs from 'fs';
import path from 'path';
import { FilterConfig, DimensionTable } from './types';

/**
 * Generates TypeScript types from dimension table data
 * This runs at build time to create strongly-typed interfaces
 */
export function generateFilterTypes(
  config: FilterConfig,
  dimensions: Record<string, DimensionTable[]>
): void {
  if (typeof window !== 'undefined') {
    // Don't run in browser
    return;
  }

  const types: string[] = [
    '// Auto-generated types from dimension tables',
    '// Do not edit manually - generated at build time',
    '',
    `// Generated on: ${new Date().toISOString()}`,
    '',
  ];

  // Generate namespace for this filter config
  types.push(`export namespace ${pascalCase(config.name)}Filters {`);

  // Generate types for each level
  config.hierarchy.forEach((level) => {
    const dimensionData = dimensions[level.name];
    if (!dimensionData || dimensionData.length === 0) return;

    // Get unique column types from sample data
    const sampleRow = dimensionData[0];
    const columnTypes = Object.entries(sampleRow).map(([key, value]) => {
      const tsType = getTypeScriptType(value);
      return `    ${key}: ${tsType};`;
    });

    // Generate interface
    types.push(`  export interface ${pascalCase(level.name)} {`);
    types.push(...columnTypes);
    types.push('  }');
    types.push('');

    // Generate enum for value column if applicable
    if (shouldGenerateEnum(dimensionData, level.valueColumn)) {
      types.push(`  export enum ${pascalCase(level.name)}Values {`);
      dimensionData.forEach(row => {
        const value = row[level.valueColumn];
        const key = sanitizeEnumKey(row[level.displayColumn] || value);
        types.push(`    ${key} = '${value}',`);
      });
      types.push('  }');
      types.push('');
    }

    // Generate union type for display values
    types.push(`  export type ${pascalCase(level.name)}Display =`);
    const displayValues = [...new Set(dimensionData.map(row => row[level.displayColumn]))];
    displayValues.forEach((value, index) => {
      const isLast = index === displayValues.length - 1;
      types.push(`    | '${value}'${isLast ? ';' : ''}`);
    });
    types.push('');
  });

  // Generate filter state type
  types.push('  export interface FilterState {');
  config.hierarchy.forEach(level => {
    types.push(`    ${level.name}?: ${pascalCase(level.name)};`);
  });
  types.push('  }');
  types.push('');

  // Generate filter value type
  types.push('  export interface FilterValues {');
  config.hierarchy.forEach(level => {
    types.push(`    ${level.name}?: ${pascalCase(level.name)}['${level.valueColumn}'];`);
  });
  types.push('  }');

  types.push('}');
  types.push('');

  // Write to file
  const outputPath = path.join(
    process.cwd(),
    'apps/web/src/types/generated',
    `${config.name}-filters.ts`
  );

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, types.join('\n'), 'utf-8');
}

/**
 * Generate TypeScript types for all filter configurations
 */
export async function generateAllFilterTypes(): Promise<void> {
  // This would be called during build process
  // Load configurations and dimension data from database
  // Generate types for each configuration
}

// Helper functions
function getTypeScriptType(value: any): string {
  if (value === null || value === undefined) return 'any';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (value instanceof Date) return 'Date';
  if (Array.isArray(value)) return 'any[]';
  if (typeof value === 'object') return 'Record<string, any>';
  return 'any';
}

function pascalCase(str: string): string {
  return str
    .split(/[_\s-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function sanitizeEnumKey(str: string): string {
  return str
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/^(\d)/, '_$1') // Prefix with _ if starts with number
    .replace(/_+/g, '_') // Remove duplicate underscores
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}

function shouldGenerateEnum(data: DimensionTable[], column: string): boolean {
  // Generate enum if we have a reasonable number of unique values
  const uniqueValues = new Set(data.map(row => row[column]));
  return uniqueValues.size <= 100; // Arbitrary limit
}
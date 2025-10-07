export interface LevelConfig {
  name: string;
  displayName: string;
  table: string;
  valueColumn: string;
  displayColumn: string;
  parentKey?: string;
  columns: string[];
  additionalDisplay?: string[];
}

export interface FilterConfig {
  name: string;
  hierarchy: LevelConfig[];
}

export interface FilterValue {
  level: string;
  value: any;
}

export interface DimensionTable {
  [key: string]: any;
}

export interface FilterState {
  filters: FilterValue[];
  loading: boolean;
  error?: Error;
}

// Generated types will be added dynamically
export interface GeneratedDimensionTypes {
  // This will be populated by the type generator
}

// Example configurations for Scout Dashboard
export const scoutFilterConfigs: Record<string, FilterConfig> = {
  geography: {
    name: 'geography',
    hierarchy: [
      {
        name: 'region',
        displayName: 'Region',
        table: 'scout_dash.dim_geography',
        valueColumn: 'region_id',
        displayColumn: 'region_name',
        columns: ['region_id', 'region_name', 'region_code']
      },
      {
        name: 'country',
        displayName: 'Country',
        table: 'scout_dash.dim_geography',
        valueColumn: 'country_id',
        displayColumn: 'country_name',
        parentKey: 'region_id',
        columns: ['country_id', 'country_name', 'country_code', 'region_id']
      },
      {
        name: 'state',
        displayName: 'State/Province',
        table: 'scout_dash.dim_geography',
        valueColumn: 'state_id',
        displayColumn: 'state_name',
        parentKey: 'country_id',
        columns: ['state_id', 'state_name', 'state_code', 'country_id']
      },
      {
        name: 'city',
        displayName: 'City',
        table: 'scout_dash.dim_geography',
        valueColumn: 'city_id',
        displayColumn: 'city_name',
        parentKey: 'state_id',
        columns: ['city_id', 'city_name', 'state_id', 'postal_code']
      }
    ]
  },
  brand: {
    name: 'brand',
    hierarchy: [
      {
        name: 'category',
        displayName: 'Category',
        table: 'scout_dash.dim_brands',
        valueColumn: 'category_id',
        displayColumn: 'category_name',
        columns: ['category_id', 'category_name']
      },
      {
        name: 'brand',
        displayName: 'Brand',
        table: 'scout_dash.dim_brands',
        valueColumn: 'brand_id',
        displayColumn: 'brand_name',
        parentKey: 'category_id',
        columns: ['brand_id', 'brand_name', 'category_id', 'brand_code'],
        additionalDisplay: ['brand_code']
      },
      {
        name: 'sub_brand',
        displayName: 'Sub-Brand',
        table: 'scout_dash.dim_brands',
        valueColumn: 'sub_brand_id',
        displayColumn: 'sub_brand_name',
        parentKey: 'brand_id',
        columns: ['sub_brand_id', 'sub_brand_name', 'brand_id']
      }
    ]
  },
  campaign: {
    name: 'campaign',
    hierarchy: [
      {
        name: 'campaign_type',
        displayName: 'Campaign Type',
        table: 'scout_dash.dim_campaigns',
        valueColumn: 'campaign_type_id',
        displayColumn: 'campaign_type_name',
        columns: ['campaign_type_id', 'campaign_type_name']
      },
      {
        name: 'campaign',
        displayName: 'Campaign',
        table: 'scout_dash.dim_campaigns',
        valueColumn: 'campaign_id',
        displayColumn: 'campaign_name',
        parentKey: 'campaign_type_id',
        columns: ['campaign_id', 'campaign_name', 'campaign_type_id', 'start_date', 'end_date'],
        additionalDisplay: ['start_date', 'end_date']
      },
      {
        name: 'campaign_version',
        displayName: 'Version',
        table: 'scout_dash.dim_campaigns',
        valueColumn: 'version_id',
        displayColumn: 'version_name',
        parentKey: 'campaign_id',
        columns: ['version_id', 'version_name', 'campaign_id', 'version_number']
      }
    ]
  },
  organization: {
    name: 'organization',
    hierarchy: [
      {
        name: 'division',
        displayName: 'Division',
        table: 'hr_admin.dim_organization',
        valueColumn: 'division_id',
        displayColumn: 'division_name',
        columns: ['division_id', 'division_name']
      },
      {
        name: 'department',
        displayName: 'Department',
        table: 'hr_admin.dim_organization',
        valueColumn: 'department_id',
        displayColumn: 'department_name',
        parentKey: 'division_id',
        columns: ['department_id', 'department_name', 'division_id', 'cost_center']
      },
      {
        name: 'team',
        displayName: 'Team',
        table: 'hr_admin.dim_organization',
        valueColumn: 'team_id',
        displayColumn: 'team_name',
        parentKey: 'department_id',
        columns: ['team_id', 'team_name', 'department_id']
      }
    ]
  },
  time: {
    name: 'time',
    hierarchy: [
      {
        name: 'year',
        displayName: 'Year',
        table: 'scout_dash.dim_time',
        valueColumn: 'year',
        displayColumn: 'year',
        columns: ['year']
      },
      {
        name: 'quarter',
        displayName: 'Quarter',
        table: 'scout_dash.dim_time',
        valueColumn: 'quarter_id',
        displayColumn: 'quarter_name',
        parentKey: 'year',
        columns: ['quarter_id', 'quarter_name', 'year', 'quarter_number']
      },
      {
        name: 'month',
        displayName: 'Month',
        table: 'scout_dash.dim_time',
        valueColumn: 'month_id',
        displayColumn: 'month_name',
        parentKey: 'quarter_id',
        columns: ['month_id', 'month_name', 'quarter_id', 'month_number']
      },
      {
        name: 'week',
        displayName: 'Week',
        table: 'scout_dash.dim_time',
        valueColumn: 'week_id',
        displayColumn: 'week_name',
        parentKey: 'month_id',
        columns: ['week_id', 'week_name', 'month_id', 'week_number', 'week_start_date', 'week_end_date']
      }
    ]
  }
};
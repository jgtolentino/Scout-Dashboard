#!/usr/bin/env node
/**
 * Scout Platform v5.2 - Data Validation & Health Check Script
 * 
 * Validates all critical scout views and tables for production readiness
 * Usage: node scripts/validate-scout-data.js
 * 
 * Exit codes:
 * 0 = All validations passed
 * 1 = Critical validation failures
 * 2 = Warning-level issues detected
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cxzllzyxwpyptfretryc.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzYxODAsImV4cCI6MjA2Nzk1MjE4MH0.b794GEIWE4ZdMAm9xQYAJ0Gx-XEn1fhJBTIIeTro_1g';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Critical views that must have data for the dashboard to work
const CRITICAL_VIEWS = [
  'scout.gold_basket_analysis_api',
  'scout.gold_customer_activity_api',
  'scout.gold_campaign_effect_api',
  'scout.gold_regional_performance_api',
  'scout.platinum_executive_dashboard_api'
];

// Optional views (warnings if empty, not failures)
const OPTIONAL_VIEWS = [
  'scout.gold_demand_forecast_api',
  'scout.gold_product_metrics_api',
  'scout.gold_consumer_insights',
  'scout.gold_ai_generated_insights_api',
  'scout.gold_predictive_insights'
];

// Core tables that should exist (even if empty)
const CORE_TABLES = [
  'scout.brands',
  'scout.products', 
  'scout.stores',
  'scout.regions',
  'scout.user_profiles',
  'scout.personas',
  'scout.transactions'
];

class ScoutDataValidator {
  constructor() {
    this.results = {
      critical_passed: 0,
      critical_failed: 0,
      warnings: 0,
      errors: [],
      warnings_list: [],
      summary: {}
    };
    this.startTime = Date.now();
  }

  async validateViewExists(viewName) {
    try {
      const { data, error } = await supabase
        .from(viewName.replace('scout.', ''))
        .select('*')
        .limit(1);
        
      if (error) {
        return { exists: false, error: error.message, rowCount: 0 };
      }
      
      return { exists: true, error: null, rowCount: data ? data.length : 0 };
    } catch (err) {
      return { exists: false, error: err.message, rowCount: 0 };
    }
  }

  async validateViewData(viewName) {
    try {
      const { data, error } = await supabase
        .from(viewName.replace('scout.', ''))
        .select('*', { count: 'exact' })
        .limit(0);
        
      if (error) {
        return { hasData: false, error: error.message, count: 0 };
      }
      
      const count = data?.length || 0;
      return { hasData: count > 0, error: null, count };
    } catch (err) {
      return { hasData: false, error: err.message, count: 0 };
    }
  }

  async testConnection() {
    console.log('🔗 Testing Supabase connection...');
    try {
      const { data, error } = await supabase
        .from('brands') // Try simplest table first
        .select('*')
        .limit(1);
        
      if (error && !error.message.includes('does not exist')) {
        throw error;
      }
      
      console.log('✅ Supabase connection successful');
      return true;
    } catch (err) {
      console.log(`❌ Supabase connection failed: ${err.message}`);
      this.results.errors.push(`Database connection failed: ${err.message}`);
      return false;
    }
  }

  async validateCriticalViews() {
    console.log('\\n🔍 Validating critical views...');
    
    for (const viewName of CRITICAL_VIEWS) {
      console.log(`  Checking ${viewName}...`);
      
      const existsResult = await this.validateViewExists(viewName);
      if (!existsResult.exists) {
        console.log(`    ❌ View does not exist or is not accessible`);
        this.results.critical_failed++;
        this.results.errors.push(`Critical view ${viewName} is not accessible: ${existsResult.error}`);
        continue;
      }
      
      const dataResult = await this.validateViewData(viewName);
      if (!dataResult.hasData) {
        console.log(`    ⚠️  View exists but has no data (${dataResult.count} rows)`);
        this.results.critical_failed++;
        this.results.errors.push(`Critical view ${viewName} has no data`);
      } else {
        console.log(`    ✅ View has data (${dataResult.count} rows)`);
        this.results.critical_passed++;
      }
      
      this.results.summary[viewName] = {
        exists: existsResult.exists,
        hasData: dataResult.hasData,
        rowCount: dataResult.count,
        error: existsResult.error || dataResult.error
      };
    }
  }

  async validateOptionalViews() {
    console.log('\\n🔍 Validating optional views...');
    
    for (const viewName of OPTIONAL_VIEWS) {
      console.log(`  Checking ${viewName}...`);
      
      const existsResult = await this.validateViewExists(viewName);
      if (!existsResult.exists) {
        console.log(`    ⚠️  View does not exist or is not accessible`);
        this.results.warnings++;
        this.results.warnings_list.push(`Optional view ${viewName} is not accessible`);
        continue;
      }
      
      const dataResult = await this.validateViewData(viewName);
      if (!dataResult.hasData) {
        console.log(`    ⚠️  View exists but has no data`);
        this.results.warnings++;
        this.results.warnings_list.push(`Optional view ${viewName} has no data`);
      } else {
        console.log(`    ✅ View has data (${dataResult.count} rows)`);
      }
      
      this.results.summary[viewName] = {
        exists: existsResult.exists,
        hasData: dataResult.hasData,
        rowCount: dataResult.count,
        error: existsResult.error || dataResult.error
      };
    }
  }

  async validateDashboardEndpoints() {
    console.log('\\n🖥️  Testing dashboard API endpoints...');
    
    // Test each endpoint that the dashboard uses
    const endpoints = [
      { name: 'Executive Dashboard', view: 'platinum_executive_dashboard_api' },
      { name: 'Basket Analysis', view: 'gold_basket_analysis_api' },
      { name: 'Customer Activity', view: 'gold_customer_activity_api' },
      { name: 'Campaign Effect', view: 'gold_campaign_effect_api' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const { data, error } = await supabase
          .from(endpoint.view)
          .select('*')
          .limit(5);
          
        if (error) {
          console.log(`    ❌ ${endpoint.name}: ${error.message}`);
          this.results.errors.push(`Dashboard endpoint ${endpoint.name} failed: ${error.message}`);
        } else {
          console.log(`    ✅ ${endpoint.name}: ${data ? data.length : 0} records`);
        }
      } catch (err) {
        console.log(`    ❌ ${endpoint.name}: ${err.message}`);
        this.results.errors.push(`Dashboard endpoint ${endpoint.name} error: ${err.message}`);
      }
    }
  }

  async generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    console.log('\\n📊 VALIDATION REPORT');
    console.log('═══════════════════════════════════════');
    console.log(`⏱️  Validation completed in ${duration}ms`);
    console.log(`✅ Critical views passed: ${this.results.critical_passed}/${CRITICAL_VIEWS.length}`);
    console.log(`❌ Critical views failed: ${this.results.critical_failed}/${CRITICAL_VIEWS.length}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    
    if (this.results.errors.length > 0) {
      console.log('\\n❌ CRITICAL ERRORS:');
      this.results.errors.forEach(error => console.log(`   • ${error}`));
    }
    
    if (this.results.warnings_list.length > 0) {
      console.log('\\n⚠️  WARNINGS:');
      this.results.warnings_list.forEach(warning => console.log(`   • ${warning}`));
    }
    
    // Overall status
    console.log('\\n🎯 OVERALL STATUS:');
    if (this.results.critical_failed === 0) {
      console.log('✅ PRODUCTION READY - All critical systems operational');
      if (this.results.warnings > 0) {
        console.log('⚠️  Some optional features may be limited');
      }
    } else {
      console.log('❌ NOT PRODUCTION READY - Critical systems failing');
    }
    
    // Write detailed results to file
    const reportPath = path.join(process.cwd(), 'validation-report.json');
    const detailedReport = {
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      status: this.results.critical_failed === 0 ? 'PASS' : 'FAIL',
      summary: {
        critical_passed: this.results.critical_passed,
        critical_failed: this.results.critical_failed,
        warnings: this.results.warnings,
        total_views_tested: CRITICAL_VIEWS.length + OPTIONAL_VIEWS.length
      },
      errors: this.results.errors,
      warnings: this.results.warnings_list,
      detailed_results: this.results.summary
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
    console.log(`\\n📄 Detailed report saved to: ${reportPath}`);
  }

  async run() {
    console.log('🚀 Scout Platform v5.2 - Data Validation');
    console.log('═══════════════════════════════════════════');
    
    // Test connection first
    const connectionOk = await this.testConnection();
    if (!connectionOk) {
      console.log('\\n❌ Cannot proceed - database connection failed');
      process.exit(1);
    }
    
    // Run all validations
    await this.validateCriticalViews();
    await this.validateOptionalViews();
    await this.validateDashboardEndpoints();
    
    // Generate report
    await this.generateReport();
    
    // Exit with appropriate code
    if (this.results.critical_failed > 0) {
      process.exit(1); // Critical failures
    } else if (this.results.warnings > 0) {
      process.exit(2); // Warnings only
    } else {
      process.exit(0); // All good
    }
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new ScoutDataValidator();
  validator.run().catch(err => {
    console.error('❌ Validation failed:', err);
    process.exit(1);
  });
}

export default ScoutDataValidator;
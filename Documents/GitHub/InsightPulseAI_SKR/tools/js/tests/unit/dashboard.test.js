const { describe, test, expect, beforeEach } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

// Setup Jest mocks
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

// Import the stub module for testing
const updater = require('../stubs/update_etl_dashboard');

describe('ETL Dashboard Updater', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('loadAuditData', () => {
    test('should load ETL audit data from specified directory', () => {
      // Mock file existence
      fs.existsSync.mockReturnValue(true);
      
      // Mock file content
      const mockEtlAudit = { checks: [{ id: 'test', status: 'PASSED' }] };
      const mockSchemaDiff = { added: [], modified: [], removed: [] };
      const mockRowCounts = { tables: { test_table: { count: 100 } } };
      const mockSummary = '# ETL Audit Summary';
      
      fs.readFileSync
        .mockReturnValueOnce(JSON.stringify(mockEtlAudit))
        .mockReturnValueOnce(JSON.stringify(mockSchemaDiff))
        .mockReturnValueOnce(JSON.stringify(mockRowCounts))
        .mockReturnValueOnce(mockSummary);
      
      // Call the function
      const result = updater.loadAuditData('test-dir');
      
      // Check the result
      expect(result).toEqual({
        etlAudit: mockEtlAudit,
        schemaDiff: mockSchemaDiff,
        rowCounts: mockRowCounts,
        summary: mockSummary
      });
      
      // Verify fs calls
      expect(fs.existsSync).toHaveBeenCalledTimes(4);
      expect(fs.readFileSync).toHaveBeenCalledTimes(4);
      expect(fs.existsSync).toHaveBeenCalledWith(path.join('test-dir', 'etl_audit.json'));
      expect(fs.existsSync).toHaveBeenCalledWith(path.join('test-dir', 'schema_diff.json'));
      expect(fs.existsSync).toHaveBeenCalledWith(path.join('test-dir', 'counts.json'));
      expect(fs.existsSync).toHaveBeenCalledWith(path.join('test-dir', 'summary.md'));
    });
    
    test('should handle missing files gracefully', () => {
      // Mock file existence - only etl_audit.json exists
      fs.existsSync
        .mockReturnValueOnce(true)  // etl_audit.json
        .mockReturnValueOnce(false) // schema_diff.json
        .mockReturnValueOnce(false) // counts.json
        .mockReturnValueOnce(false); // summary.md
      
      // Mock file content
      const mockEtlAudit = { checks: [{ id: 'test', status: 'PASSED' }] };
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockEtlAudit));
      
      // Call the function
      const result = updater.loadAuditData('test-dir');
      
      // Check the result
      expect(result).toEqual({
        etlAudit: mockEtlAudit,
        schemaDiff: null,
        rowCounts: null,
        summary: null
      });
      
      // Verify fs calls
      expect(fs.existsSync).toHaveBeenCalledTimes(4);
      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateDashboardData', () => {
    test('should generate dashboard data from audit results', () => {
      // Prepare test data
      const auditData = {
        etlAudit: {
          checks: [
            { id: 'bronze_test', status: 'PASSED', severity: 'ERROR' },
            { id: 'silver_test', status: 'FAILED', severity: 'WARNING' },
            { id: 'gold_test', status: 'PASSED', severity: 'ERROR' }
          ]
        },
        schemaDiff: {
          added: ['table1'],
          modified: ['table2'],
          removed: []
        },
        rowCounts: {
          tables: {
            'bronze_table': { count: 1000 },
            'silver_table': { count: 900 },
            'gold_table': { count: 100 }
          }
        }
      };
      
      const historicalData = [];
      
      // Call the function
      const result = updater.generateDashboardData(auditData, historicalData);
      
      // Basic assertions
      expect(result).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.pipelineMetrics).toBeDefined();
      expect(result.layerHealth).toBeDefined();
      expect(result.schemaStability).toBeDefined();
      expect(result.rowCountTrends).toBeDefined();
      expect(result.recentIssues).toBeDefined();
      expect(result.qualityScores).toBeDefined();
      
      // Check calculated metrics
      expect(result.pipelineMetrics.status).toBe('WARNING');
      expect(result.pipelineMetrics.successRate).toBe(66.7);
      expect(result.pipelineMetrics.totalChecks).toBe(3);
      expect(result.pipelineMetrics.failedChecks).toBe(1);
      
      // Check specific data structures
      expect(result.layerHealth.labels).toEqual(['Bronze', 'Silver', 'Gold']);
      expect(result.schemaStability.changes).toBeDefined();
      expect(result.schemaStability.changes.length).toBe(7);
      
      // Check recent issues
      expect(result.recentIssues.length).toBe(1);
      expect(result.recentIssues[0].check).toBe('silver_test');
      expect(result.recentIssues[0].severity).toBe('WARNING');
    });
    
    test('should handle empty or invalid audit data', () => {
      // Prepare empty test data
      const auditData = {
        etlAudit: { checks: [] },
        schemaDiff: null,
        rowCounts: null
      };
      
      const historicalData = [];
      
      // Call the function
      const result = updater.generateDashboardData(auditData, historicalData);
      
      // Basic assertions
      expect(result).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.pipelineMetrics).toBeDefined();
      expect(result.layerHealth).toBeDefined();
      expect(result.schemaStability).toBeDefined();
      expect(result.rowCountTrends).toBeDefined();
      expect(result.recentIssues).toBeDefined();
      expect(result.qualityScores).toBeDefined();
      
      // Check calculated metrics
      expect(result.pipelineMetrics.status).toBe('HEALTHY');
      expect(result.pipelineMetrics.totalChecks).toBe(0);
      expect(result.pipelineMetrics.failedChecks).toBe(0);
      
      // Check that default data is generated when no real data exists
      expect(result.rowCountTrends.datasets.length).toBeGreaterThan(0);
      expect(result.qualityScores.length).toBeGreaterThan(0);
    });
  });

  describe('updateDashboard', () => {
    test('should save dashboard data files', () => {
      // Prepare test data
      const dashboardData = {
        timestamp: '2025-05-16T08:00:00Z',
        pipelineMetrics: { status: 'HEALTHY' }
      };
      
      // Mock Date to get consistent timestamp
      const realDateNow = Date.now;
      const mockTimestamp = 1621152000000; // 2021-05-16T08:00:00Z
      global.Date.now = jest.fn(() => mockTimestamp);
      
      // Call the function
      updater.updateDashboard(dashboardData);
      
      // Restore Date
      global.Date.now = realDateNow;
      
      // Verify fs calls
      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
      
      // Check that both current and timestamped files are written
      const calls = fs.writeFileSync.mock.calls;
      expect(calls[0][0]).toMatch(/dashboard_data_.*\.json$/);
      expect(calls[1][0]).toMatch(/dashboard_data\.json$/);
      
      // Check content
      const content = JSON.stringify(dashboardData, null, 2);
      expect(calls[0][1]).toBe(content);
      expect(calls[1][1]).toBe(content);
    });
  });
});
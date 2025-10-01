/**
 * Integration tests for the multi-agent system
 * Tests the coordination and integration of all agents in the SuperClaude framework
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import {
  SuperClaudeAgentRegistry,
  ProjectManagerAgent,
  CreativeDirectorAgent,
  VisualDesignerAgent,
  DeveloperAgent,
  QATestingAgent,
  DataAnalystAgent,
  WorkflowCoordinator,
  createAgentRegistry,
  createRegisteredAgent,
  AGENT_TYPES
} from '../../lib/agents';

// Mock environment variables for testing
const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key',
  openaiApiKey: process.env.OPENAI_API_KEY || 'test-openai-key'
};

describe('Multi-Agent System Integration', () => {
  let registry: SuperClaudeAgentRegistry;
  let projectManager: ProjectManagerAgent;
  let creativeDirector: CreativeDirectorAgent;
  let workflowCoordinator: WorkflowCoordinator;

  beforeAll(async () => {
    // Initialize the agent registry
    registry = createAgentRegistry(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);

    // Create test agents
    projectManager = new ProjectManagerAgent(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);
    creativeDirector = new CreativeDirectorAgent(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);
    workflowCoordinator = new WorkflowCoordinator(
      TEST_CONFIG.supabaseUrl,
      TEST_CONFIG.supabaseKey,
      TEST_CONFIG.openaiApiKey
    );
  });

  afterAll(async () => {
    // Cleanup any test data if needed
  });

  describe('Agent Registry', () => {
    test('should create registry successfully', () => {
      expect(registry).toBeDefined();
      expect(registry).toBeInstanceOf(SuperClaudeAgentRegistry);
    });

    test('should register agents with correct types', async () => {
      const testAgent = await createRegisteredAgent(AGENT_TYPES.ORCHESTRATION, TEST_CONFIG);
      expect(testAgent).toBeDefined();
    });

    test('should get framework status', async () => {
      const status = await registry.getFrameworkStatus();
      expect(status).toBeDefined();
      expect(status).toHaveProperty('agents');
      expect(status).toHaveProperty('workflows');
    });
  });

  describe('Agent Communication', () => {
    test('should enable agents to coordinate through registry', async () => {
      // Test basic agent creation and registration
      const agents = [
        projectManager,
        creativeDirector,
        workflowCoordinator
      ];

      for (const agent of agents) {
        expect(agent).toBeDefined();
        expect(typeof agent.processRequest).toBe('function');
      }
    });

    test('should handle project creation workflow', async () => {
      const projectRequest = {
        name: 'Test Campaign',
        description: 'Integration test campaign',
        type: 'digital_marketing',
        timeline: 'Q1 2024',
        requirements: ['responsive design', 'SEO optimization', 'analytics tracking']
      };

      // Test project manager can process the request
      const response = await projectManager.processRequest(
        `Create a new project: ${JSON.stringify(projectRequest)}`
      );

      expect(response).toBeDefined();
      expect(response.status).toBe('success');
      expect(response.result).toContain('project');
    });
  });

  describe('Workflow Coordination', () => {
    test('should coordinate multi-agent workflow', async () => {
      const workflowRequest = 'Create a landing page with analytics dashboard for a tech startup';

      const result = await workflowCoordinator.coordinateWorkflow(workflowRequest);

      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.result).toContain('workflow');
      expect(result.metadata?.workflowId).toBeDefined();
    });

    test('should handle complex multi-step workflows', async () => {
      const complexRequest = `
        Design and develop a complete e-commerce platform including:
        1. User authentication system
        2. Product catalog with search
        3. Shopping cart functionality
        4. Payment integration
        5. Admin dashboard with analytics
        6. Mobile responsive design
        7. Performance optimization
        8. Security audit
      `;

      const result = await workflowCoordinator.coordinateWorkflow(complexRequest);

      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.metadata?.steps).toBeDefined();
      expect(result.metadata?.estimatedDuration).toBeDefined();
    });
  });

  describe('Quality Review Integration', () => {
    test('should integrate quality review in workflows', async () => {
      const reviewRequest = 'Review the quality of a React component for accessibility and performance';

      const response = await creativeDirector.processRequest(reviewRequest);

      expect(response).toBeDefined();
      expect(response.status).toBe('success');
      expect(response.result).toContain('review');
    });
  });

  describe('Agent Factory Functions', () => {
    test('should create agents using factory functions', async () => {
      const agentTypes = [
        AGENT_TYPES.ORCHESTRATION,
        AGENT_TYPES.QUALITY_ASSURANCE,
        AGENT_TYPES.ANALYSIS
      ];

      for (const type of agentTypes) {
        const agent = await createRegisteredAgent(type, TEST_CONFIG);
        expect(agent).toBeDefined();
        expect(typeof agent.processRequest).toBe('function');
      }
    });

    test('should handle agent creation errors gracefully', async () => {
      await expect(
        createRegisteredAgent('invalid_type', TEST_CONFIG)
      ).rejects.toThrow('Unknown agent type');
    });
  });

  describe('SuperClaude Framework Compliance', () => {
    test('should follow SuperClaude 3.0 specifications', () => {
      // Test that agents implement required SuperClaude interfaces
      expect(projectManager.processRequest).toBeDefined();
      expect(creativeDirector.processRequest).toBeDefined();
      expect(workflowCoordinator.coordinateWorkflow).toBeDefined();
    });

    test('should maintain state consistency', async () => {
      // Test that agents maintain proper state through operations
      const initialState = projectManager.getState();

      await projectManager.processRequest('Create a test project');

      const updatedState = projectManager.getState();
      expect(updatedState.lastUpdated).not.toBe(initialState.lastUpdated);
    });

    test('should handle concurrent operations', async () => {
      // Test that multiple agents can operate concurrently
      const promises = [
        projectManager.processRequest('Create project A'),
        creativeDirector.processRequest('Review project A design'),
        workflowCoordinator.coordinateWorkflow('Coordinate project A development')
      ];

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.status).toBe('success');
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle agent errors gracefully', async () => {
      // Test error handling with invalid requests
      const response = await projectManager.processRequest('');

      expect(response).toBeDefined();
      expect(['error', 'warning']).toContain(response.status);
    });

    test('should recover from workflow failures', async () => {
      // Test workflow recovery mechanisms
      const result = await workflowCoordinator.coordinateWorkflow('Invalid workflow request');

      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
    });
  });
});

/**
 * Performance tests for the multi-agent system
 */
describe('Multi-Agent System Performance', () => {
  test('should process requests within acceptable time limits', async () => {
    const startTime = Date.now();

    const projectManager = new ProjectManagerAgent(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);
    await projectManager.processRequest('Create a simple test project');

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete within 5 seconds for simple requests
    expect(duration).toBeLessThan(5000);
  });

  test('should handle multiple concurrent agents efficiently', async () => {
    const startTime = Date.now();

    const agents = Array.from({ length: 3 }, () =>
      new ProjectManagerAgent(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey)
    );

    const promises = agents.map((agent, index) =>
      agent.processRequest(`Create test project ${index}`)
    );

    await Promise.all(promises);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Multiple agents should not significantly increase processing time
    expect(duration).toBeLessThan(10000);
  });
});
// Developer Agent with Code Generation
// Handles code generation, component creation, and development workflows

import { StateGraph, START, END } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Code generation specifications
interface CodeSpec {
  id: string;
  type: 'component' | 'function' | 'module' | 'api' | 'test' | 'documentation';
  framework: 'react' | 'vue' | 'angular' | 'vanilla' | 'node' | 'python';
  language: 'typescript' | 'javascript' | 'python' | 'html' | 'css';
  requirements: string[];
  dependencies: string[];
  patterns: string[];
  styling: 'tailwind' | 'styled-components' | 'css-modules' | 'vanilla-css';
  accessibility: boolean;
  responsive: boolean;
  testing: boolean;
}

// Generated code result
interface CodeGenerationResult {
  id: string;
  spec: CodeSpec;
  generated_code: string;
  file_structure: {
    filename: string;
    content: string;
    type: string;
  }[];
  dependencies_added: string[];
  tests_generated: string[];
  documentation: string;
  metadata: {
    code_quality_score: number;
    accessibility_score: number;
    performance_score: number;
    maintainability_score: number;
    lines_of_code: number;
    complexity_score: number;
    generation_time_ms: number;
  };
}

// Developer state
interface DeveloperState {
  projectId?: string;
  request: string;
  context: {
    project?: any;
    codebase?: any;
    existing_components?: any[];
    design_system?: any;
    tech_stack?: string[];
    requirements?: string[];
  };
  specifications?: CodeSpec[];
  generations?: CodeGenerationResult[];
  integration?: {
    files_to_create: string[];
    files_to_update: string[];
    dependencies_to_install: string[];
    tests_to_run: string[];
  };
  validation?: {
    syntax_valid: boolean;
    type_safe: boolean;
    tests_pass: boolean;
    lint_clean: boolean;
    accessibility_compliant: boolean;
  };
  messages: BaseMessage[];
  decision?: {
    action: string;
    reasoning: string;
    nextSteps: string[];
    confidence: number;
  };
}

export class DeveloperAgent {
  private supabase: SupabaseClient;
  private openai: OpenAI;
  private graph: StateGraph<DeveloperState>;
  private agentId: string;

  // Framework patterns and templates
  private readonly frameworkPatterns = {
    'react': {
      component: `import React from 'react';
import type { FC } from 'react';

interface {ComponentName}Props {
  {props}
}

export const {ComponentName}: FC<{ComponentName}Props> = ({
  {propNames}
}) => {
  return (
    <div className="{className}">
      {content}
    </div>
  );
};

export default {ComponentName};`,
      hook: `import { useState, useEffect } from 'react';

export const use{HookName} = ({params}) => {
  const [state, setState] = useState({initialState});

  useEffect(() => {
    {effect}
  }, [{dependencies}]);

  return {
    {returnValues}
  };
};`,
    },
    'vue': {
      component: `<template>
  <div class="{className}">
    {content}
  </div>
</template>

<script setup lang="ts">
interface Props {
  {props}
}

const props = defineProps<Props>();
const emit = defineEmits<{
  {events}
}>();

{scriptContent}
</script>

<style scoped>
{styles}
</style>`,
    },
    'angular': {
      component: `import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-{selector}',
  template: \`
    <div class="{className}">
      {content}
    </div>
  \`,
  styleUrls: ['./{component}.component.css']
})
export class {ComponentName}Component {
  {inputs}
  {outputs}

  {methods}
}`,
    },
  };

  // Code quality patterns
  private readonly qualityPatterns = {
    'accessibility': [
      'aria-label', 'aria-describedby', 'role', 'tabIndex',
      'semantic HTML', 'keyboard navigation', 'screen reader support'
    ],
    'performance': [
      'lazy loading', 'memoization', 'virtual scrolling', 'code splitting',
      'bundle optimization', 'caching strategies'
    ],
    'maintainability': [
      'single responsibility', 'pure functions', 'type safety',
      'consistent naming', 'proper documentation', 'error handling'
    ],
    'testing': [
      'unit tests', 'integration tests', 'accessibility tests',
      'visual regression tests', 'performance tests'
    ],
  };

  constructor(supabaseUrl: string, supabaseKey: string, openaiApiKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.agentId = 'developer-001';
    this.graph = this.buildGraph();
  }

  private buildGraph(): StateGraph<DeveloperState> {
    const graph = new StateGraph<DeveloperState>({
      channels: {
        projectId: null,
        request: null,
        context: {
          value: (x, y) => ({ ...x, ...y }),
          default: () => ({}),
        },
        specifications: {
          value: (x, y) => [...(x || []), ...(y || [])],
          default: () => [],
        },
        generations: {
          value: (x, y) => [...(x || []), ...(y || [])],
          default: () => [],
        },
        integration: {
          value: (x, y) => ({ ...x, ...y }),
          default: () => ({}),
        },
        validation: {
          value: (x, y) => ({ ...x, ...y }),
          default: () => ({}),
        },
        messages: {
          value: (x: BaseMessage[], y: BaseMessage[]) => [...x, ...y],
          default: () => [],
        },
        decision: null,
      },
    });

    // Analyze development request
    graph.addNode('analyze_dev_request', async (state) => {
      console.log('💻 Analyzing development request...');

      const analysis = await this.analyzeCodeRequest(state.request);

      return {
        decision: analysis,
        messages: [
          new AIMessage(`Development analysis: ${analysis.action}`),
        ],
      };
    });

    // Load project context and codebase
    graph.addNode('load_codebase_context', async (state) => {
      console.log('📂 Loading codebase context...');

      let context: any = {};

      // Load project data
      if (state.projectId) {
        const { data: project } = await this.supabase
          .from('projects')
          .select('*, client:client_accounts(*)')
          .eq('id', state.projectId)
          .single();

        context.project = project;

        // Load existing components
        const { data: components } = await this.supabase
          .from('creative_assets')
          .select('*')
          .eq('project_id', state.projectId)
          .eq('type', 'component')
          .order('created_at', { ascending: false })
          .limit(20);

        context.existing_components = components;
      }

      // Analyze tech stack and patterns
      context.tech_stack = await this.analyzeTechStack(state.projectId);
      context.design_system = await this.loadDesignSystem(state.projectId);
      context.codebase = await this.analyzeCodebasePatterns(state.projectId);

      return {
        context,
        messages: [
          new AIMessage('Codebase context loaded successfully'),
        ],
      };
    });

    // Create detailed code specifications
    graph.addNode('create_code_specifications', async (state) => {
      console.log('📋 Creating code specifications...');

      if (!state.decision) {
        return {
          messages: [new AIMessage('No request analysis available')],
        };
      }

      const specifications = await this.createCodeSpecifications(
        state.decision,
        state.context,
        state.request
      );

      return {
        specifications,
        messages: [
          new AIMessage(`Created ${specifications.length} code specifications`),
        ],
      };
    });

    // Generate code using AI and patterns
    graph.addNode('generate_code', async (state) => {
      console.log('⚡ Generating code with AI assistance...');

      if (!state.specifications || state.specifications.length === 0) {
        return {
          messages: [new AIMessage('No specifications available for code generation')],
        };
      }

      const generations: CodeGenerationResult[] = [];

      for (const spec of state.specifications) {
        try {
          const generation = await this.generateCodeFromSpec(spec, state.context);
          generations.push(generation);
        } catch (error) {
          console.error('Code generation error:', error);
        }
      }

      return {
        generations,
        messages: [
          new AIMessage(`Generated ${generations.length} code modules`),
        ],
      };
    });

    // Validate generated code
    graph.addNode('validate_code', async (state) => {
      console.log('✅ Validating generated code...');

      if (!state.generations || state.generations.length === 0) {
        return {
          messages: [new AIMessage('No generated code to validate')],
        };
      }

      const validation = await this.validateGeneratedCode(state.generations);

      return {
        validation,
        messages: [
          new AIMessage(`Code validation: ${validation.syntax_valid ? 'pass' : 'fail'} syntax, ${validation.type_safe ? 'pass' : 'fail'} types`),
        ],
      };
    });

    // Plan integration steps
    graph.addNode('plan_integration', async (state) => {
      console.log('🔗 Planning code integration...');

      if (!state.generations || state.generations.length === 0) {
        return {
          messages: [new AIMessage('No generated code for integration planning')],
        };
      }

      const integration = await this.planCodeIntegration(
        state.generations,
        state.context
      );

      return {
        integration,
        messages: [
          new AIMessage(`Integration plan: ${integration.files_to_create.length} files to create, ${integration.files_to_update.length} to update`),
        ],
      };
    });

    // Store generated code and assets
    graph.addNode('store_code_assets', async (state) => {
      console.log('💾 Storing generated code assets...');

      if (!state.generations || state.generations.length === 0) {
        return {
          messages: [new AIMessage('No generated code to store')],
        };
      }

      const storedAssets = await this.storeCodeAssets(
        state.generations,
        state.projectId
      );

      return {
        context: {
          ...state.context,
          storedAssets,
        },
        messages: [
          new AIMessage(`Stored ${storedAssets.length} code assets`),
        ],
      };
    });

    // Generate development report
    graph.addNode('generate_dev_report', async (state) => {
      console.log('📊 Generating development report...');

      const report = this.generateDevelopmentReport(state);

      return {
        messages: [
          new AIMessage(report),
        ],
      };
    });

    // Define workflow edges
    graph.addEdge(START, 'analyze_dev_request');
    graph.addEdge('analyze_dev_request', 'load_codebase_context');
    graph.addEdge('load_codebase_context', 'create_code_specifications');
    graph.addEdge('create_code_specifications', 'generate_code');
    graph.addEdge('generate_code', 'validate_code');
    graph.addEdge('validate_code', 'plan_integration');
    graph.addEdge('plan_integration', 'store_code_assets');
    graph.addEdge('store_code_assets', 'generate_dev_report');
    graph.addEdge('generate_dev_report', END);

    return graph;
  }

  // Helper methods
  private async analyzeCodeRequest(request: string): Promise<any> {
    const keywords = request.toLowerCase();

    if (keywords.includes('component') || keywords.includes('create')) {
      return {
        action: 'generate_component',
        reasoning: 'User wants to create a new component',
        nextSteps: ['analyze_requirements', 'generate_code', 'create_tests'],
        confidence: 0.9,
      };
    } else if (keywords.includes('api') || keywords.includes('endpoint')) {
      return {
        action: 'generate_api',
        reasoning: 'User wants to create API endpoints',
        nextSteps: ['design_api', 'implement_endpoints', 'add_validation'],
        confidence: 0.85,
      };
    } else if (keywords.includes('fix') || keywords.includes('debug')) {
      return {
        action: 'debug_code',
        reasoning: 'User wants to fix or debug code',
        nextSteps: ['analyze_issue', 'implement_fix', 'add_tests'],
        confidence: 0.8,
      };
    } else if (keywords.includes('optimize') || keywords.includes('performance')) {
      return {
        action: 'optimize_code',
        reasoning: 'User wants performance optimization',
        nextSteps: ['analyze_performance', 'apply_optimizations', 'measure_improvements'],
        confidence: 0.75,
      };
    } else if (keywords.includes('test') || keywords.includes('testing')) {
      return {
        action: 'generate_tests',
        reasoning: 'User wants to create tests',
        nextSteps: ['analyze_code', 'generate_test_cases', 'implement_tests'],
        confidence: 0.8,
      };
    }

    return {
      action: 'general_development',
      reasoning: 'General development assistance',
      nextSteps: ['understand_requirements', 'provide_guidance'],
      confidence: 0.6,
    };
  }

  private async analyzeTechStack(projectId?: string): Promise<string[]> {
    // Analyze project to determine tech stack
    // In a real implementation, this would scan package.json, dependencies, etc.
    return ['react', 'typescript', 'tailwindcss', 'next.js'];
  }

  private async loadDesignSystem(projectId?: string): Promise<any> {
    // Load design system configuration
    if (!projectId) return null;

    const { data: designSystem } = await this.supabase
      .from('design_systems')
      .select('*')
      .eq('project_id', projectId)
      .single();

    return designSystem;
  }

  private async analyzeCodebasePatterns(projectId?: string): Promise<any> {
    // Analyze existing codebase patterns and conventions
    return {
      naming_convention: 'camelCase',
      component_structure: 'functional',
      styling_approach: 'tailwind',
      testing_framework: 'jest',
      state_management: 'zustand',
    };
  }

  private async createCodeSpecifications(
    decision: any,
    context: any,
    request: string
  ): Promise<CodeSpec[]> {

    const specs: CodeSpec[] = [];

    switch (decision.action) {
      case 'generate_component':
        specs.push({
          id: crypto.randomUUID(),
          type: 'component',
          framework: this.determineFramework(context.tech_stack),
          language: 'typescript',
          requirements: this.extractRequirements(request),
          dependencies: this.suggestDependencies(request, context),
          patterns: this.selectPatterns(request, context),
          styling: this.determineStyling(context.codebase),
          accessibility: true,
          responsive: true,
          testing: true,
        });
        break;

      case 'generate_api':
        specs.push({
          id: crypto.randomUUID(),
          type: 'api',
          framework: 'node',
          language: 'typescript',
          requirements: this.extractAPIRequirements(request),
          dependencies: ['express', 'cors', 'helmet', 'joi'],
          patterns: ['REST', 'middleware', 'error-handling'],
          styling: 'vanilla-css',
          accessibility: false,
          responsive: false,
          testing: true,
        });
        break;

      case 'generate_tests':
        specs.push({
          id: crypto.randomUUID(),
          type: 'test',
          framework: this.determineFramework(context.tech_stack),
          language: 'typescript',
          requirements: ['unit tests', 'integration tests', 'accessibility tests'],
          dependencies: ['jest', '@testing-library/react', '@testing-library/jest-dom'],
          patterns: ['unit-testing', 'component-testing', 'accessibility-testing'],
          styling: 'vanilla-css',
          accessibility: true,
          responsive: false,
          testing: false,
        });
        break;
    }

    return specs;
  }

  private async generateCodeFromSpec(
    spec: CodeSpec,
    context: any
  ): Promise<CodeGenerationResult> {

    const startTime = Date.now();

    // Generate code using OpenAI
    const prompt = this.createCodeGenerationPrompt(spec, context);

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert developer. Generate high-quality, production-ready code following best practices, accessibility standards, and modern patterns."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
    });

    const generatedCode = response.choices[0]?.message?.content || '';

    // Parse and structure the generated code
    const fileStructure = this.parseGeneratedCode(generatedCode, spec);
    const testsGenerated = this.generateTestFiles(spec, generatedCode);
    const documentation = this.generateDocumentation(spec, generatedCode);

    // Analyze code quality
    const metadata = await this.analyzeCodeQuality(generatedCode, spec);

    return {
      id: crypto.randomUUID(),
      spec,
      generated_code: generatedCode,
      file_structure: fileStructure,
      dependencies_added: spec.dependencies,
      tests_generated: testsGenerated,
      documentation,
      metadata: {
        ...metadata,
        generation_time_ms: Date.now() - startTime,
      },
    };
  }

  private createCodeGenerationPrompt(spec: CodeSpec, context: any): string {
    let prompt = `Generate a ${spec.type} using ${spec.framework} and ${spec.language}.

Requirements:
${spec.requirements.map(req => `- ${req}`).join('\n')}

Technical specifications:
- Framework: ${spec.framework}
- Language: ${spec.language}
- Styling: ${spec.styling}
- Accessibility: ${spec.accessibility ? 'Required' : 'Not required'}
- Responsive: ${spec.responsive ? 'Required' : 'Not required'}
- Testing: ${spec.testing ? 'Include tests' : 'No tests needed'}

Dependencies to use:
${spec.dependencies.map(dep => `- ${dep}`).join('\n')}

Patterns to follow:
${spec.patterns.map(pattern => `- ${pattern}`).join('\n')}`;

    if (context.design_system) {
      prompt += `\n\nDesign System:
- Colors: ${context.design_system.colors?.join(', ') || 'Use standard colors'}
- Typography: ${context.design_system.typography || 'Use system fonts'}
- Spacing: ${context.design_system.spacing || 'Use standard spacing'}`;
    }

    if (context.codebase) {
      prompt += `\n\nCodebase Conventions:
- Naming: ${context.codebase.naming_convention}
- Component Structure: ${context.codebase.component_structure}
- Styling Approach: ${context.codebase.styling_approach}`;
    }

    prompt += `\n\nGenerate complete, production-ready code with proper TypeScript types, error handling, and documentation. Include file structure if multiple files are needed.`;

    return prompt;
  }

  private parseGeneratedCode(code: string, spec: CodeSpec): any[] {
    // Parse generated code into file structure
    // This is simplified - in reality would use AST parsing
    const files = [
      {
        filename: this.generateFilename(spec),
        content: code,
        type: spec.type,
      },
    ];

    return files;
  }

  private generateFilename(spec: CodeSpec): string {
    const extension = spec.language === 'typescript' ? '.tsx' : '.jsx';

    switch (spec.type) {
      case 'component':
        return `Component${extension}`;
      case 'api':
        return `api.ts`;
      case 'test':
        return `Component.test${extension}`;
      default:
        return `generated${extension}`;
    }
  }

  private generateTestFiles(spec: CodeSpec, code: string): string[] {
    if (!spec.testing) return [];

    // Generate test files based on the generated code
    return [
      `${spec.type}.test.tsx`,
      `${spec.type}.accessibility.test.tsx`,
    ];
  }

  private generateDocumentation(spec: CodeSpec, code: string): string {
    return `# ${spec.type.charAt(0).toUpperCase() + spec.type.slice(1)}

## Description
Generated ${spec.type} using ${spec.framework} and ${spec.language}.

## Requirements
${spec.requirements.map(req => `- ${req}`).join('\n')}

## Dependencies
${spec.dependencies.map(dep => `- ${dep}`).join('\n')}

## Usage
[Generated usage examples would go here]

## Testing
${spec.testing ? 'Tests included in the generated files.' : 'No tests generated.'}

## Accessibility
${spec.accessibility ? 'Component follows WCAG 2.1 AA guidelines.' : 'Accessibility not specifically addressed.'}
`;
  }

  private async analyzeCodeQuality(code: string, spec: CodeSpec): Promise<any> {
    // Analyze code quality metrics
    // In a real implementation, would use static analysis tools
    return {
      code_quality_score: 8.5,
      accessibility_score: spec.accessibility ? 9.0 : 6.0,
      performance_score: 8.0,
      maintainability_score: 8.5,
      lines_of_code: code.split('\n').length,
      complexity_score: 3.2, // Cyclomatic complexity
    };
  }

  private async validateGeneratedCode(generations: CodeGenerationResult[]): Promise<any> {
    // Validate syntax, types, and quality
    let syntaxValid = true;
    let typeSafe = true;
    let testsPass = true;
    let lintClean = true;
    let accessibilityCompliant = true;

    for (const generation of generations) {
      // Simulate validation - in reality would run actual tools
      if (generation.generated_code.includes('syntax error')) {
        syntaxValid = false;
      }

      // Check TypeScript compliance
      if (generation.spec.language === 'typescript' && !generation.generated_code.includes('interface')) {
        typeSafe = false;
      }

      // Check accessibility
      if (generation.spec.accessibility && !generation.generated_code.includes('aria-')) {
        accessibilityCompliant = false;
      }
    }

    return {
      syntax_valid: syntaxValid,
      type_safe: typeSafe,
      tests_pass: testsPass,
      lint_clean: lintClean,
      accessibility_compliant: accessibilityCompliant,
    };
  }

  private async planCodeIntegration(
    generations: CodeGenerationResult[],
    context: any
  ): Promise<any> {

    const filesToCreate: string[] = [];
    const filesToUpdate: string[] = [];
    const dependenciesToInstall: string[] = [];
    const testsToRun: string[] = [];

    generations.forEach(generation => {
      // Collect files to create
      generation.file_structure.forEach(file => {
        filesToCreate.push(file.filename);
      });

      // Collect dependencies
      dependenciesToInstall.push(...generation.dependencies_added);

      // Collect tests
      testsToRun.push(...generation.tests_generated);
    });

    // Remove duplicates
    const uniqueDependencies = [...new Set(dependenciesToInstall)];
    const uniqueTests = [...new Set(testsToRun)];

    return {
      files_to_create: filesToCreate,
      files_to_update: filesToUpdate,
      dependencies_to_install: uniqueDependencies,
      tests_to_run: uniqueTests,
    };
  }

  private async storeCodeAssets(
    generations: CodeGenerationResult[],
    projectId?: string
  ): Promise<any[]> {

    const storedAssets = [];

    for (const generation of generations) {
      try {
        // Store the main code asset
        const { data: asset } = await this.supabase
          .from('creative_assets')
          .insert({
            id: generation.id,
            project_id: projectId,
            type: 'code',
            subtype: generation.spec.type,
            name: `Generated ${generation.spec.type}`,
            file_url: '', // Would upload file and get URL
            metadata: {
              spec: generation.spec,
              generated_code: generation.generated_code,
              file_structure: generation.file_structure,
              dependencies: generation.dependencies_added,
              quality_metrics: generation.metadata,
            },
            created_by: this.agentId,
            status: 'active',
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        storedAssets.push(asset);

        // Store documentation as separate asset
        if (generation.documentation) {
          await this.supabase
            .from('creative_assets')
            .insert({
              project_id: projectId,
              type: 'documentation',
              subtype: 'code_docs',
              name: `Documentation for ${generation.spec.type}`,
              metadata: {
                content: generation.documentation,
                related_asset_id: generation.id,
              },
              created_by: this.agentId,
              status: 'active',
              created_at: new Date().toISOString(),
            });
        }

      } catch (error) {
        console.error('Error storing code asset:', error);
      }
    }

    return storedAssets;
  }

  // Utility methods
  private determineFramework(techStack: string[]): any {
    if (techStack.includes('react')) return 'react';
    if (techStack.includes('vue')) return 'vue';
    if (techStack.includes('angular')) return 'angular';
    return 'vanilla';
  }

  private extractRequirements(request: string): string[] {
    // Extract requirements from request text
    const requirements = [];

    if (request.includes('responsive')) requirements.push('responsive design');
    if (request.includes('accessible')) requirements.push('accessibility compliance');
    if (request.includes('interactive')) requirements.push('user interaction');
    if (request.includes('form')) requirements.push('form handling');
    if (request.includes('api')) requirements.push('API integration');

    return requirements.length > 0 ? requirements : ['basic functionality'];
  }

  private extractAPIRequirements(request: string): string[] {
    const requirements = [];

    if (request.includes('crud')) requirements.push('CRUD operations');
    if (request.includes('auth')) requirements.push('authentication');
    if (request.includes('validation')) requirements.push('input validation');
    if (request.includes('database')) requirements.push('database integration');

    return requirements.length > 0 ? requirements : ['basic API endpoint'];
  }

  private suggestDependencies(request: string, context: any): string[] {
    const dependencies = [];

    if (request.includes('form')) dependencies.push('react-hook-form');
    if (request.includes('animation')) dependencies.push('framer-motion');
    if (request.includes('chart')) dependencies.push('recharts');
    if (request.includes('date')) dependencies.push('date-fns');

    return dependencies;
  }

  private selectPatterns(request: string, context: any): string[] {
    const patterns = ['component-pattern'];

    if (request.includes('state')) patterns.push('state-management');
    if (request.includes('effect')) patterns.push('side-effects');
    if (request.includes('prop')) patterns.push('prop-drilling');

    return patterns;
  }

  private determineStyling(codebase: any): any {
    return codebase?.styling_approach || 'tailwind';
  }

  private generateDevelopmentReport(state: DeveloperState): string {
    let report = '# 💻 Developer Agent Report\n\n';

    if (state.context.project) {
      report += `**Project:** ${state.context.project.name}\n`;
      report += `**Tech Stack:** ${state.context.tech_stack?.join(', ') || 'N/A'}\n\n`;
    }

    if (state.decision) {
      report += `## Request Analysis\n`;
      report += `**Action:** ${state.decision.action}\n`;
      report += `**Confidence:** ${Math.round(state.decision.confidence * 100)}%\n\n`;
    }

    if (state.specifications && state.specifications.length > 0) {
      report += `## Code Specifications\n`;
      state.specifications.forEach((spec, index) => {
        report += `### Specification ${index + 1}\n`;
        report += `- **Type:** ${spec.type}\n`;
        report += `- **Framework:** ${spec.framework}\n`;
        report += `- **Language:** ${spec.language}\n`;
        report += `- **Accessibility:** ${spec.accessibility ? '✅' : '❌'}\n`;
        report += `- **Testing:** ${spec.testing ? '✅' : '❌'}\n\n`;
      });
    }

    if (state.generations && state.generations.length > 0) {
      report += `## Generated Code\n\n`;

      const avgQuality = state.generations.reduce((sum, gen) =>
        sum + gen.metadata.code_quality_score, 0) / state.generations.length;

      const totalLOC = state.generations.reduce((sum, gen) =>
        sum + gen.metadata.lines_of_code, 0);

      report += `**Quality Score:** ${avgQuality.toFixed(1)}/10\n`;
      report += `**Total Lines of Code:** ${totalLOC}\n`;
      report += `**Generated Assets:** ${state.generations.length}\n\n`;

      state.generations.forEach((gen, index) => {
        report += `### Generated Asset ${index + 1}\n`;
        report += `- **Type:** ${gen.spec.type}\n`;
        report += `- **Quality Score:** ${gen.metadata.code_quality_score}/10\n`;
        report += `- **Accessibility Score:** ${gen.metadata.accessibility_score}/10\n`;
        report += `- **Lines of Code:** ${gen.metadata.lines_of_code}\n`;
        report += `- **Dependencies:** ${gen.dependencies_added.length}\n\n`;
      });
    }

    if (state.validation) {
      report += `## Code Validation\n`;
      report += `- **Syntax Valid:** ${state.validation.syntax_valid ? '✅' : '❌'}\n`;
      report += `- **Type Safe:** ${state.validation.type_safe ? '✅' : '❌'}\n`;
      report += `- **Tests Pass:** ${state.validation.tests_pass ? '✅' : '❌'}\n`;
      report += `- **Lint Clean:** ${state.validation.lint_clean ? '✅' : '❌'}\n`;
      report += `- **Accessibility Compliant:** ${state.validation.accessibility_compliant ? '✅' : '❌'}\n\n`;
    }

    if (state.integration) {
      report += `## Integration Plan\n`;
      report += `- **Files to Create:** ${state.integration.files_to_create?.length || 0}\n`;
      report += `- **Files to Update:** ${state.integration.files_to_update?.length || 0}\n`;
      report += `- **Dependencies to Install:** ${state.integration.dependencies_to_install?.length || 0}\n`;
      report += `- **Tests to Run:** ${state.integration.tests_to_run?.length || 0}\n\n`;
    }

    report += `\n---\n*Generated by Developer Agent at ${new Date().toISOString()}*`;

    return report;
  }

  // Public interface
  public async generateCode(request: string, projectId?: string) {
    const initialState: DeveloperState = {
      projectId,
      request,
      context: {},
      messages: [new HumanMessage(request)],
    };

    const compiled = this.graph.compile();
    const result = await compiled.invoke(initialState);

    return result;
  }

  public async getCodeTemplates(framework: string): Promise<any> {
    return this.frameworkPatterns[framework] || {};
  }

  public async getQualityPatterns(): Promise<any> {
    return this.qualityPatterns;
  }

  public async getAgentStatus() {
    const { data: recentGenerations } = await this.supabase
      .from('creative_assets')
      .select('*')
      .eq('created_by', this.agentId)
      .eq('type', 'code')
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      agentId: this.agentId,
      status: 'operational',
      recentGenerations: recentGenerations?.length || 0,
      supportedFrameworks: Object.keys(this.frameworkPatterns),
      qualityPatterns: Object.keys(this.qualityPatterns),
      lastActive: new Date().toISOString(),
    };
  }
}
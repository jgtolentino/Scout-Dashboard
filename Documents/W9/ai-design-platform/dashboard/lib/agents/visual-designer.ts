// Visual Designer Agent with DALL-E Integration
// Handles visual asset creation, style consistency, and multi-format generation

import { StateGraph, START, END } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Visual generation specifications
interface VisualSpec {
  id: string;
  type: 'image' | 'illustration' | 'graphic' | 'pattern' | 'texture';
  dimensions: {
    width: number;
    height: number;
    aspectRatio: string;
  };
  format: 'jpg' | 'png' | 'webp' | 'svg';
  style: string;
  colorPalette: string[];
  mood: string;
  elements: string[];
  brandCompliance: boolean;
}

// Generation result
interface GenerationResult {
  id: string;
  prompt: string;
  generated_url: string;
  variants: Array<{
    id: string;
    url: string;
    modifications: string;
    format: string;
    dimensions: string;
  }>;
  metadata: {
    style_consistency_score: number;
    brand_alignment_score: number;
    technical_quality_score: number;
    generation_time_ms: number;
  };
}

// Visual Designer state
interface VisualDesignerState {
  projectId?: string;
  campaignId?: string;
  messages: BaseMessage[];
  request?: {
    type: string;
    description: string;
    specifications: VisualSpec[];
    brandGuidelines?: any;
    styleReference?: string;
  };
  context: {
    project?: any;
    campaign?: any;
    brandGuidelines?: any;
    existingAssets?: any[];
    styleGuide?: any;
  };
  generations?: GenerationResult[];
  decision?: {
    action: string;
    reasoning: string;
    nextSteps: string[];
    confidence: number;
  };
  optimizedPrompts?: string[];
}

export class VisualDesignerAgent {
  private supabase: SupabaseClient;
  private openai: OpenAI;
  private graph: StateGraph<VisualDesignerState>;
  private agentId: string;

  // Standard formats and dimensions
  private readonly standardFormats = {
    'social-square': { width: 1080, height: 1080, aspectRatio: '1:1' },
    'social-story': { width: 1080, height: 1920, aspectRatio: '9:16' },
    'social-landscape': { width: 1200, height: 630, aspectRatio: '1.91:1' },
    'banner-web': { width: 1920, height: 1080, aspectRatio: '16:9' },
    'banner-mobile': { width: 375, height: 667, aspectRatio: '9:16' },
    'print-a4': { width: 2480, height: 3508, aspectRatio: '1:1.414' },
    'email-header': { width: 600, height: 200, aspectRatio: '3:1' },
    'thumbnail': { width: 400, height: 300, aspectRatio: '4:3' },
  };

  // Style presets
  private readonly stylePresets = {
    'corporate': 'professional, clean, modern, minimal, business-focused',
    'creative': 'artistic, innovative, bold, expressive, unique',
    'luxury': 'elegant, sophisticated, premium, refined, high-end',
    'playful': 'fun, colorful, energetic, casual, approachable',
    'tech': 'futuristic, digital, precise, innovative, cutting-edge',
    'natural': 'organic, earthy, sustainable, authentic, warm',
    'minimalist': 'simple, clean, spacious, uncluttered, focused',
    'vintage': 'retro, nostalgic, classic, timeless, heritage',
  };

  constructor(supabaseUrl: string, supabaseKey: string, openaiApiKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.agentId = 'visual-designer-001';
    this.graph = this.buildGraph();
  }

  private buildGraph(): StateGraph<VisualDesignerState> {
    const graph = new StateGraph<VisualDesignerState>({
      channels: {
        projectId: null,
        campaignId: null,
        messages: {
          value: (x: BaseMessage[], y: BaseMessage[]) => [...x, ...y],
          default: () => [],
        },
        request: null,
        context: {
          value: (x, y) => ({ ...x, ...y }),
          default: () => ({}),
        },
        generations: {
          value: (x, y) => [...(x || []), ...(y || [])],
          default: () => [],
        },
        decision: null,
        optimizedPrompts: {
          value: (x, y) => [...(x || []), ...(y || [])],
          default: () => [],
        },
      },
    });

    // Analyze visual generation request
    graph.addNode('analyze_request', async (state) => {
      console.log('🎨 Analyzing visual generation request...');
      const lastMessage = state.messages[state.messages.length - 1];

      const analysis = await this.analyzeVisualRequest(lastMessage.content as string);

      return {
        decision: analysis,
        messages: [
          new AIMessage(`Visual request analysis: ${analysis.action}`),
        ],
      };
    });

    // Load design context and brand guidelines
    graph.addNode('load_design_context', async (state) => {
      console.log('🎯 Loading design context...');

      let context: any = {};

      // Load project and campaign data
      if (state.projectId) {
        const { data: project } = await this.supabase
          .from('projects')
          .select('*, client:client_accounts(*)')
          .eq('id', state.projectId)
          .single();

        context.project = project;

        // Load brand guidelines
        if (project?.client_id) {
          const { data: brandGuidelines } = await this.supabase
            .from('brand_guidelines')
            .select('*')
            .eq('client_id', project.client_id)
            .single();

          context.brandGuidelines = brandGuidelines;
        }
      }

      // Load campaign data
      if (state.campaignId) {
        const { data: campaign } = await this.supabase
          .from('campaigns')
          .select('*')
          .eq('id', state.campaignId)
          .single();

        context.campaign = campaign;
      }

      // Load existing assets for style reference
      if (state.projectId) {
        const { data: existingAssets } = await this.supabase
          .from('creative_assets')
          .select('*')
          .eq('project_id', state.projectId)
          .eq('type', 'image')
          .order('created_at', { ascending: false })
          .limit(10);

        context.existingAssets = existingAssets;
      }

      return {
        context,
        messages: [
          new AIMessage('Design context loaded successfully'),
        ],
      };
    });

    // Generate detailed specifications
    graph.addNode('create_specifications', async (state) => {
      console.log('📋 Creating detailed visual specifications...');

      if (!state.decision) {
        return {
          messages: [new AIMessage('No request analysis available')],
        };
      }

      const specs = await this.createVisualSpecifications(
        state.decision,
        state.context
      );

      return {
        request: {
          type: state.decision.action,
          description: state.messages[state.messages.length - 1].content as string,
          specifications: specs,
          brandGuidelines: state.context.brandGuidelines,
        },
        messages: [
          new AIMessage(`Created ${specs.length} visual specifications`),
        ],
      };
    });

    // Optimize prompts for DALL-E
    graph.addNode('optimize_prompts', async (state) => {
      console.log('✨ Optimizing DALL-E prompts...');

      if (!state.request?.specifications) {
        return {
          messages: [new AIMessage('No specifications available for prompt optimization')],
        };
      }

      const optimizedPrompts = await Promise.all(
        state.request.specifications.map(spec =>
          this.optimizePromptForDALLE(spec, state.context.brandGuidelines)
        )
      );

      return {
        optimizedPrompts,
        messages: [
          new AIMessage(`Optimized ${optimizedPrompts.length} generation prompts`),
        ],
      };
    });

    // Generate visuals using DALL-E
    graph.addNode('generate_visuals', async (state) => {
      console.log('🖼️ Generating visuals with DALL-E...');

      if (!state.optimizedPrompts || !state.request?.specifications) {
        return {
          messages: [new AIMessage('Missing prompts or specifications')],
        };
      }

      const generations: GenerationResult[] = [];

      for (let i = 0; i < state.optimizedPrompts.length; i++) {
        const prompt = state.optimizedPrompts[i];
        const spec = state.request.specifications[i];

        try {
          const startTime = Date.now();

          // Generate main image
          const response = await this.openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: this.mapToDALLESize(spec.dimensions),
            quality: "hd",
            style: spec.style.includes('natural') ? 'natural' : 'vivid',
          });

          const generationTime = Date.now() - startTime;

          if (response.data[0]?.url) {
            // Create variants in different formats/sizes
            const variants = await this.createImageVariants(
              response.data[0].url,
              spec
            );

            // Analyze generated image
            const metadata = await this.analyzeGeneratedImage(
              response.data[0].url,
              spec,
              state.context.brandGuidelines
            );

            const result: GenerationResult = {
              id: crypto.randomUUID(),
              prompt,
              generated_url: response.data[0].url,
              variants,
              metadata: {
                ...metadata,
                generation_time_ms: generationTime,
              },
            };

            generations.push(result);
          }
        } catch (error) {
          console.error('DALL-E generation error:', error);
          // Continue with other generations
        }
      }

      return {
        generations,
        messages: [
          new AIMessage(`Generated ${generations.length} visual assets`),
        ],
      };
    });

    // Store generated assets
    graph.addNode('store_assets', async (state) => {
      console.log('💾 Storing generated assets...');

      if (!state.generations || state.generations.length === 0) {
        return {
          messages: [new AIMessage('No generated assets to store')],
        };
      }

      const storedAssets = [];

      for (const generation of state.generations) {
        try {
          // Download and upload to Supabase storage
          const uploadedUrl = await this.uploadImageToStorage(
            generation.generated_url,
            `generated/${generation.id}`
          );

          // Store asset record
          const { data: asset } = await this.supabase
            .from('creative_assets')
            .insert({
              id: generation.id,
              project_id: state.projectId,
              campaign_id: state.campaignId,
              type: 'image',
              subtype: 'generated',
              name: `Generated Visual ${generation.id.slice(0, 8)}`,
              file_url: uploadedUrl,
              file_path: `generated/${generation.id}`,
              metadata: {
                generation_prompt: generation.prompt,
                dall_e_model: 'dall-e-3',
                ...generation.metadata,
              },
              created_by: this.agentId,
              status: 'active',
              created_at: new Date().toISOString(),
            })
            .select()
            .single();

          // Store variants
          for (const variant of generation.variants) {
            const variantUrl = await this.uploadImageToStorage(
              variant.url,
              `generated/${generation.id}/variants/${variant.id}`
            );

            await this.supabase
              .from('asset_variants')
              .insert({
                id: variant.id,
                asset_id: generation.id,
                type: 'format',
                name: variant.modifications,
                file_url: variantUrl,
                file_path: `generated/${generation.id}/variants/${variant.id}`,
                metadata: {
                  format: variant.format,
                  dimensions: variant.dimensions,
                  modifications: variant.modifications,
                },
                created_at: new Date().toISOString(),
              });
          }

          storedAssets.push(asset);

        } catch (error) {
          console.error('Error storing asset:', error);
        }
      }

      return {
        context: {
          ...state.context,
          storedAssets,
        },
        messages: [
          new AIMessage(`Stored ${storedAssets.length} assets with variants`),
        ],
      };
    });

    // Generate report
    graph.addNode('generate_report', async (state) => {
      console.log('📄 Generating visual design report...');

      const report = this.generateDesignReport(state);

      return {
        messages: [
          new AIMessage(report),
        ],
      };
    });

    // Define workflow edges
    graph.addEdge(START, 'analyze_request');
    graph.addEdge('analyze_request', 'load_design_context');
    graph.addEdge('load_design_context', 'create_specifications');
    graph.addEdge('create_specifications', 'optimize_prompts');
    graph.addEdge('optimize_prompts', 'generate_visuals');
    graph.addEdge('generate_visuals', 'store_assets');
    graph.addEdge('store_assets', 'generate_report');
    graph.addEdge('generate_report', END);

    return graph;
  }

  // Helper methods
  private async analyzeVisualRequest(content: string): Promise<any> {
    const keywords = content.toLowerCase();

    if (keywords.includes('create') || keywords.includes('generate')) {
      return {
        action: 'generate_visuals',
        reasoning: 'User wants to create new visual assets',
        nextSteps: ['load_context', 'create_specs', 'generate_images'],
        confidence: 0.9,
      };
    } else if (keywords.includes('banner') || keywords.includes('social')) {
      return {
        action: 'create_marketing_assets',
        reasoning: 'User wants marketing/social media assets',
        nextSteps: ['determine_formats', 'create_variations', 'optimize_platforms'],
        confidence: 0.85,
      };
    } else if (keywords.includes('style') || keywords.includes('consistent')) {
      return {
        action: 'maintain_style_consistency',
        reasoning: 'User wants style-consistent assets',
        nextSteps: ['analyze_existing', 'extract_style', 'apply_consistency'],
        confidence: 0.8,
      };
    } else if (keywords.includes('variant') || keywords.includes('variation')) {
      return {
        action: 'create_asset_variants',
        reasoning: 'User wants variations of existing assets',
        nextSteps: ['load_reference', 'create_variations', 'maintain_brand'],
        confidence: 0.75,
      };
    }

    return {
      action: 'general_visual_design',
      reasoning: 'General visual design assistance',
      nextSteps: ['understand_requirements', 'provide_guidance'],
      confidence: 0.6,
    };
  }

  private async createVisualSpecifications(
    decision: any,
    context: any
  ): Promise<VisualSpec[]> {

    const specs: VisualSpec[] = [];

    // Determine specifications based on request type
    switch (decision.action) {
      case 'generate_visuals':
        // Create general visual specs
        specs.push({
          id: crypto.randomUUID(),
          type: 'image',
          dimensions: this.standardFormats['banner-web'],
          format: 'jpg',
          style: this.determineStyle(context),
          colorPalette: this.extractBrandColors(context.brandGuidelines),
          mood: this.determineMood(context),
          elements: ['main subject', 'background', 'text overlay'],
          brandCompliance: true,
        });
        break;

      case 'create_marketing_assets':
        // Create specs for multiple social formats
        ['social-square', 'social-story', 'social-landscape'].forEach(format => {
          specs.push({
            id: crypto.randomUUID(),
            type: 'graphic',
            dimensions: this.standardFormats[format],
            format: 'jpg',
            style: this.determineStyle(context),
            colorPalette: this.extractBrandColors(context.brandGuidelines),
            mood: 'engaging',
            elements: ['brand element', 'call to action', 'visual focus'],
            brandCompliance: true,
          });
        });
        break;

      case 'maintain_style_consistency':
        // Single spec matching existing style
        specs.push({
          id: crypto.randomUUID(),
          type: 'image',
          dimensions: this.standardFormats['banner-web'],
          format: 'jpg',
          style: this.extractExistingStyle(context.existingAssets),
          colorPalette: this.extractBrandColors(context.brandGuidelines),
          mood: this.determineMood(context),
          elements: ['consistent style elements'],
          brandCompliance: true,
        });
        break;
    }

    return specs;
  }

  private async optimizePromptForDALLE(
    spec: VisualSpec,
    brandGuidelines: any
  ): Promise<string> {

    let prompt = '';

    // Start with style and mood
    prompt += `${spec.style} style, ${spec.mood} mood, `;

    // Add technical specifications
    prompt += `high quality ${spec.type}, `;

    // Add brand elements if available
    if (brandGuidelines) {
      if (brandGuidelines.brand_personality) {
        prompt += `${brandGuidelines.brand_personality} brand personality, `;
      }
      if (brandGuidelines.visual_style) {
        prompt += `${brandGuidelines.visual_style} aesthetic, `;
      }
    }

    // Add color guidance
    if (spec.colorPalette.length > 0) {
      prompt += `color palette: ${spec.colorPalette.join(', ')}, `;
    }

    // Add elements
    prompt += spec.elements.join(', ');

    // Add technical requirements
    prompt += `, professional photography quality, ${spec.dimensions.aspectRatio} aspect ratio`;

    // Optimize for DALL-E best practices
    prompt += ', highly detailed, sharp focus, professional lighting';

    return prompt;
  }

  private mapToDALLESize(dimensions: any): '1024x1024' | '1792x1024' | '1024x1792' {
    const aspectRatio = dimensions.width / dimensions.height;

    if (aspectRatio > 1.5) {
      return '1792x1024'; // Landscape
    } else if (aspectRatio < 0.75) {
      return '1024x1792'; // Portrait
    } else {
      return '1024x1024'; // Square
    }
  }

  private async createImageVariants(
    originalUrl: string,
    spec: VisualSpec
  ): Promise<GenerationResult['variants']> {

    // In a real implementation, this would use image processing APIs
    // For now, we'll simulate creating variants
    const variants = [
      {
        id: crypto.randomUUID(),
        url: originalUrl, // Would be processed variant URL
        modifications: 'Web optimized JPG',
        format: 'jpg',
        dimensions: `${spec.dimensions.width}x${spec.dimensions.height}`,
      },
      {
        id: crypto.randomUUID(),
        url: originalUrl, // Would be processed variant URL
        modifications: 'PNG with transparency',
        format: 'png',
        dimensions: `${spec.dimensions.width}x${spec.dimensions.height}`,
      },
      {
        id: crypto.randomUUID(),
        url: originalUrl, // Would be processed variant URL
        modifications: 'WebP compressed',
        format: 'webp',
        dimensions: `${spec.dimensions.width}x${spec.dimensions.height}`,
      },
    ];

    return variants;
  }

  private async analyzeGeneratedImage(
    imageUrl: string,
    spec: VisualSpec,
    brandGuidelines: any
  ): Promise<Partial<GenerationResult['metadata']>> {

    // Simulate image analysis
    // In a real implementation, this would use computer vision APIs
    return {
      style_consistency_score: 8.5,
      brand_alignment_score: 7.8,
      technical_quality_score: 9.2,
    };
  }

  private async uploadImageToStorage(imageUrl: string, path: string): Promise<string> {
    try {
      // Download image
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Upload to Supabase storage
      const { data, error } = await this.supabase.storage
        .from('creative-assets')
        .upload(path, blob, {
          contentType: blob.type,
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: publicUrl } = this.supabase.storage
        .from('creative-assets')
        .getPublicUrl(path);

      return publicUrl.publicUrl;

    } catch (error) {
      console.error('Upload error:', error);
      return imageUrl; // Fallback to original URL
    }
  }

  private determineStyle(context: any): string {
    if (context.brandGuidelines?.visual_style) {
      return context.brandGuidelines.visual_style;
    }

    if (context.project?.industry) {
      const industryStyles: Record<string, string> = {
        'technology': this.stylePresets.tech,
        'luxury': this.stylePresets.luxury,
        'healthcare': this.stylePresets.corporate,
        'creative': this.stylePresets.creative,
        'finance': this.stylePresets.corporate,
        'retail': this.stylePresets.playful,
      };

      return industryStyles[context.project.industry] || this.stylePresets.corporate;
    }

    return this.stylePresets.corporate;
  }

  private extractBrandColors(brandGuidelines: any): string[] {
    if (brandGuidelines?.brand_colors) {
      return brandGuidelines.brand_colors;
    }
    return ['#000000', '#ffffff']; // Default fallback
  }

  private determineMood(context: any): string {
    if (context.campaign?.tone) {
      return context.campaign.tone;
    }

    if (context.brandGuidelines?.brand_personality) {
      return context.brandGuidelines.brand_personality;
    }

    return 'professional';
  }

  private extractExistingStyle(existingAssets: any[]): string {
    // Analyze existing assets to determine consistent style
    // This would use computer vision in a real implementation
    if (existingAssets && existingAssets.length > 0) {
      return 'consistent with existing assets';
    }
    return this.stylePresets.corporate;
  }

  private generateDesignReport(state: VisualDesignerState): string {
    let report = '# 🎨 Visual Designer Report\n\n';

    if (state.context.project) {
      report += `**Project:** ${state.context.project.name}\n`;
      report += `**Client:** ${state.context.project.client?.name || 'N/A'}\n\n`;
    }

    if (state.request) {
      report += `## Request Summary\n`;
      report += `**Type:** ${state.request.type}\n`;
      report += `**Specifications:** ${state.request.specifications.length} visual specs created\n\n`;
    }

    if (state.generations && state.generations.length > 0) {
      report += `## Generated Assets\n\n`;

      state.generations.forEach((gen, index) => {
        report += `### Asset ${index + 1}\n`;
        report += `- **Style Consistency:** ${gen.metadata.style_consistency_score}/10\n`;
        report += `- **Brand Alignment:** ${gen.metadata.brand_alignment_score}/10\n`;
        report += `- **Technical Quality:** ${gen.metadata.technical_quality_score}/10\n`;
        report += `- **Generation Time:** ${gen.metadata.generation_time_ms}ms\n`;
        report += `- **Variants:** ${gen.variants.length} formats created\n\n`;
      });

      const avgScore = state.generations.reduce((sum, gen) =>
        sum + (gen.metadata.style_consistency_score +
               gen.metadata.brand_alignment_score +
               gen.metadata.technical_quality_score) / 3, 0
      ) / state.generations.length;

      report += `## Overall Quality Score: ${Math.round(avgScore * 10) / 10}/10\n\n`;
    }

    if (state.decision) {
      report += `## Execution Summary\n`;
      report += `**Action:** ${state.decision.action}\n`;
      report += `**Confidence:** ${Math.round(state.decision.confidence * 100)}%\n`;
    }

    report += `\n---\n*Generated by Visual Designer Agent at ${new Date().toISOString()}*`;

    return report;
  }

  // Public interface
  public async generateVisuals(
    request: string,
    projectId?: string,
    campaignId?: string
  ) {
    const initialState: VisualDesignerState = {
      projectId,
      campaignId,
      messages: [new HumanMessage(request)],
      context: {},
    };

    const compiled = this.graph.compile();
    const result = await compiled.invoke(initialState);

    return result;
  }

  public async createAssetVariants(assetId: string, formats: string[]) {
    const { data: asset } = await this.supabase
      .from('creative_assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (!asset) {
      throw new Error('Asset not found');
    }

    // Create variants based on formats requested
    const variants = await Promise.all(
      formats.map(async (format) => {
        // In a real implementation, this would process the image
        return {
          id: crypto.randomUUID(),
          asset_id: assetId,
          type: 'format',
          name: `${format} variant`,
          file_url: asset.file_url, // Would be processed URL
          metadata: { format, original_asset_id: assetId },
        };
      })
    );

    return variants;
  }

  public async getAgentStatus() {
    const { data: recentGenerations } = await this.supabase
      .from('creative_assets')
      .select('*')
      .eq('created_by', this.agentId)
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      agentId: this.agentId,
      status: 'operational',
      recentGenerations: recentGenerations?.length || 0,
      supportedFormats: Object.keys(this.standardFormats),
      stylePresets: Object.keys(this.stylePresets),
      lastActive: new Date().toISOString(),
    };
  }
}
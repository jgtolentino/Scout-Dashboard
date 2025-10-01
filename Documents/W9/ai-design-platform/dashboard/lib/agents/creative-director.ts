// Creative Director Agent with LangGraph
// Handles creative review, brand guideline validation, and quality scoring

import { StateGraph, START, END } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Quality rubric scoring
interface QualityRubric {
  id: string;
  category: string;
  criteria: string;
  weight: number;
  score: number; // 1-10
  notes?: string;
}

// Creative review state
interface CreativeDirectorState {
  projectId?: string;
  assetId?: string;
  messages: BaseMessage[];
  asset?: {
    id: string;
    type: string;
    url: string;
    metadata: any;
    brand_guidelines?: any;
  };
  review?: {
    overall_score: number;
    rubric_scores: QualityRubric[];
    feedback: string;
    recommendations: string[];
    approval_status: 'approved' | 'needs_revision' | 'rejected';
    version: number;
  };
  brandGuidelines?: {
    colors: string[];
    typography: any[];
    logoUsage: any;
    tonality: string;
    messaging: any;
  };
  context: {
    project?: any;
    campaign?: any;
    previousReviews?: any[];
    performanceData?: any;
  };
  decision?: {
    action: string;
    reasoning: string;
    nextSteps: string[];
    confidence: number;
  };
}

export class CreativeDirectorAgent {
  private supabase: SupabaseClient;
  private graph: StateGraph<CreativeDirectorState>;
  private agentId: string;

  // Quality scoring rubrics
  private readonly qualityRubrics: Omit<QualityRubric, 'score' | 'notes'>[] = [
    {
      id: 'brand_alignment',
      category: 'Brand Compliance',
      criteria: 'Alignment with brand guidelines (colors, fonts, logos)',
      weight: 20,
    },
    {
      id: 'visual_impact',
      category: 'Visual Design',
      criteria: 'Visual hierarchy, composition, and aesthetic appeal',
      weight: 18,
    },
    {
      id: 'message_clarity',
      category: 'Communication',
      criteria: 'Message clarity, tone, and call-to-action effectiveness',
      weight: 16,
    },
    {
      id: 'technical_quality',
      category: 'Technical',
      criteria: 'Resolution, file format, platform optimization',
      weight: 14,
    },
    {
      id: 'audience_relevance',
      category: 'Strategy',
      criteria: 'Target audience appropriateness and relevance',
      weight: 12,
    },
    {
      id: 'creativity_innovation',
      category: 'Creative',
      criteria: 'Originality, innovation, and creative execution',
      weight: 10,
    },
    {
      id: 'compliance_legal',
      category: 'Compliance',
      criteria: 'Legal compliance, disclaimers, accessibility',
      weight: 10,
    },
  ];

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.agentId = 'creative-director-001';
    this.graph = this.buildGraph();
  }

  private buildGraph(): StateGraph<CreativeDirectorState> {
    const graph = new StateGraph<CreativeDirectorState>({
      channels: {
        projectId: null,
        assetId: null,
        messages: {
          value: (x: BaseMessage[], y: BaseMessage[]) => [...x, ...y],
          default: () => [],
        },
        asset: null,
        review: null,
        brandGuidelines: {
          value: (x, y) => ({ ...x, ...y }),
          default: () => ({}),
        },
        context: {
          value: (x, y) => ({ ...x, ...y }),
          default: () => ({}),
        },
        decision: null,
      },
    });

    // Analyze the creative review request
    graph.addNode('analyze_request', async (state) => {
      console.log('🎨 Analyzing creative review request...');
      const lastMessage = state.messages[state.messages.length - 1];

      const analysis = await this.analyzeCreativeRequest(lastMessage.content as string);

      return {
        decision: analysis,
        messages: [
          new AIMessage(`Creative analysis: ${analysis.action}`),
        ],
      };
    });

    // Load asset and project context
    graph.addNode('load_context', async (state) => {
      console.log('📁 Loading creative context...');

      let context: any = {};

      // Load asset data
      if (state.assetId) {
        const { data: asset } = await this.supabase
          .from('creative_assets')
          .select('*')
          .eq('id', state.assetId)
          .single();

        context.asset = asset;
      }

      // Load project data and brand guidelines
      if (state.projectId) {
        const { data: project } = await this.supabase
          .from('projects')
          .select('*, client:client_accounts(*), campaigns(*)')
          .eq('id', state.projectId)
          .single();

        const { data: brandGuidelines } = await this.supabase
          .from('brand_guidelines')
          .select('*')
          .eq('client_id', project?.client_id)
          .single();

        context.project = project;
        context.brandGuidelines = brandGuidelines;
      }

      // Load previous reviews for reference
      if (state.assetId) {
        const { data: previousReviews } = await this.supabase
          .from('creative_reviews')
          .select('*')
          .eq('asset_id', state.assetId)
          .order('created_at', { ascending: false })
          .limit(5);

        context.previousReviews = previousReviews;
      }

      return {
        context,
        asset: context.asset,
        brandGuidelines: context.brandGuidelines,
        messages: [
          new AIMessage('Creative context loaded successfully'),
        ],
      };
    });

    // Validate brand guidelines compliance
    graph.addNode('validate_brand_compliance', async (state) => {
      console.log('🏷️ Validating brand compliance...');

      if (!state.asset || !state.brandGuidelines) {
        return {
          messages: [new AIMessage('Insufficient data for brand validation')],
        };
      }

      const compliance = await this.validateBrandCompliance(
        state.asset,
        state.brandGuidelines
      );

      return {
        context: {
          ...state.context,
          brandCompliance: compliance,
        },
        messages: [
          new AIMessage(`Brand compliance score: ${compliance.score}/10`),
        ],
      };
    });

    // Score creative using quality rubrics
    graph.addNode('score_creative_quality', async (state) => {
      console.log('📊 Scoring creative quality...');

      if (!state.asset) {
        return {
          messages: [new AIMessage('No asset to score')],
        };
      }

      const scores = await this.scoreCreativeQuality(
        state.asset,
        state.context,
        state.brandGuidelines
      );

      const overallScore = this.calculateOverallScore(scores);

      return {
        review: {
          overall_score: overallScore,
          rubric_scores: scores,
          feedback: '',
          recommendations: [],
          approval_status: overallScore >= 7 ? 'approved' :
                          overallScore >= 5 ? 'needs_revision' : 'rejected',
          version: 1,
        },
        messages: [
          new AIMessage(`Creative quality score: ${overallScore}/10`),
        ],
      };
    });

    // Generate detailed feedback and recommendations
    graph.addNode('generate_feedback', async (state) => {
      console.log('💬 Generating creative feedback...');

      if (!state.review) {
        return {
          messages: [new AIMessage('No review data available')],
        };
      }

      const feedback = await this.generateDetailedFeedback(
        state.review.rubric_scores,
        state.context
      );

      const recommendations = await this.generateRecommendations(
        state.review.rubric_scores,
        state.review.overall_score
      );

      return {
        review: {
          ...state.review,
          feedback,
          recommendations,
        },
        messages: [
          new AIMessage('Generated detailed feedback and recommendations'),
        ],
      };
    });

    // Store review results
    graph.addNode('store_review', async (state) => {
      console.log('💾 Storing creative review...');

      if (!state.review || !state.assetId) {
        return {
          messages: [new AIMessage('Missing review data or asset ID')],
        };
      }

      // Store the review
      const { data: review } = await this.supabase
        .from('creative_reviews')
        .insert({
          agent_id: this.agentId,
          asset_id: state.assetId,
          project_id: state.projectId,
          overall_score: state.review.overall_score,
          rubric_scores: state.review.rubric_scores,
          feedback: state.review.feedback,
          recommendations: state.review.recommendations,
          approval_status: state.review.approval_status,
          version: state.review.version,
          reviewer_notes: `Automated review by Creative Director Agent`,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      // Update asset status based on review
      if (state.assetId) {
        await this.supabase
          .from('creative_assets')
          .update({
            review_status: state.review.approval_status,
            quality_score: state.review.overall_score,
            last_reviewed_at: new Date().toISOString(),
          })
          .eq('id', state.assetId);
      }

      return {
        context: {
          ...state.context,
          savedReview: review,
        },
        messages: [
          new AIMessage('Review saved successfully'),
        ],
      };
    });

    // Generate final report
    graph.addNode('generate_report', async (state) => {
      console.log('📋 Generating creative review report...');

      const report = this.generateCreativeReport(state);

      return {
        messages: [
          new AIMessage(report),
        ],
      };
    });

    // Define workflow edges
    graph.addEdge(START, 'analyze_request');
    graph.addEdge('analyze_request', 'load_context');
    graph.addEdge('load_context', 'validate_brand_compliance');
    graph.addEdge('validate_brand_compliance', 'score_creative_quality');
    graph.addEdge('score_creative_quality', 'generate_feedback');
    graph.addEdge('generate_feedback', 'store_review');
    graph.addEdge('store_review', 'generate_report');
    graph.addEdge('generate_report', END);

    return graph;
  }

  // Helper methods
  private async analyzeCreativeRequest(content: string): Promise<any> {
    const keywords = content.toLowerCase();

    if (keywords.includes('review') || keywords.includes('approve')) {
      return {
        action: 'review_creative',
        reasoning: 'User wants creative review and approval',
        nextSteps: ['load_context', 'validate_compliance', 'score_quality'],
        confidence: 0.9,
      };
    } else if (keywords.includes('brand') || keywords.includes('guideline')) {
      return {
        action: 'validate_brand_compliance',
        reasoning: 'User wants brand compliance validation',
        nextSteps: ['load_guidelines', 'check_compliance', 'provide_feedback'],
        confidence: 0.8,
      };
    } else if (keywords.includes('improve') || keywords.includes('optimize')) {
      return {
        action: 'optimize_creative',
        reasoning: 'User wants creative optimization suggestions',
        nextSteps: ['analyze_current', 'identify_improvements', 'recommend_changes'],
        confidence: 0.7,
      };
    }

    return {
      action: 'general_creative_guidance',
      reasoning: 'General creative direction and guidance',
      nextSteps: ['understand_requirements', 'provide_guidance'],
      confidence: 0.6,
    };
  }

  private async validateBrandCompliance(asset: any, guidelines: any): Promise<any> {
    // Simulate brand compliance validation
    // In a real implementation, this would use computer vision APIs

    let score = 8; // Base score
    const issues: string[] = [];

    // Check color compliance (simplified)
    if (guidelines?.brand_colors && asset?.metadata?.dominant_colors) {
      const brandColors = guidelines.brand_colors;
      const assetColors = asset.metadata.dominant_colors;

      const colorMatch = assetColors.some((color: string) =>
        brandColors.some((brandColor: string) =>
          this.colorSimilarity(color, brandColor) > 0.8
        )
      );

      if (!colorMatch) {
        score -= 2;
        issues.push('Colors do not align with brand palette');
      }
    }

    // Check typography (if text-based asset)
    if (asset?.type === 'text' && guidelines?.brand_fonts) {
      // Simplified font checking
      if (!guidelines.brand_fonts.includes(asset.metadata?.font_family)) {
        score -= 1;
        issues.push('Font not from approved brand font list');
      }
    }

    // Check logo usage
    if (asset?.metadata?.has_logo && guidelines?.logo_guidelines) {
      // Check logo placement, size, etc.
      if (asset.metadata.logo_placement !== guidelines.logo_guidelines.preferred_placement) {
        score -= 0.5;
        issues.push('Logo placement could be improved');
      }
    }

    return {
      score: Math.max(1, Math.min(10, score)),
      issues,
      compliant: score >= 7,
    };
  }

  private async scoreCreativeQuality(
    asset: any,
    context: any,
    brandGuidelines: any
  ): Promise<QualityRubric[]> {

    return this.qualityRubrics.map(rubric => {
      let score = 7; // Base score
      let notes = '';

      switch (rubric.id) {
        case 'brand_alignment':
          if (context.brandCompliance) {
            score = context.brandCompliance.score;
            notes = context.brandCompliance.issues.join('; ');
          }
          break;

        case 'visual_impact':
          // Simulate visual assessment
          if (asset?.metadata?.resolution) {
            const [width, height] = asset.metadata.resolution.split('x').map(Number);
            if (width >= 1920 && height >= 1080) score += 1;
            if (width < 1280 || height < 720) score -= 2;
          }
          if (asset?.metadata?.composition_score) {
            score = asset.metadata.composition_score;
          }
          break;

        case 'message_clarity':
          if (asset?.metadata?.text_clarity_score) {
            score = asset.metadata.text_clarity_score;
          }
          if (asset?.metadata?.has_call_to_action) {
            score += 1;
          }
          break;

        case 'technical_quality':
          if (asset?.metadata?.file_size) {
            const sizeKB = asset.metadata.file_size / 1024;
            if (sizeKB > 5000) score -= 1; // Too large
            if (sizeKB < 50) score -= 1; // Too small/compressed
          }
          if (asset?.format && ['jpg', 'png', 'webp'].includes(asset.format.toLowerCase())) {
            score += 0.5;
          }
          break;

        case 'audience_relevance':
          if (context.project?.target_audience && asset?.metadata?.audience_match_score) {
            score = asset.metadata.audience_match_score;
          }
          break;

        case 'creativity_innovation':
          if (asset?.metadata?.creativity_score) {
            score = asset.metadata.creativity_score;
          } else {
            // Default creative assessment
            score = 6 + Math.random() * 2; // Simulated
          }
          break;

        case 'compliance_legal':
          if (asset?.metadata?.has_disclaimers) score += 0.5;
          if (asset?.metadata?.accessibility_score) {
            score = Math.min(score, asset.metadata.accessibility_score);
          }
          break;
      }

      return {
        ...rubric,
        score: Math.max(1, Math.min(10, Math.round(score * 10) / 10)),
        notes,
      };
    });
  }

  private calculateOverallScore(rubricScores: QualityRubric[]): number {
    const totalWeight = rubricScores.reduce((sum, rubric) => sum + rubric.weight, 0);
    const weightedScore = rubricScores.reduce(
      (sum, rubric) => sum + (rubric.score * rubric.weight),
      0
    );

    return Math.round((weightedScore / totalWeight) * 10) / 10;
  }

  private async generateDetailedFeedback(
    rubricScores: QualityRubric[],
    context: any
  ): Promise<string> {

    let feedback = "## Creative Review Feedback\n\n";

    // Overall assessment
    const overallScore = this.calculateOverallScore(rubricScores);
    if (overallScore >= 8) {
      feedback += "🎉 **Excellent work!** This creative meets high quality standards.\n\n";
    } else if (overallScore >= 6) {
      feedback += "👍 **Good foundation** with room for improvement in key areas.\n\n";
    } else {
      feedback += "⚠️ **Needs significant revision** before approval.\n\n";
    }

    // Category feedback
    feedback += "### Detailed Assessment\n\n";

    rubricScores.forEach(rubric => {
      const emoji = rubric.score >= 8 ? '✅' : rubric.score >= 6 ? '⚠️' : '❌';
      feedback += `${emoji} **${rubric.category}** (${rubric.score}/10)\n`;
      feedback += `${rubric.criteria}\n`;
      if (rubric.notes) {
        feedback += `*Notes: ${rubric.notes}*\n`;
      }
      feedback += '\n';
    });

    return feedback;
  }

  private async generateRecommendations(
    rubricScores: QualityRubric[],
    overallScore: number
  ): Promise<string[]> {

    const recommendations: string[] = [];

    // Generate recommendations based on low scores
    rubricScores.forEach(rubric => {
      if (rubric.score < 6) {
        switch (rubric.id) {
          case 'brand_alignment':
            recommendations.push('Review and adjust colors, fonts, and logo usage to match brand guidelines');
            break;
          case 'visual_impact':
            recommendations.push('Improve visual hierarchy and composition for better impact');
            break;
          case 'message_clarity':
            recommendations.push('Clarify the main message and strengthen the call-to-action');
            break;
          case 'technical_quality':
            recommendations.push('Optimize resolution, file format, and compression settings');
            break;
          case 'audience_relevance':
            recommendations.push('Better align creative with target audience preferences and behaviors');
            break;
          case 'creativity_innovation':
            recommendations.push('Explore more creative and innovative approaches to stand out');
            break;
          case 'compliance_legal':
            recommendations.push('Add required disclaimers and improve accessibility compliance');
            break;
        }
      }
    });

    // General recommendations based on overall score
    if (overallScore < 5) {
      recommendations.push('Consider a complete creative redesign with fresh approach');
    } else if (overallScore < 7) {
      recommendations.push('Focus on the lowest-scoring areas for maximum improvement impact');
    }

    return recommendations;
  }

  private colorSimilarity(color1: string, color2: string): number {
    // Simplified color similarity calculation
    // In a real implementation, use proper color distance algorithms
    return color1.toLowerCase() === color2.toLowerCase() ? 1 : 0.5;
  }

  private generateCreativeReport(state: CreativeDirectorState): string {
    let report = '# 🎨 Creative Director Review Report\n\n';

    if (state.asset) {
      report += `**Asset:** ${state.asset.type} - ${state.asset.id}\n`;
      report += `**Project:** ${state.context.project?.name || 'N/A'}\n\n`;
    }

    if (state.review) {
      report += `## Overall Assessment\n`;
      report += `**Score:** ${state.review.overall_score}/10\n`;
      report += `**Status:** ${state.review.approval_status.toUpperCase()}\n`;
      report += `**Version:** ${state.review.version}\n\n`;

      report += state.review.feedback + '\n';

      if (state.review.recommendations.length > 0) {
        report += `## Recommendations\n\n`;
        state.review.recommendations.forEach((rec, index) => {
          report += `${index + 1}. ${rec}\n`;
        });
        report += '\n';
      }

      report += `## Quality Rubric Scores\n\n`;
      state.review.rubric_scores.forEach(rubric => {
        report += `- **${rubric.category}**: ${rubric.score}/10 (Weight: ${rubric.weight}%)\n`;
      });
    }

    if (state.decision) {
      report += `\n## Next Steps\n`;
      report += `**Action:** ${state.decision.action}\n`;
      report += `**Confidence:** ${Math.round(state.decision.confidence * 100)}%\n`;
    }

    report += `\n---\n*Review completed by Creative Director Agent at ${new Date().toISOString()}*`;

    return report;
  }

  // Public interface
  public async reviewCreative(assetId: string, projectId?: string, customMessage?: string) {
    const initialState: CreativeDirectorState = {
      assetId,
      projectId,
      messages: [new HumanMessage(customMessage || 'Please review this creative asset')],
      context: {},
    };

    const compiled = this.graph.compile();
    const result = await compiled.invoke(initialState);

    return result;
  }

  public async validateBrandGuidelines(assetId: string, clientId: string) {
    const { data: asset } = await this.supabase
      .from('creative_assets')
      .select('*')
      .eq('id', assetId)
      .single();

    const { data: guidelines } = await this.supabase
      .from('brand_guidelines')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (!asset || !guidelines) {
      throw new Error('Asset or brand guidelines not found');
    }

    return this.validateBrandCompliance(asset, guidelines);
  }

  public async getQualityRubrics(): Promise<Omit<QualityRubric, 'score' | 'notes'>[]> {
    return this.qualityRubrics;
  }

  public async getAgentStatus() {
    const { data: recentReviews } = await this.supabase
      .from('creative_reviews')
      .select('*')
      .eq('agent_id', this.agentId)
      .order('created_at', { ascending: false })
      .limit(10);

    const avgScore = recentReviews?.length
      ? recentReviews.reduce((sum, review) => sum + review.overall_score, 0) / recentReviews.length
      : 0;

    return {
      agentId: this.agentId,
      status: 'operational',
      recentReviews: recentReviews?.length || 0,
      averageScore: Math.round(avgScore * 10) / 10,
      lastActive: new Date().toISOString(),
    };
  }

  // Standardized interface for SuperClaude framework
  public async processRequest(request: string, projectId?: string): Promise<any> {
    try {
      const result = await this.reviewCreativeAsset(request, projectId);

      return {
        status: 'success',
        agentId: this.agentId,
        result: result.messages?.[result.messages.length - 1]?.content || 'Review completed successfully',
        metadata: {
          qualityScores: result.qualityScores,
          rubricResults: result.rubricResults,
          brandCompliance: result.brandCompliance,
          recommendations: result.recommendations,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'error',
        agentId: this.agentId,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      };
    }
  }

  public getState(): CreativeDirectorState {
    return {
      messages: [],
      rubricResults: [],
      qualityScores: [],
      brandCompliance: { score: 0, issues: [] },
      recommendations: [],
      context: {},
      lastUpdated: new Date().toISOString()
    } as CreativeDirectorState & { lastUpdated: string };
  }
}
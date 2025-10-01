// Data Analyst Agent with Comprehensive Analytics and Visualizations
// Handles data analysis, insights generation, and visualization creation

import { StateGraph, START, END } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Data analysis specifications
interface AnalysisSpec {
  id: string;
  type: 'descriptive' | 'diagnostic' | 'predictive' | 'prescriptive';
  domain: 'campaign_performance' | 'user_behavior' | 'content_analytics' | 'financial' | 'engagement' | 'conversion' | 'custom';
  data_sources: DataSource[];
  metrics: Metric[];
  dimensions: Dimension[];
  time_range: {
    start_date: string;
    end_date: string;
    granularity: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  };
  filters: Filter[];
  aggregations: Aggregation[];
  visualizations: VisualizationSpec[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file' | 'realtime' | 'webhook';
  connection_string?: string;
  schema?: any;
  tables?: string[];
  endpoints?: string[];
  refresh_rate?: number; // minutes
}

interface Metric {
  id: string;
  name: string;
  formula: string;
  aggregation_type: 'sum' | 'count' | 'avg' | 'min' | 'max' | 'median' | 'stddev' | 'custom';
  format: 'number' | 'percentage' | 'currency' | 'duration' | 'ratio';
  target_value?: number;
  threshold?: {
    good: number;
    warning: number;
    critical: number;
  };
}

interface Dimension {
  id: string;
  name: string;
  type: 'categorical' | 'temporal' | 'numerical' | 'geographical';
  hierarchy?: string[];
  cardinality?: number;
}

interface Filter {
  dimension: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'between' | 'contains';
  values: any[];
}

interface Aggregation {
  metric: string;
  dimensions: string[];
  type: 'group_by' | 'window' | 'cohort' | 'funnel';
  window_size?: number;
  window_unit?: 'days' | 'weeks' | 'months';
}

interface VisualizationSpec {
  id: string;
  type: 'line_chart' | 'bar_chart' | 'pie_chart' | 'scatter_plot' | 'heatmap' | 'funnel' | 'cohort' | 'histogram' | 'box_plot' | 'gauge' | 'table' | 'kpi_card';
  title: string;
  description: string;
  metrics: string[];
  dimensions: string[];
  chart_config: {
    x_axis?: string;
    y_axis?: string;
    color_by?: string;
    size_by?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    limit?: number;
    color_palette?: string[];
    show_legend?: boolean;
    show_grid?: boolean;
    interactive?: boolean;
  };
  responsive: boolean;
  export_formats: string[];
}

// Analysis results and insights
interface AnalysisResult {
  id: string;
  spec: AnalysisSpec;
  data: any[];
  aggregated_data: any[];
  insights: Insight[];
  recommendations: Recommendation[];
  visualizations: GeneratedVisualization[];
  statistical_summary: StatisticalSummary;
  anomalies: Anomaly[];
  trends: Trend[];
  correlations: Correlation[];
  forecasts?: Forecast[];
  metadata: {
    execution_time_ms: number;
    data_points: number;
    confidence_score: number;
    accuracy_score: number;
    completeness_score: number;
    data_quality_score: number;
  };
}

interface Insight {
  id: string;
  type: 'trend' | 'anomaly' | 'correlation' | 'pattern' | 'opportunity' | 'risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  confidence: number;
  supporting_data: any;
  related_metrics: string[];
  recommended_actions: string[];
}

interface Recommendation {
  id: string;
  category: 'optimization' | 'investigation' | 'action' | 'monitoring';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  rationale: string;
  expected_impact: string;
  effort_level: 'low' | 'medium' | 'high';
  timeline: string;
  success_metrics: string[];
  related_insights: string[];
}

interface GeneratedVisualization {
  id: string;
  spec: VisualizationSpec;
  chart_data: any;
  chart_config: any;
  generated_code: {
    react_component: string;
    chart_library: string;
    dependencies: string[];
  };
  static_image_url?: string;
  interactive_url?: string;
  export_urls: { [format: string]: string };
}

interface StatisticalSummary {
  total_records: number;
  date_range: { start: string; end: string };
  metrics_summary: { [metric: string]: { min: number; max: number; avg: number; median: number; stddev: number } };
  missing_data_percentage: number;
  data_quality_issues: string[];
}

interface Anomaly {
  id: string;
  metric: string;
  timestamp: string;
  value: number;
  expected_value: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
  probable_causes: string[];
}

interface Trend {
  id: string;
  metric: string;
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  strength: number; // 0-1
  duration_days: number;
  significance: 'weak' | 'moderate' | 'strong';
  change_rate: number;
}

interface Correlation {
  id: string;
  metric_a: string;
  metric_b: string;
  correlation_coefficient: number;
  strength: 'weak' | 'moderate' | 'strong';
  direction: 'positive' | 'negative';
  p_value: number;
  significance: boolean;
}

interface Forecast {
  id: string;
  metric: string;
  forecast_horizon_days: number;
  predicted_values: { date: string; value: number; confidence_interval: [number, number] }[];
  model_type: string;
  accuracy_metrics: { mae: number; rmse: number; mape: number };
}

// Data Analyst state
interface DataAnalystState {
  projectId?: string;
  campaignId?: string;
  request: string;
  context: {
    project?: any;
    campaigns?: any[];
    available_data_sources?: DataSource[];
    existing_analyses?: any[];
    user_preferences?: any;
    business_context?: any;
  };
  specifications?: AnalysisSpec[];
  results?: AnalysisResult[];
  dashboard?: {
    id: string;
    title: string;
    description: string;
    visualizations: GeneratedVisualization[];
    insights_summary: string;
    recommendations_summary: string;
    refresh_schedule?: string;
    export_urls: { [format: string]: string };
  };
  messages: BaseMessage[];
  decision?: {
    action: string;
    reasoning: string;
    analysis_approach: string;
    priority_metrics: string[];
    confidence: number;
  };
}

export class DataAnalystAgent {
  private supabase: SupabaseClient;
  private openai: OpenAI;
  private graph: StateGraph<DataAnalystState>;
  private agentId: string;

  // Chart libraries and templates
  private readonly chartLibraries = {
    'recharts': {
      line_chart: `import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const {ComponentName} = ({ data }: { data: any[] }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="{xAxisKey}" />
        <YAxis />
        <Tooltip />
        <Legend />
        {metrics.map((metric, index) => (
          <Line
            key={metric}
            type="monotone"
            dataKey={metric}
            stroke={colors[index]}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};`,

      bar_chart: `import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const {ComponentName} = ({ data }: { data: any[] }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="{xAxisKey}" />
        <YAxis />
        <Tooltip />
        <Legend />
        {metrics.map((metric, index) => (
          <Bar key={metric} dataKey={metric} fill={colors[index]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};`,

      pie_chart: `import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const {ComponentName} = ({ data }: { data: any[] }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => \`\${name} \${(percent * 100).toFixed(0)}%\`}
          outerRadius={120}
          fill="#8884d8"
          dataKey="{valueKey}"
        >
          {data.map((entry, index) => (
            <Cell key={\`cell-\${index}\`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};`,
    },

    'chart.js': {
      line_chart: `import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export const {ComponentName} = ({ data }: { data: any[] }) => {
  const chartData = {
    labels: data.map(item => item.{xAxisKey}),
    datasets: [
      {metrics.map((metric, index) => ({
        label: metric,
        data: data.map(item => item[metric]),
        borderColor: colors[index],
        backgroundColor: colors[index] + '20',
        tension: 0.1,
      }))}
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: '{title}' },
    },
  };

  return <Line data={chartData} options={options} />;
};`,
    },

    'd3': {
      custom_visualization: `import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export const {ComponentName} = ({ data }: { data: any[] }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    // Custom D3 visualization logic here
    // Implementation depends on visualization type

    svg.attr("width", width).attr("height", height);

  }, [data]);

  return <svg ref={svgRef}></svg>;
};`,
    },
  };

  // Color palettes for visualizations
  private readonly colorPalettes = {
    'default': ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'],
    'professional': ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'],
    'accessible': ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#17becf'],
    'brand': ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'],
  };

  constructor(supabaseUrl: string, supabaseKey: string, openaiApiKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.agentId = 'data-analyst-001';
    this.graph = this.buildGraph();
  }

  private buildGraph(): StateGraph<DataAnalystState> {
    const graph = new StateGraph<DataAnalystState>({
      channels: {
        projectId: null,
        campaignId: null,
        request: null,
        context: {
          value: (x, y) => ({ ...x, ...y }),
          default: () => ({}),
        },
        specifications: {
          value: (x, y) => [...(x || []), ...(y || [])],
          default: () => [],
        },
        results: {
          value: (x, y) => [...(x || []), ...(y || [])],
          default: () => [],
        },
        dashboard: {
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

    // Analyze data requirements
    graph.addNode('analyze_data_requirements', async (state) => {
      console.log('📊 Analyzing data requirements...');

      const analysis = await this.analyzeDataRequirements(state.request, state.context);

      return {
        decision: analysis,
        messages: [
          new AIMessage(`Data analysis: ${analysis.action} - ${analysis.analysis_approach}`),
        ],
      };
    });

    // Load data context and sources
    graph.addNode('load_data_context', async (state) => {
      console.log('📂 Loading data context...');

      let context: any = {};

      // Load project and campaign data
      if (state.projectId) {
        const { data: project } = await this.supabase
          .from('projects')
          .select('*, client:client_accounts(*), campaigns(*)')
          .eq('id', state.projectId)
          .single();

        context.project = project;
        context.campaigns = project?.campaigns || [];
      }

      // Load available data sources
      context.available_data_sources = await this.discoverDataSources(state.projectId);

      // Load existing analyses
      const { data: existingAnalyses } = await this.supabase
        .from('creative_assets')
        .select('*')
        .eq('project_id', state.projectId)
        .eq('type', 'analysis')
        .order('created_at', { ascending: false })
        .limit(10);

      context.existing_analyses = existingAnalyses;

      // Load business context
      context.business_context = await this.loadBusinessContext(state.projectId);

      return {
        context,
        messages: [
          new AIMessage('Data context loaded successfully'),
        ],
      };
    });

    // Create analysis specifications
    graph.addNode('create_analysis_specifications', async (state) => {
      console.log('📋 Creating analysis specifications...');

      if (!state.decision) {
        return {
          messages: [new AIMessage('No data requirements analysis available')],
        };
      }

      const specifications = await this.createAnalysisSpecifications(
        state.decision,
        state.context,
        state.request
      );

      return {
        specifications,
        messages: [
          new AIMessage(`Created ${specifications.length} analysis specifications`),
        ],
      };
    });

    // Execute data analysis
    graph.addNode('execute_data_analysis', async (state) => {
      console.log('🔬 Executing data analysis...');

      if (!state.specifications || state.specifications.length === 0) {
        return {
          messages: [new AIMessage('No analysis specifications available')],
        };
      }

      const results: AnalysisResult[] = [];

      for (const spec of state.specifications) {
        try {
          const result = await this.executeAnalysis(spec, state.context);
          results.push(result);
        } catch (error) {
          console.error('Analysis execution error:', error);
        }
      }

      return {
        results,
        messages: [
          new AIMessage(`Completed ${results.length} data analyses`),
        ],
      };
    });

    // Generate insights and recommendations
    graph.addNode('generate_insights', async (state) => {
      console.log('💡 Generating insights and recommendations...');

      if (!state.results || state.results.length === 0) {
        return {
          messages: [new AIMessage('No analysis results available for insights generation')],
        };
      }

      // Generate AI-powered insights
      const enhancedResults = await this.generateAIInsights(state.results, state.context);

      return {
        results: enhancedResults,
        messages: [
          new AIMessage('Generated AI-powered insights and recommendations'),
        ],
      };
    });

    // Create visualizations
    graph.addNode('create_visualizations', async (state) => {
      console.log('📈 Creating data visualizations...');

      if (!state.results || state.results.length === 0) {
        return {
          messages: [new AIMessage('No analysis results available for visualization')],
        };
      }

      const updatedResults = await this.createVisualizations(state.results, state.context);

      return {
        results: updatedResults,
        messages: [
          new AIMessage('Generated interactive data visualizations'),
        ],
      };
    });

    // Build comprehensive dashboard
    graph.addNode('build_dashboard', async (state) => {
      console.log('🏗️ Building analytics dashboard...');

      if (!state.results || state.results.length === 0) {
        return {
          messages: [new AIMessage('No analysis results available for dashboard')],
        };
      }

      const dashboard = await this.buildAnalyticsDashboard(
        state.results,
        state.context,
        state.request
      );

      return {
        dashboard,
        messages: [
          new AIMessage('Built comprehensive analytics dashboard'),
        ],
      };
    });

    // Store analysis assets
    graph.addNode('store_analysis_assets', async (state) => {
      console.log('💾 Storing analysis assets...');

      if (!state.results || state.results.length === 0) {
        return {
          messages: [new AIMessage('No analysis results to store')],
        };
      }

      const storedAssets = await this.storeAnalysisAssets(
        state.results,
        state.dashboard,
        state.projectId
      );

      return {
        context: {
          ...state.context,
          storedAssets,
        },
        messages: [
          new AIMessage(`Stored ${storedAssets.length} analysis assets`),
        ],
      };
    });

    // Generate analytics report
    graph.addNode('generate_analytics_report', async (state) => {
      console.log('📋 Generating analytics report...');

      const report = this.generateAnalyticsReport(state);

      return {
        messages: [
          new AIMessage(report),
        ],
      };
    });

    // Define workflow edges
    graph.addEdge(START, 'analyze_data_requirements');
    graph.addEdge('analyze_data_requirements', 'load_data_context');
    graph.addEdge('load_data_context', 'create_analysis_specifications');
    graph.addEdge('create_analysis_specifications', 'execute_data_analysis');
    graph.addEdge('execute_data_analysis', 'generate_insights');
    graph.addEdge('generate_insights', 'create_visualizations');
    graph.addEdge('create_visualizations', 'build_dashboard');
    graph.addEdge('build_dashboard', 'store_analysis_assets');
    graph.addEdge('store_analysis_assets', 'generate_analytics_report');
    graph.addEdge('generate_analytics_report', END);

    return graph;
  }

  // Helper methods
  private async analyzeDataRequirements(request: string, context: any): Promise<any> {
    const keywords = request.toLowerCase();

    if (keywords.includes('campaign') || keywords.includes('performance')) {
      return {
        action: 'campaign_analysis',
        reasoning: 'Focus on campaign performance metrics and optimization',
        analysis_approach: 'comprehensive_campaign',
        priority_metrics: ['impressions', 'clicks', 'conversions', 'ctr', 'cpa', 'roas'],
        confidence: 0.9,
      };
    } else if (keywords.includes('user') || keywords.includes('behavior')) {
      return {
        action: 'user_behavior_analysis',
        reasoning: 'Focus on user engagement and behavior patterns',
        analysis_approach: 'behavioral_segmentation',
        priority_metrics: ['sessions', 'page_views', 'bounce_rate', 'session_duration', 'conversion_rate'],
        confidence: 0.85,
      };
    } else if (keywords.includes('trend') || keywords.includes('forecast')) {
      return {
        action: 'trend_analysis',
        reasoning: 'Focus on trend identification and predictive modeling',
        analysis_approach: 'time_series_analysis',
        priority_metrics: ['growth_rate', 'seasonal_patterns', 'forecast_accuracy'],
        confidence: 0.8,
      };
    } else if (keywords.includes('engagement') || keywords.includes('content')) {
      return {
        action: 'content_analysis',
        reasoning: 'Focus on content performance and engagement metrics',
        analysis_approach: 'content_analytics',
        priority_metrics: ['engagement_rate', 'shares', 'comments', 'time_on_page', 'scroll_depth'],
        confidence: 0.85,
      };
    } else if (keywords.includes('funnel') || keywords.includes('conversion')) {
      return {
        action: 'funnel_analysis',
        reasoning: 'Focus on conversion funnel optimization',
        analysis_approach: 'funnel_analytics',
        priority_metrics: ['funnel_completion_rate', 'drop_off_rate', 'conversion_by_stage'],
        confidence: 0.9,
      };
    }

    return {
      action: 'comprehensive_analysis',
      reasoning: 'Execute comprehensive data analysis across multiple domains',
      analysis_approach: 'multi_domain',
      priority_metrics: ['revenue', 'users', 'engagement', 'conversion', 'retention'],
      confidence: 0.75,
    };
  }

  private async discoverDataSources(projectId?: string): Promise<DataSource[]> {
    const dataSources: DataSource[] = [
      {
        id: 'supabase-main',
        name: 'Main Database',
        type: 'database',
        tables: ['projects', 'campaigns', 'creative_assets', 'user_interactions', 'analytics_events'],
        refresh_rate: 15,
      },
      {
        id: 'google-analytics',
        name: 'Google Analytics',
        type: 'api',
        endpoints: ['/analytics/reports', '/analytics/realtime'],
        refresh_rate: 60,
      },
      {
        id: 'social-media',
        name: 'Social Media APIs',
        type: 'api',
        endpoints: ['/facebook/insights', '/instagram/insights', '/twitter/analytics'],
        refresh_rate: 240,
      },
    ];

    // In real implementation, would dynamically discover based on project configuration
    return dataSources;
  }

  private async loadBusinessContext(projectId?: string): Promise<any> {
    // Load business goals, KPIs, and context
    return {
      industry: 'creative_services',
      business_goals: ['increase_engagement', 'improve_conversion', 'optimize_campaigns'],
      kpi_targets: {
        conversion_rate: 0.05,
        engagement_rate: 0.08,
        customer_acquisition_cost: 50,
        return_on_ad_spend: 4.0,
      },
      seasonality_factors: ['holidays', 'back_to_school', 'summer_campaigns'],
    };
  }

  private async createAnalysisSpecifications(
    decision: any,
    context: any,
    request: string
  ): Promise<AnalysisSpec[]> {

    const specs: AnalysisSpec[] = [];

    const baseTimeRange = {
      start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      granularity: 'day' as const,
    };

    switch (decision.action) {
      case 'campaign_analysis':
        specs.push({
          id: crypto.randomUUID(),
          type: 'descriptive',
          domain: 'campaign_performance',
          data_sources: context.available_data_sources?.slice(0, 2) || [],
          metrics: [
            { id: 'impressions', name: 'Impressions', formula: 'SUM(impressions)', aggregation_type: 'sum', format: 'number' },
            { id: 'clicks', name: 'Clicks', formula: 'SUM(clicks)', aggregation_type: 'sum', format: 'number' },
            { id: 'ctr', name: 'Click-Through Rate', formula: 'clicks / impressions', aggregation_type: 'avg', format: 'percentage' },
            { id: 'conversions', name: 'Conversions', formula: 'SUM(conversions)', aggregation_type: 'sum', format: 'number' },
            { id: 'cpa', name: 'Cost Per Acquisition', formula: 'spend / conversions', aggregation_type: 'avg', format: 'currency' },
          ],
          dimensions: [
            { id: 'date', name: 'Date', type: 'temporal' },
            { id: 'campaign_name', name: 'Campaign', type: 'categorical' },
            { id: 'channel', name: 'Channel', type: 'categorical' },
          ],
          time_range: baseTimeRange,
          filters: [],
          aggregations: [
            { metric: 'impressions', dimensions: ['date', 'campaign_name'], type: 'group_by' },
            { metric: 'ctr', dimensions: ['campaign_name'], type: 'group_by' },
          ],
          visualizations: [
            {
              id: 'campaign-performance-trend',
              type: 'line_chart',
              title: 'Campaign Performance Trend',
              description: 'Daily campaign metrics over time',
              metrics: ['impressions', 'clicks', 'conversions'],
              dimensions: ['date'],
              chart_config: {
                x_axis: 'date',
                y_axis: 'value',
                color_by: 'metric',
                show_legend: true,
                show_grid: true,
                interactive: true,
              },
              responsive: true,
              export_formats: ['png', 'svg', 'pdf'],
            },
            {
              id: 'campaign-comparison',
              type: 'bar_chart',
              title: 'Campaign Comparison',
              description: 'Performance comparison across campaigns',
              metrics: ['ctr', 'cpa'],
              dimensions: ['campaign_name'],
              chart_config: {
                x_axis: 'campaign_name',
                y_axis: 'value',
                color_by: 'metric',
                sort_by: 'ctr',
                sort_order: 'desc',
                show_legend: true,
              },
              responsive: true,
              export_formats: ['png', 'svg'],
            },
          ],
          priority: 'high',
        });
        break;

      case 'user_behavior_analysis':
        specs.push({
          id: crypto.randomUUID(),
          type: 'diagnostic',
          domain: 'user_behavior',
          data_sources: context.available_data_sources || [],
          metrics: [
            { id: 'sessions', name: 'Sessions', formula: 'COUNT(DISTINCT session_id)', aggregation_type: 'count', format: 'number' },
            { id: 'page_views', name: 'Page Views', formula: 'SUM(page_views)', aggregation_type: 'sum', format: 'number' },
            { id: 'bounce_rate', name: 'Bounce Rate', formula: 'bounced_sessions / total_sessions', aggregation_type: 'avg', format: 'percentage' },
            { id: 'avg_session_duration', name: 'Avg Session Duration', formula: 'AVG(session_duration)', aggregation_type: 'avg', format: 'duration' },
          ],
          dimensions: [
            { id: 'date', name: 'Date', type: 'temporal' },
            { id: 'user_segment', name: 'User Segment', type: 'categorical' },
            { id: 'traffic_source', name: 'Traffic Source', type: 'categorical' },
            { id: 'device_type', name: 'Device Type', type: 'categorical' },
          ],
          time_range: baseTimeRange,
          filters: [],
          aggregations: [
            { metric: 'sessions', dimensions: ['date', 'user_segment'], type: 'group_by' },
            { metric: 'bounce_rate', dimensions: ['traffic_source'], type: 'group_by' },
          ],
          visualizations: [
            {
              id: 'user-behavior-heatmap',
              type: 'heatmap',
              title: 'User Behavior Heatmap',
              description: 'Session activity by hour and day',
              metrics: ['sessions'],
              dimensions: ['hour', 'day_of_week'],
              chart_config: {
                x_axis: 'hour',
                y_axis: 'day_of_week',
                color_by: 'sessions',
                interactive: true,
              },
              responsive: true,
              export_formats: ['png', 'svg'],
            },
          ],
          priority: 'medium',
        });
        break;

      case 'funnel_analysis':
        specs.push({
          id: crypto.randomUUID(),
          type: 'diagnostic',
          domain: 'conversion',
          data_sources: context.available_data_sources || [],
          metrics: [
            { id: 'step_1_users', name: 'Step 1 Users', formula: 'COUNT(DISTINCT user_id)', aggregation_type: 'count', format: 'number' },
            { id: 'step_2_users', name: 'Step 2 Users', formula: 'COUNT(DISTINCT user_id)', aggregation_type: 'count', format: 'number' },
            { id: 'step_3_users', name: 'Step 3 Users', formula: 'COUNT(DISTINCT user_id)', aggregation_type: 'count', format: 'number' },
            { id: 'conversion_rate', name: 'Conversion Rate', formula: 'step_3_users / step_1_users', aggregation_type: 'avg', format: 'percentage' },
          ],
          dimensions: [
            { id: 'funnel_step', name: 'Funnel Step', type: 'categorical' },
            { id: 'date', name: 'Date', type: 'temporal' },
            { id: 'user_segment', name: 'User Segment', type: 'categorical' },
          ],
          time_range: baseTimeRange,
          filters: [],
          aggregations: [
            { metric: 'step_1_users', dimensions: ['funnel_step'], type: 'funnel' },
          ],
          visualizations: [
            {
              id: 'conversion-funnel',
              type: 'funnel',
              title: 'Conversion Funnel',
              description: 'User progression through conversion steps',
              metrics: ['step_1_users', 'step_2_users', 'step_3_users'],
              dimensions: ['funnel_step'],
              chart_config: {
                show_percentages: true,
                color_by: 'step',
                interactive: true,
              },
              responsive: true,
              export_formats: ['png', 'svg'],
            },
          ],
          priority: 'high',
        });
        break;
    }

    return specs;
  }

  private async executeAnalysis(
    spec: AnalysisSpec,
    context: any
  ): Promise<AnalysisResult> {

    const startTime = Date.now();

    // Simulate data extraction and analysis
    const mockData = await this.generateMockAnalysisData(spec);
    const aggregatedData = this.aggregateData(mockData, spec.aggregations);

    // Perform statistical analysis
    const statisticalSummary = this.calculateStatisticalSummary(mockData, spec.metrics);
    const anomalies = this.detectAnomalies(mockData, spec.metrics);
    const trends = this.analyzeTrends(mockData, spec.metrics);
    const correlations = this.calculateCorrelations(mockData, spec.metrics);

    // Generate basic insights (AI-enhanced insights added later)
    const insights = this.generateBasicInsights(mockData, spec, trends, anomalies);
    const recommendations = this.generateBasicRecommendations(insights, spec);

    const result: AnalysisResult = {
      id: crypto.randomUUID(),
      spec,
      data: mockData,
      aggregated_data: aggregatedData,
      insights,
      recommendations,
      visualizations: [], // Will be populated in visualization step
      statistical_summary: statisticalSummary,
      anomalies,
      trends,
      correlations,
      metadata: {
        execution_time_ms: Date.now() - startTime,
        data_points: mockData.length,
        confidence_score: 0.85,
        accuracy_score: 0.9,
        completeness_score: 0.95,
        data_quality_score: 0.88,
      },
    };

    return result;
  }

  private async generateMockAnalysisData(spec: AnalysisSpec): Promise<any[]> {
    // Generate realistic mock data based on the analysis specification
    const data = [];
    const daysDiff = Math.floor((new Date(spec.time_range.end_date).getTime() - new Date(spec.time_range.start_date).getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(new Date(spec.time_range.start_date).getTime() + i * 24 * 60 * 60 * 1000);
      const record: any = {
        date: date.toISOString().split('T')[0],
        day_of_week: date.getDay(),
        hour: Math.floor(Math.random() * 24),
      };

      // Generate metric values based on domain
      if (spec.domain === 'campaign_performance') {
        record.impressions = Math.floor(Math.random() * 10000) + 5000;
        record.clicks = Math.floor(record.impressions * (0.02 + Math.random() * 0.03));
        record.conversions = Math.floor(record.clicks * (0.1 + Math.random() * 0.15));
        record.ctr = record.clicks / record.impressions;
        record.spend = record.clicks * (1 + Math.random() * 2);
        record.cpa = record.conversions > 0 ? record.spend / record.conversions : 0;
        record.campaign_name = ['Brand Awareness', 'Product Launch', 'Retargeting'][Math.floor(Math.random() * 3)];
        record.channel = ['Google Ads', 'Facebook', 'Instagram', 'LinkedIn'][Math.floor(Math.random() * 4)];
      } else if (spec.domain === 'user_behavior') {
        record.sessions = Math.floor(Math.random() * 1000) + 200;
        record.page_views = record.sessions * (2 + Math.random() * 3);
        record.bounce_rate = 0.3 + Math.random() * 0.4;
        record.avg_session_duration = 60 + Math.random() * 300; // seconds
        record.user_segment = ['New', 'Returning', 'VIP'][Math.floor(Math.random() * 3)];
        record.traffic_source = ['Organic', 'Paid', 'Social', 'Direct'][Math.floor(Math.random() * 4)];
        record.device_type = ['Desktop', 'Mobile', 'Tablet'][Math.floor(Math.random() * 3)];
      } else if (spec.domain === 'conversion') {
        const baseUsers = 1000 + Math.random() * 2000;
        record.step_1_users = Math.floor(baseUsers);
        record.step_2_users = Math.floor(baseUsers * (0.6 + Math.random() * 0.2));
        record.step_3_users = Math.floor(record.step_2_users * (0.4 + Math.random() * 0.3));
        record.conversion_rate = record.step_3_users / record.step_1_users;
        record.funnel_step = ['Landing', 'Signup', 'Purchase'][Math.floor(Math.random() * 3)];
        record.user_segment = ['New', 'Returning'][Math.floor(Math.random() * 2)];
      }

      data.push(record);
    }

    return data;
  }

  private aggregateData(data: any[], aggregations: Aggregation[]): any[] {
    const aggregated = [];

    for (const agg of aggregations) {
      if (agg.type === 'group_by') {
        const grouped = data.reduce((acc, item) => {
          const key = agg.dimensions.map(dim => item[dim]).join('|');
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(item);
          return acc;
        }, {});

        Object.entries(grouped).forEach(([key, group]: [string, any]) => {
          const dimensions = key.split('|');
          const record: any = {};

          agg.dimensions.forEach((dim, index) => {
            record[dim] = dimensions[index];
          });

          record[agg.metric] = group.reduce((sum: number, item: any) => sum + (item[agg.metric] || 0), 0);
          aggregated.push(record);
        });
      }
    }

    return aggregated;
  }

  private calculateStatisticalSummary(data: any[], metrics: Metric[]): StatisticalSummary {
    const metricsSummary: any = {};

    metrics.forEach(metric => {
      const values = data.map(item => item[metric.id]).filter(val => val !== undefined && val !== null);

      if (values.length > 0) {
        values.sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;
        const median = values[Math.floor(values.length / 2)];
        const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
        const stddev = Math.sqrt(variance);

        metricsSummary[metric.id] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: mean,
          median,
          stddev,
        };
      }
    });

    return {
      total_records: data.length,
      date_range: {
        start: data[0]?.date || '',
        end: data[data.length - 1]?.date || '',
      },
      metrics_summary: metricsSummary,
      missing_data_percentage: 2.5, // Simulated
      data_quality_issues: ['Minor data gaps on weekends', 'Some metric spikes detected'],
    };
  }

  private detectAnomalies(data: any[], metrics: Metric[]): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Simple anomaly detection using statistical methods
    metrics.forEach(metric => {
      const values = data.map(item => item[metric.id]).filter(val => val !== undefined);
      if (values.length === 0) return;

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stddev = Math.sqrt(values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length);
      const threshold = 2 * stddev; // 2 standard deviations

      data.forEach(item => {
        const value = item[metric.id];
        if (value !== undefined && Math.abs(value - mean) > threshold) {
          anomalies.push({
            id: crypto.randomUUID(),
            metric: metric.id,
            timestamp: item.date || new Date().toISOString(),
            value,
            expected_value: mean,
            deviation: Math.abs(value - mean),
            severity: Math.abs(value - mean) > 3 * stddev ? 'high' : 'medium',
            probable_causes: ['Data collection issue', 'External event impact', 'System anomaly'],
          });
        }
      });
    });

    return anomalies.slice(0, 10); // Limit to top 10 anomalies
  }

  private analyzeTrends(data: any[], metrics: Metric[]): Trend[] {
    const trends: Trend[] = [];

    metrics.forEach(metric => {
      const values = data.map(item => item[metric.id]).filter(val => val !== undefined);
      if (values.length < 5) return; // Need at least 5 data points

      // Simple linear regression for trend analysis
      const n = values.length;
      const indices = Array.from({ length: n }, (_, i) => i);
      const sumX = indices.reduce((a, b) => a + b, 0);
      const sumY = values.reduce((a, b) => a + b, 0);
      const sumXY = indices.reduce((acc, x, i) => acc + x * values[i], 0);
      const sumXX = indices.reduce((acc, x) => acc + x * x, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const direction = slope > 0.05 ? 'increasing' : slope < -0.05 ? 'decreasing' : 'stable';
      const strength = Math.min(Math.abs(slope) / (sumY / n), 1);

      trends.push({
        id: crypto.randomUUID(),
        metric: metric.id,
        direction,
        strength,
        duration_days: n,
        significance: strength > 0.7 ? 'strong' : strength > 0.3 ? 'moderate' : 'weak',
        change_rate: slope,
      });
    });

    return trends;
  }

  private calculateCorrelations(data: any[], metrics: Metric[]): Correlation[] {
    const correlations: Correlation[] = [];

    for (let i = 0; i < metrics.length; i++) {
      for (let j = i + 1; j < metrics.length; j++) {
        const metricA = metrics[i];
        const metricB = metrics[j];

        const valuesA = data.map(item => item[metricA.id]).filter(val => val !== undefined);
        const valuesB = data.map(item => item[metricB.id]).filter(val => val !== undefined);

        if (valuesA.length !== valuesB.length || valuesA.length < 3) continue;

        const correlation = this.pearsonCorrelation(valuesA, valuesB);

        if (!isNaN(correlation)) {
          correlations.push({
            id: crypto.randomUUID(),
            metric_a: metricA.id,
            metric_b: metricB.id,
            correlation_coefficient: correlation,
            strength: Math.abs(correlation) > 0.7 ? 'strong' : Math.abs(correlation) > 0.3 ? 'moderate' : 'weak',
            direction: correlation > 0 ? 'positive' : 'negative',
            p_value: 0.05, // Simplified
            significance: Math.abs(correlation) > 0.3,
          });
        }
      }
    }

    return correlations;
  }

  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, val, i) => acc + val * y[i], 0);
    const sumXX = x.reduce((acc, val) => acc + val * val, 0);
    const sumYY = y.reduce((acc, val) => acc + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private generateBasicInsights(data: any[], spec: AnalysisSpec, trends: Trend[], anomalies: Anomaly[]): Insight[] {
    const insights: Insight[] = [];

    // Trend-based insights
    trends.forEach(trend => {
      if (trend.significance === 'strong') {
        insights.push({
          id: crypto.randomUUID(),
          type: 'trend',
          severity: trend.direction === 'decreasing' ? 'high' : 'medium',
          title: `Strong ${trend.direction} trend in ${trend.metric}`,
          description: `${trend.metric} shows a ${trend.significance} ${trend.direction} trend over ${trend.duration_days} days`,
          impact: trend.direction === 'increasing' ? 'Positive growth trajectory' : 'Declining performance requiring attention',
          confidence: trend.strength,
          supporting_data: { trend },
          related_metrics: [trend.metric],
          recommended_actions: trend.direction === 'decreasing'
            ? ['Investigate root causes', 'Implement corrective measures']
            : ['Monitor sustainment', 'Scale successful strategies'],
        });
      }
    });

    // Anomaly-based insights
    anomalies.filter(a => a.severity === 'high').forEach(anomaly => {
      insights.push({
        id: crypto.randomUUID(),
        type: 'anomaly',
        severity: 'high',
        title: `Significant anomaly detected in ${anomaly.metric}`,
        description: `${anomaly.metric} showed unusual behavior on ${anomaly.timestamp}`,
        impact: 'Potential data quality issue or significant event',
        confidence: 0.8,
        supporting_data: { anomaly },
        related_metrics: [anomaly.metric],
        recommended_actions: ['Investigate data source', 'Validate with business events'],
      });
    });

    return insights;
  }

  private generateBasicRecommendations(insights: Insight[], spec: AnalysisSpec): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Generate recommendations based on insights
    insights.forEach(insight => {
      if (insight.type === 'trend' && insight.severity === 'high') {
        recommendations.push({
          id: crypto.randomUUID(),
          category: 'optimization',
          priority: 'high',
          title: `Address declining ${insight.related_metrics[0]}`,
          description: `Implement optimization strategies for ${insight.related_metrics[0]}`,
          rationale: insight.description,
          expected_impact: 'Improved performance and trend reversal',
          effort_level: 'medium',
          timeline: '2-4 weeks',
          success_metrics: insight.related_metrics,
          related_insights: [insight.id],
        });
      }
    });

    return recommendations;
  }

  private async generateAIInsights(results: AnalysisResult[], context: any): Promise<AnalysisResult[]> {
    // Use OpenAI to generate enhanced insights
    for (const result of results) {
      try {
        const prompt = this.createInsightsPrompt(result, context);

        const response = await this.openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are a data analyst expert. Generate actionable insights and recommendations based on the provided data analysis results."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.1,
        });

        const aiInsights = this.parseAIInsights(response.choices[0]?.message?.content || '');
        result.insights = [...result.insights, ...aiInsights.insights];
        result.recommendations = [...result.recommendations, ...aiInsights.recommendations];

      } catch (error) {
        console.error('Error generating AI insights:', error);
      }
    }

    return results;
  }

  private createInsightsPrompt(result: AnalysisResult, context: any): string {
    return `Analyze the following data analysis results and provide insights and recommendations:

Data Summary:
- Analysis Type: ${result.spec.type}
- Domain: ${result.spec.domain}
- Data Points: ${result.metadata.data_points}
- Time Range: ${result.statistical_summary.date_range.start} to ${result.statistical_summary.date_range.end}

Key Metrics:
${result.spec.metrics.map(m => `- ${m.name}: ${result.statistical_summary.metrics_summary[m.id]?.avg || 'N/A'}`).join('\n')}

Trends Detected:
${result.trends.map(t => `- ${t.metric}: ${t.direction} (${t.significance})`).join('\n')}

Anomalies:
${result.anomalies.slice(0, 3).map(a => `- ${a.metric}: ${a.severity} severity`).join('\n')}

Business Context:
- Industry: ${context.business_context?.industry || 'N/A'}
- Goals: ${context.business_context?.business_goals?.join(', ') || 'N/A'}

Please provide:
1. 3-5 key insights about the data patterns
2. 3-5 actionable recommendations for improvement
3. Priority level for each recommendation

Format as JSON with insights and recommendations arrays.`;
  }

  private parseAIInsights(aiResponse: string): { insights: Insight[], recommendations: Recommendation[] } {
    try {
      const parsed = JSON.parse(aiResponse);
      return {
        insights: parsed.insights || [],
        recommendations: parsed.recommendations || [],
      };
    } catch (error) {
      // Fallback to empty arrays if parsing fails
      return { insights: [], recommendations: [] };
    }
  }

  private async createVisualizations(results: AnalysisResult[], context: any): Promise<AnalysisResult[]> {
    for (const result of results) {
      const generatedVisualizations: GeneratedVisualization[] = [];

      for (const vizSpec of result.spec.visualizations) {
        try {
          const visualization = await this.generateVisualization(vizSpec, result.data, result.spec);
          generatedVisualizations.push(visualization);
        } catch (error) {
          console.error('Error generating visualization:', error);
        }
      }

      result.visualizations = generatedVisualizations;
    }

    return results;
  }

  private async generateVisualization(
    spec: VisualizationSpec,
    data: any[],
    analysisSpec: AnalysisSpec
  ): Promise<GeneratedVisualization> {

    // Prepare chart data
    const chartData = this.prepareChartData(data, spec);

    // Generate React component code
    const chartLibrary = 'recharts'; // Default library
    const template = this.chartLibraries[chartLibrary][spec.type];

    if (!template) {
      throw new Error(`No template found for chart type: ${spec.type}`);
    }

    const componentCode = this.generateChartComponent(template, spec, chartData, analysisSpec);

    return {
      id: crypto.randomUUID(),
      spec,
      chart_data: chartData,
      chart_config: spec.chart_config,
      generated_code: {
        react_component: componentCode,
        chart_library: chartLibrary,
        dependencies: ['recharts', 'react'],
      },
      export_urls: {
        'png': `/api/charts/${spec.id}/export/png`,
        'svg': `/api/charts/${spec.id}/export/svg`,
      },
    };
  }

  private prepareChartData(data: any[], spec: VisualizationSpec): any {
    // Transform data based on visualization requirements
    let chartData = [...data];

    // Apply sorting if specified
    if (spec.chart_config.sort_by) {
      chartData.sort((a, b) => {
        const valueA = a[spec.chart_config.sort_by!];
        const valueB = b[spec.chart_config.sort_by!];

        if (spec.chart_config.sort_order === 'desc') {
          return valueB - valueA;
        }
        return valueA - valueB;
      });
    }

    // Apply limit if specified
    if (spec.chart_config.limit) {
      chartData = chartData.slice(0, spec.chart_config.limit);
    }

    return chartData;
  }

  private generateChartComponent(
    template: string,
    spec: VisualizationSpec,
    chartData: any,
    analysisSpec: AnalysisSpec
  ): string {

    const colors = this.colorPalettes[spec.chart_config.color_palette || 'default'];

    let componentCode = template
      .replace(/\{ComponentName\}/g, this.toPascalCase(spec.id))
      .replace(/\{title\}/g, spec.title)
      .replace(/\{xAxisKey\}/g, spec.chart_config.x_axis || spec.dimensions[0])
      .replace(/\{valueKey\}/g, spec.metrics[0]);

    // Replace metrics array
    const metricsArray = JSON.stringify(spec.metrics);
    componentCode = componentCode.replace(/\{metrics\}/g, metricsArray);

    // Replace colors array
    const colorsArray = JSON.stringify(colors);
    componentCode = componentCode.replace(/colors/g, colorsArray);

    return componentCode;
  }

  private toPascalCase(str: string): string {
    return str.replace(/(^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '').replace(/[-_]/g, '');
  }

  private async buildAnalyticsDashboard(
    results: AnalysisResult[],
    context: any,
    request: string
  ): Promise<any> {

    const allVisualizations = results.flatMap(result => result.visualizations);
    const allInsights = results.flatMap(result => result.insights);
    const allRecommendations = results.flatMap(result => result.recommendations);

    // Summarize insights and recommendations
    const insightsSummary = this.summarizeInsights(allInsights);
    const recommendationsSummary = this.summarizeRecommendations(allRecommendations);

    return {
      id: crypto.randomUUID(),
      title: `Analytics Dashboard - ${context.project?.name || 'Data Analysis'}`,
      description: `Comprehensive analytics dashboard based on: ${request}`,
      visualizations: allVisualizations,
      insights_summary: insightsSummary,
      recommendations_summary: recommendationsSummary,
      refresh_schedule: 'daily',
      export_urls: {
        'pdf': `/api/dashboards/${crypto.randomUUID()}/export/pdf`,
        'excel': `/api/dashboards/${crypto.randomUUID()}/export/excel`,
      },
    };
  }

  private summarizeInsights(insights: Insight[]): string {
    const highSeverityCount = insights.filter(i => i.severity === 'high' || i.severity === 'critical').length;
    const trendCount = insights.filter(i => i.type === 'trend').length;
    const anomalyCount = insights.filter(i => i.type === 'anomaly').length;

    return `Generated ${insights.length} insights: ${highSeverityCount} high-priority items, ${trendCount} trends, ${anomalyCount} anomalies detected.`;
  }

  private summarizeRecommendations(recommendations: Recommendation[]): string {
    const urgentCount = recommendations.filter(r => r.priority === 'urgent' || r.priority === 'high').length;
    const optimizationCount = recommendations.filter(r => r.category === 'optimization').length;

    return `Provided ${recommendations.length} recommendations: ${urgentCount} high-priority actions, ${optimizationCount} optimization opportunities.`;
  }

  private async storeAnalysisAssets(
    results: AnalysisResult[],
    dashboard: any,
    projectId?: string
  ): Promise<any[]> {

    const storedAssets = [];

    // Store dashboard
    if (dashboard) {
      const { data: dashboardAsset } = await this.supabase
        .from('creative_assets')
        .insert({
          project_id: projectId,
          type: 'dashboard',
          subtype: 'analytics',
          name: dashboard.title,
          metadata: {
            dashboard,
            visualizations_count: dashboard.visualizations.length,
            insights_summary: dashboard.insights_summary,
            recommendations_summary: dashboard.recommendations_summary,
          },
          created_by: this.agentId,
          status: 'active',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      storedAssets.push(dashboardAsset);
    }

    // Store individual analysis results
    for (const result of results) {
      try {
        const { data: analysisAsset } = await this.supabase
          .from('creative_assets')
          .insert({
            project_id: projectId,
            type: 'analysis',
            subtype: result.spec.type,
            name: `${result.spec.domain} Analysis`,
            metadata: {
              analysis_result: result,
              metrics_summary: result.statistical_summary.metrics_summary,
              insights_count: result.insights.length,
              recommendations_count: result.recommendations.length,
              data_quality_score: result.metadata.data_quality_score,
            },
            created_by: this.agentId,
            status: 'active',
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        storedAssets.push(analysisAsset);
      } catch (error) {
        console.error('Error storing analysis asset:', error);
      }
    }

    return storedAssets;
  }

  private generateAnalyticsReport(state: DataAnalystState): string {
    let report = '# 📊 Data Analyst Agent Report\n\n';

    if (state.context.project) {
      report += `**Project:** ${state.context.project.name}\n`;
      report += `**Analysis Period:** ${state.specifications?.[0]?.time_range.start_date} to ${state.specifications?.[0]?.time_range.end_date}\n\n`;
    }

    if (state.decision) {
      report += `## Analysis Overview\n`;
      report += `**Action:** ${state.decision.action}\n`;
      report += `**Approach:** ${state.decision.analysis_approach}\n`;
      report += `**Priority Metrics:** ${state.decision.priority_metrics.join(', ')}\n`;
      report += `**Confidence:** ${Math.round(state.decision.confidence * 100)}%\n\n`;
    }

    if (state.results && state.results.length > 0) {
      const totalInsights = state.results.reduce((sum, r) => sum + r.insights.length, 0);
      const totalRecommendations = state.results.reduce((sum, r) => sum + r.recommendations.length, 0);
      const avgQualityScore = state.results.reduce((sum, r) => sum + r.metadata.data_quality_score, 0) / state.results.length;

      report += `## Analysis Results\n`;
      report += `**Analyses Completed:** ${state.results.length}\n`;
      report += `**Total Data Points:** ${state.results.reduce((sum, r) => sum + r.metadata.data_points, 0)}\n`;
      report += `**Average Data Quality:** ${(avgQualityScore * 100).toFixed(1)}%\n`;
      report += `**Insights Generated:** ${totalInsights}\n`;
      report += `**Recommendations:** ${totalRecommendations}\n\n`;

      // Key insights summary
      const highSeverityInsights = state.results.flatMap(r => r.insights.filter(i => i.severity === 'high' || i.severity === 'critical'));
      if (highSeverityInsights.length > 0) {
        report += `### 🔍 Key Insights\n`;
        highSeverityInsights.slice(0, 5).forEach(insight => {
          report += `- **${insight.title}:** ${insight.description}\n`;
        });
        report += '\n';
      }

      // Top recommendations
      const urgentRecommendations = state.results.flatMap(r => r.recommendations.filter(rec => rec.priority === 'urgent' || rec.priority === 'high'));
      if (urgentRecommendations.length > 0) {
        report += `### 💡 Priority Recommendations\n`;
        urgentRecommendations.slice(0, 5).forEach(rec => {
          report += `- **${rec.title}:** ${rec.description} (${rec.effort_level} effort, ${rec.timeline})\n`;
        });
        report += '\n';
      }

      // Visualizations summary
      const totalVisualizations = state.results.reduce((sum, r) => sum + r.visualizations.length, 0);
      if (totalVisualizations > 0) {
        report += `### 📈 Visualizations Created\n`;
        report += `**Total Charts:** ${totalVisualizations}\n`;

        const chartTypes = state.results.flatMap(r => r.visualizations.map(v => v.spec.type));
        const uniqueTypes = [...new Set(chartTypes)];
        report += `**Chart Types:** ${uniqueTypes.join(', ')}\n\n`;
      }

      // Data quality summary
      report += `### 📋 Data Quality Assessment\n`;
      state.results.forEach((result, index) => {
        report += `**Analysis ${index + 1} (${result.spec.domain}):**\n`;
        report += `- Data Quality Score: ${(result.metadata.data_quality_score * 100).toFixed(1)}%\n`;
        report += `- Completeness: ${(result.metadata.completeness_score * 100).toFixed(1)}%\n`;
        report += `- Anomalies Detected: ${result.anomalies.length}\n`;
        report += `- Trends Identified: ${result.trends.length}\n\n`;
      });
    }

    if (state.dashboard) {
      report += `## Dashboard\n`;
      report += `**Title:** ${state.dashboard.title}\n`;
      report += `**Visualizations:** ${state.dashboard.visualizations.length}\n`;
      report += `**Refresh Schedule:** ${state.dashboard.refresh_schedule}\n\n`;
      report += `**Summary:** ${state.dashboard.insights_summary}\n\n`;
    }

    report += `\n---\n*Generated by Data Analyst Agent at ${new Date().toISOString()}*`;

    return report;
  }

  // Public interface
  public async analyzeData(request: string, projectId?: string, campaignId?: string) {
    const initialState: DataAnalystState = {
      projectId,
      campaignId,
      request,
      context: {},
      messages: [new HumanMessage(request)],
    };

    const compiled = this.graph.compile();
    const result = await compiled.invoke(initialState);

    return result;
  }

  public async getChartTemplates(chartType: string): Promise<any> {
    return this.chartLibraries.recharts[chartType] || {};
  }

  public async getColorPalettes(): Promise<any> {
    return this.colorPalettes;
  }

  public async getAgentStatus() {
    const { data: recentAnalyses } = await this.supabase
      .from('creative_assets')
      .select('*')
      .eq('created_by', this.agentId)
      .in('type', ['analysis', 'dashboard'])
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      agentId: this.agentId,
      status: 'operational',
      recentAnalyses: recentAnalyses?.length || 0,
      supportedAnalysisTypes: ['descriptive', 'diagnostic', 'predictive', 'prescriptive'],
      supportedDomains: ['campaign_performance', 'user_behavior', 'content_analytics', 'financial', 'engagement', 'conversion'],
      supportedVisualizations: ['line_chart', 'bar_chart', 'pie_chart', 'scatter_plot', 'heatmap', 'funnel', 'cohort'],
      chartLibraries: Object.keys(this.chartLibraries),
      colorPalettes: Object.keys(this.colorPalettes),
      lastActive: new Date().toISOString(),
    };
  }
}

export type { DataAnalystState };
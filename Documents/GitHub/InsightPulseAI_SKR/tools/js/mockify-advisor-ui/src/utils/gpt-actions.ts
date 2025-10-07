import { InsightData } from '@/types/advisor';

export interface ActionPlan {
  summary: string;
  actions: Array<{
    title: string;
    description: string;
    timeline: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  resources: Array<{
    type: string;
    description: string;
  }>;
  timeline: {
    phase: string;
    duration: string;
    tasks: string[];
  }[];
  kpis: Array<{
    metric: string;
    target: string;
    timeframe: string;
  }>;
}

/**
 * Generates an action plan based on the provided insight
 * This function would normally call an API endpoint with GPT/Claude capabilities
 * For now, it simulates the response
 */
export async function generatePlanFromInsight(insight: InsightData): Promise<ActionPlan> {
  // In a real implementation, this would make an API call to a GPT endpoint
  // For now, we'll simulate an API response with a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate a plan based on the insight category and title
      const plan = generateMockPlan(insight);
      resolve(plan);
    }, 2000);
  });
}

/**
 * Generates a mock action plan for demo purposes
 * This simulates what would come from a GPT API call
 */
function generateMockPlan(insight: InsightData): ActionPlan {
  // Base plan structure that gets customized based on insight type
  const basePlan: ActionPlan = {
    summary: '',
    actions: [],
    resources: [],
    timeline: [],
    kpis: []
  };

  // Generate a plan based on the insight category
  switch (insight.category) {
    case 'revenue':
      return {
        summary: `This insight reveals an opportunity to increase revenue by ${insight.summary.toLowerCase()}. The data suggests a potential 12-15% uplift in targeted segments with proper implementation.`,
        actions: [
          {
            title: 'Segment Analysis Deep Dive',
            description: 'Conduct an in-depth analysis of the identified customer segments to understand their behavior, preferences, and purchasing patterns.',
            timeline: '1-2 weeks',
            priority: 'high'
          },
          {
            title: 'Marketing Campaign Development',
            description: 'Create targeted marketing campaigns for the high-value segments identified in the insight.',
            timeline: '2-3 weeks',
            priority: 'high'
          },
          {
            title: 'Budget Reallocation',
            description: 'Adjust marketing budget allocation to increase spend on high-performing segments and channels.',
            timeline: '1 week',
            priority: 'medium'
          },
          {
            title: 'Performance Tracking Setup',
            description: 'Implement enhanced tracking mechanisms to measure the impact of the new targeting approach.',
            timeline: '1 week',
            priority: 'medium'
          }
        ],
        resources: [
          {
            type: 'Personnel',
            description: 'Marketing team (2-3 members), Data analyst (1)'
          },
          {
            type: 'Budget',
            description: 'Marketing spend reallocation: $25,000-$50,000'
          },
          {
            type: 'Tools',
            description: 'Analytics platform, CRM system, Marketing automation software'
          }
        ],
        timeline: [
          {
            phase: 'Analysis & Planning',
            duration: 'Weeks 1-2',
            tasks: [
              'Conduct detailed segment analysis',
              'Develop targeting strategy',
              'Prepare budget reallocation plan'
            ]
          },
          {
            phase: 'Implementation',
            duration: 'Weeks 3-5',
            tasks: [
              'Create campaign assets',
              'Launch initial test campaigns',
              'Set up tracking and reporting'
            ]
          },
          {
            phase: 'Optimization & Scaling',
            duration: 'Weeks 6-12',
            tasks: [
              'Analyze campaign performance',
              'Optimize targeting and messaging',
              'Scale successful approaches'
            ]
          }
        ],
        kpis: [
          {
            metric: 'Revenue from Target Segment',
            target: '+12-15%',
            timeframe: '90 days'
          },
          {
            metric: 'Customer Acquisition Cost',
            target: '-5-10%',
            timeframe: '60 days'
          },
          {
            metric: 'Conversion Rate',
            target: '+2-3 percentage points',
            timeframe: '30 days'
          }
        ]
      };
    
    case 'inventory':
      return {
        summary: `This insight highlights an inventory optimization opportunity related to ${insight.summary.toLowerCase()}. Taking action quickly could prevent stockouts and optimize inventory costs.`,
        actions: [
          {
            title: 'Expedite Replenishment Orders',
            description: 'Place expedited orders for the identified SKUs to prevent stockouts before the scheduled replenishment date.',
            timeline: 'Immediate',
            priority: 'high'
          },
          {
            title: 'Review Safety Stock Levels',
            description: 'Adjust safety stock levels for high-velocity items to account for increased demand.',
            timeline: '1 week',
            priority: 'high'
          },
          {
            title: 'Update Forecasting Model',
            description: 'Refine demand forecasting models to better predict sales velocity for top-selling products.',
            timeline: '2-3 weeks',
            priority: 'medium'
          },
          {
            title: 'Implement Real-time Alerts',
            description: 'Set up alert thresholds at 40% of stock remaining to provide earlier warning for high-demand items.',
            timeline: '1-2 weeks',
            priority: 'medium'
          }
        ],
        resources: [
          {
            type: 'Personnel',
            description: 'Inventory manager, Supply chain analyst, IT support (for alert system)'
          },
          {
            type: 'Budget',
            description: 'Expedited shipping costs: $5,000-$10,000, System updates: $2,000-$5,000'
          },
          {
            type: 'Tools',
            description: 'Inventory management system, Demand forecasting software, Alert configuration tools'
          }
        ],
        timeline: [
          {
            phase: 'Immediate Action',
            duration: 'Days 1-3',
            tasks: [
              'Place expedited orders for at-risk SKUs',
              'Notify stakeholders of potential stockout risk',
              'Begin safety stock level review'
            ]
          },
          {
            phase: 'Short-term Improvements',
            duration: 'Weeks 1-2',
            tasks: [
              'Implement adjusted safety stock levels',
              'Configure inventory alert thresholds',
              'Begin forecasting model review'
            ]
          },
          {
            phase: 'Long-term Optimization',
            duration: 'Weeks 3-8',
            tasks: [
              'Deploy updated forecasting models',
              'Implement regular velocity analysis',
              'Establish ongoing inventory optimization process'
            ]
          }
        ],
        kpis: [
          {
            metric: 'Stockout Prevention',
            target: '100% for identified SKUs',
            timeframe: '30 days'
          },
          {
            metric: 'Inventory Carrying Costs',
            target: 'No increase despite higher safety stock',
            timeframe: '90 days'
          },
          {
            metric: 'Forecast Accuracy',
            target: '+10-15% improvement',
            timeframe: '60 days'
          }
        ]
      };
    
    case 'customers':
      return {
        summary: `This insight identifies a customer retention issue related to ${insight.summary.toLowerCase()}. Addressing this promptly could help maintain customer loyalty and prevent further churn.`,
        actions: [
          {
            title: 'Competitive Pricing Analysis',
            description: 'Conduct an in-depth analysis of competitor pricing structures to understand the specific areas where adjustments may be needed.',
            timeline: '1-2 weeks',
            priority: 'high'
          },
          {
            title: 'Develop Retention Program',
            description: 'Create a targeted loyalty program specifically for at-risk premium customers with meaningful incentives.',
            timeline: '2-3 weeks',
            priority: 'high'
          },
          {
            title: 'Launch Win-back Campaign',
            description: 'Design and implement a win-back campaign targeting recently churned customers with competitive offers.',
            timeline: '2-4 weeks',
            priority: 'medium'
          },
          {
            title: 'Enhance Customer Service',
            description: 'Increase touchpoints and personalized service for premium subscribers to improve satisfaction and address concerns proactively.',
            timeline: '2-4 weeks',
            priority: 'medium'
          }
        ],
        resources: [
          {
            type: 'Personnel',
            description: 'Customer success team (2-3 members), Marketing specialist (1), Pricing analyst (1)'
          },
          {
            type: 'Budget',
            description: 'Retention program incentives: $15,000-$30,000, Win-back campaign: $10,000-$20,000'
          },
          {
            type: 'Tools',
            description: 'CRM system, Customer feedback platform, Competitive analysis tools'
          }
        ],
        timeline: [
          {
            phase: 'Analysis & Strategy',
            duration: 'Weeks 1-2',
            tasks: [
              'Complete competitor pricing analysis',
              'Design retention program structure',
              'Segment at-risk customers'
            ]
          },
          {
            phase: 'Program Implementation',
            duration: 'Weeks 3-5',
            tasks: [
              'Launch retention program',
              'Begin enhanced customer service initiative',
              'Develop win-back campaign assets'
            ]
          },
          {
            phase: 'Campaign & Optimization',
            duration: 'Weeks 6-12',
            tasks: [
              'Launch win-back campaign',
              'Monitor retention metrics',
              'Refine approaches based on feedback'
            ]
          }
        ],
        kpis: [
          {
            metric: 'Premium Tier Churn Rate',
            target: 'Reduce by 8-12%',
            timeframe: '90 days'
          },
          {
            metric: 'Win-back Conversion Rate',
            target: '15-20% of targeted customers',
            timeframe: '60 days'
          },
          {
            metric: 'Customer Satisfaction Score',
            target: 'Increase by 0.5-1.0 points',
            timeframe: '30 days'
          }
        ]
      };
      
    // Default case for other categories
    default:
      return {
        summary: `This insight related to ${insight.title} presents an opportunity for business improvement. Taking structured action on this insight could yield measurable benefits.`,
        actions: [
          {
            title: 'Detailed Analysis',
            description: 'Conduct a comprehensive analysis to fully understand the implications and opportunities presented by this insight.',
            timeline: '1-2 weeks',
            priority: 'high'
          },
          {
            title: 'Strategy Development',
            description: 'Develop an action strategy based on the analysis findings, with clear objectives and ownership.',
            timeline: '2 weeks',
            priority: 'high'
          },
          {
            title: 'Implementation Planning',
            description: 'Create a detailed implementation plan with resource allocation, timelines, and success metrics.',
            timeline: '1-2 weeks',
            priority: 'medium'
          },
          {
            title: 'Execution & Monitoring',
            description: 'Execute the planned actions and establish monitoring mechanisms to track progress and impact.',
            timeline: '4-8 weeks',
            priority: 'medium'
          }
        ],
        resources: [
          {
            type: 'Personnel',
            description: 'Project lead, Subject matter experts, Implementation team'
          },
          {
            type: 'Budget',
            description: 'Initial assessment: $5,000-$10,000, Implementation: Variable based on scope'
          },
          {
            type: 'Tools',
            description: 'Analytics platform, Project management software, Reporting tools'
          }
        ],
        timeline: [
          {
            phase: 'Discovery & Analysis',
            duration: 'Weeks 1-2',
            tasks: [
              'Gather relevant data',
              'Analyze implications and opportunities',
              'Define success metrics'
            ]
          },
          {
            phase: 'Planning & Preparation',
            duration: 'Weeks 3-4',
            tasks: [
              'Develop detailed strategy',
              'Allocate resources',
              'Prepare implementation roadmap'
            ]
          },
          {
            phase: 'Execution & Monitoring',
            duration: 'Weeks 5-12',
            tasks: [
              'Implement planned actions',
              'Monitor progress and results',
              'Make adjustments as needed'
            ]
          }
        ],
        kpis: [
          {
            metric: 'Progress Against Plan',
            target: '90% of milestones met on time',
            timeframe: 'Ongoing'
          },
          {
            metric: 'Business Impact',
            target: 'Variable based on insight area',
            timeframe: '90 days'
          },
          {
            metric: 'ROI on Implementation',
            target: 'Positive within 6 months',
            timeframe: '6 months'
          }
        ]
      };
  }
}
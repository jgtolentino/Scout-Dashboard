import { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

interface CESAnalysisRequest {
  campaign_id: string;
  asset_files: string[];
  analysis_type: 'full' | 'quick' | 'benchmark_only';
  stakeholder_role: 'creative' | 'strategist' | 'account_manager' | 'leadership';
  brief_text?: string;
  client_context?: {
    client_name: string;
    industry: string;
    campaign_objectives: string[];
  };
}

interface CESAnalysisResponse {
  success: boolean;
  analysis_id: string;
  scorecard: any;
  processing_time: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CESAnalysisResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      analysis_id: '',
      scorecard: null,
      processing_time: 0,
      error: 'Method not allowed'
    });
  }

  const startTime = Date.now();
  
  try {
    const {
      campaign_id,
      asset_files,
      analysis_type = 'full',
      stakeholder_role = 'creative',
      brief_text,
      client_context
    } = req.body as CESAnalysisRequest;

    // Validate input
    if (!campaign_id || !asset_files || asset_files.length === 0) {
      return res.status(400).json({
        success: false,
        analysis_id: '',
        scorecard: null,
        processing_time: 0,
        error: 'Missing required fields: campaign_id and asset_files'
      });
    }

    // Generate analysis ID
    const analysis_id = `ces_${campaign_id}_${Date.now()}`;

    // Prepare Python analysis command
    const pythonScript = path.join(process.cwd(), '../../../packages/pageindex-agent/src/ces_modeling.py');
    const dataPayload = JSON.stringify({
      campaign_id,
      asset_files,
      analysis_type,
      stakeholder_role,
      brief_text,
      client_context,
      analysis_id
    });

    // Execute CES analysis
    const command = `python3 ${pythonScript} --analyze '${dataPayload}'`;
    const { stdout, stderr } = await execAsync(command, {
      timeout: 300000, // 5 minute timeout
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });

    if (stderr && !stderr.includes('Warning')) {
      throw new Error(`Python analysis failed: ${stderr}`);
    }

    // Parse results
    const analysisResult = JSON.parse(stdout);

    // Format scorecard for frontend
    const scorecard = {
      campaign_id,
      analysis_id,
      overall_impact_score: analysisResult.overall_impact_score || 0,
      ces_prediction: analysisResult.ces_score || 0,
      feature_scores: analysisResult.feature_scores || {},
      creative_recommendations: analysisResult.recommendations || [],
      expected_lift_estimates: analysisResult.expected_lifts || {},
      priority_actions: analysisResult.priority_actions || [],
      confidence_in_recommendations: analysisResult.confidence || 0.8,
      generated_at: new Date().toISOString(),
      daivid_scores: analysisResult.daivid_integration || null,
      stakeholder_context: {
        role: stakeholder_role,
        filtered_recommendations: analysisResult.role_specific_recommendations || []
      }
    };

    const processingTime = Date.now() - startTime;

    // Store results in database (if connection available)
    try {
      await storeAnalysisResults(analysis_id, scorecard);
    } catch (dbError) {
      console.warn('Failed to store analysis in database:', dbError);
      // Continue without database storage
    }

    return res.status(200).json({
      success: true,
      analysis_id,
      scorecard,
      processing_time
    });

  } catch (error) {
    console.error('CES Analysis failed:', error);
    
    const processingTime = Date.now() - startTime;
    
    return res.status(500).json({
      success: false,
      analysis_id: '',
      scorecard: null,
      processing_time,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

async function storeAnalysisResults(analysis_id: string, scorecard: any) {
  // This would connect to your Azure SQL database to store results
  // Implementation depends on your database connection setup
  
  const query = `
    INSERT INTO creativeScorecard (
      scorecard_id, campaign_id, overall_impact_score, 
      feature_scores, creative_recommendations, expected_lift_estimates,
      priority_actions, stakeholder_targeting, confidence_in_recommendations,
      generated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const values = [
    analysis_id,
    scorecard.campaign_id,
    scorecard.overall_impact_score,
    JSON.stringify(scorecard.feature_scores),
    JSON.stringify(scorecard.creative_recommendations),
    JSON.stringify(scorecard.expected_lift_estimates),
    JSON.stringify(scorecard.priority_actions),
    scorecard.stakeholder_context?.role || 'creative',
    scorecard.confidence_in_recommendations,
    scorecard.generated_at
  ];
  
  // Execute query with your database connection
  // await db.execute(query, values);
}
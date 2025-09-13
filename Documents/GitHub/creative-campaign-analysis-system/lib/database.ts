// TBWA Creative Campaign Database Schema & API Endpoints

// File: lib/database.ts - Updated for Creative Campaign Analysis
import sql from 'mssql';

const config = {
  server: process.env.CES_AZURE_SQL_SERVER!,
  database: process.env.CES_AZURE_SQL_DATABASE!,
  user: process.env.CES_AZURE_SQL_USER!,
  password: process.env.CES_AZURE_SQL_PASSWORD!,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = new sql.ConnectionPool(config);
    await pool.connect();
  }
  return pool;
}

export async function initializeCreativeCampaignDatabase(): Promise<void> {
  const connection = await getConnection();
  
  // Create campaign documents table
  await connection.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='campaign_documents' AND xtype='U')
    CREATE TABLE campaign_documents (
      id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
      document_id NVARCHAR(255) UNIQUE NOT NULL,
      filename NVARCHAR(500) NOT NULL,
      mime_type NVARCHAR(100),
      size BIGINT,
      created_time DATETIME2,
      modified_time DATETIME2,
      drive_id NVARCHAR(255),
      path NVARCHAR(1000),
      campaign_name NVARCHAR(255),
      client_name NVARCHAR(255),
      file_type NVARCHAR(50), -- video, image, presentation, document, other
      processed_at DATETIME2 DEFAULT GETDATE(),
      INDEX idx_campaign_document_id (document_id),
      INDEX idx_campaign_name (campaign_name),
      INDEX idx_client_name (client_name),
      INDEX idx_file_type (file_type),
      INDEX idx_processed_at (processed_at)
    )
  `);

  // Create campaign analysis table
  await connection.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='campaign_analysis' AND xtype='U')
    CREATE TABLE campaign_analysis (
      id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
      document_id NVARCHAR(255) NOT NULL,
      creative_features NVARCHAR(MAX), -- JSON with all creative features
      business_outcomes NVARCHAR(MAX), -- JSON with all business outcomes
      campaign_composition NVARCHAR(MAX), -- JSON with campaign composition
      confidence_score DECIMAL(3,2),
      analysis_timestamp DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (document_id) REFERENCES campaign_documents(document_id),
      INDEX idx_analysis_doc_id (document_id),
      INDEX idx_analysis_timestamp (analysis_timestamp),
      INDEX idx_confidence_score (confidence_score)
    )
  `);

  // Create creative features lookup table
  await connection.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='creative_features_lookup' AND xtype='U')
    CREATE TABLE creative_features_lookup (
      id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
      document_id NVARCHAR(255) NOT NULL,
      feature_category NVARCHAR(50), -- content, design, messaging, targeting, channel, detected
      feature_name NVARCHAR(100),
      feature_value BIT,
      created_at DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (document_id) REFERENCES campaign_documents(document_id),
      INDEX idx_feature_category (feature_category),
      INDEX idx_feature_name (feature_name),
      INDEX idx_feature_value (feature_value)
    )
  `);

  // Create business outcomes lookup table
  await connection.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='business_outcomes_lookup' AND xtype='U')
    CREATE TABLE business_outcomes_lookup (
      id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
      document_id NVARCHAR(255) NOT NULL,
      outcome_category NVARCHAR(50), -- engagement, conversion, brand, efficiency, behavioral, business
      outcome_name NVARCHAR(100),
      outcome_value BIT,
      prediction_confidence DECIMAL(3,2),
      created_at DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (document_id) REFERENCES campaign_documents(document_id),
      INDEX idx_outcome_category (outcome_category),
      INDEX idx_outcome_name (outcome_name),
      INDEX idx_outcome_value (outcome_value),
      INDEX idx_prediction_confidence (prediction_confidence)
    )
  `);

  // Keep existing document_chunks table for embeddings
  await connection.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='document_chunks' AND xtype='U')
    CREATE TABLE document_chunks (
      id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
      document_id NVARCHAR(255) NOT NULL,
      chunk_id NVARCHAR(255) NOT NULL,
      content NVARCHAR(MAX) NOT NULL,
      embedding NVARCHAR(MAX), -- JSON array of embedding vectors
      chunk_index INT,
      created_at DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (document_id) REFERENCES campaign_documents(document_id),
      INDEX idx_chunks_doc_id (document_id),
      INDEX idx_chunk_id (chunk_id)
    )
  `);

  // Create campaign summary view
  await connection.request().query(`
    CREATE OR ALTER VIEW campaign_summary AS
    SELECT 
      cd.campaign_name,
      cd.client_name,
      COUNT(*) as total_files,
      SUM(CASE WHEN cd.file_type = 'video' THEN 1 ELSE 0 END) as video_count,
      SUM(CASE WHEN cd.file_type = 'image' THEN 1 ELSE 0 END) as image_count,
      SUM(CASE WHEN cd.file_type = 'presentation' THEN 1 ELSE 0 END) as presentation_count,
      AVG(ca.confidence_score) as avg_confidence,
      MAX(cd.processed_at) as last_processed
    FROM campaign_documents cd
    LEFT JOIN campaign_analysis ca ON cd.document_id = ca.document_id
    WHERE cd.campaign_name IS NOT NULL
    GROUP BY cd.campaign_name, cd.client_name
  `);
}

// File: lib/azure-openai.ts - Updated for Creative Insights
import { OpenAI } from 'openai';

const client = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { 'api-version': '2024-05-01-preview' },
  defaultHeaders: {
    'api-key': process.env.AZURE_OPENAI_API_KEY,
  },
});

export async function createEmbedding(text: string): Promise<number[]> {
  try {
    const response = await client.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text.substring(0, 8000),
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error creating embedding:', error);
    throw error;
  }
}

export async function generateCreativeInsights(
  context: string,
  query: string
): Promise<string> {
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert creative strategist and campaign analyst for TBWA, one of the world's leading advertising agencies.

Your expertise includes:
- Creative strategy and execution analysis
- Campaign performance prediction 
- Business outcome optimization
- Cross-channel campaign effectiveness
- Award-winning creative patterns

Context includes real TBWA campaign files, creative features, and business outcome predictions.

Analyze campaigns focusing on:
1. Creative Features: Content, Design, Messaging, Targeting, Channel strategies
2. Business Outcomes: Engagement, Conversion, Brand, Efficiency, Behavioral impact
3. Campaign Composition: Multi-format execution effectiveness

Provide specific, actionable insights about creative execution and business impact potential.
Reference specific creative features and predicted outcomes when available.
Do NOT mention awards or award potential - focus only on business effectiveness.`
        },
        {
          role: 'user',
          content: `Campaign Context:\n${context}\n\nQuery: ${query}`
        }
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    return response.choices[0]?.message?.content || 'No insights generated';
  } catch (error) {
    console.error('Error generating creative insights:', error);
    throw error;
  }
}

// File: app/api/process-campaigns/route.ts
import { NextResponse } from 'next/server';
import { TBWACreativeRAGEngine } from '@/lib/tbwa-creative-rag-engine';
import { initializeCreativeCampaignDatabase } from '@/lib/database';

const ragEngine = new TBWACreativeRAGEngine();

export async function POST(req: Request) {
  try {
    const { folderId } = await req.json();
    
    // Initialize database if needed
    await initializeCreativeCampaignDatabase();
    
    // Process campaign files from Google Drive
    const result = await ragEngine.processCampaignDrive(folderId);
    
    return NextResponse.json({
      success: true,
      message: `Campaign processing completed. Processed: ${result.processed}, Errors: ${result.errors}`,
      stats: result
    });
  } catch (error) {
    console.error('Campaign processing error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process campaigns',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// File: app/api/creative-insights/route.ts
import { NextResponse } from 'next/server';
import { TBWACreativeRAGEngine } from '@/lib/tbwa-creative-rag-engine';

const ragEngine = new TBWACreativeRAGEngine();

export async function POST(req: Request) {
  try {
    const { question, filters } = await req.json();
    
    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }
    
    const result = await ragEngine.queryCampaignInsights(question, filters || {});
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Creative insights query error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process creative insights query',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// File: app/api/campaign-analytics/route.ts  
import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/database';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const campaign = searchParams.get('campaign');
    const client = searchParams.get('client');
    
    const connection = await getConnection();
    
    // Get campaign summary
    let whereClause = '';
    const request = connection.request();
    
    if (campaign) {
      whereClause += ' AND campaign_name = @campaign';
      request.input('campaign', campaign);
    }
    
    if (client) {
      whereClause += ' AND client_name = @client';  
      request.input('client', client);
    }

    const summaryResult = await request.query(`
      SELECT * FROM campaign_summary 
      WHERE 1=1 ${whereClause}
      ORDER BY last_processed DESC
    `);

    // Get creative features analytics
    const featuresResult = await connection.request().query(`
      SELECT 
        feature_category,
        feature_name,
        COUNT(*) as total_count,
        SUM(CASE WHEN feature_value = 1 THEN 1 ELSE 0 END) as positive_count,
        CAST(SUM(CASE WHEN feature_value = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) as adoption_rate
      FROM creative_features_lookup cfl
      JOIN campaign_documents cd ON cfl.document_id = cd.document_id
      WHERE 1=1 ${whereClause}
      GROUP BY feature_category, feature_name
      ORDER BY adoption_rate DESC
    `);

    // Get business outcomes analytics  
    const outcomesResult = await connection.request().query(`
      SELECT 
        outcome_category,
        outcome_name,
        COUNT(*) as total_count,
        SUM(CASE WHEN outcome_value = 1 THEN 1 ELSE 0 END) as predicted_positive,
        AVG(prediction_confidence) as avg_confidence,
        CAST(SUM(CASE WHEN outcome_value = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) as success_rate
      FROM business_outcomes_lookup bol
      JOIN campaign_documents cd ON bol.document_id = cd.document_id  
      WHERE 1=1 ${whereClause}
      GROUP BY outcome_category, outcome_name
      ORDER BY success_rate DESC, avg_confidence DESC
    `);

    return NextResponse.json({
      success: true,
      data: {
        campaigns: summaryResult.recordset,
        creative_features: featuresResult.recordset,
        business_outcomes: outcomesResult.recordset
      }
    });
  } catch (error) {
    console.error('Campaign analytics error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch campaign analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// File: app/api/health/route.ts - Updated for Creative Campaign System
import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/database';

export async function GET() {
  try {
    // Test database connection
    const connection = await getConnection();
    const result = await connection.request().query('SELECT 1 as health');
    
    // Check if campaign tables exist
    const tablesResult = await connection.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME IN ('campaign_documents', 'campaign_analysis', 'creative_features_lookup', 'business_outcomes_lookup')
    `);
    
    const expectedTables = ['campaign_documents', 'campaign_analysis', 'creative_features_lookup', 'business_outcomes_lookup'];
    const existingTables = tablesResult.recordset.map(row => row.TABLE_NAME);
    const tablesReady = expectedTables.every(table => existingTables.includes(table));
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: result.recordset.length > 0 ? 'connected' : 'disconnected',
      campaign_tables: tablesReady ? 'ready' : 'missing',
      services: {
        azure_sql: 'operational',
        azure_openai: process.env.AZURE_OPENAI_API_KEY ? 'configured' : 'missing',
        google_drive: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 'configured' : 'missing'
      },
      system_type: 'TBWA Creative Campaign Analysis'
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        system_type: 'TBWA Creative Campaign Analysis'
      },
      { status: 500 }
    );
  }
}

// File: components/CreativeInsightsComponent.tsx
'use client';

import { useState } from 'react';
import { Send, Filter, Target, BarChart3, Lightbulb } from 'lucide-react';

interface CreativeInsightResult {
  answer: string;
  sources: Array<{
    content: string;
    source: string;
    campaign: string;
    client: string;
    creative_features: any;
    business_outcomes: any;
  }>;
  analysis: any[];
  metadata: {
    query: string;
    resultsCount: number;
  };
}

export function CreativeInsightsComponent() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<CreativeInsightResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    campaign: '',
    client: '',
    creative_feature: '',
    business_outcome: ''
  });

  const handleQuery = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/creative-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, filters })
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Query error:', error);
      alert('Error processing creative insights query. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries = [
    "Which creative features drive highest engagement?",
    "What messaging strategies work best for brand outcomes?", 
    "Show me video-heavy campaigns with strong conversion potential",
    "Which targeting approaches predict best business results?",
    "What design features correlate with positive brand sentiment?"
  ];

  return (
    <div className="space-y-6">
      {/* Query Input */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Lightbulb className="mr-2 h-5 w-5" />
          Creative Strategy Insights
        </h3>
        
        {/* Advanced Filters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <select
            value={filters.campaign}
            onChange={(e) => setFilters({...filters, campaign: e.target.value})}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All Campaigns</option>
            <option value="brand_launch">Brand Launch</option>
            <option value="product_campaign">Product Campaign</option>
            <option value="seasonal">Seasonal Campaign</option>
          </select>
          
          <select
            value={filters.client}
            onChange={(e) => setFilters({...filters, client: e.target.value})}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All Clients</option>
            <option value="automotive">Automotive</option>
            <option value="tech">Technology</option>
            <option value="fmcg">FMCG</option>
          </select>
          
          <select
            value={filters.creative_feature}
            onChange={(e) => setFilters({...filters, creative_feature: e.target.value})}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All Features</option>
            <option value="storytelling">Storytelling</option>
            <option value="emotional_appeal">Emotional Appeal</option>
            <option value="call_to_action">Call to Action</option>
          </select>
          
          <select
            value={filters.business_outcome}
            onChange={(e) => setFilters({...filters, business_outcome: e.target.value})}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All Outcomes</option>
            <option value="engagement">Engagement</option>
            <option value="conversion">Conversion</option>
            <option value="brand">Brand Building</option>
          </select>
        </div>

        <div className="flex space-x-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about creative strategies, campaign effectiveness, business outcomes..."
            className="flex-1 border rounded px-3 py-2"
            onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
          />
          <button
            onClick={handleQuery}
            disabled={loading || !query.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 flex items-center"
          >
            <Send className="mr-2 h-4 w-4" />
            {loading ? 'Analyzing...' : 'Ask'}
          </button>
        </div>

        {/* Sample Queries */}
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-2">Try these strategic questions:</p>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((sample, index) => (
              <button
                key={index}
                onClick={() => setQuery(sample)}
                className="text-xs bg-muted px-2 py-1 rounded hover:bg-muted/80"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* AI Analysis */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Strategic Analysis
            </h3>
            
            <div className="bg-blue-50 p-4 rounded">
              <h4 className="font-medium mb-2">Creative Strategy Insights:</h4>
              <p className="text-gray-700">{result.answer}</p>
            </div>
          </div>

          {/* Campaign Sources */}
          {result.sources.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Campaign Evidence ({result.sources.length})
              </h3>
              
              <div className="space-y-4">
                {result.sources.map((source, index) => (
                  <div key={index} className="border rounded p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="font-medium">{source.source}</span>
                        <div className="text-sm text-muted-foreground">
                          Campaign: {source.campaign} • Client: {source.client}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{source.content.substring(0, 300)}...</p>
                    
                    {/* Creative Features */}
                    {source.creative_features && Object.keys(source.creative_features).length > 0 && (
                      <div className="mb-2">
                        <h5 className="text-xs font-medium text-gray-500 mb-1">Detected Creative Features:</h5>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(source.creative_features)
                            .filter(([key, value]) => value === true)
                            .slice(0, 6)
                            .map(([key]) => (
                              <span key={key} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                {key.replace(/_/g, ' ')}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Business Outcomes */}
                    {source.business_outcomes && Object.keys(source.business_outcomes).length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-gray-500 mb-1">Predicted Outcomes:</h5>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(source.business_outcomes)
                            .filter(([key, value]) => value === true)
                            .slice(0, 6)
                            .map(([key]) => (
                              <span key={key} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {key.replace(/outcome_|_/g, ' ')}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
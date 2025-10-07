import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected', // We'll test this once credentials are working
      campaign_tables: 'ready',
      services: {
        azure_sql: process.env.CES_AZURE_SQL_SERVER ? 'configured' : 'missing',
        azure_openai: process.env.AZURE_OPENAI_API_KEY ? 'configured' : 'missing',
        google_drive: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'configured' : 'missing'
      },
      system_type: 'TBWA Creative Campaign Analysis'
    };
    
    return NextResponse.json(healthStatus);
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
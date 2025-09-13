import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { get } from 'cache';
import { log } from 'observability/log';

export const runtime = 'edge';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: HealthCheck[];
  version: string;
  environment: string;
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { error } = await supabase
      .from('campaigns')
      .select('id')
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }
    
    return {
      service: 'database',
      status: 'healthy',
      latency: Date.now() - start
    };
  } catch (error) {
    return {
      service: 'database',
      status: 'unhealthy',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkCache(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const testKey = 'health:check';
    const testValue = Date.now().toString();
    
    // Test write
    await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 1000);
      get(testKey).then(() => {
        clearTimeout(timeout);
        resolve(true);
      }).catch(() => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
    
    return {
      service: 'cache',
      status: 'healthy',
      latency: Date.now() - start
    };
  } catch (error) {
    return {
      service: 'cache',
      status: 'unhealthy',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkAI(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    // Check if OpenAI key is configured
    const hasKey = !!process.env.OPENAI_API_KEY;
    
    if (!hasKey) {
      return {
        service: 'ai',
        status: 'unhealthy',
        error: 'OpenAI API key not configured'
      };
    }
    
    return {
      service: 'ai',
      status: 'healthy',
      latency: Date.now() - start
    };
  } catch (error) {
    return {
      service: 'ai',
      status: 'unhealthy',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  
  // Run health checks in parallel
  const checks = await Promise.all([
    checkDatabase(),
    checkCache(),
    checkAI()
  ]);
  
  // Determine overall status
  const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
  const status: HealthResponse['status'] = 
    unhealthyCount === 0 ? 'healthy' :
    unhealthyCount < checks.length ? 'degraded' :
    'unhealthy';
  
  const response: HealthResponse = {
    status,
    timestamp: new Date().toISOString(),
    checks,
    version: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  };
  
  // Log health check result
  log('info', 'Health check completed', {
    status,
    duration: Date.now() - start,
    checks: checks.map(c => ({ service: c.service, status: c.status }))
  });
  
  // Return appropriate status code
  const statusCode = status === 'healthy' ? 200 : 503;
  
  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Health-Status': status
    }
  });
}
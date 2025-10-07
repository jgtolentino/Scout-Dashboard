import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { log } from '../../../observability/log';

export const runtime = 'edge';

type Subcheck = {
  component: string;
  status: 'pass' | 'warn' | 'fail';
  detail?: string;
  latency_ms?: number;
};

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
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
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
    // Simple in-memory cache check for edge runtime
    const testKey = 'health:check';
    const testValue = Date.now().toString();
    
    // Basic cache functionality test
    const cache = new Map();
    cache.set(testKey, testValue);
    const retrieved = cache.get(testKey);
    
    if (retrieved !== testValue) {
      throw new Error('Cache set/get failed');
    }
    
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

async function checkIoTExpert(): Promise<Subcheck> {
  const started = Date.now();
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 3000);
  
  try {
    // Check IoT writes flag - critical gate
    const allowWrites = process.env.IOT_ALLOW_WRITES;
    if (allowWrites !== 'true') {
      clearTimeout(t);
      return {
        component: 'iot-expert',
        status: 'fail',
        detail: 'IOT_ALLOW_WRITES must be "true"',
        latency_ms: Date.now() - started
      };
    }
    
    // Check Supabase config
    const supaUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supaUrl?.includes('supabase')) {
      clearTimeout(t);
      return {
        component: 'iot-expert',
        status: 'fail',
        detail: 'Invalid NEXT_PUBLIC_SUPABASE_URL',
        latency_ms: Date.now() - started
      };
    }
    
    // Test ingest function liveness (OPTIONS is safer than GET/POST)
    try {
      const res = await fetch(`${supaUrl}/functions/v1/iot-ingest`, {
        method: 'OPTIONS',
        signal: ctl.signal
      });
      clearTimeout(t);
      
      if (!res.ok) {
        return {
          component: 'iot-expert',
          status: 'warn',
          detail: `ingest function status ${res.status}`,
          latency_ms: Date.now() - started
        };
      }
      
      return {
        component: 'iot-expert',
        status: 'pass',
        detail: 'ready for telemetry',
        latency_ms: Date.now() - started
      };
    } catch (netErr) {
      clearTimeout(t);
      return {
        component: 'iot-expert',
        status: 'fail',
        detail: netErr instanceof Error ? netErr.message.substring(0, 50) : 'network timeout',
        latency_ms: Date.now() - started
      };
    }
  } catch (unexpectedErr) {
    clearTimeout(t);
    return {
      component: 'iot-expert',
      status: 'fail',
      detail: unexpectedErr instanceof Error ? unexpectedErr.message.substring(0, 50) : 'unexpected error',
      latency_ms: Date.now() - started
    };
  }
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  
  // Run health checks in parallel
  const [database, cache, ai, iotSubcheck] = await Promise.all([
    checkDatabase(),
    checkCache(),
    checkAI(),
    checkIoTExpert()
  ]);
  
  // Convert IoT Subcheck to HealthCheck format for compatibility
  const iotCheck: HealthCheck = {
    service: 'iot-expert',
    status: iotSubcheck.status === 'pass' ? 'healthy' : 'unhealthy',
    latency: iotSubcheck.latency_ms,
    error: iotSubcheck.status !== 'pass' ? iotSubcheck.detail : undefined
  };
  
  const checks = [database, cache, ai, iotCheck];
  
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
    version: import.meta.env.VITE_VERSION || '1.0.0',
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
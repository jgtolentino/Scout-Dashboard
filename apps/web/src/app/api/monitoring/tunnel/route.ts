import { NextRequest, NextResponse } from 'next/server';

// Sentry tunnel endpoint to bypass ad blockers
// This proxies Sentry events through your domain
export async function POST(request: NextRequest) {
  try {
    const envelope = await request.text();
    const pieces = envelope.split('\n');
    const header = JSON.parse(pieces[0]);
    
    // Extract DSN from header
    const { host, projectId } = parseDSN(header.dsn);
    
    if (!host || !projectId) {
      return NextResponse.json(
        { error: 'Invalid DSN' },
        { status: 400 }
      );
    }
    
    // Forward to Sentry
    const sentryUrl = `https://${host}/api/${projectId}/envelope/`;
    const sentryResponse = await fetch(sentryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
      body: envelope,
    });
    
    // Return Sentry's response
    return new NextResponse(sentryResponse.body, {
      status: sentryResponse.status,
      statusText: sentryResponse.statusText,
    });
  } catch (error) {
    console.error('Sentry tunnel error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

function parseDSN(dsn: string) {
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.substring(1);
    const host = url.host;
    return { host, projectId };
  } catch {
    return { host: null, projectId: null };
  }
}

// This endpoint should not be cached
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
/**
 * TBWA Creative Campaign Analysis System - PageIndex API
 * ColPali-style semantic indexing and search endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { PageIndexAgent } from '@/lib/pageindex-service';

// Initialize PageIndex agent (singleton pattern)
let pageIndexAgent: PageIndexAgent | null = null;

async function getPageIndexAgent(): Promise<PageIndexAgent> {
  if (!pageIndexAgent) {
    const { PageIndexAgent: Agent } = await import('@/lib/pageindex-service');
    pageIndexAgent = new Agent();
    await pageIndexAgent.initialize();
  }
  return pageIndexAgent;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const query = searchParams.get('query');
    const fileId = searchParams.get('fileId');
    const limit = parseInt(searchParams.get('limit') || '20');

    const agent = await getPageIndexAgent();

    switch (action) {
      case 'search':
        if (!query) {
          return NextResponse.json(
            { error: 'Query parameter is required for search' },
            { status: 400 }
          );
        }
        
        const searchResults = await agent.searchSemantic(query, limit);
        return NextResponse.json({
          success: true,
          results: searchResults,
          query,
          count: searchResults.length
        });

      case 'file-chunks':
        if (!fileId) {
          return NextResponse.json(
            { error: 'fileId parameter is required' },
            { status: 400 }
          );
        }
        
        const chunks = await agent.getFileChunks(fileId);
        return NextResponse.json({
          success: true,
          fileId,
          chunks,
          count: chunks.length
        });

      case 'health':
        const healthStatus = await agent.healthCheck();
        return NextResponse.json(healthStatus);

      case 'stats':
        const stats = agent.getProcessingStats();
        return NextResponse.json({
          success: true,
          stats
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: search, file-chunks, health, stats' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('PageIndex API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, filepath, campaignName, clientName, query } = body;

    const agent = await getPageIndexAgent();

    switch (action) {
      case 'process-file':
        if (!filepath) {
          return NextResponse.json(
            { error: 'filepath is required for file processing' },
            { status: 400 }
          );
        }

        const fileId = await agent.processFile(filepath, campaignName, clientName);
        const stats = agent.getProcessingStats();

        return NextResponse.json({
          success: true,
          fileId,
          filepath,
          campaignName,
          clientName,
          stats
        });

      case 'search-semantic':
        if (!query) {
          return NextResponse.json(
            { error: 'query is required for semantic search' },
            { status: 400 }
          );
        }

        const results = await agent.searchSemantic(query, body.limit || 20);
        return NextResponse.json({
          success: true,
          query,
          results,
          count: results.length
        });

      case 'bulk-process':
        if (!body.files || !Array.isArray(body.files)) {
          return NextResponse.json(
            { error: 'files array is required for bulk processing' },
            { status: 400 }
          );
        }

        const processedFiles = [];
        const errors = [];

        for (const fileData of body.files) {
          try {
            const processedFileId = await agent.processFile(
              fileData.filepath,
              fileData.campaignName || campaignName,
              fileData.clientName || clientName
            );
            processedFiles.push({
              filepath: fileData.filepath,
              fileId: processedFileId,
              status: 'success'
            });
          } catch (error) {
            errors.push({
              filepath: fileData.filepath,
              error: error.message,
              status: 'failed'
            });
          }
        }

        return NextResponse.json({
          success: true,
          processed: processedFiles,
          errors,
          stats: agent.getProcessingStats()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: process-file, search-semantic, bulk-process' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('PageIndex API POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const chunkId = searchParams.get('chunkId');

    if (!fileId && !chunkId) {
      return NextResponse.json(
        { error: 'Either fileId or chunkId is required' },
        { status: 400 }
      );
    }

    const agent = await getPageIndexAgent();

    if (fileId) {
      await agent.deleteFile(fileId);
      return NextResponse.json({
        success: true,
        message: `File ${fileId} and all associated chunks deleted`
      });
    }

    if (chunkId) {
      await agent.deleteChunk(chunkId);
      return NextResponse.json({
        success: true,
        message: `Chunk ${chunkId} deleted`
      });
    }

  } catch (error) {
    console.error('PageIndex API DELETE error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
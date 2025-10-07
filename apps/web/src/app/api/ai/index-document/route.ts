import { NextRequest } from 'next/server';
import { withGuard } from 'api-guards/guard';
import { z } from 'zod';
import { indexDocument } from '@scout/ai-chat';
import { Document } from 'langchain/document';
import { log } from 'observability/log';

const IndexDocumentSchema = z.object({
  content: z.string(),
  metadata: z.object({
    title: z.string(),
    source: z.string(),
    type: z.enum(['documentation', 'guide', 'faq', 'report', 'other']).default('other')
  }).passthrough()
});

export const runtime = 'nodejs';

export const POST = withGuard(
  IndexDocumentSchema,
  async (input, ctx) => {
    try {
      const doc = new Document({
        pageContent: input.content,
        metadata: {
          ...input.metadata,
          indexedBy: ctx.userId,
          indexedAt: new Date().toISOString()
        }
      });
      
      await indexDocument(doc);
      
      return {
        success: true,
        message: 'Document indexed successfully'
      };
    } catch (error) {
      log('error', 'Document indexing failed', { error, userId: ctx.userId });
      throw error;
    }
  }
);
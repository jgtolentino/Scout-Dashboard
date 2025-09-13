import { NextRequest } from 'next/server';
import { withGuard } from 'api-guards/guard';
import { z } from 'zod';
import { naturalLanguageToSQL, executeGeneratedSQL } from '@scout/ai-chat';
import { log } from 'observability/log';

const NLToSQLSchema = z.object({
  query: z.string().min(1).max(500),
  execute: z.boolean().default(false)
});

export const runtime = 'nodejs';

export const POST = withGuard(
  NLToSQLSchema,
  async (input, ctx) => {
    try {
      const sqlQuery = await naturalLanguageToSQL(input.query, ctx.userId);
      
      let results = null;
      if (input.execute && sqlQuery.is_safe) {
        results = await executeGeneratedSQL(sqlQuery, ctx.userId);
      }
      
      return {
        success: true,
        sql: sqlQuery,
        results: results,
        executed: !!results
      };
    } catch (error) {
      log('error', 'NL to SQL failed', { error, userId: ctx.userId });
      throw error;
    }
  }
);
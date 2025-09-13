/**
 * Claude Desktop MCP Dispatch
 * 
 * This module provides functionality for Claude Desktop to send tasks to the MCP bridge.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Types
interface MCPTask {
  id: string;
  type: string;
  params: Record<string, any>;
  source: string;
  priority: 'low' | 'normal' | 'high';
  created_at: string;
}

interface MCPResult {
  output: string;
  agent: string;
  execution_time: number;
  completed_at: string;
  task_id: string;
  task_type: string;
}

// Config
const MCP_DIR = process.env.MCP_DIR || path.resolve(process.cwd(), '../mcp');
const QUEUE_PATH = path.join(MCP_DIR, 'dispatch_queue.json');
const RESULTS_DIR = path.join(MCP_DIR, 'results');

/**
 * Send a task to the MCP bridge
 * @param type Task type from mcp_routes.yaml
 * @param params Parameters for the task
 * @param options Additional options
 * @returns Task ID
 */
export async function sendToMCP(
  type: string, 
  params: Record<string, any>, 
  options: { priority?: 'low' | 'normal' | 'high' } = {}
): Promise<string> {
  // Create task
  const taskId = uuidv4();
  const task: MCPTask = {
    id: taskId,
    type,
    params,
    source: 'claude_desktop',
    priority: options.priority || 'normal',
    created_at: new Date().toISOString(),
  };

  // Write to queue
  await fs.writeFile(QUEUE_PATH, JSON.stringify(task, null, 2));
  console.log(`[Claude Desktop] Task ${taskId} sent to MCP`);
  
  return taskId;
}

/**
 * Check if a task result is available
 * @param taskId Task ID to check
 * @returns True if result is available
 */
export async function isResultAvailable(taskId: string): Promise<boolean> {
  try {
    const resultPath = path.join(RESULTS_DIR, `${taskId}.json`);
    await fs.access(resultPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get task result
 * @param taskId Task ID to get result for
 * @returns Task result or null if not available
 */
export async function getTaskResult(taskId: string): Promise<MCPResult | null> {
  try {
    const resultPath = path.join(RESULTS_DIR, `${taskId}.json`);
    const resultData = await fs.readFile(resultPath, 'utf-8');
    return JSON.parse(resultData) as MCPResult;
  } catch {
    return null;
  }
}

/**
 * Poll for task result with timeout
 * @param taskId Task ID to poll for
 * @param timeoutMs Timeout in milliseconds
 * @param intervalMs Polling interval in milliseconds
 * @returns Task result or null if timeout exceeded
 */
export async function pollForResult(
  taskId: string, 
  timeoutMs = 60000, 
  intervalMs = 1000
): Promise<MCPResult | null> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const result = await getTaskResult(taskId);
    if (result) {
      return result;
    }
    
    // Wait for the next poll
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  console.warn(`[Claude Desktop] Timeout exceeded waiting for task ${taskId}`);
  return null;
}

/**
 * Example usage
 */
async function exampleCodeReview() {
  try {
    // Send code review task
    const taskId = await sendToMCP('run_code_review', {
      project_path: '/path/to/project'
    });
    
    console.log(`Waiting for result of task ${taskId}...`);
    
    // Poll for result (timeout after 5 minutes)
    const result = await pollForResult(taskId, 5 * 60 * 1000);
    
    if (result) {
      console.log(`Code review completed in ${result.execution_time.toFixed(2)}s`);
      console.log(`Output: ${result.output.substring(0, 100)}...`);
    } else {
      console.error('Code review timed out or failed');
    }
  } catch (error) {
    console.error('Error running code review:', error);
  }
}

// Example: exampleCodeReview();
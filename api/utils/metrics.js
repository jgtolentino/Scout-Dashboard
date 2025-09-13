import client from 'prom-client'
import { config } from '../config/index.js'

// Initialize Prometheus metrics
const register = new client.Registry()

// Add default metrics (memory, CPU, etc.)
client.collectDefaultMetrics({
  register,
  prefix: config.metrics.prefix,
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
})

// Custom metrics for TBWA HRIS backend

// Chat service metrics
const chatRequestsTotal = new client.Counter({
  name: `${config.metrics.prefix}chat_requests_total`,
  help: 'Total number of chat requests',
  labelNames: ['status', 'intent']
})

const chatResponseTime = new client.Histogram({
  name: `${config.metrics.prefix}chat_response_time_seconds`,
  help: 'Chat response time in seconds',
  buckets: [0.1, 0.5, 1, 2, 5, 10]
})

const chatActiveUsers = new client.Gauge({
  name: `${config.metrics.prefix}chat_active_users`,
  help: 'Number of active chat users'
})

// Workflow metrics
const workflowExecutions = new client.Counter({
  name: `${config.metrics.prefix}workflow_executions_total`,
  help: 'Total workflow executions',
  labelNames: ['workflow_type', 'status']
})

const workflowExecutionTime = new client.Histogram({
  name: `${config.metrics.prefix}workflow_execution_time_seconds`,
  help: 'Workflow execution time in seconds',
  labelNames: ['workflow_type'],
  buckets: [0.5, 1, 2, 5, 10, 30]
})

// Document search metrics
const documentSearchTotal = new client.Counter({
  name: `${config.metrics.prefix}document_search_total`,
  help: 'Total document searches',
  labelNames: ['status']
})

const documentSearchTime = new client.Histogram({
  name: `${config.metrics.prefix}document_search_time_seconds`,
  help: 'Document search time in seconds',
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
})

const documentSearchResults = new client.Histogram({
  name: `${config.metrics.prefix}document_search_results`,
  help: 'Number of search results returned',
  buckets: [0, 1, 2, 5, 10, 20]
})

// OpenAI API metrics
const openaiRequests = new client.Counter({
  name: `${config.metrics.prefix}openai_requests_total`,
  help: 'Total OpenAI API requests',
  labelNames: ['model', 'status']
})

const openaiTokensUsed = new client.Counter({
  name: `${config.metrics.prefix}openai_tokens_total`,
  help: 'Total OpenAI tokens used',
  labelNames: ['model', 'type'] // type: prompt, completion, embedding
})

const openaiResponseTime = new client.Histogram({
  name: `${config.metrics.prefix}openai_response_time_seconds`,
  help: 'OpenAI API response time in seconds',
  labelNames: ['model'],
  buckets: [0.5, 1, 2, 5, 10, 30, 60]
})

// Database metrics
const databaseQueries = new client.Counter({
  name: `${config.metrics.prefix}database_queries_total`,
  help: 'Total database queries',
  labelNames: ['table', 'operation', 'status']
})

const databaseQueryTime = new client.Histogram({
  name: `${config.metrics.prefix}database_query_time_seconds`,
  help: 'Database query time in seconds',
  labelNames: ['table', 'operation'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 5]
})

// HTTP metrics
const httpRequests = new client.Counter({
  name: `${config.metrics.prefix}http_requests_total`,
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code']
})

const httpRequestDuration = new client.Histogram({
  name: `${config.metrics.prefix}http_request_duration_seconds`,
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5, 10]
})

// Business metrics
const expensesCreated = new client.Counter({
  name: `${config.metrics.prefix}expenses_created_total`,
  help: 'Total expenses created',
  labelNames: ['source', 'category']
})

const leaveRequestsCreated = new client.Counter({
  name: `${config.metrics.prefix}leave_requests_created_total`,
  help: 'Total leave requests created',
  labelNames: ['source', 'leave_type']
})

const timeCorrectionsCreated = new client.Counter({
  name: `${config.metrics.prefix}time_corrections_created_total`,
  help: 'Total time corrections created',
  labelNames: ['source']
})

const itTicketsCreated = new client.Counter({
  name: `${config.metrics.prefix}it_tickets_created_total`,
  help: 'Total IT tickets created',
  labelNames: ['source', 'category', 'priority']
})

// Register all metrics
const metrics = {
  register,
  chatRequestsTotal,
  chatResponseTime,
  chatActiveUsers,
  workflowExecutions,
  workflowExecutionTime,
  documentSearchTotal,
  documentSearchTime,
  documentSearchResults,
  openaiRequests,
  openaiTokensUsed,
  openaiResponseTime,
  databaseQueries,
  databaseQueryTime,
  httpRequests,
  httpRequestDuration,
  expensesCreated,
  leaveRequestsCreated,
  timeCorrectionsCreated,
  itTicketsCreated
}

// Register all metrics with the registry
Object.values(metrics).forEach(metric => {
  if (metric !== register && typeof metric.register === 'function') {
    register.registerMetric(metric)
  }
})

// Helper functions for common metric patterns
export const trackHttpRequest = (method, route) => {
  const start = Date.now()
  
  return (statusCode) => {
    const duration = (Date.now() - start) / 1000
    httpRequests.inc({ method, route, status_code: statusCode })
    httpRequestDuration.observe({ method, route }, duration)
  }
}

export const trackDatabaseQuery = (table, operation) => {
  const start = Date.now()
  
  return (status = 'success') => {
    const duration = (Date.now() - start) / 1000
    databaseQueries.inc({ table, operation, status })
    databaseQueryTime.observe({ table, operation }, duration)
  }
}

export const trackOpenAIRequest = (model) => {
  const start = Date.now()
  
  return (status = 'success', tokens = {}) => {
    const duration = (Date.now() - start) / 1000
    openaiRequests.inc({ model, status })
    openaiResponseTime.observe({ model }, duration)
    
    if (tokens.prompt) {
      openaiTokensUsed.inc({ model, type: 'prompt' }, tokens.prompt)
    }
    if (tokens.completion) {
      openaiTokensUsed.inc({ model, type: 'completion' }, tokens.completion)
    }
    if (tokens.embedding) {
      openaiTokensUsed.inc({ model, type: 'embedding' }, tokens.embedding)
    }
  }
}

export const trackWorkflowExecution = (workflowType) => {
  const start = Date.now()
  
  return (status = 'success') => {
    const duration = (Date.now() - start) / 1000
    workflowExecutions.inc({ workflow_type: workflowType, status })
    workflowExecutionTime.observe({ workflow_type: workflowType }, duration)
  }
}

// Export metrics for use in other modules
export { metrics }
export default metrics
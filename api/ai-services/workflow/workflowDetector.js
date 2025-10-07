import { logger } from '../../utils/logger.js'
import { supabase } from '../../config/database.js'
import { ExpenseWorkflow } from './workflows/expenseWorkflow.js'
import { TimeWorkflow } from './workflows/timeWorkflow.js'
import { LeaveWorkflow } from './workflows/leaveWorkflow.js'
import { ITWorkflow } from './workflows/itWorkflow.js'
import { v4 as uuidv4 } from 'uuid'

export class WorkflowDetector {
  constructor() {
    this.workflows = new Map()
    this.initializeWorkflows()
  }

  initializeWorkflows() {
    // Register workflow handlers
    this.workflows.set('expense', new ExpenseWorkflow())
    this.workflows.set('time_correction', new TimeWorkflow())
    this.workflows.set('leave_request', new LeaveWorkflow())
    this.workflows.set('it_support', new ITWorkflow())
  }

  async detectIntent(message, context = {}) {
    try {
      const normalizedMessage = message.toLowerCase()
      
      // Intent patterns with confidence scores
      const intentPatterns = [
        // Expense-related intents
        {
          intent: 'expense',
          patterns: [
            /expense|receipt|reimburs|lunch|dinner|travel|hotel|taxi|uber|lyft|business meal/i,
            /submit.*receipt|upload.*receipt|expense report|business.*expense/i,
            /need.*reimburse|claim.*expense|out of pocket/i
          ],
          entities: this.extractExpenseEntities(message)
        },
        
        // Time correction intents
        {
          intent: 'time_correction',
          patterns: [
            /time.*wrong|time.*incorrect|time.*mistake|forgot.*clock|timesheet.*error/i,
            /correct.*time|fix.*time|update.*timesheet|change.*hours/i,
            /clock.*in|clock.*out|time.*entry|working.*hours/i
          ],
          entities: this.extractTimeEntities(message)
        },
        
        // Leave request intents
        {
          intent: 'leave_request',
          patterns: [
            /vacation|time off|pto|sick.*day|leave|holiday|day off/i,
            /request.*leave|take.*day|need.*time|going.*away/i,
            /sick|medical|family.*emergency|bereavement/i
          ],
          entities: this.extractLeaveEntities(message)
        },
        
        // IT support intents
        {
          intent: 'it_support',
          patterns: [
            /computer.*not.*work|laptop.*issue|software.*problem|network.*down/i,
            /it.*help|technical.*support|system.*error|password.*reset/i,
            /email.*not.*work|wifi.*problem|printer.*issue|access.*problem/i
          ],
          entities: this.extractITEntities(message)
        },
        
        // General help/information
        {
          intent: 'general_help',
          patterns: [
            /help|how.*do|what.*is|can.*you|policy|procedure/i,
            /information|question|confused|don.*know/i
          ],
          entities: {}
        }
      ]

      // Calculate confidence scores
      let bestMatch = null
      let maxConfidence = 0

      for (const intentConfig of intentPatterns) {
        let confidence = 0
        let matchCount = 0
        
        for (const pattern of intentConfig.patterns) {
          if (pattern.test(normalizedMessage)) {
            matchCount++
          }
        }
        
        if (matchCount > 0) {
          confidence = Math.min(0.9, 0.3 + (matchCount * 0.2))
          
          // Boost confidence if entities are found
          if (Object.keys(intentConfig.entities).length > 0) {
            confidence += 0.1
          }
          
          // Context-based confidence boost
          if (context.previousIntent === intentConfig.intent) {
            confidence += 0.1
          }
          
          if (confidence > maxConfidence) {
            maxConfidence = confidence
            bestMatch = {
              intent: intentConfig.intent,
              confidence,
              entities: intentConfig.entities,
              matchCount
            }
          }
        }
      }

      // Log detection results
      logger.info('Intent detection', {
        message: message.substring(0, 100),
        detectedIntent: bestMatch?.intent || 'none',
        confidence: bestMatch?.confidence || 0,
        entities: bestMatch?.entities || {}
      })

      return bestMatch || {
        intent: 'general',
        confidence: 0.1,
        entities: {},
        matchCount: 0
      }

    } catch (error) {
      logger.error('Intent detection error', { error: error.message })
      return {
        intent: 'general',
        confidence: 0,
        entities: {},
        error: error.message
      }
    }
  }

  extractExpenseEntities(message) {
    const entities = {}
    
    // Extract amount
    const amountMatch = message.match(/\$?(\d+(?:\.\d{2})?)/);
    if (amountMatch) {
      entities.amount = parseFloat(amountMatch[1])
    }
    
    // Extract date
    const datePatterns = [
      /yesterday/i,
      /today/i,
      /last\s+(week|month)/i,
      /(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/,
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/i
    ]
    
    for (const pattern of datePatterns) {
      const match = message.match(pattern)
      if (match) {
        entities.date = match[0]
        break
      }
    }
    
    // Extract category
    const categoryMap = {
      'lunch|dinner|breakfast|meal|restaurant|food': 'meals',
      'hotel|accommodation|lodging|stay': 'accommodation',
      'flight|plane|airline|travel|train|bus': 'travel',
      'taxi|uber|lyft|rideshare|gas|mileage': 'travel',
      'supplies|office|equipment|software': 'supplies'
    }
    
    for (const [pattern, category] of Object.entries(categoryMap)) {
      if (new RegExp(pattern, 'i').test(message)) {
        entities.category = category
        break
      }
    }
    
    return entities
  }

  extractTimeEntities(message) {
    const entities = {}
    
    // Extract date
    const dateMatch = message.match(/(yesterday|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\/\d{1,2})/i)
    if (dateMatch) {
      entities.date = dateMatch[1]
    }
    
    // Extract time
    const timeMatch = message.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/gi)
    if (timeMatch) {
      entities.time = timeMatch
    }
    
    return entities
  }

  extractLeaveEntities(message) {
    const entities = {}
    
    // Extract leave type
    const typeMap = {
      'sick|illness|medical|doctor': 'sick',
      'vacation|holiday|pto|personal': 'vacation',
      'family|emergency|bereavement': 'family',
      'maternity|paternity|parental': 'parental'
    }
    
    for (const [pattern, type] of Object.entries(typeMap)) {
      if (new RegExp(pattern, 'i').test(message)) {
        entities.leaveType = type
        break
      }
    }
    
    // Extract duration
    const durationMatch = message.match(/(half\s+day|full\s+day|\d+\s+days?|\d+\s+weeks?)/i)
    if (durationMatch) {
      entities.duration = durationMatch[1]
    }
    
    // Extract dates
    const dateMatch = message.match(/next\s+(week|month)|this\s+(week|friday)|tomorrow/i)
    if (dateMatch) {
      entities.when = dateMatch[0]
    }
    
    return entities
  }

  extractITEntities(message) {
    const entities = {}
    
    // Extract issue category
    const categoryMap = {
      'computer|laptop|desktop|machine': 'hardware',
      'software|application|program|system': 'software',
      'email|outlook|gmail': 'email',
      'password|login|access|account': 'access',
      'wifi|network|internet|connection': 'network',
      'printer|print|scan': 'printer'
    }
    
    for (const [pattern, category] of Object.entries(categoryMap)) {
      if (new RegExp(pattern, 'i').test(message)) {
        entities.category = category
        break
      }
    }
    
    // Extract urgency
    const urgencyPatterns = [
      { pattern: /urgent|critical|asap|immediately|emergency/i, level: 'urgent' },
      { pattern: /important|soon|priority/i, level: 'high' },
      { pattern: /when.*possible|convenient|not.*urgent/i, level: 'low' }
    ]
    
    for (const { pattern, level } of urgencyPatterns) {
      if (pattern.test(message)) {
        entities.priority = level
        break
      }
    }
    
    return entities
  }

  async executeWorkflow({ action, userId, sessionId, conversationId }) {
    try {
      const workflowHandler = this.workflows.get(action.intent)
      
      if (!workflowHandler) {
        logger.warn('No workflow handler found', { intent: action.intent })
        return {
          success: false,
          message: `I understand you want help with ${action.intent}, but I don't have a handler for that workflow yet.`
        }
      }

      // Log workflow execution
      const executionId = uuidv4()
      await this.logWorkflowExecution({
        id: executionId,
        workflowType: action.intent,
        userId,
        sessionId,
        conversationId,
        inputData: action,
        status: 'started'
      })

      // Execute the workflow
      const result = await workflowHandler.execute({
        action,
        userId,
        sessionId,
        conversationId,
        executionId
      })

      // Update execution log
      await this.updateWorkflowExecution(executionId, {
        status: result.success ? 'completed' : 'failed',
        outputData: result,
        completedAt: new Date().toISOString()
      })

      return result

    } catch (error) {
      logger.error('Workflow execution error', {
        error: error.message,
        intent: action.intent,
        userId,
        sessionId
      })

      return {
        success: false,
        message: "I encountered an error while processing your request. Please try again or contact support.",
        error: error.message
      }
    }
  }

  async logWorkflowExecution(execution) {
    try {
      const { error } = await supabase
        .from('workflow_executions')
        .insert(execution)

      if (error) {
        logger.error('Failed to log workflow execution', { error })
      }
    } catch (error) {
      logger.error('Workflow execution logging error', { error })
    }
  }

  async updateWorkflowExecution(executionId, updates) {
    try {
      const { error } = await supabase
        .from('workflow_executions')
        .update(updates)
        .eq('id', executionId)

      if (error) {
        logger.error('Failed to update workflow execution', { error })
      }
    } catch (error) {
      logger.error('Workflow execution update error', { error })
    }
  }
}

export default WorkflowDetector
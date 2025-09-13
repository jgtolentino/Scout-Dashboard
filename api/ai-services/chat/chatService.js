import OpenAI from 'openai'
import { config } from '../../config/index.js'
import { logger } from '../../utils/logger.js'
import { supabase } from '../../config/database.js'
import { WorkflowDetector } from '../workflow/workflowDetector.js'
import { DocumentSearch } from '../documents/documentSearch.js'
import { metrics } from '../../utils/metrics.js'
import { v4 as uuidv4 } from 'uuid'

const openai = new OpenAI({
  apiKey: config.openai.apiKey
})

export class ChatService {
  constructor() {
    this.workflowDetector = new WorkflowDetector()
    this.documentSearch = new DocumentSearch()
    this.conversationMemory = new Map()
  }

  async processMessage({ sessionId, userId, message, context = {} }) {
    const startTime = Date.now()
    metrics.chatRequestsTotal.inc()

    try {
      logger.info('Processing chat message', {
        sessionId,
        userId,
        messageLength: message.length,
        context
      })

      // 1. Detect workflow intent
      const workflowIntent = await this.workflowDetector.detectIntent(message, context)
      
      // 2. Search relevant documents
      const relevantDocs = await this.documentSearch.searchDocuments(message, {
        limit: 3,
        threshold: 0.7
      })

      // 3. Get conversation history
      const conversationHistory = await this.getConversationHistory(sessionId, 10)

      // 4. Generate AI response
      const aiResponse = await this.generateResponse({
        message,
        workflowIntent,
        relevantDocs,
        conversationHistory,
        context
      })

      // 5. Save conversation
      const conversationId = await this.saveConversation({
        sessionId,
        userId,
        userMessage: message,
        assistantMessage: aiResponse.message,
        workflowAction: aiResponse.workflowAction,
        referencedDocuments: relevantDocs.map(doc => doc.id),
        metadata: {
          intent: workflowIntent,
          processingTime: Date.now() - startTime,
          model: config.openai.model
        }
      })

      // 6. Execute workflow if detected
      let workflowResult = null
      if (aiResponse.workflowAction && aiResponse.workflowAction.type !== 'none') {
        workflowResult = await this.workflowDetector.executeWorkflow({
          action: aiResponse.workflowAction,
          userId,
          sessionId,
          conversationId
        })
      }

      metrics.chatResponseTime.observe(Date.now() - startTime)
      metrics.chatRequestsTotal.inc({ status: 'success' })

      return {
        id: conversationId,
        message: aiResponse.message,
        workflowAction: aiResponse.workflowAction,
        workflowResult,
        referencedDocuments: relevantDocs,
        suggestions: aiResponse.suggestions || [],
        metadata: {
          processingTime: Date.now() - startTime,
          intent: workflowIntent?.intent || 'general',
          confidence: workflowIntent?.confidence || 0
        }
      }

    } catch (error) {
      logger.error('Chat processing error', {
        error: error.message,
        sessionId,
        userId,
        stack: error.stack
      })

      metrics.chatRequestsTotal.inc({ status: 'error' })
      
      return {
        id: uuidv4(),
        message: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment or contact IT support if the issue persists.",
        workflowAction: { type: 'none' },
        error: true,
        metadata: {
          processingTime: Date.now() - startTime,
          error: error.message
        }
      }
    }
  }

  async generateResponse({ message, workflowIntent, relevantDocs, conversationHistory, context }) {
    const systemPrompt = this.buildSystemPrompt(workflowIntent, relevantDocs, context)
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(conv => [
        { role: 'user', content: conv.user_message },
        { role: 'assistant', content: conv.assistant_message }
      ]).flat(),
      { role: 'user', content: message }
    ]

    const functions = this.getAvailableFunctions(workflowIntent)

    try {
      const completion = await openai.chat.completions.create({
        model: config.openai.model,
        messages,
        functions: functions.length > 0 ? functions : undefined,
        function_call: workflowIntent?.confidence > 0.8 ? 'auto' : undefined,
        temperature: config.openai.temperature,
        max_tokens: config.openai.maxTokens
      })

      const response = completion.choices[0].message
      
      // Check if AI wants to call a function
      let workflowAction = { type: 'none' }
      if (response.function_call) {
        workflowAction = {
          type: 'function_call',
          function: response.function_call.name,
          arguments: JSON.parse(response.function_call.arguments || '{}'),
          confidence: workflowIntent?.confidence || 0.9
        }
      } else if (workflowIntent?.confidence > 0.7) {
        workflowAction = {
          type: 'workflow',
          intent: workflowIntent.intent,
          entities: workflowIntent.entities,
          confidence: workflowIntent.confidence
        }
      }

      return {
        message: response.content || "I understand your request. Let me help you with that.",
        workflowAction,
        suggestions: this.generateSuggestions(workflowIntent, context)
      }

    } catch (error) {
      logger.error('OpenAI API error', { error: error.message })
      throw new Error('Failed to generate AI response')
    }
  }

  buildSystemPrompt(workflowIntent, relevantDocs, context) {
    const basePrompt = `You are TBWA's AI-powered HRIS assistant. You help employees with:
- Time tracking and corrections
- Expense reporting and reimbursements  
- Leave requests and approvals
- IT support and equipment requests
- HR policies and procedures
- General workplace questions

Always be helpful, professional, and concise. If you detect that a user wants to perform a specific action (like submitting an expense or requesting time off), guide them through the process and offer to help complete the task.`

    let contextPrompt = ''
    if (workflowIntent?.intent) {
      contextPrompt += `\n\nDETECTED INTENT: ${workflowIntent.intent} (confidence: ${workflowIntent.confidence})`
      if (workflowIntent.entities && Object.keys(workflowIntent.entities).length > 0) {
        contextPrompt += `\nENTITIES: ${JSON.stringify(workflowIntent.entities)}`
      }
    }

    let docsPrompt = ''
    if (relevantDocs.length > 0) {
      docsPrompt = `\n\nRELEVANT COMPANY POLICIES:\n${relevantDocs.map(doc => 
        `- ${doc.title}: ${doc.content.substring(0, 200)}...`
      ).join('\n')}`
    }

    let userContextPrompt = ''
    if (context.userProfile) {
      userContextPrompt = `\n\nUSER CONTEXT: ${JSON.stringify(context.userProfile)}`
    }

    return basePrompt + contextPrompt + docsPrompt + userContextPrompt
  }

  getAvailableFunctions(workflowIntent) {
    const functions = []

    // Time tracking functions
    functions.push({
      name: 'create_time_correction',
      description: 'Create a time entry correction request',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Date to correct (YYYY-MM-DD)' },
          startTime: { type: 'string', description: 'Correct start time (HH:MM)' },
          endTime: { type: 'string', description: 'Correct end time (HH:MM)' },
          reason: { type: 'string', description: 'Reason for correction' },
          projectCode: { type: 'string', description: 'Project or client code' }
        },
        required: ['date', 'reason']
      }
    })

    // Expense functions
    functions.push({
      name: 'create_expense_report',
      description: 'Create a new expense report',
      parameters: {
        type: 'object',
        properties: {
          description: { type: 'string', description: 'Expense description' },
          amount: { type: 'number', description: 'Expense amount' },
          category: { type: 'string', enum: ['meals', 'travel', 'accommodation', 'supplies', 'other'] },
          date: { type: 'string', description: 'Expense date (YYYY-MM-DD)' },
          merchant: { type: 'string', description: 'Merchant/vendor name' },
          receiptRequired: { type: 'boolean', description: 'Whether receipt upload is needed' }
        },
        required: ['description', 'amount', 'category', 'date']
      }
    })

    // Leave request functions
    functions.push({
      name: 'create_leave_request',
      description: 'Submit a leave/vacation request',
      parameters: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'Leave start date (YYYY-MM-DD)' },
          endDate: { type: 'string', description: 'Leave end date (YYYY-MM-DD)' },
          leaveType: { type: 'string', enum: ['vacation', 'sick', 'personal', 'bereavement', 'other'] },
          reason: { type: 'string', description: 'Reason for leave (optional for vacation)' },
          halfDay: { type: 'boolean', description: 'Whether this is a half-day request' }
        },
        required: ['startDate', 'endDate', 'leaveType']
      }
    })

    // IT support functions
    functions.push({
      name: 'create_it_ticket',
      description: 'Create an IT support ticket',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: ['hardware', 'software', 'access', 'email', 'other'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          description: { type: 'string', description: 'Detailed description of the issue' },
          location: { type: 'string', description: 'Office location or remote' }
        },
        required: ['category', 'description']
      }
    })

    return functions
  }

  generateSuggestions(workflowIntent, context) {
    const suggestions = []

    if (!workflowIntent || workflowIntent.confidence < 0.5) {
      suggestions.push(
        "Submit an expense report",
        "Request time off",
        "Correct a time entry", 
        "Get IT support"
      )
    } else {
      switch (workflowIntent.intent) {
        case 'expense':
          suggestions.push(
            "Upload receipt photo",
            "View expense history",
            "Check reimbursement status"
          )
          break
        case 'time_correction':
          suggestions.push(
            "View timesheet",
            "Submit another correction",
            "Check approval status"
          )
          break
        case 'leave_request':
          suggestions.push(
            "Check leave balance",
            "View upcoming time off",
            "Cancel a request"
          )
          break
        case 'it_support':
          suggestions.push(
            "Check ticket status",
            "Submit another ticket",
            "Request equipment"
          )
          break
      }
    }

    return suggestions.slice(0, 3)
  }

  async getConversationHistory(sessionId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('user_message, assistant_message, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        logger.error('Failed to get conversation history', { error })
        return []
      }

      return data.reverse() // Return in chronological order
    } catch (error) {
      logger.error('Conversation history error', { error })
      return []
    }
  }

  async saveConversation({
    sessionId,
    userId,
    userMessage,
    assistantMessage,
    workflowAction,
    referencedDocuments,
    metadata
  }) {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          session_id: sessionId,
          user_id: userId,
          user_message: userMessage,
          assistant_message: assistantMessage,
          workflow_action: workflowAction,
          referenced_documents: referencedDocuments,
          metadata
        })
        .select('id')
        .single()

      if (error) {
        logger.error('Failed to save conversation', { error })
        return uuidv4()
      }

      return data.id
    } catch (error) {
      logger.error('Save conversation error', { error })
      return uuidv4()
    }
  }
}

export default ChatService
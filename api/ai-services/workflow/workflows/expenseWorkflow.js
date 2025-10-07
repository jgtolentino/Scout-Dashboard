import { logger } from '../../../utils/logger.js'
import { supabase } from '../../../config/database.js'
import { v4 as uuidv4 } from 'uuid'

export class ExpenseWorkflow {
  async execute({ action, userId, sessionId, conversationId, executionId }) {
    try {
      logger.info('Executing expense workflow', {
        action,
        userId,
        executionId
      })

      // Extract expense data from action
      const expenseData = this.parseExpenseData(action)
      
      // Validate required fields
      const validation = this.validateExpenseData(expenseData)
      if (!validation.isValid) {
        return {
          success: false,
          message: `I need some additional information to create your expense report: ${validation.missingFields.join(', ')}`,
          action: {
            type: 'form',
            form: 'expense',
            prefillData: expenseData,
            missingFields: validation.missingFields
          }
        }
      }

      // Create expense record
      const expense = await this.createExpense({
        ...expenseData,
        userId,
        sessionId,
        conversationId
      })

      if (expense.success) {
        return {
          success: true,
          message: `Perfect! I've created your expense report for ${expenseData.description} ($${expenseData.amount}). ${expenseData.receiptRequired ? 'Please upload your receipt to complete the submission.' : 'Your expense has been submitted for approval.'}`,
          action: {
            type: 'navigate',
            route: '/expenses',
            params: { expenseId: expense.id }
          },
          data: {
            expenseId: expense.id,
            amount: expenseData.amount,
            description: expenseData.description,
            receiptRequired: expenseData.receiptRequired
          }
        }
      } else {
        return {
          success: false,
          message: "I encountered an issue creating your expense report. Please try using the expense form directly.",
          action: {
            type: 'navigate',
            route: '/expenses'
          }
        }
      }

    } catch (error) {
      logger.error('Expense workflow execution error', { error: error.message })
      return {
        success: false,
        message: "I'm having trouble processing your expense request. Please try again or use the expense form.",
        error: error.message
      }
    }
  }

  parseExpenseData(action) {
    const data = {}
    
    // From function call arguments
    if (action.type === 'function_call' && action.arguments) {
      Object.assign(data, action.arguments)
    }
    
    // From entities extracted during intent detection
    if (action.entities) {
      if (action.entities.amount) data.amount = action.entities.amount
      if (action.entities.category) data.category = action.entities.category
      if (action.entities.date) data.expense_date = this.parseDate(action.entities.date)
    }

    // Set defaults
    data.currency = data.currency || 'USD'
    data.status = 'pending'
    data.receiptRequired = data.amount > 25 // Company policy: receipts required for expenses over $25
    
    return data
  }

  validateExpenseData(data) {
    const required = ['description', 'amount', 'category']
    const missingFields = []
    
    for (const field of required) {
      if (!data[field]) {
        missingFields.push(field)
      }
    }
    
    // Additional validations
    if (data.amount && (data.amount <= 0 || data.amount > 10000)) {
      missingFields.push('valid amount (must be between $0.01 and $10,000)')
    }
    
    if (data.category && !['meals', 'travel', 'accommodation', 'supplies', 'other'].includes(data.category)) {
      missingFields.push('valid category')
    }

    return {
      isValid: missingFields.length === 0,
      missingFields
    }
  }

  async createExpense(expenseData) {
    try {
      const expense = {
        id: uuidv4(),
        user_id: expenseData.userId,
        description: expenseData.description,
        amount: expenseData.amount,
        currency: expenseData.currency,
        category: expenseData.category,
        expense_date: expenseData.expense_date || new Date().toISOString().split('T')[0],
        merchant: expenseData.merchant || null,
        notes: expenseData.reason || null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          source: 'ai_chat',
          session_id: expenseData.sessionId,
          conversation_id: expenseData.conversationId
        }
      }

      const { data, error } = await supabase
        .from('expenses')
        .insert(expense)
        .select()
        .single()

      if (error) {
        logger.error('Failed to create expense', { error, expenseData })
        return { success: false, error: error.message }
      }

      logger.info('Expense created successfully', { expenseId: data.id })
      return { success: true, id: data.id, data }

    } catch (error) {
      logger.error('Create expense error', { error: error.message })
      return { success: false, error: error.message }
    }
  }

  parseDate(dateString) {
    if (!dateString) return new Date().toISOString().split('T')[0]
    
    const today = new Date()
    const dateStr = dateString.toLowerCase()
    
    if (dateStr === 'today') {
      return today.toISOString().split('T')[0]
    }
    
    if (dateStr === 'yesterday') {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return yesterday.toISOString().split('T')[0]
    }
    
    // Try to parse other date formats
    try {
      const parsed = new Date(dateString)
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0]
      }
    } catch (error) {
      logger.warn('Could not parse date', { dateString })
    }
    
    return today.toISOString().split('T')[0]
  }

  // Quick actions for expense workflow
  getQuickActions() {
    return [
      {
        id: 'upload_receipt',
        label: 'Upload Receipt',
        icon: 'camera',
        action: { type: 'camera', mode: 'receipt' }
      },
      {
        id: 'expense_history',
        label: 'View Expenses',
        icon: 'list',
        action: { type: 'navigate', route: '/expenses' }
      },
      {
        id: 'expense_policy',
        label: 'Expense Policy',
        icon: 'info',
        action: { type: 'document', id: 'expense-policy' }
      }
    ]
  }
}

export default ExpenseWorkflow
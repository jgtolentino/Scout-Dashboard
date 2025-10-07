import { supabase } from '../config/database.js'
import { logger } from '../utils/logger.js'
import { metrics } from '../utils/metrics.js'

export const expenseRoutes = async (fastify) => {
  // Get user's expenses
  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'integer', minimum: 0, default: 0 },
          status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'reimbursed'] },
          category: { type: 'string', enum: ['meals', 'travel', 'accommodation', 'supplies', 'other'] },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { limit, offset, status, category, startDate, endDate } = request.query
      const userId = request.user.id

      let query = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (status) query = query.eq('status', status)
      if (category) query = query.eq('category', category)
      if (startDate) query = query.gte('expense_date', startDate)
      if (endDate) query = query.lte('expense_date', endDate)

      const { data: expenses, error } = await query

      if (error) throw error

      logger.info('Expenses retrieved', {
        userId,
        count: expenses.length,
        filters: { status, category, startDate, endDate }
      })

      return {
        success: true,
        expenses,
        count: expenses.length,
        limit,
        offset,
        hasMore: expenses.length === limit
      }

    } catch (error) {
      logger.error('Get expenses error', {
        error: error.message,
        userId: request.user.id
      })

      return reply.code(500).send({
        success: false,
        error: 'Failed to retrieve expenses'
      })
    }
  })

  // Get expense by ID
  fastify.get('/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params
      const userId = request.user.id

      const { data: expense, error } = await supabase
        .from('expenses')
        .select(`
          *,
          receipts (*)
        `)
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (error || !expense) {
        return reply.code(404).send({
          success: false,
          error: 'Expense not found'
        })
      }

      return {
        success: true,
        expense
      }

    } catch (error) {
      logger.error('Get expense error', {
        error: error.message,
        userId: request.user.id,
        expenseId: request.params.id
      })

      return reply.code(500).send({
        success: false,
        error: 'Failed to retrieve expense'
      })
    }
  })

  // Create new expense
  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['description', 'amount', 'category', 'expense_date'],
        properties: {
          description: { type: 'string', minLength: 1, maxLength: 500 },
          amount: { type: 'number', minimum: 0.01, maximum: 10000 },
          currency: { type: 'string', minLength: 3, maxLength: 3, default: 'USD' },
          category: { type: 'string', enum: ['meals', 'travel', 'accommodation', 'supplies', 'other'] },
          expense_date: { type: 'string', format: 'date' },
          merchant: { type: 'string', maxLength: 200 },
          notes: { type: 'string', maxLength: 1000 },
          department: { type: 'string', maxLength: 100 },
          project_code: { type: 'string', maxLength: 50 },
          tax_amount: { type: 'number', minimum: 0, default: 0 },
          payment_method: { type: 'string', maxLength: 50 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const expenseData = request.body
      const userId = request.user.id

      const expense = {
        ...expenseData,
        user_id: userId,
        status: 'pending'
      }

      const { data: createdExpense, error } = await supabase
        .from('expenses')
        .insert(expense)
        .select()
        .single()

      if (error) throw error

      // Track metrics
      metrics.expensesCreated.inc({
        source: 'api',
        category: expenseData.category
      })

      logger.info('Expense created', {
        userId,
        expenseId: createdExpense.id,
        amount: expenseData.amount,
        category: expenseData.category
      })

      return {
        success: true,
        expense: createdExpense
      }

    } catch (error) {
      logger.error('Create expense error', {
        error: error.message,
        userId: request.user.id,
        amount: request.body.amount
      })

      return reply.code(500).send({
        success: false,
        error: 'Failed to create expense'
      })
    }
  })

  // Update expense
  fastify.put('/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        properties: {
          description: { type: 'string', minLength: 1, maxLength: 500 },
          amount: { type: 'number', minimum: 0.01, maximum: 10000 },
          category: { type: 'string', enum: ['meals', 'travel', 'accommodation', 'supplies', 'other'] },
          expense_date: { type: 'string', format: 'date' },
          merchant: { type: 'string', maxLength: 200 },
          notes: { type: 'string', maxLength: 1000 },
          department: { type: 'string', maxLength: 100 },
          project_code: { type: 'string', maxLength: 50 },
          tax_amount: { type: 'number', minimum: 0 },
          payment_method: { type: 'string', maxLength: 50 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params
      const updates = request.body
      const userId = request.user.id

      // Check if expense exists and belongs to user
      const { data: existingExpense, error: fetchError } = await supabase
        .from('expenses')
        .select('id, status')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (fetchError || !existingExpense) {
        return reply.code(404).send({
          success: false,
          error: 'Expense not found'
        })
      }

      // Don't allow updates to approved/reimbursed expenses
      if (['approved', 'reimbursed'].includes(existingExpense.status)) {
        return reply.code(400).send({
          success: false,
          error: 'Cannot update approved or reimbursed expenses'
        })
      }

      const { data: updatedExpense, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error

      logger.info('Expense updated', {
        userId,
        expenseId: id,
        updates: Object.keys(updates)
      })

      return {
        success: true,
        expense: updatedExpense
      }

    } catch (error) {
      logger.error('Update expense error', {
        error: error.message,
        userId: request.user.id,
        expenseId: request.params.id
      })

      return reply.code(500).send({
        success: false,
        error: 'Failed to update expense'
      })
    }
  })

  // Delete expense
  fastify.delete('/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params
      const userId = request.user.id

      // Check if expense exists and can be deleted
      const { data: expense, error: fetchError } = await supabase
        .from('expenses')
        .select('id, status')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (fetchError || !expense) {
        return reply.code(404).send({
          success: false,
          error: 'Expense not found'
        })
      }

      if (['approved', 'reimbursed'].includes(expense.status)) {
        return reply.code(400).send({
          success: false,
          error: 'Cannot delete approved or reimbursed expenses'
        })
      }

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error

      logger.info('Expense deleted', {
        userId,
        expenseId: id
      })

      return {
        success: true,
        message: 'Expense deleted successfully'
      }

    } catch (error) {
      logger.error('Delete expense error', {
        error: error.message,
        userId: request.user.id,
        expenseId: request.params.id
      })

      return reply.code(500).send({
        success: false,
        error: 'Failed to delete expense'
      })
    }
  })

  // Get expense analytics/summary
  fastify.get('/analytics', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          groupBy: { type: 'string', enum: ['category', 'status', 'month'], default: 'category' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { startDate, endDate, groupBy } = request.query
      const userId = request.user.id

      let query = supabase
        .from('expenses')
        .select('amount, category, status, expense_date')
        .eq('user_id', userId)

      if (startDate) query = query.gte('expense_date', startDate)
      if (endDate) query = query.lte('expense_date', endDate)

      const { data: expenses, error } = await query

      if (error) throw error

      // Calculate analytics
      const analytics = {
        totalAmount: expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0),
        totalCount: expenses.length,
        byCategory: {},
        byStatus: {},
        byMonth: {}
      }

      expenses.forEach(expense => {
        const amount = parseFloat(expense.amount)
        
        // By category
        analytics.byCategory[expense.category] = {
          amount: (analytics.byCategory[expense.category]?.amount || 0) + amount,
          count: (analytics.byCategory[expense.category]?.count || 0) + 1
        }
        
        // By status
        analytics.byStatus[expense.status] = {
          amount: (analytics.byStatus[expense.status]?.amount || 0) + amount,
          count: (analytics.byStatus[expense.status]?.count || 0) + 1
        }
        
        // By month
        const month = expense.expense_date.substring(0, 7) // YYYY-MM
        analytics.byMonth[month] = {
          amount: (analytics.byMonth[month]?.amount || 0) + amount,
          count: (analytics.byMonth[month]?.count || 0) + 1
        }
      })

      return {
        success: true,
        analytics,
        dateRange: { startDate, endDate },
        groupBy
      }

    } catch (error) {
      logger.error('Expense analytics error', {
        error: error.message,
        userId: request.user.id
      })

      return reply.code(500).send({
        success: false,
        error: 'Failed to retrieve expense analytics'
      })
    }
  })
}
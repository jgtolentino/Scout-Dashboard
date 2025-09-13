import { logger } from '../../../utils/logger.js'
import { supabase } from '../../../config/database.js'
import { v4 as uuidv4 } from 'uuid'
import { addDays, format, parseISO, differenceInDays } from 'date-fns'

export class LeaveWorkflow {
  async execute({ action, userId, sessionId, conversationId, executionId }) {
    try {
      logger.info('Executing leave request workflow', {
        action,
        userId,
        executionId
      })

      const leaveData = this.parseLeaveData(action)
      
      const validation = this.validateLeaveData(leaveData)
      if (!validation.isValid) {
        return {
          success: false,
          message: `I need some additional information for your leave request: ${validation.missingFields.join(', ')}`,
          action: {
            type: 'form',
            form: 'leaveRequest',
            prefillData: leaveData,
            missingFields: validation.missingFields
          }
        }
      }

      // Check leave balance
      const balanceCheck = await this.checkLeaveBalance(userId, leaveData)
      if (!balanceCheck.sufficient && leaveData.leaveType === 'vacation') {
        return {
          success: false,
          message: `You don't have enough vacation days for this request. You have ${balanceCheck.available} days available, but requested ${balanceCheck.requested} days.`,
          action: {
            type: 'navigate',
            route: '/leave/balance'
          }
        }
      }

      const leaveRequest = await this.createLeaveRequest({
        ...leaveData,
        userId,
        sessionId,
        conversationId
      })

      if (leaveRequest.success) {
        const daysCount = differenceInDays(parseISO(leaveData.endDate), parseISO(leaveData.startDate)) + 1
        const isHalfDay = leaveData.halfDay || daysCount === 0.5

        return {
          success: true,
          message: `Perfect! I've submitted your ${leaveData.leaveType} request for ${isHalfDay ? 'half day' : `${daysCount} day${daysCount > 1 ? 's' : ''}`} (${format(parseISO(leaveData.startDate), 'MMM dd')} - ${format(parseISO(leaveData.endDate), 'MMM dd')}). Your manager will review and respond soon.`,
          action: {
            type: 'navigate',
            route: '/leave',
            params: { requestId: leaveRequest.id }
          },
          data: {
            requestId: leaveRequest.id,
            startDate: leaveData.startDate,
            endDate: leaveData.endDate,
            leaveType: leaveData.leaveType,
            daysRequested: isHalfDay ? 0.5 : daysCount
          }
        }
      } else {
        return {
          success: false,
          message: "I encountered an issue submitting your leave request. Please try using the leave request form directly.",
          action: {
            type: 'navigate',
            route: '/leave'
          }
        }
      }

    } catch (error) {
      logger.error('Leave workflow execution error', { error: error.message })
      return {
        success: false,
        message: "I'm having trouble processing your leave request. Please try again or use the leave request form.",
        error: error.message
      }
    }
  }

  parseLeaveData(action) {
    const data = {}
    
    if (action.type === 'function_call' && action.arguments) {
      Object.assign(data, action.arguments)
    }
    
    if (action.entities) {
      if (action.entities.leaveType) data.leaveType = action.entities.leaveType
      if (action.entities.duration) {
        if (action.entities.duration.includes('half')) {
          data.halfDay = true
        }
      }
      if (action.entities.when) {
        const dates = this.parseDateRange(action.entities.when)
        if (dates.startDate) data.startDate = dates.startDate
        if (dates.endDate) data.endDate = dates.endDate
      }
    }

    // Set defaults
    data.status = 'pending'
    if (!data.leaveType) data.leaveType = 'vacation'
    
    return data
  }

  validateLeaveData(data) {
    const required = ['startDate', 'endDate', 'leaveType']
    const missingFields = []
    
    for (const field of required) {
      if (!data[field]) {
        missingFields.push(field)
      }
    }
    
    // Validate dates
    if (data.startDate && data.endDate) {
      const startDate = parseISO(data.startDate)
      const endDate = parseISO(data.endDate)
      const today = new Date()
      
      if (startDate < today) {
        missingFields.push('start date cannot be in the past')
      }
      
      if (endDate < startDate) {
        missingFields.push('end date must be after start date')
      }
      
      // Check for reasonable duration (max 30 days for vacation)
      const duration = differenceInDays(endDate, startDate) + 1
      if (data.leaveType === 'vacation' && duration > 30) {
        missingFields.push('vacation requests cannot exceed 30 days')
      }
    }
    
    // Validate leave type
    const validTypes = ['vacation', 'sick', 'personal', 'bereavement', 'maternity', 'paternity', 'other']
    if (data.leaveType && !validTypes.includes(data.leaveType)) {
      missingFields.push('valid leave type')
    }
    
    // Require reason for certain leave types
    if (['sick', 'bereavement', 'other'].includes(data.leaveType) && !data.reason) {
      missingFields.push('reason (required for this leave type)')
    }

    return {
      isValid: missingFields.length === 0,
      missingFields
    }
  }

  async createLeaveRequest(leaveData) {
    try {
      const request = {
        id: uuidv4(),
        user_id: leaveData.userId,
        leave_type: leaveData.leaveType,
        start_date: leaveData.startDate,
        end_date: leaveData.endDate,
        half_day: leaveData.halfDay || false,
        reason: leaveData.reason || null,
        status: 'pending',
        days_requested: this.calculateDays(leaveData.startDate, leaveData.endDate, leaveData.halfDay),
        submitted_at: new Date().toISOString(),
        metadata: {
          source: 'ai_chat',
          session_id: leaveData.sessionId,
          conversation_id: leaveData.conversationId
        }
      }

      const { data, error } = await supabase
        .from('leave_requests')
        .insert(request)
        .select()
        .single()

      if (error) {
        logger.error('Failed to create leave request', { error, leaveData })
        return { success: false, error: error.message }
      }

      logger.info('Leave request created successfully', { requestId: data.id })
      return { success: true, id: data.id, data }

    } catch (error) {
      logger.error('Create leave request error', { error: error.message })
      return { success: false, error: error.message }
    }
  }

  async checkLeaveBalance(userId, leaveData) {
    try {
      // Get user's leave balance
      const { data: balance, error } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('user_id', userId)
        .eq('year', new Date().getFullYear())
        .single()

      if (error || !balance) {
        logger.warn('Could not fetch leave balance', { userId, error })
        return { sufficient: true, available: 'unknown', requested: 0 }
      }

      const requested = this.calculateDays(leaveData.startDate, leaveData.endDate, leaveData.halfDay)
      let available = 0

      switch (leaveData.leaveType) {
        case 'vacation':
          available = balance.vacation_days_remaining
          break
        case 'sick':
          available = balance.sick_days_remaining
          break
        case 'personal':
          available = balance.personal_days_remaining
          break
        default:
          return { sufficient: true, available: 'unlimited', requested }
      }

      return {
        sufficient: available >= requested,
        available,
        requested
      }

    } catch (error) {
      logger.error('Leave balance check error', { error: error.message })
      return { sufficient: true, available: 'unknown', requested: 0 }
    }
  }

  parseDateRange(whenString) {
    const today = new Date()
    const when = whenString.toLowerCase()
    
    if (when.includes('next week')) {
      const nextMonday = addDays(today, 7 - today.getDay() + 1)
      return {
        startDate: format(nextMonday, 'yyyy-MM-dd'),
        endDate: format(addDays(nextMonday, 4), 'yyyy-MM-dd') // Monday to Friday
      }
    }
    
    if (when.includes('this week')) {
      const thisMonday = addDays(today, 1 - today.getDay())
      return {
        startDate: format(thisMonday, 'yyyy-MM-dd'),
        endDate: format(addDays(thisMonday, 4), 'yyyy-MM-dd')
      }
    }
    
    if (when === 'tomorrow') {
      const tomorrow = addDays(today, 1)
      return {
        startDate: format(tomorrow, 'yyyy-MM-dd'),
        endDate: format(tomorrow, 'yyyy-MM-dd')
      }
    }
    
    if (when.includes('friday')) {
      const nextFriday = addDays(today, 5 - today.getDay() + (today.getDay() > 5 ? 7 : 0))
      return {
        startDate: format(nextFriday, 'yyyy-MM-dd'),
        endDate: format(nextFriday, 'yyyy-MM-dd')
      }
    }
    
    return { startDate: null, endDate: null }
  }

  calculateDays(startDate, endDate, halfDay = false) {
    if (halfDay) return 0.5
    
    const start = parseISO(startDate)
    const end = parseISO(endDate)
    return differenceInDays(end, start) + 1
  }

  getQuickActions() {
    return [
      {
        id: 'leave_balance',
        label: 'Check Balance',
        icon: 'calendar',
        action: { type: 'navigate', route: '/leave/balance' }
      },
      {
        id: 'leave_calendar',
        label: 'Team Calendar',
        icon: 'users',
        action: { type: 'navigate', route: '/leave/calendar' }
      },
      {
        id: 'leave_policy',
        label: 'Leave Policy',
        icon: 'info',
        action: { type: 'document', id: 'leave-policy' }
      }
    ]
  }
}

export default LeaveWorkflow
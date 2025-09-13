import { logger } from '../../../utils/logger.js'
import { supabase } from '../../../config/database.js'
import { v4 as uuidv4 } from 'uuid'

export class TimeWorkflow {
  async execute({ action, userId, sessionId, conversationId, executionId }) {
    try {
      logger.info('Executing time correction workflow', {
        action,
        userId,
        executionId
      })

      const timeData = this.parseTimeData(action)
      
      const validation = this.validateTimeData(timeData)
      if (!validation.isValid) {
        return {
          success: false,
          message: `I need some additional information for your time correction: ${validation.missingFields.join(', ')}`,
          action: {
            type: 'form',
            form: 'timeCorrection',
            prefillData: timeData,
            missingFields: validation.missingFields
          }
        }
      }

      const timeCorrection = await this.createTimeCorrection({
        ...timeData,
        userId,
        sessionId,
        conversationId
      })

      if (timeCorrection.success) {
        return {
          success: true,
          message: `Got it! I've submitted your time correction for ${timeData.date}. Your manager will review and approve the changes.`,
          action: {
            type: 'navigate',
            route: '/time',
            params: { correctionId: timeCorrection.id }
          },
          data: {
            correctionId: timeCorrection.id,
            date: timeData.date,
            reason: timeData.reason
          }
        }
      } else {
        return {
          success: false,
          message: "I encountered an issue submitting your time correction. Please try using the timesheet directly.",
          action: {
            type: 'navigate',
            route: '/time'
          }
        }
      }

    } catch (error) {
      logger.error('Time workflow execution error', { error: error.message })
      return {
        success: false,
        message: "I'm having trouble processing your time correction. Please try again or use the timesheet.",
        error: error.message
      }
    }
  }

  parseTimeData(action) {
    const data = {}
    
    if (action.type === 'function_call' && action.arguments) {
      Object.assign(data, action.arguments)
    }
    
    if (action.entities) {
      if (action.entities.date) data.date = this.parseDate(action.entities.date)
      if (action.entities.time && action.entities.time.length > 0) {
        data.startTime = action.entities.time[0]
        if (action.entities.time.length > 1) {
          data.endTime = action.entities.time[1]
        }
      }
    }

    // Set defaults
    data.status = 'pending'
    
    return data
  }

  validateTimeData(data) {
    const required = ['date', 'reason']
    const missingFields = []
    
    for (const field of required) {
      if (!data[field]) {
        missingFields.push(field)
      }
    }
    
    // Validate date is not in future
    if (data.date) {
      const correctionDate = new Date(data.date)
      const today = new Date()
      if (correctionDate > today) {
        missingFields.push('date cannot be in the future')
      }
      
      // Don't allow corrections older than 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      if (correctionDate < thirtyDaysAgo) {
        missingFields.push('date cannot be more than 30 days ago')
      }
    }
    
    // Validate time format if provided
    if (data.startTime && !this.isValidTimeFormat(data.startTime)) {
      missingFields.push('valid start time (HH:MM format)')
    }
    
    if (data.endTime && !this.isValidTimeFormat(data.endTime)) {
      missingFields.push('valid end time (HH:MM format)')
    }

    return {
      isValid: missingFields.length === 0,
      missingFields
    }
  }

  async createTimeCorrection(timeData) {
    try {
      const correction = {
        id: uuidv4(),
        user_id: timeData.userId,
        correction_date: timeData.date,
        start_time: timeData.startTime || null,
        end_time: timeData.endTime || null,
        reason: timeData.reason,
        project_code: timeData.projectCode || null,
        status: 'pending',
        submitted_at: new Date().toISOString(),
        metadata: {
          source: 'ai_chat',
          session_id: timeData.sessionId,
          conversation_id: timeData.conversationId
        }
      }

      const { data, error } = await supabase
        .from('time_corrections')
        .insert(correction)
        .select()
        .single()

      if (error) {
        logger.error('Failed to create time correction', { error, timeData })
        return { success: false, error: error.message }
      }

      logger.info('Time correction created successfully', { correctionId: data.id })
      return { success: true, id: data.id, data }

    } catch (error) {
      logger.error('Create time correction error', { error: error.message })
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
    
    // Handle day names (monday, tuesday, etc.)
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayIndex = dayNames.indexOf(dateStr)
    if (dayIndex !== -1) {
      const targetDate = new Date(today)
      const todayIndex = today.getDay()
      const daysBack = todayIndex >= dayIndex ? todayIndex - dayIndex : 7 - (dayIndex - todayIndex)
      targetDate.setDate(today.getDate() - daysBack)
      return targetDate.toISOString().split('T')[0]
    }
    
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

  isValidTimeFormat(timeString) {
    if (!timeString) return false
    
    // Match HH:MM or H:MM format, optionally with AM/PM
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])(\s?(AM|PM))?$/i
    return timeRegex.test(timeString.trim())
  }

  getQuickActions() {
    return [
      {
        id: 'view_timesheet',
        label: 'View Timesheet',
        icon: 'clock',
        action: { type: 'navigate', route: '/time' }
      },
      {
        id: 'time_policy',
        label: 'Time Policy',
        icon: 'info',
        action: { type: 'document', id: 'time-policy' }
      },
      {
        id: 'correction_status',
        label: 'Check Status',
        icon: 'check',
        action: { type: 'navigate', route: '/time/corrections' }
      }
    ]
  }
}

export default TimeWorkflow
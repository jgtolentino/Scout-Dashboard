import { logger } from '../../../utils/logger.js'
import { supabase } from '../../../config/database.js'
import { v4 as uuidv4 } from 'uuid'

export class ITWorkflow {
  async execute({ action, userId, sessionId, conversationId, executionId }) {
    try {
      logger.info('Executing IT support workflow', {
        action,
        userId,
        executionId
      })

      const ticketData = this.parseTicketData(action)
      
      const validation = this.validateTicketData(ticketData)
      if (!validation.isValid) {
        return {
          success: false,
          message: `I need some additional information for your IT ticket: ${validation.missingFields.join(', ')}`,
          action: {
            type: 'form',
            form: 'itTicket',
            prefillData: ticketData,
            missingFields: validation.missingFields
          }
        }
      }

      const ticket = await this.createITTicket({
        ...ticketData,
        userId,
        sessionId,
        conversationId
      })

      if (ticket.success) {
        const priorityMessage = ticketData.priority === 'urgent' 
          ? 'I\'ve marked this as urgent and IT will respond immediately.'
          : `This has been assigned priority: ${ticketData.priority}.`

        return {
          success: true,
          message: `Got it! I've created IT ticket #${ticket.ticketNumber} for your ${ticketData.category} issue. ${priorityMessage} You'll receive updates via email.`,
          action: {
            type: 'navigate',
            route: '/support',
            params: { ticketId: ticket.id }
          },
          data: {
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            category: ticketData.category,
            priority: ticketData.priority
          }
        }
      } else {
        return {
          success: false,
          message: "I encountered an issue creating your IT ticket. Please try using the support form directly.",
          action: {
            type: 'navigate',
            route: '/support'
          }
        }
      }

    } catch (error) {
      logger.error('IT workflow execution error', { error: error.message })
      return {
        success: false,
        message: "I'm having trouble processing your IT request. Please try again or use the support form.",
        error: error.message
      }
    }
  }

  parseTicketData(action) {
    const data = {}
    
    if (action.type === 'function_call' && action.arguments) {
      Object.assign(data, action.arguments)
    }
    
    if (action.entities) {
      if (action.entities.category) data.category = action.entities.category
      if (action.entities.priority) data.priority = action.entities.priority
    }

    // Set defaults
    data.status = 'open'
    data.priority = data.priority || 'medium'
    data.category = data.category || 'other'
    
    return data
  }

  validateTicketData(data) {
    const required = ['description', 'category']
    const missingFields = []
    
    for (const field of required) {
      if (!data[field]) {
        missingFields.push(field)
      }
    }
    
    // Validate category
    const validCategories = ['hardware', 'software', 'access', 'email', 'network', 'printer', 'other']
    if (data.category && !validCategories.includes(data.category)) {
      missingFields.push('valid category')
    }
    
    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent']
    if (data.priority && !validPriorities.includes(data.priority)) {
      missingFields.push('valid priority level')
    }
    
    // Require more details for certain categories
    if (['access', 'email'].includes(data.category) && (!data.description || data.description.length < 10)) {
      missingFields.push('detailed description (especially for access/email issues)')
    }

    return {
      isValid: missingFields.length === 0,
      missingFields
    }
  }

  async createITTicket(ticketData) {
    try {
      const ticketNumber = await this.generateTicketNumber()
      
      const ticket = {
        id: uuidv4(),
        ticket_number: ticketNumber,
        user_id: ticketData.userId,
        category: ticketData.category,
        priority: ticketData.priority,
        subject: this.generateSubject(ticketData),
        description: ticketData.description,
        location: ticketData.location || 'remote',
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          source: 'ai_chat',
          session_id: ticketData.sessionId,
          conversation_id: ticketData.conversationId,
          auto_categorized: true
        }
      }

      const { data, error } = await supabase
        .from('it_tickets')
        .insert(ticket)
        .select()
        .single()

      if (error) {
        logger.error('Failed to create IT ticket', { error, ticketData })
        return { success: false, error: error.message }
      }

      // Send notification to IT team
      await this.notifyITTeam(data)

      logger.info('IT ticket created successfully', { ticketId: data.id, ticketNumber })
      return { success: true, id: data.id, ticketNumber, data }

    } catch (error) {
      logger.error('Create IT ticket error', { error: error.message })
      return { success: false, error: error.message }
    }
  }

  async generateTicketNumber() {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    
    // Get today's ticket count
    const { count } = await supabase
      .from('it_tickets')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today.toISOString().slice(0, 10)}T00:00:00.000Z`)
      .lt('created_at', `${today.toISOString().slice(0, 10)}T23:59:59.999Z`)
    
    const sequenceNumber = (count || 0) + 1
    return `IT${dateStr}${sequenceNumber.toString().padStart(3, '0')}`
  }

  generateSubject(ticketData) {
    const categorySubjects = {
      hardware: 'Hardware Issue',
      software: 'Software Problem',
      access: 'Access Request',
      email: 'Email Issue',
      network: 'Network/Connectivity Problem',
      printer: 'Printer Issue',
      other: 'General IT Support'
    }
    
    const baseSubject = categorySubjects[ticketData.category] || 'IT Support Request'
    
    // Try to extract specific issue from description
    const description = ticketData.description.toLowerCase()
    if (description.includes('password')) {
      return `${baseSubject} - Password Reset`
    }
    if (description.includes('login') || description.includes('access')) {
      return `${baseSubject} - Login/Access Issue`
    }
    if (description.includes('slow') || description.includes('performance')) {
      return `${baseSubject} - Performance Issue`
    }
    if (description.includes('not working') || description.includes('broken')) {
      return `${baseSubject} - Equipment Not Working`
    }
    
    return baseSubject
  }

  async notifyITTeam(ticket) {
    try {
      // In a real implementation, this would send notifications via email, Slack, etc.
      logger.info('IT team notification sent', {
        ticketId: ticket.id,
        ticketNumber: ticket.ticket_number,
        priority: ticket.priority,
        category: ticket.category
      })

      // For urgent tickets, could trigger immediate notifications
      if (ticket.priority === 'urgent') {
        // Send immediate alert to IT team
        logger.warn('URGENT IT ticket created', {
          ticketNumber: ticket.ticket_number,
          userId: ticket.user_id,
          description: ticket.description
        })
      }

    } catch (error) {
      logger.error('Failed to notify IT team', { error: error.message })
    }
  }

  getQuickActions() {
    return [
      {
        id: 'check_ticket_status',
        label: 'Check Status',
        icon: 'search',
        action: { type: 'navigate', route: '/support/tickets' }
      },
      {
        id: 'common_issues',
        label: 'Common Issues',
        icon: 'help',
        action: { type: 'document', id: 'it-troubleshooting' }
      },
      {
        id: 'request_equipment',
        label: 'Request Equipment',
        icon: 'package',
        action: { type: 'form', form: 'equipmentRequest' }
      },
      {
        id: 'password_reset',
        label: 'Reset Password',
        icon: 'key',
        action: { type: 'navigate', route: '/support/password-reset' }
      }
    ]
  }

  // Get common IT issues for auto-suggestions
  getCommonIssues() {
    return [
      {
        category: 'password',
        title: 'Password Reset',
        description: 'I need to reset my password',
        quickSolution: 'Try the self-service password reset at /support/password-reset'
      },
      {
        category: 'email',
        title: 'Email Not Working',
        description: 'I cannot access my email',
        quickSolution: 'Check if you can access webmail at mail.tbwa.com'
      },
      {
        category: 'wifi',
        title: 'WiFi Connection Issues',
        description: 'Cannot connect to office WiFi',
        quickSolution: 'Try forgetting and reconnecting to the network'
      },
      {
        category: 'vpn',
        title: 'VPN Problems',
        description: 'Cannot connect to company VPN',
        quickSolution: 'Ensure you have the latest VPN client installed'
      },
      {
        category: 'printer',
        title: 'Printer Not Working',
        description: 'Cannot print documents',
        quickSolution: 'Check if printer is online and has paper/toner'
      }
    ]
  }
}

export default ITWorkflow
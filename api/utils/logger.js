import pino from 'pino'
import { config } from '../config/index.js'

// Create logger instance
export const logger = pino({
  level: config.logging.level,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() }
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(config.logging.prettyPrint && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'yyyy-mm-dd HH:MM:ss'
      }
    }
  })
})

// Add custom log methods for specific use cases
logger.chat = (message, data = {}) => {
  logger.info(data, `[CHAT] ${message}`)
}

logger.workflow = (message, data = {}) => {
  logger.info(data, `[WORKFLOW] ${message}`)
}

logger.ai = (message, data = {}) => {
  logger.info(data, `[AI] ${message}`)
}

logger.database = (message, data = {}) => {
  logger.info(data, `[DB] ${message}`)
}

logger.security = (message, data = {}) => {
  logger.warn(data, `[SECURITY] ${message}`)
}

logger.performance = (message, data = {}) => {
  logger.info(data, `[PERF] ${message}`)
}

export default logger
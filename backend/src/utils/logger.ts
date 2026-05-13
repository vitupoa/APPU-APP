export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

export interface LogContext {
  [key: string]: any;
}

export class Logger {
  private context: string;
  private static logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;

  constructor(context: string) {
    this.context = context;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    return levels.indexOf(level) >= levels.indexOf(Logger.logLevel);
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] [${this.context}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, context));
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message, context));
    }
  }

  fatal(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.FATAL)) {
      console.error(this.formatMessage(LogLevel.FATAL, message, context));
    }
  }

  /**
   * Log database query with execution time
   */
  logQuery(query: string, duration: number, params?: any): void {
    this.debug(`Query executed in ${duration}ms`, { query, params });
  }

  /**
   * Log API request
   */
  logRequest(method: string, path: string, userId?: string, duration?: number): void {
    this.info(`${method} ${path}`, { user_id: userId, duration });
  }

  /**
   * Log API error
   */
  logApiError(method: string, path: string, error: Error, userId?: string): void {
    this.error(`${method} ${path} failed`, {
      user_id: userId,
      error: error.message,
      stack: error.stack,
    });
  }

  /**
   * Log conversion event
   */
  logConversion(type: string, user_id: string, value?: number, metadata?: any): void {
    this.info(`Conversion: ${type}`, { user_id, value, ...metadata });
  }

  /**
   * Log security event
   */
  logSecurity(event: string, userId?: string, ipAddress?: string, metadata?: any): void {
    this.warn(`Security: ${event}`, { user_id: userId, ipAddress, ...metadata });
  }

  /**
   * Log performance metric
   */
  logPerformance(operation: string, duration: number, metadata?: any): void {
    if (duration > 1000) {
      this.warn(`Slow operation: ${operation} took ${duration}ms`, metadata);
    } else {
      this.debug(`Performance: ${operation} took ${duration}ms`, metadata);
    }
  }
}

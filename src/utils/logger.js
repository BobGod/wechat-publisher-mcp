/**
 * 日志工具
 * 提供统一的日志记录功能，支持不同级别的日志输出
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const LOG_COLORS = {
  ERROR: '\x1b[31m', // 红色
  WARN: '\x1b[33m',  // 黄色
  INFO: '\x1b[36m',  // 青色
  DEBUG: '\x1b[90m', // 灰色
  RESET: '\x1b[0m'   // 重置
};

class Logger {
  constructor() {
    // 从环境变量读取日志级别，默认为INFO
    this.logLevel = this.parseLogLevel(process.env.LOG_LEVEL || 'INFO');
    this.enableColors = process.env.NO_COLOR !== '1';
  }

  /**
   * 解析日志级别
   */
  parseLogLevel(level) {
    const upperLevel = level.toUpperCase();
    return LOG_LEVELS[upperLevel] !== undefined ? LOG_LEVELS[upperLevel] : LOG_LEVELS.INFO;
  }

  /**
   * 格式化时间戳
   */
  formatTimestamp() {
    return new Date().toISOString();
  }

  /**
   * 格式化日志消息
   */
  formatMessage(level, message, metadata = {}) {
    const timestamp = this.formatTimestamp();
    const metaStr = Object.keys(metadata).length > 0 ? 
      ' ' + JSON.stringify(metadata) : '';
    
    if (this.enableColors) {
      const color = LOG_COLORS[level] || '';
      const reset = LOG_COLORS.RESET;
      return `${color}[${timestamp}] ${level.padEnd(5)} ${message}${metaStr}${reset}`;
    } else {
      return `[${timestamp}] ${level.padEnd(5)} ${message}${metaStr}`;
    }
  }

  /**
   * 记录日志
   */
  log(level, message, metadata = {}) {
    const levelValue = LOG_LEVELS[level];
    if (levelValue <= this.logLevel) {
      const formattedMessage = this.formatMessage(level, message, metadata);
      
      // 错误日志输出到stderr，其他输出到stdout
      if (level === 'ERROR') {
        console.error(formattedMessage);
      } else {
        console.log(formattedMessage);
      }
    }
  }

  /**
   * 错误日志
   */
  error(message, metadata = {}) {
    this.log('ERROR', message, metadata);
  }

  /**
   * 警告日志
   */
  warn(message, metadata = {}) {
    this.log('WARN', message, metadata);
  }

  /**
   * 信息日志
   */
  info(message, metadata = {}) {
    this.log('INFO', message, metadata);
  }

  /**
   * 调试日志
   */
  debug(message, metadata = {}) {
    this.log('DEBUG', message, metadata);
  }

  /**
   * 开始计时器
   */
  time(label) {
    this.timers = this.timers || {};
    this.timers[label] = Date.now();
    this.debug(`Timer started: ${label}`);
  }

  /**
   * 结束计时器
   */
  timeEnd(label) {
    if (this.timers && this.timers[label]) {
      const duration = Date.now() - this.timers[label];
      delete this.timers[label];
      this.info(`Timer ${label}: ${duration}ms`);
      return duration;
    } else {
      this.warn(`Timer ${label} not found`);
      return 0;
    }
  }

  /**
   * 记录性能信息
   */
  performance(operation, startTime, metadata = {}) {
    const duration = Date.now() - startTime;
    this.info(`Performance: ${operation} completed`, {
      duration: `${duration}ms`,
      ...metadata
    });
    return duration;
  }

  /**
   * 记录HTTP请求
   */
  httpRequest(method, url, statusCode, duration, metadata = {}) {
    const level = statusCode >= 400 ? 'WARN' : 'INFO';
    this.log(level, `HTTP ${method} ${url}`, {
      statusCode,
      duration: `${duration}ms`,
      ...metadata
    });
  }

  /**
   * 记录微信API调用
   */
  wechatAPI(api, success, duration, metadata = {}) {
    const level = success ? 'INFO' : 'ERROR';
    const status = success ? 'SUCCESS' : 'FAILED';
    this.log(level, `WeChat API ${api} ${status}`, {
      duration: `${duration}ms`,
      ...metadata
    });
  }

  /**
   * 记录用户操作
   */
  userAction(action, params = {}, result = 'SUCCESS') {
    this.info(`User Action: ${action}`, {
      result,
      params: this.sanitizeParams(params)
    });
  }

  /**
   * 清理敏感参数（如密钥等）
   */
  sanitizeParams(params) {
    const sanitized = { ...params };
    const sensitiveKeys = ['appSecret', 'password', 'token', 'secret'];
    
    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '***';
      }
    });
    
    return sanitized;
  }

  /**
   * 设置日志级别
   */
  setLogLevel(level) {
    this.logLevel = this.parseLogLevel(level);
    this.info(`Log level set to ${level}`);
  }

  /**
   * 启用/禁用颜色输出
   */
  setColorEnabled(enabled) {
    this.enableColors = enabled;
  }
}

// 创建单例实例
const logger = new Logger();

module.exports = logger; 
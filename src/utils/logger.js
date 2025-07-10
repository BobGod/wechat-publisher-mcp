/**
 * 日志工具
 * 提供统一的日志记录功能，支持不同级别的日志输出
 */

const logger = {
  info: (message, ...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  
  error: (message, error) => {
    if (error && error.stack) {
      console.error(`[ERROR] ${message}\n${error.stack}`);
    } else {
      console.error(`[ERROR] ${message}`, error || '');
    }
  },
  
  debug: (message, ...args) => {
    if (process.env.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
};

module.exports = logger; 
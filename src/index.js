#!/usr/bin/env node

/**
 * 微信公众号发布MCP服务入口文件
 * 启动MCP服务器，提供微信公众号文章发布和状态查询功能
 */

import path from 'path';
import logger from './utils/logger.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 设置进程标题
process.title = 'wechat-publisher-mcp';

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason,
    promise: promise
  });
  process.exit(1);
});

// 优雅退出处理
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// 启动服务器
async function main() {
  try {
    const packageJson = JSON.parse(readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
    logger.info('Starting WeChat Publisher MCP Service...', {
      version: packageJson.version,
      nodeVersion: process.version,
      platform: process.platform
    });

    // 导入并启动服务器
    const { default: WeChatMCPServer } = await import('./server.js');
    const server = new WeChatMCPServer();
    
    await server.start();
    
    logger.info('WeChat Publisher MCP Service started successfully');
    
    // 保持进程运行
    process.stdin.resume();
    
  } catch (error) {
    logger.error('Failed to start WeChat Publisher MCP Service', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// 如果是直接执行此文件，则启动服务
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
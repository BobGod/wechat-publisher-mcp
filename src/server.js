#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { z } from 'zod';
import WeChatPublisher from './tools/wechat-publisher.js';
import WeChatStatus from './tools/wechat-status.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 简单的日志函数
const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg, error) => console.error(`[ERROR] ${msg}`, error || ''),
  debug: (msg, data) => process.env.DEBUG && console.log(`[DEBUG] ${msg}`, data || '')
};

// 创建MCP服务器
const server = new McpServer({
  name: "wechat-publisher-mcp",
  version: "1.0.0"
});

// 注册微信发布工具
server.registerTool(
  "wechat_publish_article",
  {
    title: "微信公众号发布工具",
    description: "将文章发布到微信公众号，支持Markdown格式",
    inputSchema: {
      title: z.string().describe("文章标题"),
      content: z.string().describe("Markdown格式的文章内容"),
      author: z.string().describe("作者名称"),
      appId: z.string().describe("微信公众号AppID"),
      appSecret: z.string().describe("微信公众号AppSecret"),
      coverImagePath: z.string().optional().describe("封面图片路径"),
      previewMode: z.boolean().optional().default(false).describe("是否为预览模式"),
      previewOpenId: z.string().optional().describe("预览用户OpenID")
    }
  },
  async (params) => {
    const { title, content, author, appId, appSecret, coverImagePath, previewMode, previewOpenId } = params;
    logger.info(`Publishing article: ${title}`);
    
    try {
      // 调用实际的发布逻辑
      const result = await WeChatPublisher.publish({
        title,
        content,
        author,
        appId,
        appSecret,
        coverImagePath,
        previewMode,
        previewOpenId
      });
      
      return result;
    } catch (error) {
      logger.error(`发布失败: ${error.message}`);
      return {
        content: [{
          type: "text",
          text: `❌ 发布失败: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// 注册状态查询工具
server.registerTool(
  "wechat_query_status",
  {
    title: "微信文章状态查询",
    description: "查询文章发布状态和统计数据",
    inputSchema: {
      msgId: z.string().describe("消息ID"),
      appId: z.string().describe("微信公众号AppID"),
      appSecret: z.string().describe("微信公众号AppSecret")
    }
  },
  async (params) => {
    const { msgId, appId, appSecret } = params;
    logger.info(`Querying status for message: ${msgId}`);
    
    try {
      // 调用实际的查询逻辑
      const result = await WeChatStatus.query({
        msgId,
        appId,
        appSecret
      });
      
      return result;
    } catch (error) {
      logger.error(`查询失败: ${error.message}`);
      return {
        content: [{
          type: "text",
          text: `❌ 查询失败: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

logger.info('WeChat Publisher MCP Server initialized');

// 启动服务器函数
async function startServer() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info('WeChat Publisher MCP Server connected via stdio');
    return server;
  } catch (error) {
    logger.error('Failed to start server', error);
    throw error;
  }
}

// Start server if running directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer().catch(error => {
    logger.error('Failed to start server', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down...');
    process.exit(0);
  });
}

// 包装类
class WeChatMCPServer {
  constructor() {
    this.server = server;
  }
  
  async start() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      logger.info('WeChat Publisher MCP Server connected via stdio');
      return this.server;
    } catch (error) {
      logger.error('Failed to start server', error);
      throw error;
    }
  }
}

export default WeChatMCPServer;
#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const express = require('express');
const logger = require('./utils/logger.js');
const WeChatPublisher = require('./tools/wechat-publisher.js');
const WeChatStatus = require('./tools/wechat-status.js');

class WeChatMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "wechat-publisher-mcp",
        version: "1.0.0"
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );
    
    this.setupTools();
    logger.info('WeChat Publisher MCP Server initialized');
  }

  setupTools() {
    // Register WeChat publishing tools
    const publisher = new WeChatPublisher();
    const status = new WeChatStatus();

    this.server.addTool({
      name: 'wechat_publish_article',
      description: '将文章发布到微信公众号，支持Markdown格式',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: '文章标题'
          },
          content: {
            type: 'string',
            description: 'Markdown格式的文章内容'
          },
          author: {
            type: 'string',
            description: '作者名称'
          },
          cover_image_path: {
            type: 'string',
            description: '封面图片路径',
            optional: true
          },
          is_preview: {
            type: 'boolean',
            description: '是否为预览模式',
            default: false
          }
        },
        required: ['title', 'content', 'author']
      },
      handler: publisher.publish.bind(publisher)
    });

    this.server.addTool({
      name: 'wechat_query_status',
      description: '查询文章发布状态',
      parameters: {
        type: 'object',
        properties: {
          article_id: {
            type: 'string',
            description: '文章ID'
          }
        },
        required: ['article_id']
      },
      handler: status.query.bind(status)
    });
  }

  async startStdio() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      logger.info('WeChat Publisher MCP Server connected via stdio');
      return this.server;
    } catch (error) {
      logger.error('Failed to start stdio server', error);
      throw error;
    }
  }

  async startHttp(port = 3000, host = 'localhost') {
    try {
      const app = express();
      app.use(express.json());

      // Health check endpoint
      app.get('/health', (req, res) => {
        res.json({ 
          status: 'ok',
          name: this.server.name,
          version: this.server.version
        });
      });

      const transport = new StreamableHTTPServerTransport({
        app,
        path: '/mcp',
        cors: true
      });

      await this.server.connect(transport);
      
      const server = app.listen(port, host, () => {
        logger.info(`WeChat Publisher MCP Server listening at http://${host}:${port}`);
      });

      return server;
    } catch (error) {
      logger.error('Failed to start HTTP server', error);
      throw error;
    }
  }

  async start(options = {}) {
    const { transport = 'stdio', port, host } = options;

    switch (transport) {
      case 'stdio':
        return this.startStdio();
      case 'http':
        return this.startHttp(port, host);
      default:
        throw new Error(`Unsupported transport: ${transport}`);
    }
  }
}

// Export the server class
module.exports = WeChatMCPServer;

// Start server if running directly
if (require.main === module) {
  const server = new WeChatMCPServer();
  const transport = process.env.MCP_TRANSPORT || 'stdio';
  const port = parseInt(process.env.MCP_PORT || '3000', 10);
  const host = process.env.MCP_HOST || 'localhost';

  server.start({ transport, port, host }).catch(error => {
    logger.error('Failed to start server', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down...');
    process.exit(0);
  });
} 
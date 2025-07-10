#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const WeChatPublisher = require('./tools/wechat-publisher.js');
const WeChatStatus = require('./tools/wechat-status.js');
const logger = require('./utils/logger.js');

/**
 * 微信公众号发布MCP服务器
 * 提供标准MCP协议接口，支持任何AI工具调用
 */
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
    
    this.setupHandlers();
    logger.info('WeChat Publisher MCP Server initialized');
  }

  /**
   * 设置MCP请求处理程序
   */
  setupHandlers() {
    // 工具列表处理程序
    this.server.setRequestHandler({
      method: 'tools/list'
    }, async () => {
      return {
        tools: [
          {
            name: "wechat_publish_article",
            description: "发布或预览文章到微信公众号。支持Markdown自动转换、封面图上传、预览模式等功能。",
            inputSchema: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "文章标题（最大64字符）",
                  maxLength: 64
                },
                content: {
                  type: "string", 
                  description: "文章内容（Markdown格式，最大200,000字符）",
                  maxLength: 200000
                },
                author: {
                  type: "string",
                  description: "作者名称（最大8字符）",
                  maxLength: 8
                },
                appId: {
                  type: "string",
                  description: "微信公众号AppID（以wx开头的18位字符串）",
                  pattern: "^wx[a-zA-Z0-9]{16}$"
                },
                appSecret: {
                  type: "string", 
                  description: "微信公众号AppSecret（32位字符串）",
                  minLength: 32,
                  maxLength: 32
                },
                coverImagePath: {
                  type: "string",
                  description: "封面图片路径（支持PNG、JPG、JPEG格式，小于1MB）"
                },
                previewMode: {
                  type: "boolean",
                  description: "是否为预览模式（默认false）",
                  default: false
                },
                previewOpenId: {
                  type: "string",
                  description: "预览用户的OpenID（预览模式下必需）"
                }
              },
              required: ["title", "content", "appId", "appSecret"],
              additionalProperties: false
            }
          },
          {
            name: "wechat_query_status",
            description: "查询微信公众号文章发布状态和统计数据。",
            inputSchema: {
              type: "object", 
              properties: {
                msgId: {
                  type: "string",
                  description: "消息ID（发布时返回的msgId）",
                  pattern: "^\\d+$"
                },
                appId: {
                  type: "string",
                  description: "微信公众号AppID（以wx开头的18位字符串）",
                  pattern: "^wx[a-zA-Z0-9]{16}$"
                },
                appSecret: {
                  type: "string",
                  description: "微信公众号AppSecret（32位字符串）",
                  minLength: 32,
                  maxLength: 32
                }
              },
              required: ["msgId", "appId", "appSecret"],
              additionalProperties: false
            }
          }
        ]
      };
    });

    // 工具调用处理程序
    this.server.setRequestHandler({
      method: 'tools/call'
    }, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        logger.info(`Tool call: ${name}`, { args: logger.sanitizeParams(args) });
        
        switch (name) {
          case 'wechat_publish_article':
            return await WeChatPublisher.publish(args);
            
          case 'wechat_query_status':
            return await WeChatStatus.query(args);
            
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        logger.error(`Tool call failed: ${name}`, {
          error: error.message,
          stack: error.stack
        });
        
        return {
          content: [{
            type: "text",
            text: `❌ 工具调用失败: ${error.message}`
          }],
          isError: true
        };
      }
    });

    logger.debug('MCP handlers setup completed');
  }

  /**
   * 启动MCP服务器
   */
  async start() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      logger.info('WeChat Publisher MCP Server connected and ready');
      return this.server;
    } catch (error) {
      logger.error('Failed to start MCP server', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * 停止MCP服务器
   */
  async stop() {
    try {
      await this.server.close();
      logger.info('WeChat Publisher MCP Server stopped');
    } catch (error) {
      logger.error('Error stopping MCP server', {
        error: error.message
      });
      throw error;
    }
  }
}

// 如果直接运行此文件，启动服务器
if (require.main === module) {
  const server = new WeChatMCPServer();
  
  server.start().catch(error => {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  });
  
  // 优雅退出处理
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down...');
    try {
      await server.stop();
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error: error.message });
      process.exit(1);
    }
  });
}

module.exports = WeChatMCPServer; 
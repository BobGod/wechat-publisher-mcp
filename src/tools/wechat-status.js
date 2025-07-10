const WeChatAPI = require('../services/WeChatAPI.js');
const { validateStatusParams } = require('../utils/validator.js');
const logger = require('../utils/logger.js');

/**
 * 微信公众号状态查询工具
 * 提供文章发布状态查询、数据统计等功能
 */
class WeChatStatus {
  /**
   * 查询微信公众号文章状态
   * @param {Object} params 查询参数
   * @returns {Object} MCP格式的响应结果
   */
  static async query(params) {
    const startTime = Date.now();
    
    try {
      logger.info('开始查询状态', { msgId: params.msgId });
      
      // 1. 参数验证
      const validation = validateStatusParams(params);
      if (!validation.valid) {
        throw new Error(`参数验证失败: ${validation.errors.join(', ')}`);
      }

      const { msgId, appId, appSecret } = params;

      // 2. 初始化微信API
      logger.debug('初始化微信API');
      const wechatAPI = new WeChatAPI(appId, appSecret);

      // 3. 查询发布状态
      logger.debug('查询发布状态', { msgId });
      const statusData = await wechatAPI.getPublishStatus(msgId);

      const executionTime = Date.now() - startTime;
      logger.info('状态查询成功', { 
        ...statusData, 
        executionTime: `${executionTime}ms` 
      });

      // 4. 构建成功响应
      const successMessage = this.buildStatusMessage(statusData, executionTime);

      return {
        content: [{
          type: "text",
          text: successMessage
        }]
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('状态查询失败', {
        error: error.message,
        executionTime: `${executionTime}ms`,
        stack: error.stack
      });
      
      return {
        content: [{
          type: "text",
          text: this.buildErrorMessage(error)
        }],
        isError: true
      };
    }
  }

  /**
   * 构建状态响应消息
   */
  static buildStatusMessage(statusData, executionTime) {
    let message = `📊 微信公众号文章状态查询\n\n`;
    
    // 基本信息
    if (statusData.article_id) {
      message += `🆔 文章ID: ${statusData.article_id}\n`;
    }
    
    if (statusData.article_detail) {
      const detail = statusData.article_detail;
      message += `📱 标题: ${detail.title || '未知'}\n`;
      message += `👤 作者: ${detail.author || '未知'}\n`;
      message += `📅 发布时间: ${this.formatTimestamp(detail.publish_time)}\n`;
    }
    
    // 发布状态
    if (statusData.publish_status !== undefined) {
      const statusText = this.getStatusText(statusData.publish_status);
      message += `📈 发布状态: ${statusText}\n`;
    }
    
    // 统计数据
    if (statusData.article_detail && statusData.article_detail.stat_info) {
      const stat = statusData.article_detail.stat_info;
      message += `\n📊 数据统计:\n`;
      message += `👀 阅读量: ${stat.read_num || 0}\n`;
      message += `👍 点赞数: ${stat.like_num || 0}\n`;
      message += `💬 评论数: ${stat.comment_num || 0}\n`;
      message += `📤 分享数: ${stat.share_num || 0}\n`;
    }
    
    // 链接信息
    if (statusData.article_detail && statusData.article_detail.url) {
      message += `🔗 文章链接: ${statusData.article_detail.url}\n`;
    }
    
    message += `⏱️ 查询时间: ${executionTime}ms\n`;
    message += `\n✅ 状态查询完成！数据已为您整理如上。`;
    
    return message;
  }

  /**
   * 构建错误响应消息
   */
  static buildErrorMessage(error) {
    let message = `❌ 状态查询失败: ${error.message}\n\n`;
    
    // 常见错误的解决建议
    if (error.message.includes('access_token')) {
      message += `🔑 认证问题:\n`;
      message += `• 检查AppID和AppSecret是否正确\n`;
      message += `• 确认公众号权限是否足够\n\n`;
    }
    
    if (error.message.includes('msgId') || error.message.includes('not found')) {
      message += `🔍 消息ID问题:\n`;
      message += `• 检查提供的msgId是否正确\n`;
      message += `• 确认消息是否确实存在\n`;
      message += `• 只能查询最近的发布记录\n\n`;
    }
    
    message += `💡 解决建议:\n`;
    message += `• 确认msgId来自发布成功的返回结果\n`;
    message += `• 检查网络连接是否正常\n`;
    message += `• 如果是新发布的文章，请稍等几分钟后重试\n`;
    message += `• 确保查询的是本公众号发布的文章`;
    
    return message;
  }

  /**
   * 获取状态文本
   */
  static getStatusText(status) {
    const statusMap = {
      0: '🟡 发布中',
      1: '🟢 发布成功',
      2: '🔴 发布失败',
      3: '🟠 审核中',
      4: '🔴 审核失败'
    };
    
    return statusMap[status] || `🤔 未知状态(${status})`;
  }

  /**
   * 格式化时间戳
   */
  static formatTimestamp(timestamp) {
    if (!timestamp) return '未知';
    
    try {
      const date = new Date(timestamp * 1000);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return '时间格式错误';
    }
  }
}

module.exports = WeChatStatus; 
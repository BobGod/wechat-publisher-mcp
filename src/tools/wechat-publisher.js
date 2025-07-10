import WeChatAPI from '../services/WeChatAPI.js';
import MarkdownConverter from '../services/MarkdownConverter.js';
import { validatePublishParams } from '../utils/validator.js';
import logger from '../utils/logger.js';

/**
 * 微信公众号发布工具
 * 提供文章发布的核心功能，包括Markdown转换、图片上传、文章发布等
 */
class WeChatPublisher {
  /**
   * 发布文章到微信公众号
   * @param {Object} params 发布参数
   * @returns {Object} MCP格式的响应结果
   */
  static async publish(params) {
    const startTime = Date.now();
    
    try {
      logger.info('开始发布流程', { title: params.title });
      
      // 1. 参数验证
      const validation = validatePublishParams(params);
      if (!validation.valid) {
        throw new Error(`参数验证失败: ${validation.errors.join(', ')}`);
      }

      const {
        title,
        content, 
        author,
        appId,
        appSecret,
        coverImagePath,
        previewMode = false,
        previewOpenId
      } = params;

      // 2. 初始化微信API
      logger.debug('初始化微信API');
      const wechatAPI = new WeChatAPI(appId, appSecret);

      // 3. 转换Markdown为微信HTML
      logger.debug('转换Markdown内容');
      const htmlContent = MarkdownConverter.convertToWeChatHTML(content);
      logger.debug('Markdown转换完成', { 
        originalLength: content.length, 
        htmlLength: htmlContent.length 
      });

      // 4. 处理封面图 - 如果没有提供封面图，则自动生成
      let thumbMediaId = null;
      let coverPath = coverImagePath;
      
      if (!coverPath) {
        // 自动生成封面图
        logger.info('未提供封面图，正在根据文章内容自动生成封面图...');
        coverPath = await WeChatPublisher.generateCoverImage(title, content);
      }
      
      if (coverPath) {
        try {
          logger.debug('开始上传封面图', { path: coverPath });
          thumbMediaId = await wechatAPI.uploadCoverImage(coverPath);
          logger.info('封面图上传成功', { mediaId: thumbMediaId });
          
          // 如果是自动生成的封面图，上传后删除临时文件
          if (!coverImagePath && coverPath) {
            try {
              const fs = await import('fs/promises');
              await fs.unlink(coverPath);
              logger.debug('临时封面图文件已清理', { coverPath });
            } catch (cleanupError) {
              logger.warn('清理临时封面图文件失败', { error: cleanupError.message });
            }
          }
        } catch (error) {
          logger.warn('封面图上传失败，将继续发布', { error: error.message });
          // 不抛出错误，继续发布流程
        }
      }

      // 5. 发布或预览文章
      let result;
      if (previewMode) {
        if (!previewOpenId) {
          throw new Error('预览模式需要提供previewOpenId参数');
        }
        
        logger.debug('开始预览文章', { previewOpenId });
        result = await wechatAPI.previewArticle({
          title,
          content: htmlContent,
          author,
          thumbMediaId,
          previewOpenId
        });
        
      } else {
        logger.debug('开始正式发布文章');
        result = await wechatAPI.publishArticle({
          title,
          content: htmlContent, 
          author,
          thumbMediaId
        });
      }

      const executionTime = Date.now() - startTime;
      logger.info(`文章${previewMode ? '预览' : '发布'}成功`, { 
        ...result, 
        executionTime: `${executionTime}ms` 
      });

      // 6. 构建成功响应
      const successMessage = this.buildSuccessMessage({
        title,
        author,
        result,
        previewMode,
        executionTime,
        thumbMediaId
      });

      return {
        content: [{
          type: "text",
          text: successMessage
        }]
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('发布流程失败', {
        error: error.message,
        executionTime: `${executionTime}ms`,
        stack: error.stack
      });
      
      return {
        content: [{
          type: "text",
          text: this.buildErrorMessage(error, params)
        }],
        isError: true
      };
    }
  }

  /**
   * 构建成功响应消息
   */
  static buildSuccessMessage({ title, author, result, previewMode, executionTime, thumbMediaId }) {
    const mode = previewMode ? '预览' : '发布';
    const icon = previewMode ? '👀' : '✅';
    
    let message = `${icon} 文章${mode}成功！\n\n`;
    message += `📱 标题: ${title}\n`;
    message += `👤 作者: ${author}\n`;
    
    if (result.articleUrl) {
      message += `🔗 链接: ${result.articleUrl}\n`;
    }
    
    if (result.publishId) {
      message += `📊 发布ID: ${result.publishId}\n`;
    }
    
    if (result.msgId) {
      message += `📨 消息ID: ${result.msgId}\n`;
    }
    
    if (thumbMediaId) {
      message += `🖼️ 封面图: 已上传\n`;
    }
    
    message += `⏱️ 处理时间: ${executionTime}ms\n`;
    
    if (!previewMode) {
      message += `\n🎉 您的文章已成功发布到微信公众号！读者可以在公众号中看到这篇文章。`;
    } else {
      message += `\n👀 预览已发送到指定用户，请检查微信查看效果。`;
    }
    
    return message;
  }

  /**
   * 根据文章内容自动生成封面图
   * @param {string} title 文章标题
   * @param {string} content 文章内容
   * @returns {Promise<string>} 生成的封面图路径
   */
  static async generateCoverImage(title, content) {
    try {
      const path = await import('path');
      const fs = await import('fs/promises');
      
      // 提取文章关键信息
      const cleanTitle = title.replace(/[#*`]/g, '').trim();
      const shortTitle = cleanTitle.length > 20 ? cleanTitle.substring(0, 20) + '...' : cleanTitle;
      
      // 从内容中提取关键词或副标题
      const contentLines = content.split('\n').filter(line => line.trim());
      let subtitle = '';
      for (const line of contentLines) {
        const cleanLine = line.replace(/[#*`<>]/g, '').trim();
        if (cleanLine.length > 10 && cleanLine.length < 50 && !cleanLine.includes('http')) {
          subtitle = cleanLine;
          break;
        }
      }
      
      if (!subtitle) {
        subtitle = '精彩内容，值得一读';
      }
      
      // 选择背景颜色（根据标题内容智能选择）
      const colors = [
        { bg: '#3498db', text: '#ffffff', accent: '#2980b9' }, // 蓝色主题
        { bg: '#e74c3c', text: '#ffffff', accent: '#c0392b' }, // 红色主题
        { bg: '#2ecc71', text: '#ffffff', accent: '#27ae60' }, // 绿色主题
        { bg: '#9b59b6', text: '#ffffff', accent: '#8e44ad' }, // 紫色主题
        { bg: '#f39c12', text: '#ffffff', accent: '#e67e22' }, // 橙色主题
        { bg: '#1abc9c', text: '#ffffff', accent: '#16a085' }, // 青色主题
      ];
      
      // 根据标题内容选择颜色
      let colorIndex = 0;
      if (title.includes('AI') || title.includes('技术')) colorIndex = 0;
      else if (title.includes('重要') || title.includes('紧急')) colorIndex = 1;
      else if (title.includes('成功') || title.includes('增长')) colorIndex = 2;
      else if (title.includes('创新') || title.includes('未来')) colorIndex = 3;
      else if (title.includes('警告') || title.includes('注意')) colorIndex = 4;
      else colorIndex = Math.floor(Math.random() * colors.length);
      
      const theme = colors[colorIndex];
      
      // 创建Canvas并生成PNG图片
      const timestamp = Date.now();
      const coverPath = path.default.join(process.cwd(), `auto-cover-${timestamp}.png`);
      
      // 使用Canvas API生成PNG图片
      await WeChatPublisher.createPngCover({
        title: shortTitle,
        subtitle: subtitle.substring(0, 30),
        theme,
        outputPath: coverPath
      });
      
      // 检查文件大小
      const stats = await fs.stat(coverPath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      
      if (fileSizeInMB > 1) {
        logger.warn('生成的封面图超过1MB，尝试压缩', { size: `${fileSizeInMB.toFixed(2)}MB` });
        // 如果文件过大，可以在这里添加压缩逻辑
      }
      
      logger.info('自动生成封面图成功', { 
        coverPath, 
        title: shortTitle, 
        size: `${fileSizeInMB.toFixed(2)}MB` 
      });
      return coverPath;
      
    } catch (error) {
      logger.error('自动生成封面图失败', { error: error.message });
      throw new Error(`自动生成封面图失败: ${error.message}`);
    }
  }
  
  /**
   * 创建PNG格式的封面图
   * @param {Object} options 封面图选项
   */
  static async createPngCover({ title, subtitle, theme, outputPath }) {
    try {
      // 尝试使用node-canvas创建PNG图片
      let Canvas, createCanvas;
      try {
        const canvas = await import('canvas');
        Canvas = canvas.default;
        createCanvas = canvas.createCanvas;
      } catch (canvasError) {
        // 如果没有安装canvas，回退到创建简单的SVG文件
        logger.warn('Canvas模块未安装，回退到SVG格式');
        return await WeChatPublisher.createSvgCover({ title, subtitle, theme, outputPath });
      }
      
      const width = 900;
      const height = 500;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      
      // 创建渐变背景
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, theme.bg);
      gradient.addColorStop(1, theme.accent);
      
      // 绘制背景
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // 绘制装饰圆形
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.arc(750, 100, 80, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(150, 400, 60, 0, 2 * Math.PI);
      ctx.fill();
      
      // 绘制主标题
      ctx.fillStyle = theme.text;
      ctx.font = 'bold 48px "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(title, width / 2, 200);
      
      // 绘制副标题
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '24px "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
      ctx.fillText(subtitle, width / 2, 280);
      
      // 绘制装饰线
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillRect(300, 348, 300, 4);
      
      // 绘制品牌标识
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '18px "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
      ctx.fillText('AI智能内容创作', width / 2, 420);
      
      // 保存为PNG文件
      const fs = await import('fs/promises');
      const buffer = canvas.toBuffer('image/png');
      await fs.writeFile(outputPath, buffer);
      
    } catch (error) {
      logger.error('创建PNG封面图失败，回退到SVG', { error: error.message });
      // 回退到SVG格式
      await WeChatPublisher.createSvgCover({ title, subtitle, theme, outputPath });
    }
  }
  
  /**
   * 创建SVG格式的封面图（回退方案）
   * @param {Object} options 封面图选项
   */
  static async createSvgCover({ title, subtitle, theme, outputPath }) {
    const svgContent = `<svg width="900" height="500" xmlns="http://www.w3.org/2000/svg">
  <!-- 背景渐变 -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${theme.bg};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${theme.accent};stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
  </defs>
  
  <!-- 背景 -->
  <rect width="100%" height="100%" fill="url(#bgGradient)"/>
  
  <!-- 装饰性几何图形 -->
  <circle cx="750" cy="100" r="80" fill="rgba(255,255,255,0.1)"/>
  <circle cx="150" cy="400" r="60" fill="rgba(255,255,255,0.1)"/>
  <polygon points="800,350 850,400 800,450 750,400" fill="rgba(255,255,255,0.1)"/>
  
  <!-- 主标题 -->
  <text x="450" y="200" font-family="PingFang SC, Microsoft YaHei, Arial, sans-serif" 
        font-size="48" font-weight="bold" fill="${theme.text}" 
        text-anchor="middle" dominant-baseline="middle" filter="url(#shadow)">
    ${WeChatPublisher.escapeXml(title)}
  </text>
  
  <!-- 副标题 -->
  <text x="450" y="280" font-family="PingFang SC, Microsoft YaHei, Arial, sans-serif" 
        font-size="24" fill="rgba(255,255,255,0.9)" 
        text-anchor="middle" dominant-baseline="middle">
    ${WeChatPublisher.escapeXml(subtitle)}
  </text>
  
  <!-- 底部装饰线 -->
  <rect x="300" y="350" width="300" height="4" fill="rgba(255,255,255,0.8)" rx="2"/>
  
  <!-- 品牌标识区域 -->
  <text x="450" y="420" font-family="PingFang SC, Microsoft YaHei, Arial, sans-serif" 
        font-size="18" fill="rgba(255,255,255,0.7)" 
        text-anchor="middle" dominant-baseline="middle">
    AI智能内容创作
  </text>
</svg>`;
    
    // 修改输出路径为SVG格式
    const svgPath = outputPath.replace(/\.png$/, '.svg');
    const fs = await import('fs/promises');
    await fs.writeFile(svgPath, svgContent, 'utf8');
    
    // 返回实际的文件路径
    return svgPath;
  }
  
  /**
   * XML字符转义
   * @param {string} text 需要转义的文本
   * @returns {string} 转义后的文本
   */
  static escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * 构建错误响应消息
   */
  static buildErrorMessage(error, params) {
    let message = `❌ 发布失败: ${error.message}\n\n`;
    
    // 常见错误的解决建议
    if (error.message.includes('access_token')) {
      message += `🔑 AppID/AppSecret问题:\n`;
      message += `• 检查微信公众号AppID和AppSecret是否正确\n`;
      message += `• 确认公众号类型是否支持发布接口\n`;
      message += `• 验证公众号是否已认证\n\n`;
    }
    
    if (error.message.includes('ip')) {
      message += `🌐 IP白名单问题:\n`;
      message += `• 将服务器IP添加到微信公众平台的IP白名单\n`;
      message += `• 登录微信公众平台 -> 开发 -> 基本配置 -> IP白名单\n\n`;
    }
    
    if (error.message.includes('media') || error.message.includes('图')) {
      message += `🖼️ 封面图问题:\n`;
      message += `• 检查图片路径是否正确\n`;
      message += `• 确认图片格式为PNG、JPG或JPEG\n`;
      message += `• 验证图片大小不超过1MB\n\n`;
    }
    
    message += `💡 通用解决方案:\n`;
    message += `• 检查网络连接是否正常\n`;
    message += `• 确认所有必需参数都已提供\n`;
    message += `• 查看微信公众平台是否有维护通知\n`;
    message += `• 如问题持续，请联系技术支持`;
    
    return message;
  }
}

export default WeChatPublisher;
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger.js');

/**
 * 微信公众号API服务
 * 封装微信公众平台的API调用，包括access_token管理、图片上传、文章发布等
 */
class WeChatAPI {
  constructor(appId, appSecret) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.accessToken = null;
    this.tokenExpireTime = 0;
    
    logger.debug('WeChatAPI initialized', { appId });
  }

  /**
   * 获取访问令牌(Access Token)
   * 自动处理token缓存和刷新
   * @returns {Promise<string>} Access Token
   */
  async getAccessToken() {
    const now = Date.now();
    
    // 如果token还没过期，直接返回缓存的token
    if (this.accessToken && now < this.tokenExpireTime) {
      logger.debug('使用缓存的access_token');
      return this.accessToken;
    }

    try {
      logger.debug('获取新的access_token');
      const response = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
        params: {
          grant_type: 'client_credential',
          appid: this.appId,
          secret: this.appSecret
        },
        timeout: 10000
      });

      if (response.data.access_token) {
        this.accessToken = response.data.access_token;
        // 提前60秒过期，避免边界情况
        this.tokenExpireTime = now + (response.data.expires_in - 60) * 1000;
        
        logger.info('access_token获取成功', { 
          expiresIn: response.data.expires_in 
        });
        
        return this.accessToken;
      } else {
        throw new Error(`获取Access Token失败: ${response.data.errmsg || '未知错误'}`);
      }
    } catch (error) {
      if (error.response) {
        const errorData = error.response.data;
        throw new Error(`Access Token请求失败: ${errorData.errmsg || error.message}`);
      } else {
        throw new Error(`Access Token网络请求失败: ${error.message}`);
      }
    }
  }

  /**
   * 上传封面图片
   * @param {string} imagePath 图片文件路径
   * @returns {Promise<string>} 媒体ID
   */
  async uploadCoverImage(imagePath) {
    const accessToken = await this.getAccessToken();
    
    try {
      // 检查文件是否存在
      const stats = await fs.stat(imagePath);
      if (!stats.isFile()) {
        throw new Error('指定路径不是有效文件');
      }
      
      // 检查文件大小（微信要求缩略图不超过64KB，这里放宽到1MB）
      if (stats.size > 1024 * 1024) {
        throw new Error('图片文件过大，请使用小于1MB的图片');
      }
      
      // 读取图片文件
      const imageBuffer = await fs.readFile(imagePath);
      const formData = new FormData();
      
      // 根据文件扩展名确定Content-Type
      const ext = path.extname(imagePath).toLowerCase();
      let contentType = 'image/jpeg';
      if (ext === '.png') contentType = 'image/png';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.webp') contentType = 'image/webp';
      
      formData.append('media', imageBuffer, {
        filename: path.basename(imagePath),
        contentType: contentType
      });

      logger.debug('开始上传封面图', { 
        path: imagePath, 
        size: stats.size, 
        contentType 
      });

      const response = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=thumb`,
        formData,
        { 
          headers: formData.getHeaders(),
          timeout: 30000
        }
      );

      if (response.data.media_id) {
        logger.info('封面图上传成功', { 
          mediaId: response.data.media_id,
          url: response.data.url
        });
        return response.data.media_id;
      } else {
        throw new Error(`封面图上传失败: ${response.data.errmsg || '未知错误'}`);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`图片文件不存在: ${imagePath}`);
      } else if (error.response) {
        const errorData = error.response.data;
        throw new Error(`封面图上传失败: ${errorData.errmsg || error.message}`);
      } else {
        throw new Error(`封面图上传请求失败: ${error.message}`);
      }
    }
  }

  /**
   * 发布文章（使用草稿+发布流程）
   * @param {Object} options 发布选项
   * @returns {Promise<Object>} 发布结果
   */
  async publishArticle({ title, content, author, thumbMediaId }) {
    const accessToken = await this.getAccessToken();
    
    try {
      logger.debug('开始创建草稿');
      
      // 1. 创建草稿
      const draftData = {
        articles: [{
          title,
          author: author || '',
          digest: this.extractDigest(content),
          content,
          content_source_url: '',
          need_open_comment: 0,
          only_fans_can_comment: 0,
          ...(thumbMediaId ? { thumb_media_id: thumbMediaId } : {})
        }]
      };

      const draftResponse = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`,
        draftData,
        { timeout: 30000 }
      );

      if (draftResponse.data.errcode && draftResponse.data.errcode !== 0) {
        throw new Error(`创建草稿失败: ${draftResponse.data.errmsg}`);
      }

      const mediaId = draftResponse.data.media_id;
      logger.info('草稿创建成功', { mediaId });

      // 2. 发布草稿
      logger.debug('开始发布草稿');
      
      const publishResponse = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${accessToken}`,
        { media_id: mediaId },
        { timeout: 30000 }
      );

      if (publishResponse.data.errcode && publishResponse.data.errcode !== 0) {
        throw new Error(`发布文章失败: ${publishResponse.data.errmsg}`);
      }

      const publishId = publishResponse.data.publish_id;
      const msgId = publishResponse.data.msg_id;
      
      // 生成文章URL（微信公众号URL格式）
      const articleUrl = `https://mp.weixin.qq.com/s?__biz=${this.appId.replace('wx', '')}&mid=${publishId}`;

      logger.info('文章发布成功', { publishId, msgId, articleUrl });

      return {
        success: true,
        publishId,
        msgId,
        articleUrl,
        mediaId
      };

    } catch (error) {
      if (error.response) {
        const errorData = error.response.data;
        throw new Error(`发布文章失败: ${errorData.errmsg || error.message}`);
      } else {
        throw new Error(`发布文章请求失败: ${error.message}`);
      }
    }
  }

  /**
   * 预览文章
   * @param {Object} options 预览选项
   * @returns {Promise<Object>} 预览结果
   */
  async previewArticle({ title, content, author, thumbMediaId, previewOpenId }) {
    try {
      // 先创建图文消息素材
      const mediaId = await this.createNewsMedia({ title, content, author, thumbMediaId });
      
      const accessToken = await this.getAccessToken();
      
      const previewData = {
        touser: previewOpenId,
        mpnews: { media_id: mediaId },
        msgtype: 'mpnews'
      };

      logger.debug('发送预览消息', { previewOpenId, mediaId });

      const response = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/message/mass/preview?access_token=${accessToken}`,
        previewData,
        { timeout: 30000 }
      );

      if (response.data.errcode === 0) {
        logger.info('文章预览发送成功', { msgId: response.data.msg_id });
        return {
          success: true,
          msgId: response.data.msg_id,
          mediaId
        };
      } else {
        throw new Error(`文章预览失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      if (error.response) {
        const errorData = error.response.data;
        throw new Error(`文章预览失败: ${errorData.errmsg || error.message}`);
      } else {
        throw new Error(`文章预览请求失败: ${error.message}`);
      }
    }
  }

  /**
   * 创建图文消息素材（用于预览）
   * @param {Object} options 图文消息选项
   * @returns {Promise<string>} 媒体ID
   */
  async createNewsMedia({ title, content, author, thumbMediaId }) {
    const accessToken = await this.getAccessToken();
    
    try {
      const newsData = {
        articles: [{
          title,
          author: author || '',
          digest: this.extractDigest(content),
          content,
          content_source_url: '',
          show_cover_pic: thumbMediaId ? 1 : 0,
          ...(thumbMediaId ? { thumb_media_id: thumbMediaId } : {})
        }]
      };

      const response = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/media/uploadnews?access_token=${accessToken}`,
        newsData,
        { timeout: 30000 }
      );

      if (response.data.media_id) {
        return response.data.media_id;
      } else {
        throw new Error(`创建图文消息失败: ${response.data.errmsg || '未知错误'}`);
      }
    } catch (error) {
      if (error.response) {
        const errorData = error.response.data;
        throw new Error(`创建图文消息失败: ${errorData.errmsg || error.message}`);
      } else {
        throw new Error(`创建图文消息请求失败: ${error.message}`);
      }
    }
  }

  /**
   * 查询发布状态
   * @param {string} publishId 发布ID
   * @returns {Promise<Object>} 状态信息
   */
  async getPublishStatus(publishId) {
    const accessToken = await this.getAccessToken();
    
    try {
      const response = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/freepublish/get?access_token=${accessToken}`,
        { publish_id: publishId },
        { timeout: 10000 }
      );

      if (response.data.errcode === 0) {
        return response.data;
      } else {
        throw new Error(`查询发布状态失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      if (error.response) {
        const errorData = error.response.data;
        throw new Error(`查询发布状态失败: ${errorData.errmsg || error.message}`);
      } else {
        throw new Error(`查询发布状态请求失败: ${error.message}`);
      }
    }
  }

  /**
   * 从内容中提取摘要
   * @param {string} content 文章内容
   * @returns {string} 摘要
   */
  extractDigest(content) {
    // 移除Markdown标记和HTML标签
    let digest = content
      .replace(/[#*`]/g, '')        // 移除Markdown标记
      .replace(/<[^>]*>/g, '')      // 移除HTML标签
      .replace(/\n+/g, ' ')         // 替换换行为空格
      .trim();
    
    // 截取前120个字符作为摘要
    if (digest.length > 120) {
      digest = digest.substring(0, 120) + '...';
    }
    
    return digest;
  }
}

module.exports = WeChatAPI; 
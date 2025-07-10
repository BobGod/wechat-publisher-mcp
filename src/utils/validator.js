/**
 * 参数验证工具
 * 提供发布和状态查询参数的验证功能
 */

/**
 * 验证发布参数
 * @param {Object} params 发布参数
 * @returns {Object} 验证结果
 */
function validatePublishParams(params) {
  const errors = [];
  
  // 必需参数检查
  if (!params.title || typeof params.title !== 'string' || params.title.trim() === '') {
    errors.push('title参数是必需的，且不能为空字符串');
  }
  
  if (!params.content || typeof params.content !== 'string' || params.content.trim() === '') {
    errors.push('content参数是必需的，且不能为空字符串');
  }
  
  if (!params.appId || typeof params.appId !== 'string' || params.appId.trim() === '') {
    errors.push('appId参数是必需的，且不能为空字符串');
  }
  
  if (!params.appSecret || typeof params.appSecret !== 'string' || params.appSecret.trim() === '') {
    errors.push('appSecret参数是必需的，且不能为空字符串');
  }
  
  // 可选参数类型检查
  if (params.author && typeof params.author !== 'string') {
    errors.push('author参数必须是字符串类型');
  }
  
  if (params.coverImagePath && typeof params.coverImagePath !== 'string') {
    errors.push('coverImagePath参数必须是字符串类型');
  }
  
  if (params.previewMode !== undefined && typeof params.previewMode !== 'boolean') {
    errors.push('previewMode参数必须是布尔值类型');
  }
  
  if (params.previewOpenId && typeof params.previewOpenId !== 'string') {
    errors.push('previewOpenId参数必须是字符串类型');
  }
  
  // 业务规则验证
  if (params.title && params.title.length > 64) {
    errors.push('标题长度不能超过64个字符');
  }
  
  if (params.author && params.author.length > 8) {
    errors.push('作者名称长度不能超过8个字符');
  }
  
  if (params.content && params.content.length > 200000) {
    errors.push('文章内容长度不能超过200,000个字符');
  }
  
  // AppID格式验证
  if (params.appId && !params.appId.startsWith('wx')) {
    errors.push('AppID格式错误，应该以"wx"开头');
  }
  
  if (params.appId && params.appId.length !== 18) {
    errors.push('AppID长度应该为18个字符');
  }
  
  // AppSecret格式验证
  if (params.appSecret && params.appSecret.length !== 32) {
    errors.push('AppSecret长度应该为32个字符');
  }
  
  // 预览模式验证
  if (params.previewMode === true && !params.previewOpenId) {
    errors.push('预览模式下必须提供previewOpenId参数');
  }
  
  // OpenID格式验证（如果提供了）
  if (params.previewOpenId && !isValidOpenId(params.previewOpenId)) {
    errors.push('previewOpenId格式不正确');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 验证状态查询参数
 * @param {Object} params 状态查询参数
 * @returns {Object} 验证结果
 */
function validateStatusParams(params) {
  const errors = [];
  
  // 必需参数检查
  if (!params.msgId || typeof params.msgId !== 'string' || params.msgId.trim() === '') {
    errors.push('msgId参数是必需的，且不能为空字符串');
  }
  
  if (!params.appId || typeof params.appId !== 'string' || params.appId.trim() === '') {
    errors.push('appId参数是必需的，且不能为空字符串');
  }
  
  if (!params.appSecret || typeof params.appSecret !== 'string' || params.appSecret.trim() === '') {
    errors.push('appSecret参数是必需的，且不能为空字符串');
  }
  
  // 格式验证
  if (params.msgId && !isValidMsgId(params.msgId)) {
    errors.push('msgId格式不正确，应该是数字字符串');
  }
  
  // AppID格式验证
  if (params.appId && !params.appId.startsWith('wx')) {
    errors.push('AppID格式错误，应该以"wx"开头');
  }
  
  if (params.appId && params.appId.length !== 18) {
    errors.push('AppID长度应该为18个字符');
  }
  
  // AppSecret格式验证
  if (params.appSecret && params.appSecret.length !== 32) {
    errors.push('AppSecret长度应该为32个字符');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 验证OpenID格式
 * @param {string} openId OpenID
 * @returns {boolean} 是否有效
 */
function isValidOpenId(openId) {
  // OpenID通常是28个字符的字母数字字符串
  return /^[a-zA-Z0-9_-]{28}$/.test(openId);
}

/**
 * 验证消息ID格式
 * @param {string} msgId 消息ID
 * @returns {boolean} 是否有效
 */
function isValidMsgId(msgId) {
  // 消息ID通常是数字字符串
  return /^\d+$/.test(msgId);
}

/**
 * 验证文件路径
 * @param {string} filePath 文件路径
 * @returns {Object} 验证结果
 */
function validateFilePath(filePath) {
  const errors = [];
  
  if (!filePath || typeof filePath !== 'string') {
    errors.push('文件路径不能为空');
    return { valid: false, errors };
  }
  
  // 检查文件扩展名
  const supportedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const hasValidExt = supportedExts.some(ext => 
    filePath.toLowerCase().endsWith(ext)
  );
  
  if (!hasValidExt) {
    errors.push(`不支持的文件格式，支持格式：${supportedExts.join(', ')}`);
  }
  
  // 基本路径安全检查
  if (filePath.includes('..')) {
    errors.push('文件路径不能包含".."字符');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 清理和标准化参数
 * @param {Object} params 原始参数
 * @returns {Object} 清理后的参数
 */
function sanitizeParams(params) {
  const sanitized = {};
  
  // 字符串参数去除首尾空格
  const stringFields = ['title', 'content', 'author', 'appId', 'appSecret', 'coverImagePath', 'previewOpenId', 'msgId'];
  stringFields.forEach(field => {
    if (params[field] && typeof params[field] === 'string') {
      sanitized[field] = params[field].trim();
    }
  });
  
  // 布尔值参数
  if (params.previewMode !== undefined) {
    sanitized.previewMode = Boolean(params.previewMode);
  }
  
  // 过滤掉undefined值
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    }
  });
  
  return sanitized;
}

/**
 * 从自然语言中解析参数
 * @param {string} userRequest 用户自然语言需求
 * @returns {Object} 解析出的参数
 */
function parseNaturalLanguage(userRequest) {
  const params = {};
  
  // 提取标题
  const titleMatch = userRequest.match(/标题[：:]\s*([^\n,，]+)/);
  if (titleMatch) {
    params.title = titleMatch[1].trim();
  }
  
  // 提取作者
  const authorMatch = userRequest.match(/作者[：:]\s*([^\n,，]+)/);
  if (authorMatch) {
    params.author = authorMatch[1].trim();
  }
  
  // 检测预览模式
  if (userRequest.includes('预览') || userRequest.includes('试看')) {
    params.previewMode = true;
  }
  
  // 提取内容（通常在最后或特定标记后）
  const contentMatch = userRequest.match(/内容[：:]\s*([\s\S]+)/);
  if (contentMatch) {
    params.content = contentMatch[1].trim();
  }
  
  return params;
}

module.exports = {
  validatePublishParams,
  validateStatusParams,
  validateFilePath,
  sanitizeParams,
  parseNaturalLanguage,
  isValidOpenId,
  isValidMsgId
}; 
#!/usr/bin/env node

/**
 * 微信公众号发布MCP服务 - 基本使用示例
 * 
 * 本示例展示如何在Node.js环境中直接使用微信发布功能
 * 
 * 注意：实际使用时，通常通过MCP协议从AI工具调用，而不是直接调用
 */

const WeChatPublisher = require('../src/tools/wechat-publisher.js');
const WeChatStatus = require('../src/tools/wechat-status.js');

// 示例配置（请替换为您的实际配置）
const config = {
  appId: 'your_wechat_appid_here',  // 替换为您的AppID
  appSecret: 'your_wechat_appsecret_here',  // 替换为您的AppSecret
  // previewOpenId: 'your_preview_openid_here'  // 预览模式需要
};

// 示例文章内容
const articleContent = `
# 🚀 AI赋能内容创作：微信公众号自动发布实战

## 📖 概述

本文介绍如何使用微信公众号自动发布服务，实现AI生成内容的一键发布。

## ✨ 主要特性

- **智能转换**：自动将Markdown转换为微信优化HTML
- **封面处理**：支持自动上传封面图片
- **预览模式**：发布前可先预览效果
- **状态查询**：实时跟踪文章发布状态

## 🛠️ 技术实现

### 核心API

\`\`\`javascript
// 发布文章
const result = await publisher.publish({
  title: '文章标题',
  content: markdownContent,
  author: '作者名称',
  appId: 'your_app_id',
  appSecret: 'your_app_secret'
});
\`\`\`

### 状态查询

\`\`\`javascript
// 查询状态
const status = await publisher.queryStatus({
  msgId: result.msgId,
  appId: 'your_app_id',
  appSecret: 'your_app_secret'
});
\`\`\`

## 📊 效果展示

通过本服务发布的文章具有以下特点：

1. **移动端优化**：专为手机阅读体验设计
2. **美观排版**：自动优化字体、间距、颜色
3. **代码高亮**：支持多种编程语言语法高亮
4. **表格支持**：完美显示表格数据

## 🎯 总结

微信公众号自动发布服务为内容创作者提供了强大的自动化工具，让AI生成的内容能够快速、美观地发布到微信公众号平台。

---

**关于作者**：PromptX技术团队致力于AI工具和自动化解决方案的开发。
`;

async function example1_basicPublish() {
  console.log('🚀 示例1：基础文章发布');
  
  try {
    const result = await WeChatPublisher.publish({
      title: '🔥 AI赋能内容创作：微信公众号自动发布实战教程',
      content: articleContent,
      author: 'PromptX技术团队',
      ...config,
      previewMode: false  // 正式发布模式
    });

    console.log('✅ 发布成功！');
    console.log('📊 发布结果：', result);
    
    return result;
  } catch (error) {
    console.error('❌ 发布失败：', error.message);
    throw error;
  }
}

async function example2_previewMode() {
  console.log('👀 示例2：预览模式发布');
  
  if (!config.previewOpenId) {
    console.log('⚠️  预览模式需要配置previewOpenId，跳过此示例');
    return;
  }
  
  try {
    const result = await WeChatPublisher.publish({
      title: '📝 预览测试：微信公众号自动发布功能',
      content: '这是一篇预览测试文章，用于验证发布功能是否正常工作。',
      author: '测试作者',
      ...config,
      previewMode: true,
      previewOpenId: config.previewOpenId
    });

    console.log('✅ 预览发送成功！');
    console.log('📊 预览结果：', result);
    
    return result;
  } catch (error) {
    console.error('❌ 预览失败：', error.message);
    throw error;
  }
}

async function example3_queryStatus(msgId) {
  console.log('📊 示例3：查询文章状态');
  
  if (!msgId) {
    console.log('⚠️  需要提供msgId，跳过此示例');
    return;
  }
  
  try {
    const status = await WeChatStatus.query({
      msgId,
      ...config
    });

    console.log('✅ 状态查询成功！');
    console.log('📈 文章状态：', status);
    
    return status;
  } catch (error) {
    console.error('❌ 状态查询失败：', error.message);
    throw error;
  }
}

async function example4_withCoverImage() {
  console.log('🖼️ 示例4：带封面图的文章发布');
  
  try {
    // 注意：这里需要提供真实存在的图片文件路径
    const coverImagePath = './cover-example.png';
    
    const result = await WeChatPublisher.publish({
      title: '🎨 带封面图的精美文章',
      content: articleContent,
      author: 'PromptX设计团队',
      coverImagePath,  // 添加封面图
      ...config,
      previewMode: false
    });

    console.log('✅ 带封面图发布成功！');
    console.log('📊 发布结果：', result);
    
    return result;
  } catch (error) {
    console.error('❌ 发布失败：', error.message);
    if (error.message.includes('图片文件不存在')) {
      console.log('💡 提示：请确保封面图片文件存在');
    }
    throw error;
  }
}

// 主函数：运行所有示例
async function runExamples() {
  console.log('📱 微信公众号发布MCP服务 - 使用示例');
  console.log('=====================================\n');
  
  // 检查配置
  if (!config.appId || !config.appSecret) {
    console.error('❌ 请先配置您的微信公众号AppID和AppSecret');
    process.exit(1);
  }
  
  try {
    // 示例1：基础发布
    const publishResult = await example1_basicPublish();
    
    // 等待一会儿，然后查询状态
    if (publishResult && publishResult.content[0].text.includes('msgId')) {
      setTimeout(async () => {
        const msgIdMatch = publishResult.content[0].text.match(/消息ID:\s*(\d+)/);
        if (msgIdMatch) {
          await example3_queryStatus(msgIdMatch[1]);
        }
      }, 5000);
    }
    
    // 示例2：预览模式
    // await example2_previewMode();
    
    // 示例4：带封面图发布（如果图片存在）
    // await example4_withCoverImage();
    
  } catch (error) {
    console.error('❌ 示例运行失败：', error.message);
    process.exit(1);
  }
}

// 如果直接运行此文件，执行示例
if (require.main === module) {
  runExamples();
}

module.exports = {
  example1_basicPublish,
  example2_previewMode,
  example3_queryStatus,
  example4_withCoverImage
};
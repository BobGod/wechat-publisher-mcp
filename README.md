# 📱 微信公众号自动发布 MCP 服务

[![npm version](https://badge.fury.io/js/wechat-publisher-mcp.svg)](https://badge.fury.io/js/wechat-publisher-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/your-username/wechat-publisher-mcp/workflows/Node.js%20CI/badge.svg)](https://github.com/your-username/wechat-publisher-mcp/actions)

## 🎯 项目概述

这是一个独立的MCP（Model Context Protocol）服务，专门用于微信公众号文章的自动发布。支持任何兼容MCP协议的AI工具调用，包括Claude Desktop、Cursor、Continue等。

### ✨ 核心特性

- 🚀 **即插即用**：标准MCP协议，一键集成到任何AI工具
- 📝 **智能转换**：自动将Markdown转换为微信公众号优化HTML
- 🖼️ **封面处理**：自动上传和处理封面图片
- 👀 **预览模式**：支持预览和正式发布两种模式
- 📊 **状态查询**：实时查询文章发布状态和数据统计
- 🔧 **错误处理**：完善的错误提示和解决建议
- 📱 **移动优化**：针对微信公众号移动端阅读体验优化

## 📦 安装

### NPM 安装（推荐）

```bash
npm install -g wechat-publisher-mcp
```

### 源码安装

```bash
git clone https://github.com/your-username/wechat-publisher-mcp.git
cd wechat-publisher-mcp
npm install
npm link
```

## 🔧 配置

### 1. 微信公众号配置

在微信公众平台完成以下配置：

1. **获取AppID和AppSecret**：
   - 登录 [微信公众平台](https://mp.weixin.qq.com)
   - 进入 "开发" → "基本配置"
   - 记录AppID和AppSecret

2. **配置IP白名单**：
   - 在 "开发" → "基本配置" → "IP白名单"
   - 添加服务器IP地址

3. **开通发布权限**：
   - 确保公众号已认证
   - 确保具有群发消息权限

### 2. MCP 客户端配置

#### Claude Desktop 配置

在 `~/Library/Application Support/Claude/claude_desktop_config.json` 中添加：

```json
{
  "mcpServers": {
    "wechat-publisher": {
      "command": "wechat-publisher-mcp",
      "args": [],
      "env": {
        "LOG_LEVEL": "INFO"
      }
    }
  }
}
```

#### Cursor 配置

在Cursor设置中添加MCP服务器：

```json
{
  "mcp.servers": [
    {
      "name": "wechat-publisher",
      "command": "wechat-publisher-mcp",
      "args": []
    }
  ]
}
```

## 🚀 使用方法

### 基础发布

```javascript
// 在AI工具中直接描述需求
"请帮我发布一篇文章到微信公众号，标题是'AI赋能内容创作'，作者是'张三'，内容是以下Markdown..."
```

### 预览模式

```javascript
"请先预览这篇文章，预览用户OpenID是 'xxx'，然后再决定是否正式发布"
```

### 状态查询

```javascript
"查询刚才发布的文章状态，消息ID是 '12345'"
```

## 🛠️ API 工具

### 1. wechat_publish_article

发布或预览文章到微信公众号。

**参数：**

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| title | string | ✅ | 文章标题（最大64字符） |
| content | string | ✅ | 文章内容（Markdown格式） |
| appId | string | ✅ | 微信公众号AppID |
| appSecret | string | ✅ | 微信公众号AppSecret |
| author | string | ❌ | 作者名称（最大8字符） |
| coverImagePath | string | ❌ | 封面图片路径 |
| previewMode | boolean | ❌ | 是否预览模式（默认false） |
| previewOpenId | string | ❌ | 预览用户OpenID（预览模式必需） |

**返回值：**

```json
{
  "success": true,
  "publishId": "2247483647",
  "msgId": "1000000001",
  "articleUrl": "https://mp.weixin.qq.com/s?__biz=...",
  "mediaId": "media_id_here"
}
```

### 2. wechat_query_status

查询文章发布状态和统计数据。

**参数：**

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| msgId | string | ✅ | 消息ID |
| appId | string | ✅ | 微信公众号AppID |
| appSecret | string | ✅ | 微信公众号AppSecret |

**返回值：**

```json
{
  "article_id": "123456",
  "publish_status": 1,
  "article_detail": {
    "title": "文章标题",
    "author": "作者",
    "publish_time": 1634567890,
    "url": "https://mp.weixin.qq.com/s?...",
    "stat_info": {
      "read_num": 1000,
      "like_num": 50,
      "comment_num": 10,
      "share_num": 20
    }
  }
}
```

## 📋 示例

### 完整发布流程

```markdown
# 示例：发布技术文章

## 步骤1：准备内容
将文章写成Markdown格式，包含代码块、图片等。

## 步骤2：准备封面图
准备一张封面图片，支持PNG、JPG、JPEG格式，建议尺寸900x500px。

## 步骤3：发布文章
在AI工具中说："请发布这篇文章到微信公众号"，并提供：
- 标题：🔥 AI赋能Chrome扩展开发：从PromptX到功能实现的全流程实战教程
- 作者：郑伟 | PromptX技术  
- AppID：wxe576047557b63353
- AppSecret：58cdb363cf9ed63942b8e124890a8c18
- 封面图：./cover.png
- 内容：[Markdown内容]

## 步骤4：查询状态
发布后使用返回的msgId查询文章状态和数据。
```

### 自然语言示例

```text
用户："帮我把这篇关于Chrome扩展开发的教程发布到微信公众号，标题叫'AI赋能Chrome扩展开发实战教程'，作者署名'郑伟'，先预览给我看看效果"

AI会自动：
1. 解析用户需求
2. 转换Markdown为微信HTML
3. 上传封面图（如果提供）
4. 发送预览消息
5. 返回预览结果和链接
```

## 🔧 高级配置

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| LOG_LEVEL | INFO | 日志级别（ERROR/WARN/INFO/DEBUG） |
| NO_COLOR | 0 | 禁用彩色输出（设为1禁用） |
| NODE_ENV | development | 运行环境 |

### 启动参数

```bash
# 调试模式启动
LOG_LEVEL=DEBUG wechat-publisher-mcp

# 生产模式启动
NODE_ENV=production wechat-publisher-mcp
```

## 🐛 故障排除

### 常见错误及解决方案

#### 1. IP白名单错误
```
错误：invalid ip xxx, not in whitelist
解决：在微信公众平台添加服务器IP到白名单
```

#### 2. access_token错误
```
错误：access_token invalid
解决：检查AppID和AppSecret是否正确
```

#### 3. 封面图上传失败
```
错误：图片上传失败
解决：检查图片格式（PNG/JPG）和大小（<1MB）
```

#### 4. 预览失败
```
错误：预览用户不存在
解决：确认previewOpenId是否正确，用户是否关注公众号
```

### 调试模式

启用调试模式查看详细日志：

```bash
LOG_LEVEL=DEBUG wechat-publisher-mcp
```

## 🧪 测试

```bash
# 运行单元测试
npm test

# 运行集成测试
npm run test:integration

# 运行代码覆盖率测试
npm run test:coverage
```

## 🤝 贡献

欢迎提交Issue和Pull Request！

1. Fork本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- [微信公众平台开发文档](https://developers.weixin.qq.com/doc/offiaccount/Getting_Started/Overview.html)
- [MCP协议规范](https://modelcontextprotocol.io/)
- [Claude Desktop配置](https://claude.ai/docs)

## 🙏 致谢

感谢以下项目和社区的支持：

- [PromptX项目](https://github.com/your-username/PromptX) - 原始灵感来源
- [Model Context Protocol](https://modelcontextprotocol.io/) - 协议支持
- 微信开发者社区 - API支持

---

📢 **如果这个项目对您有帮助，请给我们一个⭐！** 
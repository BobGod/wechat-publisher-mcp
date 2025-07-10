# 📱 微信公众号自动发布 MCP 服务

[![npm version](https://badge.fury.io/js/wechat-publisher-mcp.svg)](https://badge.fury.io/js/wechat-publisher-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/your-username/wechat-publisher-mcp/workflows/Node.js%20CI/badge.svg)](https://github.com/your-username/wechat-publisher-mcp/actions)

## 📖 目录

- [🎯 项目概述](#-项目概述)
- [✨ 核心特性](#-核心特性)
- [📦 安装](#-安装)
- [🔧 配置](#-配置)
- [🚀 新手快速开始](#-新手快速开始)
- [🚀 使用方法](#-使用方法)
- [🛠️ API 工具](#️-api-工具)
- [📋 示例](#-示例)
- [🔧 高级配置](#-高级配置)
- [🐛 故障排除](#-故障排除)
- [🧪 测试](#-测试)
- [🤝 贡献](#-贡献)
- [📄 许可证](#-许可证)
- [🔗 相关链接](#-相关链接)
- [🙏 致谢](#-致谢)

## 🎯 项目概述

这是一个独立的MCP（Model Context Protocol）服务，专门用于微信公众号文章的自动发布。支持任何兼容MCP协议的AI工具调用，包括Claude Desktop、Cursor、Continue等。

> **🎉 最新更新**：已修复MCP SDK兼容性问题，支持最新版本的Claude Desktop和Cursor！

### ✨ 核心特性

- 🚀 **即插即用**：标准MCP协议，一键集成到任何AI工具
- 📝 **智能转换**：自动将Markdown转换为微信公众号优化HTML
- 🖼️ **封面处理**：自动上传和处理封面图片
- 👀 **预览模式**：支持预览和正式发布两种模式
- 📊 **状态查询**：实时查询文章发布状态和数据统计
- 🔧 **错误处理**：完善的错误提示和解决建议
- 📱 **移动优化**：针对微信公众号移动端阅读体验优化

## 📦 安装

> **注意**：目前该包尚未发布到npm registry，请使用源码安装方式。

### 方式一：源码安装（推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/wechat-publisher-mcp.git
cd wechat-publisher-mcp

# 2. 安装依赖
npm install

# 3. 配置微信公众号密钥
# ⚠️ 重要安全提示：请勿将真实的AppID和AppSecret提交到代码仓库！
cp examples/wechat-config.example.js examples/wechat-config.js
# 编辑 examples/wechat-config.js，填入您的真实密钥

# 4. 创建全局链接
npm link

# 5. 验证安装
wechat-publisher-mcp --help
```

### 安全配置说明

**⚠️ 重要：为了保护您的微信公众号安全，请务必正确配置密钥！**

1. **复制配置示例文件**：
```bash
cp examples/wechat-config.example.js examples/wechat-config.js
```

2. **编辑配置文件**，填入您的真实密钥：
```javascript
// examples/wechat-config.js
export const wechatConfig = {
  appId: 'your_real_appid_here',        // 替换为您的真实AppID
  appSecret: 'your_real_appsecret_here' // 替换为您的真实AppSecret
};
```

3. **在代码中引用配置**：
```javascript
import { wechatConfig } from './examples/wechat-config.js';
const { appId, appSecret } = wechatConfig;
```

4. **确保配置文件不被提交**：
   - `examples/wechat-config.js` 已添加到 `.gitignore`
   - 只有示例文件 `examples/wechat-config.example.js` 会被提交到仓库

### 方式二：直接运行

如果不想全局安装，可以直接运行：

```bash
# 克隆并安装依赖
git clone https://github.com/your-username/wechat-publisher-mcp.git
cd wechat-publisher-mcp
npm install

# 直接运行
node src/server.js
```

### 系统要求

- **Node.js**: v18.0.0 或更高版本
- **npm**: v8.0.0 或更高版本
- **操作系统**: macOS, Linux, Windows

### 验证安装

安装完成后，运行以下命令验证：

```bash
# 检查命令是否可用
which wechat-publisher-mcp

# 查看版本信息
wechat-publisher-mcp --version

# 查看帮助信息
wechat-publisher-mcp --help
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

**macOS 配置路径：**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows 配置路径：**
```bash
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux 配置路径：**
```bash
~/.config/Claude/claude_desktop_config.json
```

**配置内容：**

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

**如果使用绝对路径（推荐）：**

```json
{
  "mcpServers": {
    "wechat-publisher": {
      "command": "/path/to/your/node",
      "args": ["/path/to/wechat-publisher-mcp/src/server.js"]
    }
  }
}
```

#### Cursor 配置

1. 打开Cursor设置（`Cmd+,` 或 `Ctrl+,`）
2. 搜索"MCP"找到配置选项
3. 添加以下配置：

**方式一：使用全局命令**
```json
{
  "mcpServers": {
    "wechat-publisher": {
      "command": "wechat-publisher-mcp",
      "args": []
    }
  }
}
```

**方式二：使用绝对路径（推荐）**
```json
{
  "mcpServers": {
    "wechat-publisher": {
      "command": "/Users/your-username/.nvm/versions/node/v18.20.8/bin/wechat-publisher-mcp",
      "args": []
    }
  }
}
```

**方式三：使用Node.js直接启动（最稳定）**
```json
{
  "mcpServers": {
    "wechat-publisher": {
      "command": "/Users/your-username/.nvm/versions/node/v18.20.8/bin/node",
      "args": ["/path/to/wechat-publisher-mcp/src/server.js"]
    }
  }
}
```

#### Continue 配置

在Continue的配置文件中添加：

```json
{
  "mcpServers": {
    "wechat-publisher": {
      "command": "wechat-publisher-mcp",
      "args": []
    }
  }
}
```

#### 配置验证

配置完成后：

1. **重启AI工具**（Claude Desktop/Cursor等）
2. **等待服务初始化**（通常需要几秒钟）
3. **验证连接**：在AI对话中输入"请列出可用的工具"
4. **查看状态**：MCP服务图标应显示为绿色

#### 故障排除

**如果MCP服务图标显示黄色或红色：**

1. **检查命令路径**：
   ```bash
   which wechat-publisher-mcp
   ```

2. **使用绝对路径**：将上述命令返回的完整路径用于配置

3. **检查Node.js版本**：
   ```bash
   node --version  # 应该 >= v18.0.0
   ```

4. **查看错误日志**：打开AI工具的开发者工具查看Console错误

5. **手动测试**：在终端中直接运行命令验证
   ```bash
   wechat-publisher-mcp
   ```

## 🚀 新手快速开始

### 第一步：环境准备

1. **检查Node.js版本**
   ```bash
   node --version  # 需要 >= v18.0.0
   ```
   如果版本过低，请访问 [Node.js官网](https://nodejs.org/) 下载最新版本。

2. **检查npm版本**
   ```bash
   npm --version   # 需要 >= v8.0.0
   ```

### 第二步：安装项目

```bash
# 1. 克隆项目到本地
git clone https://github.com/your-username/wechat-publisher-mcp.git
cd wechat-publisher-mcp

# 2. 安装依赖
npm install

# 3. 创建全局链接
npm link

# 4. 验证安装
wechat-publisher-mcp --help
```

### 第三步：获取微信公众号配置

1. **登录微信公众平台**
   - 访问 [https://mp.weixin.qq.com](https://mp.weixin.qq.com)
   - 使用管理员账号登录

2. **获取AppID和AppSecret**
   - 进入"开发" → "基本配置"
   - 复制保存AppID和AppSecret

3. **配置IP白名单**
   - 在"基本配置"页面找到"IP白名单"
   - 添加你的服务器IP地址（可以先添加 `0.0.0.0/0` 用于测试）

### 第四步：配置AI工具

#### 如果你使用Claude Desktop：

1. **找到配置文件**
   ```bash
   # macOS
   open "~/Library/Application Support/Claude/"
   
   # Windows
   # 打开 %APPDATA%\Claude\
   
   # Linux
   # 打开 ~/.config/Claude/
   ```

2. **编辑claude_desktop_config.json**
   ```json
   {
     "mcpServers": {
       "wechat-publisher": {
         "command": "wechat-publisher-mcp",
         "args": []
       }
     }
   }
   ```

3. **重启Claude Desktop**

#### 如果你使用Cursor：

1. **打开Cursor设置**
   - 按 `Cmd+,` (Mac) 或 `Ctrl+,` (Windows/Linux)

2. **搜索MCP配置**
   - 在设置中搜索"MCP"

3. **添加服务配置**
   ```bash
   # 首先获取你的命令路径
   which wechat-publisher-mcp
   ```
   
   然后使用返回的完整路径配置：
   ```json
   {
     "mcpServers": {
       "wechat-publisher": {
         "command": "/your/full/path/to/wechat-publisher-mcp",
         "args": []
       }
     }
   }
   ```

4. **重启Cursor**

### 第五步：测试连接

1. **验证MCP服务状态**
   - 在AI工具中，MCP服务图标应显示为绿色
   - 如果显示黄色或红色，请查看故障排除部分

2. **测试工具可用性**
   在AI对话中输入：
   ```
   请列出可用的工具
   ```
   
   你应该能看到以下工具：
   - `wechat_publish_article` - 发布文章
   - `wechat_query_status` - 查询状态

### 第六步：发布第一篇文章

在AI工具中输入以下内容（替换为你的实际信息）：

```
请帮我发布一篇测试文章到微信公众号：

标题：我的第一篇AI发布文章
作者：你的名字
AppID：你的微信公众号AppID
AppSecret：你的微信公众号AppSecret
预览模式：true
预览用户OpenID：你的OpenID（可选，用于预览）

内容：
# 欢迎使用微信公众号自动发布工具

这是一篇测试文章，用于验证MCP服务是否正常工作。

## 功能特点

- ✅ 支持Markdown格式
- ✅ 自动转换为微信HTML
- ✅ 支持预览和正式发布
- ✅ 实时状态查询

**测试成功！** 🎉
```

### 常见问题解决

**Q: MCP服务图标显示黄色怎么办？**
A: 这通常表示路径问题，请使用 `which wechat-publisher-mcp` 获取完整路径，然后在配置中使用绝对路径。

**Q: 提示"access_token invalid"怎么办？**
A: 检查AppID和AppSecret是否正确，确保在微信公众平台的"基本配置"中获取。

**Q: 提示IP不在白名单怎么办？**
A: 在微信公众平台的"基本配置" → "IP白名单"中添加你的服务器IP。

**Q: 如何获取预览用户的OpenID？**
A: 可以通过微信公众号的用户管理功能获取，或者先不使用预览模式直接发布。

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
- AppID：your_wechat_appid_here（请替换为您的真实AppID）
- AppSecret：your_wechat_appsecret_here（请替换为您的真实AppSecret）
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

### MCP连接问题

#### 1. MCP服务图标显示黄色或红色

**症状**：AI工具中MCP服务状态异常

**解决方案**：

1. **检查命令路径**
   ```bash
   which wechat-publisher-mcp
   ```
   
2. **使用绝对路径配置**
   ```json
   {
     "mcpServers": {
       "wechat-publisher": {
         "command": "/Users/username/.nvm/versions/node/v18.20.8/bin/wechat-publisher-mcp",
         "args": []
       }
     }
   }
   ```

3. **使用Node.js直接启动**
   ```json
   {
     "mcpServers": {
       "wechat-publisher": {
         "command": "/Users/username/.nvm/versions/node/v18.20.8/bin/node",
         "args": ["/path/to/wechat-publisher-mcp/src/server.js"]
       }
     }
   }
   ```

#### 2. ERR_PACKAGE_PATH_NOT_EXPORTED 错误

**症状**：启动时报模块导入错误

**解决方案**：
```bash
# 重新安装依赖
cd wechat-publisher-mcp
npm install

# 检查Node.js版本
node --version  # 确保 >= v18.0.0
```

#### 3. 命令未找到错误

**症状**：`command not found: wechat-publisher-mcp`

**解决方案**：
```bash
# 重新创建全局链接
npm unlink -g wechat-publisher-mcp
npm link

# 或者检查PATH环境变量
echo $PATH
```

### 微信API错误

#### 1. IP白名单错误
```
错误：invalid ip xxx, not in whitelist
解决：在微信公众平台添加服务器IP到白名单
```

**详细步骤**：
1. 登录微信公众平台
2. 进入"开发" → "基本配置"
3. 找到"IP白名单"设置
4. 添加你的公网IP地址
5. 如果不确定IP，可以临时添加 `0.0.0.0/0`（仅用于测试）

#### 2. access_token错误
```
错误：access_token invalid
解决：检查AppID和AppSecret是否正确
```

**检查清单**：
- [ ] AppID格式正确（以wx开头）
- [ ] AppSecret长度为32位
- [ ] 没有多余的空格或换行符
- [ ] 公众号类型支持API调用

#### 3. 封面图上传失败
```
错误：图片上传失败
解决：检查图片格式（PNG/JPG）和大小（<1MB）
```

**图片要求**：
- 格式：PNG、JPG、JPEG
- 大小：< 1MB
- 尺寸：建议 900x500px
- 路径：使用绝对路径或相对于项目根目录的路径

#### 4. 预览失败
```
错误：预览用户不存在
解决：确认previewOpenId是否正确，用户是否关注公众号
```

**获取OpenID方法**：
1. 在微信公众平台的"用户管理"中查看
2. 通过微信网页授权获取
3. 使用微信开发者工具测试

### 权限和认证问题

#### 1. 公众号权限不足
```
错误：no privilege to write this kind of message
解决：确保公众号已认证且具有群发权限
```

#### 2. 接口调用次数限制
```
错误：api minute-quota reach limit
解决：等待一分钟后重试，或优化调用频率
```

### 环境和依赖问题

#### 1. Node.js版本过低
```
错误：SyntaxError: Unexpected token
解决：升级Node.js到v18.0.0或更高版本
```

#### 2. 依赖安装失败
```
错误：npm install失败
解决：清理缓存后重新安装
```

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 调试模式

启用调试模式查看详细日志：

```bash
# 方式一：环境变量
LOG_LEVEL=DEBUG wechat-publisher-mcp

# 方式二：在配置中添加
{
  "mcpServers": {
    "wechat-publisher": {
      "command": "wechat-publisher-mcp",
      "args": [],
      "env": {
        "LOG_LEVEL": "DEBUG",
        "DEBUG": "true"
      }
    }
  }
}
```

### 获取帮助

如果以上方法都无法解决问题：

1. **查看详细日志**：启用DEBUG模式
2. **检查网络连接**：确保能访问微信API
3. **提交Issue**：在GitHub仓库提交详细的错误信息
4. **社区求助**：在相关技术社区寻求帮助

**提交Issue时请包含**：
- 操作系统和版本
- Node.js版本
- 错误的完整日志
- 复现步骤
- 配置文件（隐藏敏感信息）

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

### 官方文档
- [微信公众平台开发文档](https://developers.weixin.qq.com/doc/offiaccount/Getting_Started/Overview.html)
- [微信公众号API参考](https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Batch_Sends_and_Originality_Checks.html)
- [MCP协议规范](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

### AI工具配置
- [Claude Desktop配置指南](https://claude.ai/docs)
- [Cursor MCP配置](https://docs.cursor.com/)
- [Continue.dev配置](https://continue.dev/docs)

### 开发资源
- [Node.js官网](https://nodejs.org/)
- [npm包管理器](https://www.npmjs.com/)
- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

### 社区和支持
- [GitHub Issues](https://github.com/your-username/wechat-publisher-mcp/issues)
- [微信开发者社区](https://developers.weixin.qq.com/community/)
- [MCP开发者社区](https://github.com/modelcontextprotocol)

## 🙏 致谢

感谢以下项目和社区的支持：

### 核心技术
- [Model Context Protocol](https://modelcontextprotocol.io/) - 提供了强大的AI工具协议支持
- [微信公众平台](https://mp.weixin.qq.com/) - 提供了完善的API接口
- [Node.js社区](https://nodejs.org/) - 提供了优秀的运行时环境

### 灵感来源
- [PromptX项目](https://github.com/Deepractice/PromptX) - 原始灵感和技术架构参考
- [Claude Desktop](https://claude.ai/) - MCP协议的先驱实现
- [Cursor](https://cursor.com/) - 优秀的AI编程工具

### 开源社区
- 所有提交Issue和PR的贡献者
- 微信开发者社区的技术分享
- MCP协议的早期采用者和反馈者

### 特别感谢
- **郑伟** - 项目发起人和主要维护者
- **PromptX团队** - 技术指导和架构设计
- **所有测试用户** - 提供了宝贵的使用反馈

---

📢 **如果这个项目对您有帮助，请给我们一个⭐！**
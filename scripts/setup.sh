#!/bin/bash

# 微信公众号发布MCP服务 - 快速安装配置脚本
# Quick Setup Script for WeChat Publisher MCP Service

set -e

echo "📱 微信公众号发布MCP服务 - 快速配置向导"
echo "============================================="
echo ""

# 检查Node.js版本
echo "🔍 检查Node.js环境..."
if ! command -v node &> /dev/null; then
    echo "❌ 未找到Node.js，请先安装Node.js 16+版本"
    echo "   下载地址: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js版本过低($NODE_VERSION)，需要16+版本"
    exit 1
fi

echo "✅ Node.js版本: $(node -v)"

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ 未找到npm包管理器"
    exit 1
fi

echo "✅ npm版本: $(npm -v)"
echo ""

# 安装依赖
echo "📦 安装项目依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "✅ 依赖安装完成"
echo ""

# 创建配置文件
echo "⚙️  创建配置文件..."

# 检查是否已有配置文件
if [ ! -f "config.json" ]; then
    cat > config.json << EOF
{
  "appId": "",
  "appSecret": "",
  "previewOpenId": "",
  "logLevel": "INFO"
}
EOF
    echo "✅ 已创建 config.json 配置文件"
else
    echo "⚠️  config.json 已存在，跳过创建"
fi

echo ""

# 提示用户配置
echo "🔧 配置微信公众号信息"
echo "======================"
echo ""
echo "请按照以下步骤配置您的微信公众号："
echo ""
echo "1. 登录微信公众平台: https://mp.weixin.qq.com"
echo "2. 进入 '开发' → '基本配置'"
echo "3. 获取 AppID 和 AppSecret"
echo "4. 编辑 config.json 文件，填入您的信息"
echo ""

# 检查是否需要交互式配置
read -p "是否现在配置微信公众号信息? (y/n): " configure_now

if [ "$configure_now" = "y" ] || [ "$configure_now" = "Y" ]; then
    echo ""
    echo "📝 请输入您的微信公众号信息："
    
    read -p "AppID (以wx开头): " app_id
    read -p "AppSecret (32位字符串): " app_secret
    read -p "预览用户OpenID (可选): " preview_openid
    
    # 验证输入
    if [[ ! $app_id =~ ^wx[a-zA-Z0-9]{16}$ ]]; then
        echo "⚠️  AppID格式可能不正确，请检查"
    fi
    
    if [ ${#app_secret} -ne 32 ]; then
        echo "⚠️  AppSecret长度不是32位，请检查"
    fi
    
    # 更新配置文件
    cat > config.json << EOF
{
  "appId": "$app_id",
  "appSecret": "$app_secret",
  "previewOpenId": "$preview_openid",
  "logLevel": "INFO"
}
EOF
    
    echo "✅ 配置已保存到 config.json"
fi

echo ""

# MCP客户端配置提示
echo "🔌 MCP客户端配置"
echo "================"
echo ""
echo "将此服务添加到您的AI工具中："
echo ""

echo "Claude Desktop 配置 (~/.config/claude/claude_desktop_config.json):"
cat << 'EOF'
{
  "mcpServers": {
    "wechat-publisher": {
      "command": "node",
      "args": ["./src/server.js"],
      "cwd": "/path/to/wechat-publisher-mcp",
      "env": {
        "LOG_LEVEL": "INFO"
      }
    }
  }
}
EOF

echo ""
echo "或者全局安装后使用："
cat << 'EOF'
{
  "mcpServers": {
    "wechat-publisher": {
      "command": "wechat-publisher-mcp"
    }
  }
}
EOF

echo ""

# 测试连接
echo "🧪 测试配置"
echo "==========="
echo ""

if [ -f "config.json" ]; then
    # 检查配置文件是否有效
    if grep -q '"appId": ""' config.json; then
        echo "⚠️  检测到空的AppID，请先完成配置再测试"
    else
        read -p "是否运行连接测试? (y/n): " run_test
        
        if [ "$run_test" = "y" ] || [ "$run_test" = "Y" ]; then
            echo "🔄 正在测试微信API连接..."
            
            # 创建简单的测试脚本
            cat > test_connection.js << 'EOF'
const WeChatAPI = require('./src/services/WeChatAPI.js');
const config = require('./config.json');

async function testConnection() {
  try {
    const api = new WeChatAPI(config.appId, config.appSecret);
    const token = await api.getAccessToken();
    console.log('✅ 微信API连接成功！');
    console.log('🔑 Access Token获取成功');
    return true;
  } catch (error) {
    console.log('❌ 微信API连接失败:', error.message);
    return false;
  }
}

testConnection();
EOF
            
            node test_connection.js
            rm test_connection.js
        fi
    fi
fi

echo ""

# 完成提示
echo "🎉 安装配置完成！"
echo "================="
echo ""
echo "下一步："
echo "1. 确保 config.json 中的信息正确"
echo "2. 在微信公众平台配置IP白名单"
echo "3. 将MCP服务添加到您的AI工具配置中"
echo "4. 重启AI工具以加载MCP服务"
echo ""
echo "使用方法："
echo "- 在AI工具中说: '帮我发布一篇文章到微信公众号'"
echo "- 提供标题、内容、作者等信息"
echo "- AI会自动调用发布服务"
echo ""
echo "更多帮助："
echo "- 查看 README.md 了解详细用法"
echo "- 运行 'npm run example' 查看代码示例"
echo "- 查看 examples/ 目录中的示例文件"
echo ""
echo "📧 如有问题，请提交Issue或联系技术支持"
echo ""

# 询问是否全局安装
read -p "是否全局安装此服务以便在任何地方使用? (y/n): " global_install

if [ "$global_install" = "y" ] || [ "$global_install" = "Y" ]; then
    echo "🌐 正在全局安装..."
    npm link
    
    if [ $? -eq 0 ]; then
        echo "✅ 全局安装成功！现在可以使用 'wechat-publisher-mcp' 命令"
    else
        echo "❌ 全局安装失败，可能需要管理员权限"
        echo "   请尝试: sudo npm link"
    fi
fi

echo ""
echo "🚀 准备就绪！开始您的AI内容创作之旅吧！" 
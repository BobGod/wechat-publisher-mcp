/**
 * Markdown转微信HTML转换器
 * 将标准Markdown格式转换为适合微信公众号显示的HTML格式
 * 包含移动端优化的样式和排版
 */
class MarkdownConverter {
  /**
   * 将Markdown内容转换为微信公众号优化的HTML
   * @param {string} markdownContent Markdown内容
   * @returns {string} 微信优化的HTML内容
   */
  static convertToWeChatHTML(markdownContent) {
    if (!markdownContent || typeof markdownContent !== 'string') {
      return '';
    }

    let html = markdownContent;

    // 1. 先处理代码块（避免被其他规则影响）
    html = this.convertCodeBlocks(html);

    // 2. 处理标题
    html = this.convertHeadings(html);

    // 3. 处理文本格式
    html = this.convertTextFormatting(html);

    // 4. 处理列表
    html = this.convertLists(html);

    // 5. 处理引用
    html = this.convertBlockquotes(html);

    // 6. 处理链接
    html = this.convertLinks(html);

    // 7. 处理表格
    html = this.convertTables(html);

    // 8. 处理段落
    html = this.convertParagraphs(html);

    // 9. 清理和优化
    html = this.cleanupHTML(html);

    // 10. 添加基础样式
    return this.addBaseStyles(html);
  }

  /**
   * 处理代码块
   */
  static convertCodeBlocks(html) {
    // 处理带语言标识的代码块
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || 'text';
      return `<pre data-language="${language}" style="background: #f8f9fa; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: 'Monaco', 'Consolas', 'Courier New', monospace; font-size: 14px; line-height: 1.4; border: 1px solid #e9ecef; margin: 16px 0;"><code style="color: #333; background: none; padding: 0;">${this.escapeHtml(code.trim())}</code></pre>`;
    });

    // 处理行内代码
    html = html.replace(/`([^`]+)`/g, '<code style="background: #f1f3f4; color: #e91e63; padding: 2px 6px; border-radius: 4px; font-family: \'Monaco\', \'Consolas\', \'Courier New\', monospace; font-size: 0.9em;">$1</code>');

    return html;
  }

  /**
   * 处理标题
   */
  static convertHeadings(html) {
    // H1 - 主标题，较大字体，深色
    html = html.replace(/^# (.+)$/gm, '<h1 style="color: #2c3e50; font-size: 28px; font-weight: bold; margin: 24px 0 16px 0; line-height: 1.3; border-bottom: 3px solid #3498db; padding-bottom: 8px;">$1</h1>');
    
    // H2 - 次标题，蓝色
    html = html.replace(/^## (.+)$/gm, '<h2 style="color: #3498db; font-size: 24px; font-weight: bold; margin: 20px 0 12px 0; line-height: 1.3;">🔹 $1</h2>');
    
    // H3 - 三级标题，绿色
    html = html.replace(/^### (.+)$/gm, '<h3 style="color: #27ae60; font-size: 20px; font-weight: bold; margin: 18px 0 10px 0; line-height: 1.3;">▶ $1</h3>');
    
    // H4 - 四级标题，紫色
    html = html.replace(/^#### (.+)$/gm, '<h4 style="color: #8e44ad; font-size: 18px; font-weight: bold; margin: 16px 0 8px 0; line-height: 1.3;">• $1</h4>');

    return html;
  }

  /**
   * 处理文本格式
   */
  static convertTextFormatting(html) {
    // 粗体 - 红色突出
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #e74c3c; font-weight: bold;">$1</strong>');
    
    // 斜体 - 紫色
    html = html.replace(/\*(.*?)\*/g, '<em style="color: #9b59b6; font-style: italic;">$1</em>');
    
    // 删除线
    html = html.replace(/~~(.*?)~~/g, '<del style="color: #95a5a6; text-decoration: line-through;">$1</del>');

    return html;
  }

  /**
   * 处理列表
   */
  static convertLists(html) {
    // 先处理有序列表
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li style="margin: 8px 0; line-height: 1.6;">$1</li>');
    
    // 再处理无序列表
    html = html.replace(/^[-*+]\s+(.+)$/gm, '<li style="margin: 8px 0; line-height: 1.6;">$1</li>');
    
    // 将连续的li标签包装在ul中
    html = html.replace(/(<li[^>]*>.*?<\/li>(\s*<li[^>]*>.*?<\/li>)*)/gs, (match) => {
      return `<ul style="margin: 16px 0; padding-left: 24px; list-style-type: disc;">${match}</ul>`;
    });

    return html;
  }

  /**
   * 处理引用
   */
  static convertBlockquotes(html) {
    html = html.replace(/^>\s*(.+)$/gm, '<blockquote style="border-left: 4px solid #3498db; padding: 16px 20px; margin: 16px 0; background: #f8fafb; font-style: italic; color: #555; border-radius: 0 8px 8px 0;">$1</blockquote>');
    return html;
  }

  /**
   * 处理链接
   */
  static convertLinks(html) {
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #3498db; text-decoration: none; border-bottom: 1px dotted #3498db;" target="_blank">$1</a>');
    return html;
  }

  /**
   * 处理表格
   */
  static convertTables(html) {
    // 简单的表格转换（Markdown表格转HTML表格）
    const lines = html.split('\n');
    let inTable = false;
    let tableLines = [];
    let result = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 检测表格开始（包含 | 的行）
      if (line.includes('|') && !inTable) {
        inTable = true;
        tableLines = [line];
      } else if (line.includes('|') && inTable) {
        tableLines.push(line);
      } else if (inTable) {
        // 表格结束，处理表格
        if (tableLines.length > 0) {
          result.push(this.convertTableToHTML(tableLines));
        }
        inTable = false;
        tableLines = [];
        result.push(line);
      } else {
        result.push(line);
      }
    }

    // 处理最后可能的表格
    if (inTable && tableLines.length > 0) {
      result.push(this.convertTableToHTML(tableLines));
    }

    return result.join('\n');
  }

  /**
   * 将Markdown表格转换为HTML表格
   */
  static convertTableToHTML(tableLines) {
    if (tableLines.length < 2) return tableLines.join('\n');

    const headerLine = tableLines[0];
    const separatorLine = tableLines[1];
    const dataLines = tableLines.slice(2);

    // 解析表头
    const headers = headerLine.split('|').map(h => h.trim()).filter(h => h);
    
    // 检查是否是有效的表格分隔符
    if (!separatorLine.includes('-')) {
      return tableLines.join('\n');
    }

    let tableHTML = '<table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">';
    
    // 表头
    tableHTML += '<thead><tr style="background: #f8f9fa;">';
    headers.forEach(header => {
      tableHTML += `<th style="border: 1px solid #dee2e6; padding: 12px 8px; text-align: left; font-weight: bold; color: #495057;">${header}</th>`;
    });
    tableHTML += '</tr></thead>';

    // 表格数据
    tableHTML += '<tbody>';
    dataLines.forEach((line, index) => {
      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
      tableHTML += `<tr style="background: ${bgColor};">`;
      cells.forEach(cell => {
        tableHTML += `<th style="border: 1px solid #dee2e6; padding: 12px 8px; color: #495057;">${cell}</th>`;
      });
      tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table>';

    return tableHTML;
  }

  /**
   * 处理段落
   */
  static convertParagraphs(html) {
    // 将双换行转换为段落分隔
    html = html.replace(/\n\s*\n/g, '</p><p style="margin: 16px 0; line-height: 1.8; text-align: justify; color: #333;">');
    
    // 在开头和结尾添加段落标签
    html = '<p style="margin: 16px 0; line-height: 1.8; text-align: justify; color: #333;">' + html + '</p>';

    return html;
  }

  /**
   * 清理HTML
   */
  static cleanupHTML(html) {
    // 移除空段落
    html = html.replace(/<p[^>]*>\s*<\/p>/g, '');
    
    // 清理多余的空白
    html = html.replace(/\s+/g, ' ');
    
    // 修复标签嵌套问题
    html = html.replace(/<p[^>]*>(\s*<h[1-6][^>]*>.*?<\/h[1-6]>\s*)<\/p>/g, '$1');
    html = html.replace(/<p[^>]*>(\s*<ul[^>]*>.*?<\/ul>\s*)<\/p>/gs, '$1');
    html = html.replace(/<p[^>]*>(\s*<ol[^>]*>.*?<\/ol>\s*)<\/p>/gs, '$1');
    html = html.replace(/<p[^>]*>(\s*<blockquote[^>]*>.*?<\/blockquote>\s*)<\/p>/gs, '$1');
    html = html.replace(/<p[^>]*>(\s*<pre[^>]*>.*?<\/pre>\s*)<\/p>/gs, '$1');
    html = html.replace(/<p[^>]*>(\s*<table[^>]*>.*?<\/table>\s*)<\/p>/gs, '$1');

    return html;
  }

  /**
   * 添加基础样式
   */
  static addBaseStyles(html) {
    const baseStyle = `
<style>
/* 微信公众号文章样式 */
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif;
  line-height: 1.8;
  color: #333;
  background: #fff;
  font-size: 16px;
  margin: 0;
  padding: 20px;
}

/* 响应式图片 */
img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 16px auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* 分割线 */
hr {
  border: none;
  height: 1px;
  background: linear-gradient(to right, transparent, #ddd, transparent);
  margin: 24px 0;
}

/* 强调框 */
.highlight {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
}

/* 小贴士 */
.tip {
  background: #d1ecf1;
  border-left: 4px solid #bee5eb;
  padding: 16px;
  margin: 16px 0;
  border-radius: 0 8px 8px 0;
}
</style>
`;

    return baseStyle + html;
  }

  /**
   * HTML转义
   */
  static escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

export default MarkdownConverter;
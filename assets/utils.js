/**
 * 工具函数文件 - 提供各种辅助功能
 * 
 * 该文件包含应用程序中使用的各种工具函数，
 * 包括时间处理、CSV解析、状态更新、编码检测等功能。
 */

/**
 * 解析时间字符串为时间戳
 * @param {string} timeStr - 时间字符串
 * @returns {number} 时间戳（毫秒），解析失败返回NaN
 * @example
 * parseTime('2023-12-01 12:00:00'); // 返回时间戳
 * parseTime('00:00:00.044'); // 返回时间戳
 */
function parseTime(timeStr) {
  // 尝试直接解析
  const date = new Date(timeStr);
  if (!isNaN(date.getTime())) {
    return date.getTime();
  }
  
  // 尝试不同的时间格式
  const patterns = [
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})(\.\d+)?$/, 
    /^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})(\.\d+)?$/, 
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?$/, 
    /^(\d{4})\/(\d{2})\/(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?$/, 
    /^(\d{2}):(\d{2}):(\d{2})(\.\d+)?$/, 
    /^(\d{4})-(\d{2})-(\d{2})$/, 
    /^(\d{4})\/(\d{2})\/(\d{2})$/  ];
  
  for (const pattern of patterns) {
    const match = timeStr.match(pattern);
    if (match) {
      if (match.length === 8) {
        // 完整日期时间（带毫秒）
        const [, year, month, day, hour, minute, second, ms] = match;
        const milliseconds = ms ? parseFloat(ms) * 1000 : 0;
        const date = new Date(year, month - 1, day, hour, minute, second, milliseconds);
        if (!isNaN(date.getTime())) {
          return date.getTime();
        }
      } else if (match.length === 7) {
        // 完整日期时间（不带毫秒）
        const [, year, month, day, hour, minute, second] = match;
        const date = new Date(year, month - 1, day, hour, minute, second);
        if (!isNaN(date.getTime())) {
          return date.getTime();
        }
      } else if (match.length === 5 && match[0].includes(':')) {
        // 只有时间（带毫秒）
        const [, hour, minute, second, ms] = match;
        const milliseconds = ms ? parseFloat(ms) * 1000 : 0;
        const date = new Date();
        date.setHours(hour, minute, second, milliseconds);
        if (!isNaN(date.getTime())) {
          return date.getTime();
        }
      } else if (match.length === 4) {
        // 只有时间（不带毫秒）
        const [, hour, minute, second] = match;
        const date = new Date();
        date.setHours(hour, minute, second, 0);
        if (!isNaN(date.getTime())) {
          return date.getTime();
        }
      } else if (match.length === 5 && !match[0].includes(':')) {
        // 只有日期
        const [, year, month, day] = match;
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          return date.getTime();
        }
      }
    }
  }
  
  return NaN;
}

/**
 * 格式化时间戳为日期时间字符串
 * @param {number} timestamp - 时间戳（毫秒）
 * @returns {string} 格式化后的日期时间字符串
 * @example
 * formatDateTime(1670000000000); // 返回 "2022-12-02T16:53"
 */
function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * 解析CSV/TXT内容为二维数组
 * @param {Array<string>} lines - 文件行数组
 * @returns {Array<Array<string>>} 解析后的数据二维数组，第一行为标题行
 * @example
 * parseCSVContent(['a,b,c', '1,2,3']); // 返回 [["a", "b", "c"], ["1", "2", "3"]]
 * parseCSVContent(['a\tb\tc', '1:2\t3:4']); // 返回 [["a", "b", "c"], ["2", "4"]]
 * parseCSVContent(['时间\t温度:25\t湿度:60']); // 返回 [["时间", "温度", "湿度"], ["25", "60"]]
 */
function parseCSVContent(lines) {
  if (lines.length === 0) return [];
  
  const data = [];
  let headerRow = [];
  let hasHeader = false;
  
  // 检查第一行是否包含冒号分隔的键值对（除了时间列）
  const firstLine = lines[0];
  if (firstLine.includes('\t')) {
    const cells = firstLine.split('\t');
    // 检查除第一列外的其他列是否包含冒号
    for (let i = 1; i < cells.length; i++) {
      if (cells[i].includes(':')) {
        hasHeader = true;
        break;
      }
    }
  }
  
  if (hasHeader) {
    // 提取标题行
    const firstLineCells = firstLine.split('\t');
    headerRow = firstLineCells.map((cell, index) => {
      if (index === 0) {
        // 第一列设置为时间列标题
        return '时间';
      }
      // 提取冒号前的部分作为标题
      if (cell.includes(':')) {
        const parts = cell.split(':');
        return parts[0].trim();
      }
      return cell.trim();
    });
    data.push(headerRow);
    
    // 处理数据行（从第一行开始，因为第一行也包含数据）
    lines.forEach(line => {
      const row = line.split('\t').map((cell, index) => {
        if (index === 0) {
          return cell.trim();
        }
        if (cell.includes(':')) {
          const parts = cell.split(':');
          return parts.slice(1).join(':').trim();
        }
        return cell.trim();
      });
      data.push(row);
    });
  } else {
    // 普通CSV格式或没有冒号分隔的格式
    lines.forEach(line => {
      let row;
      if (line.includes('\t')) {
        row = line.split('\t').map(cell => cell.trim());
      } else {
        row = line.split(',').map(cell => cell.trim());
      }
      data.push(row);
    });
  }
  
  return data;
}

/**
 * 更新状态信息
 * @param {string} message - 状态消息
 * @example
 * updateStatus('✅ 数据加载成功');
 */
function updateStatus(message) {
  const statusText = document.getElementById('statusText');
  if (statusText) {
    statusText.textContent = message;
  }
}

/**
 * 检测文件是否包含GB2312特征
 * @param {Uint8Array} buffer - 文件数据缓冲区
 * @returns {boolean} 是否包含GB2312特征
 * @example
 * hasGB2312Features(new Uint8Array([0xB0, 0xA1])); // 返回 true
 */
function hasGB2312Features(buffer) {
  let gbCount = 0;
  let totalBytes = 0;
  
  for (let i = 0; i < buffer.length - 1; i++) {
    const byte1 = buffer[i];
    const byte2 = buffer[i + 1];
    
    // 检测GB2312/GBK特征
    if ((byte1 >= 129 && byte1 <= 254) && (byte2 >= 64 && byte2 <= 254) && byte2 !== 127) {
      gbCount++;
      totalBytes += 2;
      i++;
    } else if (byte1 < 128) {
      // ASCII字符
      totalBytes += 1;
    } else {
      // 其他字符
      totalBytes += 1;
    }
  }
  
  // 如果GB2312字符占比超过10%，就认为是GB2312编码
  return gbCount > 0 && (gbCount * 2) / totalBytes > 0.1;
}

/**
 * 检测文件编码
 * @param {Uint8Array} buffer - 文件数据缓冲区
 * @returns {string} 检测到的编码
 * @example
 * detectEncoding(new Uint8Array([0xEF, 0xBB, 0xBF])); // 返回 "utf8bom"
 */
function detectEncoding(buffer) {
  if (!buffer || buffer.length === 0) return 'utf8';
  
  // 检测UTF-8 BOM
  if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    return 'utf8bom';
  }
  
  // 首先尝试UTF-8解码
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const text = decoder.decode(buffer);
    // 检查解码后的文本是否包含有效字符
    if (text.length > 0) {
      return 'utf8';
    }
  } catch (e) {
    // UTF-8解码失败，继续尝试GB18030
  }
  
  // 检测GB2312特征
  const hasGBFeatures = hasGB2312Features(buffer);
  
  if (hasGBFeatures) {
    try {
      // 尝试使用浏览器自带的TextDecoder解码GB18030（包含GB2312和GBK）
      const decoder = new TextDecoder('gb18030', { fatal: false });
      const text = decoder.decode(buffer);
      if (text.length > 0) {
        return 'gb18030';
      }
    } catch (e) {
      // 解码失败，返回utf8
    }
  }
  
  // 默认返回utf8
  return 'utf8';
}

/**
 * 解码数据
 * @param {Uint8Array} buffer - 文件数据缓冲区
 * @param {string} encoding - 编码类型
 * @returns {string} 解码后的文本
 * @example
 * decodeData(buffer, 'utf8'); // 返回解码后的文本
 */
function decodeData(buffer, encoding) {
  try {
    const enc = encoding.toLowerCase().replace('-', '');
    if (enc === 'utf8' || enc === 'utf8bom') {
      let text = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true }).decode(buffer);
      if (text.charCodeAt(0) === 65279) {
        text = text.substring(1);
      }
      return text;
    } else if (enc === 'gb2312' || enc === 'gbk' || enc === 'gb18030') {
      // 使用浏览器自带的TextDecoder尝试解码GB2312
      try {
        // 尝试使用gb18030编码（包含GB2312和GBK）
        const decoder = new TextDecoder('gb18030', { fatal: false });
        return decoder.decode(buffer);
      } catch (e) {
        // 如果浏览器不支持gb18030，则使用替代方法
        return decodeGB2312Fallback(buffer);
      }
    } else {
      return new TextDecoder('utf-8', { fatal: false, ignoreBOM: true }).decode(buffer);
    }
  } catch (error) {
    // 解码失败时使用简单的字符转换
    let text = '';
    for (let i = 0; i < buffer.length; i++) {
      text += String.fromCharCode(buffer[i]);
    }
    return text;
  }
}

/**
 * GB2312解码的备用方法
 * @param {Uint8Array} buffer - GB2312编码的缓冲区
 * @returns {string} 解码后的文本
 */
function decodeGB2312Fallback(buffer) {
  let text = '';
  let i = 0;
  
  while (i < buffer.length) {
    const byte = buffer[i];
    if (byte < 128) {
      // ASCII字符
      text += String.fromCharCode(byte);
      i++;
    } else if (byte >= 129 && byte <= 254 && i + 1 < buffer.length) {
      // GB2312双字节字符
      const nextByte = buffer[i + 1];
      
      // 尝试使用简单的映射方法
      if (byte >= 0xA1 && byte <= 0xFE && nextByte >= 0xA1 && nextByte <= 0xFE) {
        // 计算Unicode码点
        const offset = (byte - 0xA1) * 94 + (nextByte - 0xA1);
        const unicode = 0x4E00 + offset;
        if (unicode >= 0x4E00 && unicode <= 0x9FFF) {
          text += String.fromCharCode(unicode);
        } else {
          text += '?';
        }
      } else {
        text += '?';
      }
      i += 2;
    } else {
      // 无法识别的字符
      text += '?';
      i++;
    }
  }
  
  return text;
}

// 导出工具函数
export {
  parseTime,
  formatDateTime,
  parseCSVContent,
  updateStatus,
  detectEncoding,
  decodeData
}
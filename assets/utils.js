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
 * parseCSVContent(['2026-03-14 03:59:33 99.451 23.570']); // 返回 [["时间", "列1", "列2"], ["2026-03-14 03:59:33", "99.451", "23.570"]]
 */

/**
 * 预处理行，处理标题行多余TAB键的情况
 * 如果标题行以TAB开头，且数据行比标题行少一列，则去掉标题行的第一个TAB
 * @param {Array<string>} lines - 文件行数组
 * @returns {Array<string>} 处理后的行数组
 */
function preprocessLines(lines) {
  if (lines.length < 2) return lines;
  
  const firstLine = lines[0];
  // 检查标题行是否以TAB开头
  if (!firstLine.startsWith('\t')) return lines;
  
  const headerCells = firstLine.split('\t');
  const headerColCount = headerCells.length;
  
  // 检查前10行数据行的列数
  const maxCheckRows = Math.min(10, lines.length - 1);
  let dataColCount = 0;
  let allDataRowsHaveOneLessColumn = true;
  
  for (let i = 1; i <= maxCheckRows; i++) {
    const dataLine = lines[i];
    if (!dataLine || dataLine.trim() === '') continue;
    
    const dataCells = dataLine.split('\t');
    if (dataColCount === 0) {
      dataColCount = dataCells.length;
    }
    
    // 如果数据行比标题行少一列，说明标题行第一个TAB是多余的
    if (dataCells.length !== headerColCount - 1) {
      allDataRowsHaveOneLessColumn = false;
      break;
    }
  }
  
  // 如果所有数据行都比标题行少一列，去掉标题行的第一个TAB
  if (allDataRowsHaveOneLessColumn && dataColCount > 0) {
    const newFirstLine = firstLine.substring(1); // 去掉第一个TAB
    const newLines = [newFirstLine, ...lines.slice(1)];
    return newLines;
  }
  
  return lines;
}

function parseCSVContent(lines) {
  if (lines.length === 0) return [];
  
  // 预处理：处理标题行多余TAB键的情况
  const processedLines = preprocessLines(lines);
  
  const data = [];
  let headerRow = [];
  
  // 处理多行标题的情况（用户提供的格式）
  // 第一行：设备名称，第二行：参数名称，第三行：单位
  if (processedLines.length >= 3) {
    const line1 = processedLines[0];
    const line2 = processedLines[1];
    const line3 = processedLines[2];
    
    let delimiter = ',';
    if (line1.includes('\t')) delimiter = '\t';
    
    const cells1 = line1.split(delimiter).map(cell => cell.trim());
    const cells2 = line2.split(delimiter).map(cell => cell.trim());
    const cells3 = line3.split(delimiter).map(cell => cell.trim());
    
    // 检查是否为多行标题格式
    // 特征：第一行第一列为空，第二行第一列为'时间'，第三行第一列为空
    if (cells1[0] === '' && cells2[0] === '时间' && cells3[0] === '') {
      // 合并多行标题
      headerRow = [];
      for (let i = 0; i < cells1.length; i++) {
        const parts = [];
        if (cells1[i]) parts.push(cells1[i]);
        if (cells2[i]) parts.push(cells2[i]);
        if (cells3[i]) parts.push(cells3[i]);
        headerRow.push(parts.join(' ') || `列${i + 1}`);
      }
      // 第一列设置为'时间'
      headerRow[0] = '时间';
      data.push(headerRow);
      
      // 处理数据行（从第四行开始）
      for (let i = 3; i < processedLines.length; i++) {
        const line = processedLines[i];
        let row;
        if (line.includes('\t')) {
          row = line.split('\t').map(cell => cell.trim());
        } else if (line.includes(',')) {
          row = line.split(',').map(cell => cell.trim());
        } else {
          row = [line.trim()];
        }
        if (row.length > 0 && row[0].trim() !== '') {
          data.push(row);
        }
      }
      return data;
    }
  }
  
  // 检查第一行是否包含冒号分隔的键值对（除了时间列）
  const firstLine = processedLines[0];
  let hasHeader = false;
  
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
    processedLines.forEach(line => {
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
    // 检查是否为空格分隔的格式（日期 时间 数据1 数据2 ...）
    // 判断条件：第一列包含日期格式（年月日），后面是空格分隔的数值
    const isSpaceSeparated = detectSpaceSeparatedFormat(firstLine);
    
    if (isSpaceSeparated) {
       // 空格分隔的格式：解析所有行
       const firstParts = firstLine.trim().split(/\s+/);
       const numCols = firstParts.length;
       headerRow = ['时间'];
       for (let i = 1; i < numCols; i++) {
         headerRow.push(`列${i}`);
       }
       data.push(headerRow);
       
       // 处理数据行
       processedLines.forEach(line => {
         const parts = line.trim().split(/\s+/);
         if (parts.length >= 2) {
           // 第一部分是日期，第二部分是时间，合并为完整的日期时间
           const dateTime = `${parts[0]} ${parts[1]}`;
           const row = [dateTime];
           // 添加后续的数据列
           for (let i = 2; i < parts.length; i++) {
             row.push(parts[i]);
           }
           data.push(row);
         }
       });
     } else {
      // 普通CSV格式或TAB分隔的格式
      processedLines.forEach(line => {
        let row;
        if (line.includes('\t')) {
          row = line.split('\t').map(cell => cell.trim());
        } else if (line.includes(',')) {
          row = line.split(',').map(cell => cell.trim());
        } else {
          row = [line.trim()];
        }
        data.push(row);
      });
    }
  }
  
  return data;
}

/**
 * 检测是否为空格分隔的格式
 * 格式：日期 时间 数据1 数据2 ...
 * 例如：2026-03-14 03:59:33 99.451 23.570
 * @param {string} line - 待检测的行
 * @returns {boolean} 是否为空格分隔格式
 */
function detectSpaceSeparatedFormat(line) {
  const trimmed = line.trim();
  // 使用空格分割
  const parts = trimmed.split(/\s+/);
  
  // 至少需要3列（日期、时间、至少一个数据）
  if (parts.length < 3) return false;
  
  // 检查第一部分是否是日期格式（年-月-日）
  const datePattern = /^\d{4}-\d{1,2}-\d{1,2}$/;
  if (!datePattern.test(parts[0])) return false;
  
  // 检查第二部分是否是时间格式（时:分:秒）
  const timePattern = /^\d{1,2}:\d{1,2}:\d{1,2}(\.\d+)?$/;
  if (!timePattern.test(parts[1])) return false;
  
  // 检查后续部分是否都是数值
  for (let i = 2; i < parts.length; i++) {
    const num = parseFloat(parts[i]);
    if (isNaN(num)) return false;
  }
  
  return true;
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
  
  // 首先检测GB2312特征
  const hasGBFeatures = hasGB2312Features(buffer);
  
  if (hasGBFeatures) {
    try {
      // 尝试使用浏览器自带的TextDecoder解码GB18030（包含GB2312和GBK）
      const decoder = new TextDecoder('gb18030', { fatal: false });
      const text = decoder.decode(buffer);
      if (text.length > 0) {
        // 检查解码后的文本是否包含中文字符
        if (/[\u4e00-\u9fa5]/.test(text)) {
          return 'gb18030';
        }
      }
    } catch (e) {
      // 解码失败，继续尝试UTF-8
    }
  }
  
  // 尝试UTF-8解码
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const text = decoder.decode(buffer);
    // 检查解码后的文本是否包含有效字符
    if (text.length > 0) {
      return 'utf8';
    }
  } catch (e) {
    // UTF-8解码失败，返回GB18030
    return 'gb18030';
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
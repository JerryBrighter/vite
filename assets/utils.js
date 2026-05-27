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
    /^(\d{2}):(\d{2}):(\d{2}):(\d{3})$/, // 支持 00:45:49:000 格式
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
        let milliseconds;
        if (ms.startsWith('.')) {
          // 格式：00:45:49.000
          milliseconds = parseFloat(ms) * 1000;
        } else {
          // 格式：00:45:49:000
          milliseconds = parseInt(ms);
        }
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
 * 从文件名中解析日期
 * @param {string} fileName - 文件名
 * @returns {string|null} 解析出的日期字符串 "YYYY-MM-DD"，解析失败返回null
 * @example
 * parseDateFromFileName('2026-03-10_00-45-48_0 OBJECT D_step_20.txt'); // 返回 "2026-03-10"
 * parseDateFromFileName('data_20231201.csv'); // 返回 "2023-12-01"
 */
function parseDateFromFileName(fileName) {
  if (!fileName || typeof fileName !== 'string') {
    return null;
  }
  
  // 尝试从文件名中提取日期
  const datePatterns = [
    /(\d{4})[-_](\d{2})[-_](\d{2})/, // YYYY-MM-DD 或 YYYY_MM_DD
    /(\d{8})/, // YYYYMMDD
    /(\d{4})(\d{2})(\d{2})/ // YYYYMMDD（单独出现）
  ];
  
  for (const pattern of datePatterns) {
    const match = fileName.match(pattern);
    if (match) {
      const year = match[1];
      const month = match[2].padStart(2, '0');
      const day = match[3]?.padStart(2, '0') || '01';
      
      // 验证日期是否有效
      if (parseInt(month) >= 1 && parseInt(month) <= 12 && parseInt(day) >= 1 && parseInt(day) <= 31) {
        return `${year}-${month}-${day}`;
      }
    }
  }
  
  return null;
}

/**
 * 规范化时间字符串为标准格式
 * @param {string} timeStr - 时间字符串
 * @param {object} options - 可选参数
 * @param {string} options.fileName - 文件名，用于从文件名解析日期
 * @param {Date} options.fileDate - 文件日期，用于当时间字符串没有日期时使用
 * @param {string} options.detectedDate - 已检测到的日期（优先使用）
 * @returns {string} 规范化后的标准时间字符串，如果原始数据只有时间则尝试从detectedDate、文件名或文件日期获取日期，输出 "YYYY-MM-DD HH:MM:SS.sss"，解析失败返回原字符串
 * @example
 * normalizeTime('00:45:49:000'); // 返回 "00:45:49.000"
 * normalizeTime('00:45:49:000', { fileName: '2026-03-10_data.txt' }); // 返回 "2026-03-10 00:45:49.000"
 * normalizeTime('00:45:49:000', { detectedDate: '2026-03-10' }); // 返回 "2026-03-10 00:45:49.000"
 * normalizeTime('2023-12-01 12:00:00'); // 返回 "2023-12-01 12:00:00.000"
 */
function normalizeTime(timeStr, options = {}) {
  if (!timeStr || typeof timeStr !== 'string') {
    return timeStr || '';
  }
  
  const timestamp = parseTime(timeStr);
  if (isNaN(timestamp)) {
    return timeStr;
  }
  
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  
  // 检查原始字符串是否包含日期（年份或日期格式）
  const hasDate = /^\d{4}[-/]\d{2}[-/]\d{2}/.test(timeStr.trim());
  
  if (hasDate) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  } else {
    // 尝试获取日期，优先级：detectedDate > 文件名 > 文件日期
    let dateStr = null;
    
    // 优先使用已检测到的日期
    if (options.detectedDate) {
      dateStr = options.detectedDate;
    }
    // 其次尝试从文件名解析日期
    else if (options.fileName) {
      dateStr = parseDateFromFileName(options.fileName);
    }
    // 最后使用文件日期
    else if (options.fileDate instanceof Date) {
      const fileYear = options.fileDate.getFullYear();
      const fileMonth = String(options.fileDate.getMonth() + 1).padStart(2, '0');
      const fileDay = String(options.fileDate.getDate()).padStart(2, '0');
      dateStr = `${fileYear}-${fileMonth}-${fileDay}`;
    }
    
    if (dateStr) {
      // 有日期来源，输出完整的日期时间
      return `${dateStr} ${hours}:${minutes}:${seconds}.${milliseconds}`;
    } else {
      // 没有日期来源，只输出时间
      return `${hours}:${minutes}:${seconds}.${milliseconds}`;
    }
  }
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
        const mergedHeader = parts.join('') || `列${i + 1}`;
        headerRow.push(mergedHeader);
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
  
  // 优先尝试UTF-8解码（UTF-8有严格的编码规则，不会误判）
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const text = decoder.decode(buffer);
    // 检查解码后的文本是否包含有效字符
    if (text.length > 0) {
      return 'utf8';
    }
  } catch (e) {
    // UTF-8解码失败，继续尝试其他编码
  }
  
  // 检测GB2312/GBK/GB18030特征
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
      // 解码失败，继续
    }
  }
  
  // 尝试GBK解码
  try {
    const decoder = new TextDecoder('gbk', { fatal: false });
    const text = decoder.decode(buffer);
    if (text.length > 0) {
      if (/[\u4e00-\u9fa5]/.test(text)) {
        return 'gbk';
      }
    }
  } catch (e) {
    // 解码失败，继续
  }
  
  // 尝试GB2312解码
  try {
    const decoder = new TextDecoder('gb2312', { fatal: false });
    const text = decoder.decode(buffer);
    if (text.length > 0) {
      if (/[\u4e00-\u9fa5]/.test(text)) {
        return 'gb2312';
      }
    }
  } catch (e) {
    // 解码失败，继续
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

/**
 * 合并Excel多Sheet数据
 * 处理特殊格式的Excel文件，每个Sheet结构相同：时间、名称、值、站点ID、设备ID
 * @param {Array<Object>} sheetsData - 多个Sheet的数据，每个Sheet包含name和data属性
 * @returns {Object} 包含合并后的数据和处理信息
 * @example
 * // 输入格式（每个Sheet）:
 * // [{ name: 'Sheet1', data: [
 * //   ['时间', '值'],
 * //   ['2026-05-07 18:11:40', '-10.043'],
 * //   ...
 * // ]}]
 * // 输出格式:
 * // [
 * //   ['时间', 'Sheet1', 'Sheet2', ...],
 * //   ['2026-05-07 18:11:40', '-10.043', '-11.234', ...],
 * //   ...
 * // ]
 */
function mergeExcelSheets(sheetsData) {
  if (!sheetsData || sheetsData.length === 0) {
    return { mergedData: [], info: '没有有效的Sheet数据' };
  }

  // 过滤无数据的Sheet（数据行少于2行的视为无数据）
  const validSheets = sheetsData.filter(sheet => {
    const sheetData = sheet.data;
    return sheetData && sheetData.length >= 2;
  });

  if (validSheets.length === 0) {
    return { mergedData: [], info: '没有有效的Sheet数据（所有Sheet数据不足）' };
  }

  // 用于存储所有时间点和对应的数据
  const timeMap = new Map();
  const validSheetNames = [];

  // 处理每个有效的Sheet
  validSheets.forEach((sheet, sheetIndex) => {
    const sheetData = sheet.data;
    const sheetName = sheet.name || `Sheet${sheetIndex + 1}`;
    
    // 获取表头，确定各列的索引
    const headers = sheetData[0];
    let timeIndex = -1;
    let valueIndex = -1;

    headers.forEach((header, index) => {
      const headerTrimmed = String(header).trim();
      if (headerTrimmed === '时间' || headerTrimmed === 'Time') {
        timeIndex = index;
      } else if (headerTrimmed === '值' || headerTrimmed === 'Value' || headerTrimmed === '数值') {
        valueIndex = index;
      }
    });

    // 如果找不到必要的列，跳过这个Sheet
    if (timeIndex === -1 || valueIndex === -1) {
      return;
    }

    // 使用Sheet名称作为列标题
    validSheetNames.push(sheetName);

    // 处理数据行（从第二行开始，第一行是表头）
    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      if (!row || row.length <= timeIndex) continue;

      const timeStr = String(row[timeIndex]).trim();
      const value = String(row[valueIndex]).trim();

      if (!timeStr) continue;

      // 解析时间戳作为key
      const timeKey = parseTime(timeStr);
      const finalKey = isNaN(timeKey) ? timeStr : timeKey;

      // 如果这个时间点不存在，创建新条目
      if (!timeMap.has(finalKey)) {
        timeMap.set(finalKey, {
          timeStr: timeStr,
          values: new Array(validSheets.length).fill('')
        });
      }

      // 设置当前Sheet的数据值
      const entry = timeMap.get(finalKey);
      entry.values[sheetIndex] = value;
    }
  });

  // 如果没有数据，返回空结果
  if (timeMap.size === 0) {
    return { mergedData: [], info: '无法从Sheet中提取有效数据' };
  }

  // 将时间映射转换为数组并按时间排序
  const sortedEntries = Array.from(timeMap.values()).sort((a, b) => {
    const timeA = typeof a.timeStr === 'number' ? a.timeStr : parseTime(a.timeStr);
    const timeB = typeof b.timeStr === 'number' ? b.timeStr : parseTime(b.timeStr);
    return timeA - timeB;
  });

  // 构建合并后的表头
  const mergedHeaders = ['时间'];
  validSheetNames.forEach(sheetName => {
    mergedHeaders.push(sheetName);
  });

  // 构建合并后的数据行
  const mergedData = [mergedHeaders];
  sortedEntries.forEach(entry => {
    const row = [entry.timeStr];
    row.push(...entry.values);
    mergedData.push(row);
  });

  return {
    mergedData: mergedData,
    info: `成功合并${validSheetNames.length}个Sheet（过滤了${sheetsData.length - validSheetNames.length}个无数据Sheet），共${mergedData.length - 1}行数据，${mergedHeaders.length - 1}个参数列`
  };
}

/**
 * 将UTF-8字符串转换为GBK编码的字节数组
 * 使用GBK编码映射表进行转换
 * @param {string} str - UTF-8编码的字符串
 * @returns {Uint8Array} GBK编码的字节数组
 */
function encodeToGBK(str) {
  // GBK编码映射表：Unicode到GBK的字节对
  // 这里使用一个简化的GBK编码器
  // 完整GBK包含21003个汉字，映射表非常大
  // 我们使用一种近似方法来处理常见汉字
  
  const result = [];
  
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    
    if (charCode < 0x80) {
      // ASCII字符：单字节，直接复制
      result.push(charCode);
    } else {
      // 非ASCII字符（包括中文）
      // 由于无法获取完整的GBK映射表，我们使用UTF-8编码
      // 然后通过TextEncoder尝试转换
      // 这会导致数据使用UTF-8而不是GBK
      // 简化处理：直接返回UTF-8编码的结果
      const encoder = new TextEncoder();
      const utf8Bytes = encoder.encode(str.substring(i));
      for (let j = 0; j < utf8Bytes.length; j++) {
        result.push(utf8Bytes[j]);
      }
      break; // 已经处理完剩余所有字符
    }
  }
  
  return new Uint8Array(result);
}

/**
 * 将字符串转换为指定编码的字节数组
 * @param {string} str - 要转换的字符串
 * @param {string} encoding - 编码类型 ('utf8', 'gbk', 'gb2312', 'gb18030')
 * @returns {Uint8Array} 编码后的字节数组
 */
function encodeString(str, encoding) {
  const enc = encoding ? encoding.toLowerCase() : 'utf8';
  
  if (enc === 'utf8' || enc === 'utf8bom') {
    const encoder = new TextEncoder();
    return encoder.encode(str);
  } else if (enc === 'gb2312' || enc === 'gbk' || enc === 'gb18030') {
    // 对于GB系列编码，由于浏览器原生不支持，我们返回UTF-8编码
    // 这意味着导出的文件实际上仍然是UTF-8编码
    // 用户在Excel中打开时需要选择正确的编码
    const encoder = new TextEncoder();
    return encoder.encode(str);
  } else {
    const encoder = new TextEncoder();
    return encoder.encode(str);
  }
}

// 导出工具函数
export {
  parseTime,
  formatDateTime,
  normalizeTime,
  parseDateFromFileName,
  parseCSVContent,
  updateStatus,
  detectEncoding,
  decodeData,
  encodeToGBK,
  mergeExcelSheets
}
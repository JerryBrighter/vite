import { readFileSync } from 'fs';

// 复制parseCSVLine函数
function parseCSVLine(line, delimiter = ',') {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

// 复制hasTimeRelatedText函数
function hasTimeRelatedText(value) {
  const timeKeywords = ['时间', '日期', 'time', 'date', '时刻', 'timestamp'];
  const lowerValue = value.toLowerCase();
  return timeKeywords.some(keyword => lowerValue.includes(keyword.toLowerCase()));
}

// 复制修改后的isTimeValue函数
function isTimeValue(value) {
  // 首先检查是否为数字（包括浮点数）
  if (!isNaN(Number(value)) && value.trim() !== '') {
    return false;
  }
  
  // 检查是否包含时间格式的特殊字符
  const hasTimeSpecialChars = /[:_T]/.test(value) || (/-/.test(value) && /\d{4}-\d{2}-\d{2}/.test(value));
  if (!hasTimeSpecialChars) {
    return false;
  }
  
  // 更严格的时间格式正则表达式
  const timeRegex = /^\d{4}[-/]?\d{2}[-/]?\d{2}\s?\d{2}[:.]?\d{2}[:.]?\d{2}[:.]?\d{0,3}$|^\d{2}[:.]?\d{2}[:.]?\d{2}[:.]?\d{0,3}$|^\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}_\d{0,3}$|^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[.:]?\d{0,3}$/;
  // 先尝试正则表达式匹配
  if (value && timeRegex.test(value)) {
    return true;
  }
  // 再尝试Date对象解析，但只对包含日期格式的字符串进行解析
  if (/-/.test(value) || /:/g.test(value).length >= 2) {
    try {
      const date = new Date(value);
      return !isNaN(date.getTime());
    } catch (e) {
      return false;
    }
  }
  return false;
}

// 复制isHeaderRow函数
function isHeaderRow(row, delimiter) {
  const parsedRow = parseCSVLine(row, delimiter);
  let hasNumber = false;
  let hasTimeText = false;
  let hasText = false;
  let hasTimestamp = false;
  let hasDataValue = false;
  let hasChineseText = false;
  
  console.log('解析行:', parsedRow);
  
  for (const cell of parsedRow) {
    const value = cell?.trim();
    if (value) {
      // 检查是否包含时间相关的文字（时间标题）
      if (hasTimeRelatedText(value)) {
        hasTimeText = true;
        console.log('包含时间相关文字:', value);
      }
      // 检查是否包含中文字符
      if (value.match(/[\u4e00-\u9fa5]/)) {
        hasChineseText = true;
        console.log('包含中文字符:', value);
      }
      // 检查是否包含文字值（非数字）
      if (isNaN(Number(value))) {
        hasText = true;
        console.log('包含文字值:', value);
      } else {
        // 检查是否包含数字值（包括0的数值）
        hasNumber = true;
        console.log('包含数字值:', value);
        // 标题行中可能包含数字（如序号），但不会包含时间戳
        // 只有当同时包含时间戳时，才认为是数据值
      }
      // 检查是否包含时间戳（数据行中的时间数据）
      if (isTimeValue(value)) {
        hasTimestamp = true;
        hasDataValue = true;
        console.log('包含时间戳:', value);
      }
    }
  }
  
  // 标题行判断逻辑：
  // 1. 如果包含时间戳，不是标题行
  // 2. 如果包含中文字符，很可能是标题行
  // 3. 如果包含时间相关文字，很可能是标题行
  // 4. 如果只包含数字和文字，可能是标题行
  const isHeader = !hasDataValue && (hasChineseText || hasTimeText || hasText);
  console.log(`判断结果: ${isHeader} (hasDataValue: ${hasDataValue}, hasChineseText: ${hasChineseText}, hasTimeText: ${hasTimeText}, hasText: ${hasText})`);
  return isHeader;
}

// 复制mergeHeaderRows函数
function mergeHeaderRows(headerRows) {
  if (!headerRows || headerRows.length === 0) {
    return ['列1'];
  }
  
  // 找到最大列数
  const maxCols = Math.max(...headerRows.map(row => row.length));
  const mergedHeaders = [];
  
  // 逐列处理
  for (let col = 0; col < maxCols; col++) {
    let mergedText = [];
    // 遍历所有标题行的当前列
    for (let row = 0; row < headerRows.length; row++) {
      // 获取当前行列的内容，去空格
      const cellText = (headerRows[row][col] || '').trim().replace(/\s+/g, '');
      if (cellText) {
        mergedText.push(cellText);
      }
    }
    // 如果合并后为空，用默认列名
    mergedHeaders.push(mergedText.join('') || `列${col + 1}`);
  }
  
  return mergedHeaders;
}

// 测试test_gb2312_real.csv文件的标题行检测
console.log('测试test_gb2312_real.csv文件的标题行检测:');
try {
  const buffer = readFileSync('test_gb2312_real.csv');
  const content = buffer.toString('utf8');
  const rows = content.split(/\r?\n/).filter(row => row.trim() !== '');
  
  console.log(`文件共有${rows.length}行`);
  
  // 检测分隔符
  const delimiter = ',';
  console.log(`使用分隔符: ${delimiter}`);
  
  // 检测标题行
  let headerRowCount = 0;
  for (let i = 0; i < Math.min(5, rows.length - 1); i++) {
    console.log(`\n检查第${i + 1}行:`);
    console.log(`原始行: ${rows[i]}`);
    if (isHeaderRow(rows[i], delimiter)) {
      headerRowCount++;
      console.log(`第${i + 1}行被识别为标题行`);
    } else {
      console.log(`第${i + 1}行不是标题行，停止检测`);
      break;
    }
  }
  
  console.log(`\n共识别出${headerRowCount}行标题行`);
  
  // 合并标题行
  if (headerRowCount > 0) {
    const headerRows = rows.slice(0, headerRowCount);
    const parsedHeaderRows = headerRows.map(row => parseCSVLine(row, delimiter));
    const mergedHeaders = mergeHeaderRows(parsedHeaderRows);
    console.log('\n合并后的标题行:');
    console.log(mergedHeaders);
  }
} catch (error) {
  console.error('测试失败:', error.message);
  console.error('错误堆栈:', error.stack);
}

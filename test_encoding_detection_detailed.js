import { readFileSync } from 'fs';

// 复制修改后的containsGB2312Features函数
function containsGB2312Features(uint8Array) {
  // 检查是否包含GB2312/GBK双字节字符模式
  let gbCharCount = 0;
  let utf8CharCount = 0;
  
  for (let i = 0; i < uint8Array.length - 1; i++) {
    const byte1 = uint8Array[i];
    const byte2 = uint8Array[i + 1];
    
    // 检查是否是UTF-8多字节字符
    // UTF-8 多字节字符的特征：
    // 2字节: 0xC0-0xDF 后跟 0x80-0xBF
    // 3字节: 0xE0-0xEF 后跟 0x80-0xBF 后跟 0x80-0xBF
    // 4字节: 0xF0-0xF7 后跟 0x80-0xBF 后跟 0x80-0xBF 后跟 0x80-0xBF
    if ((byte1 >= 0xC0 && byte1 <= 0xDF && byte2 >= 0x80 && byte2 <= 0xBF) ||
        (byte1 >= 0xE0 && byte1 <= 0xEF && i + 2 < uint8Array.length && 
         byte2 >= 0x80 && byte2 <= 0xBF && uint8Array[i + 2] >= 0x80 && uint8Array[i + 2] <= 0xBF)) {
      utf8CharCount++;
      // 跳过UTF-8多字节字符的后续字节
      if (byte1 >= 0xE0) {
        i += 2;
      } else {
        i += 1;
      }
    }
    // GB2312/GBK双字节字符的特征：
    // 第一个字节：0x81-0xFE
    // 第二个字节：0x40-0xFE（除了0x7F）
    else if (byte1 >= 0x81 && byte1 <= 0xFE && byte2 >= 0x40 && byte2 <= 0xFE && byte2 !== 0x7F) {
      gbCharCount++;
      i += 1;
    }
  }
  
  console.log(`UTF-8字符数: ${utf8CharCount}, GB2312字符数: ${gbCharCount}`);
  
  // 如果UTF-8字符数大于GB2312字符数，认为是UTF-8编码
  if (utf8CharCount > gbCharCount) {
    return false;
  }
  
  // 如果找到至少3个GB2312双字节字符模式，才认为是GB2312编码
  return gbCharCount >= 3;
}

// 复制修改后的autoDetectEncoding函数
function autoDetectEncoding(uint8Array, type) {
  let content = '';
  let detectedEncoding = '';
  
  // 检测UTF-8 BOM
  if (uint8Array.length >= 3 && uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
    content = new TextDecoder('utf-8').decode(uint8Array);
    content = content.substring(1); // 移除BOM
    detectedEncoding = 'utf8bom';
  } 
  // 按照优先级尝试解码：GB2312 > GBK > UTF-8
  else {
    // 1. 首先检查是否包含GB2312特征
    const hasGB2312Features = containsGB2312Features(uint8Array);
    console.log('是否包含GB2312特征:', hasGB2312Features);
    
    if (hasGB2312Features) {
      // 尝试GB2312解码
      try {
        content = decodeBuffer(uint8Array, 'gb2312');
        detectedEncoding = 'gb2312';
      } catch (e1) {
        // 尝试GBK解码
        try {
          content = decodeBuffer(uint8Array, 'gbk');
          detectedEncoding = 'gbk';
        } catch (e2) {
          // 解码失败，尝试UTF-8
          try {
            const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
            content = utf8Decoder.decode(uint8Array);
            detectedEncoding = 'utf8';
          } catch (e3) {
            // 最终降级到UTF-8
            content = decodeBuffer(uint8Array, 'utf8');
            detectedEncoding = 'utf8';
          }
        }
      }
    } else {
      // 不包含GB2312特征，尝试UTF-8解码
      try {
        const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
        content = utf8Decoder.decode(uint8Array);
        detectedEncoding = 'utf8';
      } catch (e2) {
        // 最终降级到UTF-8
        content = decodeBuffer(uint8Array, 'utf8');
        detectedEncoding = 'utf8';
      }
    }
  }
  
  console.log(`检测到的编码: ${detectedEncoding}`);
  return detectedEncoding;
}

// 复制decodeBuffer函数
function decodeBuffer(uint8Array, encoding) {
  try {
    // 统一编码名称格式
    const enc = encoding.toLowerCase().replace('-', '');
    
    // 处理UTF-8编码
    if (enc === 'utf8' || enc === 'utf8bom' || enc === 'utf8') {
      const decoder = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true });
      let content = decoder.decode(uint8Array);
      // 处理UTF8 BOM
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.substring(1);
      }
      return content;
    }
    
    // 处理GB2312/GBK/GB18030编码
    else if (enc === 'gb2312' || enc === 'gbk' || enc === 'gb18030') {
      return decodeGB(uint8Array);
    }
    
    // 默认使用UTF-8
    else {
      const decoder = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true });
      return decoder.decode(uint8Array);
    }
  } catch (e) {
    // 终极降级处理
    let text = '';
    for (let i = 0; i < uint8Array.length; i++) {
      text += String.fromCharCode(uint8Array[i]);
    }
    return text;
  }
}

// 复制decodeGB函数
function decodeGB(uint8Array) {
  let text = '';
  let i = 0;
  
  // 扩展GBK编码表，增加常用中文字符
  const extendedGbkTable = {
    // 常用中文标题字符
    0xD2B5: '功', 0xC1A6: '率', 0xC8AB: '全', 0xD0C5: '信', 0xBAF7: '号',
    0xBDE3: '解', 0xC2EB: '译', 0xD2C7: '码', 0xCFB5: '载', 0xB2A8: '波',
    0xCBF8: '锁', 0xB6A8: '定', 0xC2EB: '误', 0xD1C7: '码', 0xD4AA: '元',
    0xC6AC: '偏', 0xD2C0: '移', 0xD6B1: '直', 0xC1F7: '流', 0xC6B4: '偏',
    0xD6C6: '置', 0xB0B2: '幅', 0xB6C8: '度', 0xB2BB: '不', 0xC6BD: '平',
    0xBAE2: '衡', 0xCFE0: '相', 0xCEBB: '位', 0xD7EE: '累', 0xBCB3: '计',
    0xD7DB: '总', 0xB1C8: '比', 0xCAFD: '特', 0xCAF6: '数', 0xB3A3: '误',
    0xD5D9: '接', 0xCA85: '收', 0xD58D: '帧', 0xCAFD: '数', 0xB4B9: '丢',
    0xCDB7: '头', 0xD7D3: '总', 0xCAFD: '数', 0xB2EC: '错', 0xCEF3: '误',
    0xB0E6: '包', 0xBEF8: '可', 0xBEF9: '纠', 0xB6A8: '定', 0xD7F7: '作',
    0xD3C3: '用', 0xC8A8: '示', 0xB8F6: '个', 0xD4AA: '元', 0xC9CF: '成',
    0xBDD3: '组', 0xC4BF: '部', 0xB7D6: '分', 0xD0D4: '值', 0xB5C4: '的',
    0xBCF5: '简', 0xB5A5: '单', 0xC3E6: '格', 0xCFBC: '式', 0xCEAA: '列',
    0xB1FA: '表', 0xB1EA: '行', 0xCDB7: '头', 0xC4CF: '处', 0xC0ED: '理',
    ...gbkTable
  };
  
  while (i < uint8Array.length) {
    const byte1 = uint8Array[i];
    
    // ASCII字符（0x00-0x7F）
    if (byte1 < 0x80) {
      text += String.fromCharCode(byte1);
      i++;
    }
    // 双字节字符（0x81-0xFE）
    else if (byte1 >= 0x81 && byte1 <= 0xFE && i + 1 < uint8Array.length) {
      const byte2 = uint8Array[i + 1];
      // 计算GBK编码的码点
      const code = (byte1 << 8) | byte2;
      // 尝试从扩展GBK表中查找
      if (extendedGbkTable[code]) {
        text += extendedGbkTable[code];
      } else {
        // 对于未找到的字符，使用更合理的处理
        // 检查是否为有效的GB2312范围
        if (byte1 >= 0xA1 && byte1 <= 0xFE && byte2 >= 0xA1 && byte2 <= 0xFE) {
          // 尝试使用Unicode映射
          // 这是一个简化的映射，实际GB2312到Unicode的映射更复杂
          let unicode = 0x4E00;
          if (byte1 >= 0xA1 && byte1 <= 0xFE) {
            unicode += (byte1 - 0xA1) * 94;
          }
          if (byte2 >= 0xA1 && byte2 <= 0xFE) {
            unicode += (byte2 - 0xA1);
          }
          // 确保Unicode在合理范围内
          if (unicode >= 0x4E00 && unicode <= 0x9FFF) {
            text += String.fromCharCode(unicode);
          } else {
            text += '?';
          }
        } else {
          text += '?';
        }
      }
      i += 2;
    }
    // 无效字节
    else {
      text += String.fromCharCode(byte1);
      i++;
    }
  }
  
  return text;
}

// 复制gbkTable
const gbkTable = {
  0xB0A1: '啊', 0xB0A2: '阿', 0xB0A3: '埃', 0xB0A4: '挨', 0xB0A5: '哎',
  0xB0A6: '唉', 0xB0A7: '哀', 0xB0A8: '皑', 0xB0A9: '癌', 0xB0AA: '蔼',
  // 省略大量映射
  0xD7F9: '做', 0xD7FA: '坐', 0xD7FB: '作', 0xD7FC: '昨', 0xD7FD: '左',
  0xD7FE: '佐', 0xD7FF: '撮'
};

// 测试test_gb2312_real.csv文件
console.log('测试test_gb2312_real.csv文件的编码检测:');
try {
  const buffer = readFileSync('test_gb2312_real.csv');
  const uint8Array = new Uint8Array(buffer);
  const detectedEncoding = autoDetectEncoding(uint8Array, 'data');
  console.log(`\n最终检测到的编码: ${detectedEncoding}`);
  
  // 尝试用检测到的编码解码
  if (detectedEncoding === 'utf8' || detectedEncoding === 'utf8bom') {
    const decoder = new TextDecoder('utf-8', { ignoreBOM: true });
    const content = decoder.decode(uint8Array);
    console.log('\nUTF-8解码结果:');
    console.log(content.substring(0, 200));
  } else if (detectedEncoding === 'gb2312' || detectedEncoding === 'gbk') {
    const content = decodeBuffer(uint8Array, detectedEncoding);
    console.log(`\n${detectedEncoding.toUpperCase()}解码结果:`);
    console.log(content.substring(0, 200));
  }
} catch (error) {
  console.error('测试失败:', error.message);
  console.error('错误堆栈:', error.stack);
}

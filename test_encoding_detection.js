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

// 复制autoDetectEncoding函数的核心逻辑
function autoDetectEncoding(uint8Array) {
  let detectedEncoding = '';
  
  // 检测UTF-8 BOM
  if (uint8Array.length >= 3 && uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
    detectedEncoding = 'utf8bom';
  } 
  // 按照优先级尝试解码：GB2312 > GBK > UTF-8
  else {
    // 检查是否包含GB2312特征
    const hasGB2312Features = containsGB2312Features(uint8Array);
    console.log(`是否包含GB2312特征: ${hasGB2312Features}`);
    
    if (hasGB2312Features) {
      // 尝试GB2312解码
      detectedEncoding = 'gb2312';
    } else {
      // 尝试UTF-8解码
      try {
        const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
        utf8Decoder.decode(uint8Array);
        detectedEncoding = 'utf8';
      } catch (e2) {
        // 最终降级到UTF-8
        detectedEncoding = 'utf8';
      }
    }
  }
  
  return detectedEncoding;
}

// 测试test_gb2312_real.csv文件
console.log('测试test_gb2312_real.csv文件的编码检测:');
try {
  const buffer = readFileSync('test_gb2312_real.csv');
  const uint8Array = new Uint8Array(buffer);
  const detectedEncoding = autoDetectEncoding(uint8Array);
  console.log(`检测到的编码: ${detectedEncoding}`);
  
  // 尝试用检测到的编码解码
  if (detectedEncoding === 'utf8' || detectedEncoding === 'utf8bom') {
    const decoder = new TextDecoder('utf-8', { ignoreBOM: true });
    const content = decoder.decode(uint8Array);
    console.log('\n解码结果:');
    console.log(content.substring(0, 200));
  }
} catch (error) {
  console.error('测试失败:', error.message);
}

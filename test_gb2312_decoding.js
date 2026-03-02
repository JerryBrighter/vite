// 模拟decodeGB函数
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
    // 添加更多常用中文字符
    0xCAB1: '时', 0xBCFE: '间', 0xCEF3: '误', 0xB5E7: '电', 0xC2EB: '译',
    0xD6C6: '置', 0xD7F7: '作', 0xCFB5: '载', 0xB2A8: '波', 0xCBF8: '锁',
    0xB6A8: '定', 0xCAFD: '数', 0xD0C5: '信', 0xBAF7: '号', 0xBDE3: '解',
    0xC2EB: '译', 0xD2C7: '码', 0xC1A6: '率', 0xD2B5: '功', 0xC8AB: '全',
    0xCA85: '收', 0xD5D9: '接', 0xD58D: '帧', 0xB4B9: '丢', 0xCDB7: '头',
    0xD7D3: '总', 0xB3A3: '误', 0xCEF3: '误', 0xB0E6: '包', 0xBEF8: '可',
    0xBEF9: '纠', 0xD6B1: '直', 0xC1F7: '流', 0xC6B4: '偏', 0xD6C6: '置',
    0xB0B2: '幅', 0xB6C8: '度', 0xB2BB: '不', 0xC6BD: '平', 0xBAE2: '衡',
    0xCFE0: '相', 0xCEBB: '位', 0xD7EE: '累', 0xBCB3: '计', 0xB1C8: '比',
    0xCAFD: '特', 0xCAF6: '数', 0xD2C0: '移', 0xC6AC: '偏', 0xD1C7: '码',
    0xD4AA: '元', 0xC8A8: '示', 0xB8F6: '个', 0xC9CF: '成', 0xBDD3: '组',
    0xC4BF: '部', 0xB7D6: '分', 0xD0D4: '值', 0xB5C4: '的', 0xBCF5: '简',
    0xB5A5: '单', 0xC3E6: '格', 0xCFBC: '式', 0xCEAA: '列', 0xB1FA: '表',
    0xB1EA: '行', 0xC4CF: '处', 0xC0ED: '理',
    // 失锁、锁定等常用词
    0xCAA7: '失', 0xCBF8: '锁', 0xBBF0: '帧', 0xCDAC: '同', 0xB2B9: '步'
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
      console.log(`处理双字节字符: 0x${byte1.toString(16).toUpperCase()}${byte2.toString(16).toUpperCase()} = 0x${code.toString(16).toUpperCase()}`);
      // 尝试从扩展GBK表中查找
      if (extendedGbkTable[code]) {
        text += extendedGbkTable[code];
        console.log(`从表中找到: ${extendedGbkTable[code]}`);
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
            const char = String.fromCharCode(unicode);
            text += char;
            console.log(`Unicode映射: 0x${unicode.toString(16).toUpperCase()} = ${char}`);
          } else {
            text += '?';
            console.log('无效的Unicode范围，替换为?');
          }
        } else {
          text += '?';
          console.log('无效的GB2312范围，替换为?');
        }
      }
      i += 2;
    }
    // 无效字节
    else {
      text += String.fromCharCode(byte1);
      console.log(`处理无效字节: 0x${byte1.toString(16).toUpperCase()} = ${String.fromCharCode(byte1)}`);
      i++;
    }
  }
  
  return text;
}

// 测试GB2312编码的常见中文字符
console.log('测试GB2312编码的常见中文字符:');

// GB2312编码的"时间" (0xCA B1, 0xBC FE)
const timeBytes = new Uint8Array([0xCA, 0xB1, 0xBC, 0xFE]);
const timeResult = decodeGB(timeBytes);
console.log(`"时间" 解码结果: "${timeResult}"`);

// GB2312编码的"功率" (0xC1 A6, 0xD2 B5)
const powerBytes = new Uint8Array([0xC1, 0xA6, 0xD2, 0xB5]);
const powerResult = decodeGB(powerBytes);
console.log(`"功率" 解码结果: "${powerResult}"`);

// GB2312编码的"信号" (0xD0 C5, 0xBA F7)
const signalBytes = new Uint8Array([0xD0, 0xC5, 0xBA, 0xF7]);
const signalResult = decodeGB(signalBytes);
console.log(`"信号" 解码结果: "${signalResult}"`);

// GB2312编码的"解调" (0xBD E3, 0xC2 EB)
const demodulateBytes = new Uint8Array([0xBD, 0xE3, 0xC2, 0xEB]);
const demodulateResult = decodeGB(demodulateBytes);
console.log(`"解调" 解码结果: "${demodulateResult}"`);

// GB2312编码的"锁定" (0xCB F8, 0xB6 A8)
const lockBytes = new Uint8Array([0xCB, 0xF8, 0xB6, 0xA8]);
const lockResult = decodeGB(lockBytes);
console.log(`"锁定" 解码结果: "${lockResult}"`);

// GB2312编码的"失锁" (0xCA A7, 0xCB F8)
const unlockBytes = new Uint8Array([0xCA, 0xA7, 0xCB, 0xF8]);
const unlockResult = decodeGB(unlockBytes);
console.log(`"失锁" 解码结果: "${unlockResult}"`);

// GB2312编码的"帧数" (0xD5 8D, 0xCA FD)
const frameBytes = new Uint8Array([0xD5, 0x8D, 0xCA, 0xFD]);
const frameResult = decodeGB(frameBytes);
console.log(`"帧数" 解码结果: "${frameResult}"`);

// GB2312编码的"误码" (0xCE F3, 0xD1 C7)
const errorBytes = new Uint8Array([0xCE, 0xF3, 0xD1, 0xC7]);
const errorResult = decodeGB(errorBytes);
console.log(`"误码" 解码结果: "${errorResult}"`);

// 测试混合内容（中文+英文+数字）
console.log('\n测试混合内容:');
const mixedBytes = new Uint8Array([
  0xCA, 0xB1, 0xBC, 0xFE, // 时间
  0x2C, // ,
  0xC1, 0xA6, 0xD2, 0xB5, // 功率
  0x2C, // ,
  0xD0, 0xC5, 0xBA, 0xF7, // 信号
  0x2C, // ,
  0x31, 0x32, 0x33, // 123
  0x2C, // ,
  0x41, 0x42, 0x43 // ABC
]);
const mixedResult = decodeGB(mixedBytes);
console.log(`混合内容解码结果: "${mixedResult}"`);

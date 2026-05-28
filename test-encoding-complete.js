// 测试完整的编码检测流程
import { detectEncoding, decodeData, parseCSVContent } from './assets/utils.js';

// 模拟包含汉字的TXT文件内容
const testContent = `23:29:49.508	板卡槽位号:解调1	板卡工作电压:12.0862	温度_K7:50	电流_K7:2.0775	电压_K7:0.99625	温度_V70:44	电流_V70:2.8225	电压_V70:0.995	温度_V71:49	电流_V71:10.525	电压_V71:0.98375	板卡工作电流_K7:3.3765	中频工作状态:设置正常	AGC时常数反馈:null	外频标状态:故障	信号电平:0	模拟AGC响应的控制电压:10.565`;

// 测试编码检测的完整流程
function testCompleteEncodingDetection() {
  console.log('=== 测试完整的编码检测流程 ===');
  
  // 1. 模拟文件上传（UTF-8编码）
  console.log('1. 模拟UTF-8编码文件上传');
  const utf8Encoder = new TextEncoder();
  const utf8Buffer = utf8Encoder.encode(testContent);
  
  // 2. 检测编码
  console.log('2. 检测编码');
  const detectedEncoding = detectEncoding(utf8Buffer);
  console.log(`   检测到的编码: ${detectedEncoding}`);
  
  // 3. 解码数据
  console.log('3. 解码数据');
  const decodedText = decodeData(utf8Buffer, detectedEncoding);
  console.log(`   解码成功: ${decodedText.includes('板卡槽位号')}`);
  console.log(`   解码后的文本片段: ${decodedText.substring(0, 50)}...`);
  
  // 4. 解析数据
  console.log('4. 解析数据');
  const lines = decodedText.split('\n').filter(line => line.trim() !== '');
  const parsedData = parseCSVContent(lines);
  console.log(`   解析后的数据行数: ${parsedData.length}`);
  if (parsedData.length > 0) {
    console.log(`   标题行: ${parsedData[0].slice(0, 5).join(', ')}...`);
    if (parsedData.length > 1) {
      console.log(`   第一行数据: ${parsedData[1].slice(0, 5).join(', ')}...`);
    }
  }
  
  // 5. 模拟编码名称映射
  console.log('5. 模拟编码名称映射');
  const encodingNames = {
    gb2312: 'GB2312 (简体中文)',
    gbk: 'GBK (扩展中文)',
    gb18030: 'GB18030 (全面中文支持)',
    utf8: 'UTF-8',
    utf8bom: 'UTF-8 with BOM'
  };
  const encodingName = encodingNames[detectedEncoding] || detectedEncoding.toUpperCase();
  console.log(`   显示的编码名称: ${encodingName}`);
  console.log(`   编码名称是否正确: ${encodingName === 'UTF-8'}`);
  
  console.log('\n=== 测试完成 ===');
}

// 运行测试
testCompleteEncodingDetection();

// 测试编码检测功能
import { detectEncoding, decodeData, parseCSVContent } from './assets/utils.js';

// 模拟包含汉字的TXT文件内容
const testContent = `23:29:49.508	板卡槽位号:解调1	板卡工作电压:12.0862	温度_K7:50	电流_K7:2.0775	电压_K7:0.99625	温度_V70:44	电流_V70:2.8225	电压_V70:0.995	温度_V71:49	电流_V71:10.525	电压_V71:0.98375	板卡工作电流_K7:3.3765	中频工作状态:设置正常	AGC时常数反馈:null	外频标状态:故障	信号电平:0	模拟AGC响应的控制电压:10.565`;

// 测试不同编码的情况
function testEncoding(buffer, description) {
  console.log(`=== 测试 ${description} ===`);
  const detectedEncoding = detectEncoding(buffer);
  console.log(`检测到的编码: ${detectedEncoding}`);
  
  const decodedText = decodeData(buffer, detectedEncoding);
  console.log(`解码后的文本: ${decodedText}`);
  
  // 测试解析功能
  const lines = decodedText.split('\n').filter(line => line.trim() !== '');
  const parsedData = parseCSVContent(lines);
  console.log(`解析后的数据行数: ${parsedData.length}`);
  if (parsedData.length > 0) {
    console.log(`标题行: ${parsedData[0]}`);
    if (parsedData.length > 1) {
      console.log(`第一行数据: ${parsedData[1]}`);
    }
  }
  console.log('---');
}

// 测试UTF-8编码
const utf8Encoder = new TextEncoder();
const utf8Buffer = utf8Encoder.encode(testContent);
testEncoding(utf8Buffer, 'UTF-8编码');

// 测试GB2312编码（模拟）
// 注意：这里只是模拟，实际GB2312编码需要真实的GB2312编码数据
console.log('\n=== 测试编码检测逻辑 ===');
console.log('包含汉字的文本:', testContent);
console.log('文本长度:', testContent.length);
console.log('包含的汉字:', testContent.match(/[\u4e00-\u9fa5]/g)?.join('') || '无');

// 测试parseCSVContent函数
console.log('\n=== 测试parseCSVContent函数 ===');
const testLines = [testContent];
const parsedData = parseCSVContent(testLines);
console.log(`解析后的数据行数: ${parsedData.length}`);
if (parsedData.length > 0) {
  console.log(`标题行: ${parsedData[0]}`);
  if (parsedData.length > 1) {
    console.log(`第一行数据: ${parsedData[1]}`);
  }
}

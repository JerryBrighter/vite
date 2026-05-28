// 测试时间解析功能
import { parseTime, formatDateTime } from './assets/utils.js';

// 测试数据 - 模拟用户提供的时间格式
const testTimes = [
  '00:00:00.044',
  '00:00:01.054',
  '12:34:56.789',
  '2026-03-06 12:34:56',
  '2026/03/06 12:34:56',
  '2026-03-06',
  '12:34:56'
];

console.log('=== 时间解析测试 ===');
testTimes.forEach(timeStr => {
  const timestamp = parseTime(timeStr);
  const formatted = formatDateTime(timestamp);
  console.log(`输入: ${timeStr}`);
  console.log(`时间戳: ${timestamp}`);
  console.log(`格式化: ${formatted}`);
  console.log(`解析成功: ${!isNaN(timestamp)}`);
  console.log('---');
});

// 测试X轴范围设置逻辑
console.log('\n=== 模拟X轴范围设置 ===');
const mockFilteredData = [
  ['00:00:00.044', '12.0913', '47'],
  ['00:00:01.054', '12.0913', '47']
];

if (mockFilteredData.length > 0) {
  const firstTime = parseTime(mockFilteredData[0][0]);
  const lastTime = parseTime(mockFilteredData[mockFilteredData.length - 1][0]);
  
  if (!isNaN(firstTime) && !isNaN(lastTime)) {
    console.log(`第一个时间: ${mockFilteredData[0][0]}`);
    console.log(`最后一个时间: ${mockFilteredData[mockFilteredData.length - 1][0]}`);
    console.log(`解析后第一个时间: ${formatDateTime(firstTime)}`);
    console.log(`解析后最后一个时间: ${formatDateTime(lastTime)}`);
    console.log('✅ X轴范围设置成功！');
  } else {
    console.log('❌ 时间解析失败！');
  }
}

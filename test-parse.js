// 测试parseCSVContent函数
import { parseCSVContent } from './assets/utils.js';

// 测试数据 - 模拟用户提供的格式
const testLines = [
  '00:00:00.044\t板卡槽位号:解调1\t板卡工作电压:12.0913\t温度_K7:47\t电流_K7:2.045\t电压_K7:0.99625\t温度_V70:44\t电流_V70:5.2\t电压_V70:0.995\t温度_V71:51\t电流_V71:18.5875\t电压_V71:0.99125\t板卡工作电流_K7:4.263\t中频工作状态:设置正常\tAGC时常数反馈:null\t外频标状态:故障\t信号电平:0\t模拟AGC响应的控制电压:9.633',
  '00:00:01.044\t板卡槽位号:解调1\t板卡工作电压:12.1000\t温度_K7:48\t电流_K7:2.050\t电压_K7:0.9970\t温度_V70:45\t电流_V70:5.3\t电压_V70:0.996\t温度_V71:52\t电流_V71:18.600\t电压_V71:0.9920\t板卡工作电流_K7:4.270\t中频工作状态:设置正常\tAGC时常数反馈:null\t外频标状态:故障\t信号电平:0\t模拟AGC响应的控制电压:9.640'
];

// 解析数据
const parsedData = parseCSVContent(testLines);

// 输出结果
console.log('解析结果:');
console.log('行数:', parsedData.length);
parsedData.forEach((row, index) => {
  console.log(`行 ${index + 1}:`, row);
  console.log(`列数:`, row.length);
});

// 测试普通CSV格式
const csvTestLines = [
  '时间,温度,湿度',
  '12:00,25,60',
  '13:00,26,58'
];

const csvParsedData = parseCSVContent(csvTestLines);
console.log('\nCSV格式解析结果:');
csvParsedData.forEach((row, index) => {
  console.log(`行 ${index + 1}:`, row);
});
import fs from 'fs';
import { parseCSVContent } from './assets/utils.js';

const testContent = `2026-07-07 18:12:11.000 162.932  3.061 
2026-07-07 18:12:12.000 162.921  3.136 
2026-07-07 18:12:13.000 162.911  3.211 
2026-07-07 18:12:14.000 162.900  3.286 
2026-07-07 18:12:15.000 162.889  3.361 
2026-07-07 18:12:16.000 162.878  3.437`;

const lines = testContent.split('\n').filter(line => line.trim() !== '');

console.log('=== 原始行数据 ===');
console.log(lines);

console.log('\n=== 解析结果 ===');
const parsedData = parseCSVContent(lines);
console.log('解析后的数据行数:', parsedData.length);
console.log('第一行（标题行）:', parsedData[0]);
console.log('第二行（数据行）:', parsedData[1]);
console.log('最后一行:', parsedData[parsedData.length - 1]);

console.log('\n=== processDataFile 逻辑测试 ===');
const hasHeader = parsedData[0] && parsedData[0][0] === '时间';
console.log('hasHeader:', hasHeader);

if (hasHeader) {
  const newHeaders = parsedData[0];
  const newOriginalData = parsedData.slice(1).filter(row => row.length > 0);
  console.log('newHeaders:', newHeaders);
  console.log('newOriginalData行数:', newOriginalData.length);
  console.log('newOriginalData[0]:', newOriginalData[0]);
}

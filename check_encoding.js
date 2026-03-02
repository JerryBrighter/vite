import { readFileSync } from 'fs';

// 读取文件的原始字节
const buffer = readFileSync('test_gb2312_real.csv');

// 打印前50个字节的十六进制值
console.log('前50个字节的十六进制值:');
for (let i = 0; i < Math.min(50, buffer.length); i++) {
  process.stdout.write(buffer[i].toString(16).padStart(2, '0') + ' ');
  if ((i + 1) % 10 === 0) {
    console.log();
  }
}
console.log();

// 尝试用不同编码解码并显示
console.log('\n尝试用不同编码解码:');
try {
  console.log('UTF-8:');
  console.log(buffer.toString('utf8').substring(0, 200));
} catch (e) {
  console.log('UTF-8解码失败:', e.message);
}

try {
  console.log('\nGBK:');
  console.log(buffer.toString('gbk').substring(0, 200));
} catch (e) {
  console.log('GBK解码失败:', e.message);
}

try {
  console.log('\nGB2312:');
  console.log(buffer.toString('gb2312').substring(0, 200));
} catch (e) {
  console.log('GB2312解码失败:', e.message);
}

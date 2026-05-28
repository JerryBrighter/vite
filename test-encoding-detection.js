// 测试编码检测逻辑
import { detectEncoding, decodeData } from './assets/utils.js';

// 模拟用户提供的文件头内容
const testContent = `, 解调, 解调, 解调, 解调, 解调, 解调, 解调, 解调, 解调, 解调, 解调, 帧同步-1, 帧同步-1, 帧同步-1, 帧同步-1, 帧同步-1, 帧同步-1, 帧同步-2, 帧同步-2, 帧同步-2, 帧同步-2, 帧同步-2, 帧同步-2, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧, 物理帧 
 时间, 功率(全), 功率(信号), Eb/No(解调), Eb/No(译码), 载波锁定, 码元锁定, 载波偏移, 码元偏移, 直流偏置, 幅度不平衡, 相位不平衡, 锁定, 接收帧数, 错误帧数, 丢帧数, 帧头误比特数, 帧头BER, 锁定, 接收帧数, 错误帧数, 丢帧数, 帧头误比特数, 帧头BER, DVB-S2/X锁定, 当前MODCOD, 总接收帧数, 总错帧数, 错帧率, MODCOD-0接收帧数,  MODCOD-0错帧数,  MODCOD-1接收帧数,  MODCOD-1错帧数,  MODCOD-2接收帧数,  MODCOD-2错帧数,  MODCOD-3接收帧数,  MODCOD-3错帧数, MODCOD-4接收帧数,  MODCOD-4错帧数,  MODCOD-5接收帧数,  MODCOD-5错帧数,  MODCOD-6接收帧数,  MODCOD-6错帧数,  MODCOD-7接收帧数,  MODCOD-7错帧数, MODCOD-8接收帧数,  MODCOD-8错帧数,  MODCOD-9接收帧数,  MODCOD-9错帧数,  MODCOD-10接收帧数, MODCOD-10错帧数, MODCOD-11接收帧数, MODCOD-11错帧数, MODCOD-12接收帧数, MODCOD-12错帧数, MODCOD-13接收帧数, MODCOD-13错帧数, MODCOD-14接收帧数, MODCOD-14错帧数, MODCOD-15接收帧数, MODCOD-15错帧数, MODCOD-16接收帧数, MODCOD-16错帧数, MODCOD-17接收帧数, MODCOD-17错帧数, MODCOD-18接收帧数, MODCOD-18错帧数, MODCOD-19接收帧数, MODCOD-19错帧数, MODCOD-20接收帧数, MODCOD-20错帧数, MODCOD-21接收帧数, MODCOD-21错帧数, MODCOD-22接收帧数, MODCOD-22错帧数, MODCOD-23接收帧数, MODCOD-23错帧数, MODCOD-24接收帧数, MODCOD-24错帧数, MODCOD-25接收帧数, MODCOD-25错帧数, MODCOD-26接收帧数, MODCOD-26错帧数, MODCOD-27接收帧数, MODCOD-27错帧数, MODCOD-28接收帧数, MODCOD-28错帧数, MODCOD-29接收帧数, MODCOD-29错帧数, MODCOD-30接收帧数, MODCOD-30错帧数, MODCOD-31接收帧数, MODCOD-31错帧数, BER 
  , dBm, dBm, dB, dB, , , KHz, Ksps, , I:Q, deg`;

// 测试GB2312编码
console.log('=== 测试编码检测 ===');

// 模拟GB2312编码的缓冲区
// 注意：这里我们需要创建一个真实的GB2312编码的缓冲区
// 为了简单起见，我们使用TextEncoder先编码为UTF-8，然后模拟GB2312编码
// 实际上，我们应该使用真实的GB2312编码数据

// 测试1：使用UTF-8编码的缓冲区
const utf8Encoder = new TextEncoder();
const utf8Buffer = utf8Encoder.encode(testContent);
console.log('UTF-8编码的缓冲区长度:', utf8Buffer.length);
const detectedEncoding1 = detectEncoding(utf8Buffer);
console.log('检测到的编码(UTF-8缓冲区):', detectedEncoding1);
const decodedText1 = decodeData(utf8Buffer, detectedEncoding1);
console.log('解码后的前50个字符:', decodedText1.substring(0, 50), '...');

// 测试2：手动创建一个包含GB2312特征的缓冲区
// 0xB0 0xA1 是GB2312中的"啊"字
const gb2312Buffer = new Uint8Array([0xB0, 0xA1, 0xB0, 0xA2, 0xB0, 0xA3, 0x20, 0x20, 0x20]);
console.log('\nGB2312特征缓冲区:', gb2312Buffer);
const detectedEncoding2 = detectEncoding(gb2312Buffer);
console.log('检测到的编码(GB2312特征缓冲区):', detectedEncoding2);
const decodedText2 = decodeData(gb2312Buffer, detectedEncoding2);
console.log('解码后的文本:', decodedText2);

// 测试3：混合缓冲区（包含中文和英文）
const mixedContent = 'Hello 你好 World 世界';
const mixedBuffer = utf8Encoder.encode(mixedContent);
console.log('\n混合内容缓冲区长度:', mixedBuffer.length);
const detectedEncoding3 = detectEncoding(mixedBuffer);
console.log('检测到的编码(混合内容):', detectedEncoding3);
const decodedText3 = decodeData(mixedBuffer, detectedEncoding3);
console.log('解码后的文本:', decodedText3);

console.log('\n=== 测试完成 ===');

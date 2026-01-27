// ========== 全局拖拽拦截（关键修复：阻止拖拽下载） ==========
// 拦截整个页面的拖拽默认行为，避免文件拖入时触发下载
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());

// ========== DOM元素获取 ==========
// 文件上传相关
const dataFileUploadArea = document.getElementById('dataFileUploadArea');
const demDecFileInput = document.getElementById('demDecFileInput');
const controlFileUploadArea = document.getElementById('controlFileUploadArea');
const demControlFileInput = document.getElementById('demControlFileInput');
const filterByControlBtn = document.getElementById('filterByControlBtn');

// 文件名称显示元素
const dataFileNameDisplay = document.getElementById('dataFileNameDisplay');
const dataFileName = document.getElementById('dataFileName');
const controlFileNameDisplay = document.getElementById('controlFileNameDisplay');
const controlFileName = document.getElementById('controlFileName');

// 编码选择器相关
const encodingSelector = document.getElementById('encodingSelector');
const dataFileEncoding = document.getElementById('dataFileEncoding');
const encodingPreview = document.getElementById('encodingPreview');
const confirmEncodingBtn = document.getElementById('confirmEncodingBtn');
const controlEncodingSelector = document.getElementById('controlEncodingSelector');
const controlFileEncoding = document.getElementById('controlFileEncoding');
const controlEncodingPreview = document.getElementById('controlEncodingPreview');
const confirmControlEncodingBtn = document.getElementById('confirmControlEncodingBtn');

// 编码检测结果显示元素
const dataEncodingResult = document.getElementById('dataEncodingResult');
const controlEncodingResult = document.getElementById('controlEncodingResult');

// 时间选择下拉框相关
const timeSelectorContainer = document.getElementById('timeSelectorContainer');
const timeSelectorSelect = document.getElementById('timeSelectorSelect');

// 选择器相关
const xAxisSelect = document.getElementById('xAxisSelect');
const yAxisSelect = document.getElementById('yAxisSelect');
const drawChartBtn = document.getElementById('drawChartBtn');

// 按钮相关
const exportChartBtn = document.getElementById('exportChartBtn');
const resetDataBtn = document.getElementById('resetDataBtn');
const clearAllBtn = document.getElementById('clearAllBtn');

// 显示区域相关
const statusText = document.getElementById('statusText');
const tableContainer = document.getElementById('tableContainer');
const tableHeader = document.getElementById('tableHeader');
const tableBody = document.getElementById('tableBody');
const chartContainer = document.getElementById('chartContainer');
const lineChart = document.getElementById('lineChart');
// 数据行数提示
const dataCountHint = document.getElementById('dataCountHint');
const totalDataCount = document.getElementById('totalDataCount');

// ========== 全局变量 ==========
let csvHeaders = []; // 表头数组
let csvData = [];    // 当前显示的数据（可能是筛选后的）
let originalCsvData = []; // 原始数据备份
let chartInstance = null; // 图表实例
let demControlFileSelected = false; // 是否选择了DemControl文件
let demControlTimeList = []; // 存储DemControl文件中的所有有效时间
let selectedStartTime = null; // 选中的筛选起始时间
const MAX_DISPLAY_ROWS = 50; // 最大显示行数

// 存储文件原始数据和名称
let demDecFileBuffer = null; // DemDec文件原始ArrayBuffer
let demDecFileName = '';     // DemDec文件名称
let demControlFileBuffer = null; // DemControl文件原始ArrayBuffer
let demControlFileName = '';     // DemControl文件名称

// 存储检测到的编码
let detectedDataEncoding = ''; // DemDec文件检测到的编码
let detectedControlEncoding = ''; // DemControl文件检测到的编码

// 分页相关变量
let currentPage = 1;
const ITEMS_PER_PAGE = 20;

// 时间范围相关变量
let selectedTimeRange = null; // 存储用户选择的时间范围
let originalChartData = []; // 存储原始图表数据，用于时间范围重置

// 图表颜色方案（支持多列）
const chartColors = [
  { border: '#0d6efd', background: 'rgba(13, 110, 253, 0.1)' },
  { border: '#dc3545', background: 'rgba(220, 53, 69, 0.1)' },
  { border: '#198754', background: 'rgba(25, 135, 84, 0.1)' },
  { border: '#ffc107', background: 'rgba(255, 193, 7, 0.1)' },
  { border: '#fd7e14', background: 'rgba(253, 126, 20, 0.1)' },
  { border: '#6f42c1', background: 'rgba(111, 66, 193, 0.1)' },
  { border: '#20c997', background: 'rgba(32, 201, 151, 0.1)' },
  { border: '#0dcaf0', background: 'rgba(13, 202, 240, 0.1)' }
];

// ========== 事件绑定 ==========
// DOM加载完成后绑定事件
document.addEventListener('DOMContentLoaded', function() {
  // ========== 修复：DemDec数据文件上传事件 ==========
dataFileUploadArea.addEventListener('click', function(e) {
  
  // 直接触发原有input元素的点击事件，简化逻辑
  demDecFileInput.click();
  console.log('点击数据文件上传区域，触发文件选择框');
});
  
// ========== 修复：DemControl时间筛选文件上传事件 ==========
controlFileUploadArea.addEventListener('click', function(e) {
  
  // 直接触发原有input元素的点击事件，简化逻辑
  demControlFileInput.click();
  console.log('点击控制文件上传区域，触发文件选择框');
});
  
  // 保留原有拖拽事件绑定（无需修改）
  dataFileUploadArea.addEventListener('dragover', (e) => handleDragOver(e, 'data'));
  dataFileUploadArea.addEventListener('dragleave', (e) => handleDragLeave(e, 'data'));
  dataFileUploadArea.addEventListener('drop', (e) => handleDrop(e, 'data'));
  demDecFileInput.addEventListener('change', (e) => handleDemDecFileSelect(e));
  
  controlFileUploadArea.addEventListener('dragover', (e) => handleDragOver(e, 'control'));
  controlFileUploadArea.addEventListener('dragleave', (e) => handleDragLeave(e, 'control'));
  controlFileUploadArea.addEventListener('drop', (e) => handleDrop(e, 'control'));
  demControlFileInput.addEventListener('change', (e) => handleDemControlFileSelect(e));
  
  // 其他事件绑定保持不变
  dataFileEncoding.addEventListener('change', () => updateEncodingPreview('data'));
  controlFileEncoding.addEventListener('change', () => updateEncodingPreview('control'));
  confirmEncodingBtn.addEventListener('click', () => parseDemDecFileWithSelectedEncoding());
  confirmControlEncodingBtn.addEventListener('click', () => parseDemControlFileWithSelectedEncoding());
  filterByControlBtn.addEventListener('click', filterDataByDemControl);
  drawChartBtn.addEventListener('click', drawLineChart);
  exportChartBtn.addEventListener('click', exportChartAsImage);
  resetDataBtn.addEventListener('click', resetToOriginalData);
  clearAllBtn.addEventListener('click', clearAllFiles);
  timeSelectorSelect.addEventListener('change', handleTimeSelectChange);
  
  // 时间范围选择器事件绑定
  const applyTimeRangeBtn = document.getElementById('applyTimeRangeBtn');
  const resetTimeRangeBtn = document.getElementById('resetTimeRangeBtn');
  const autoTimeRangeBtn = document.getElementById('autoTimeRangeBtn');
  const xAxisSelect = document.getElementById('xAxisSelect');
  
  if (applyTimeRangeBtn) {
    applyTimeRangeBtn.addEventListener('click', applyTimeRange);
  }
  if (resetTimeRangeBtn) {
    resetTimeRangeBtn.addEventListener('click', resetTimeRange);
  }
  if (autoTimeRangeBtn) {
    autoTimeRangeBtn.addEventListener('click', autoTimeRange);
  }
  if (xAxisSelect) {
    xAxisSelect.addEventListener('change', updateTimeRangeSelectorVisibility);
  }
  
  // 初始化表格显示/隐藏切换功能
  initTableToggle();
  
  // 初始化时间范围选择器
  initTimeRangeSelector();
});

// ========== 拖拽处理函数（完整修复版） ==========
function handleDragOver(e, type) {
  e.preventDefault(); // 核心：阻止浏览器默认行为（避免下载）
  e.stopPropagation(); // 新增：阻止事件冒泡
  const area = type === 'data' ? dataFileUploadArea : controlFileUploadArea;
  area.style.borderColor = 'var(--primary-color)';
  area.style.backgroundColor = 'rgba(13, 110, 253, 0.05)';
  // 新增：明确拖拽效果为复制，提升浏览器兼容性
  e.dataTransfer.dropEffect = 'copy';
}

function handleDragLeave(e, type) {
  e.preventDefault();
  e.stopPropagation(); // 新增：阻止事件冒泡
  const area = type === 'data' ? dataFileUploadArea : controlFileUploadArea;
  area.style.borderColor = 'var(--border-color)';
  area.style.backgroundColor = '';
}

function handleDrop(e, type) {
  e.preventDefault(); // 核心：阻止默认下载行为
  e.stopPropagation(); // 新增：阻止事件冒泡
  
  const area = type === 'data' ? dataFileUploadArea : controlFileUploadArea;
  area.style.borderColor = 'var(--border-color)';
  area.style.backgroundColor = '';
  
  // 核心修复1：安全获取拖拽文件（兼容null）
  const files = e.dataTransfer?.files;
  if (!files || files.length === 0) {
    updateStatus(`❌ 未检测到拖拽的文件`, 'danger');
    return;
  }
  
  // 核心修复2：严格校验CSV或DAT文件
  const file = files[0];
  if (!file.name.endsWith('.csv') && !file.name.endsWith('.dat') && file.type !== 'text/csv') {
    updateStatus(`❌ 请上传有效的CSV或DAT文件（当前文件：${file.name}）`, 'danger');
    return;
  }
  
  try {
    if (type === 'data') {
        // 修复3：将拖拽文件赋值给原有input，保持逻辑一致
        demDecFileInput.files = files;
        demDecFileName = file.name;
        if (dataFileName) {
          dataFileName.textContent = demDecFileName;
        }
        if (dataFileNameDisplay) {
          dataFileNameDisplay.classList.remove('d-none');
        }
        readFileAsBuffer(file, 'data');
        updateStatus(`📝 拖拽上传成功：${file.name}`, 'success');
      } else {
        demControlFileInput.files = files;
        demControlFileName = file.name;
        if (controlFileName) {
          controlFileName.textContent = demControlFileName;
        }
        if (controlFileNameDisplay) {
          controlFileNameDisplay.classList.remove('d-none');
        }
        readFileAsBuffer(file, 'control');
        updateStatus(`📅 拖拽上传成功：${file.name}`, 'success');
      }
  } catch (error) {
    updateStatus(`❌ 拖拽文件处理失败：${error.message}`, 'danger');
    console.error('拖拽错误：', error);
  }
}

// ========== 文件选择和读取函数 ==========
// 处理DemDec文件选择
function handleDemDecFileSelect(e) {
  console.log('选择了DemDec文件');
  const file = e.target.files[0];
  if (file) {
    demDecFileName = file.name;
    if (dataFileName) {
      dataFileName.textContent = demDecFileName;
    }
    if (dataFileNameDisplay) {
      dataFileNameDisplay.classList.remove('d-none');
    }
    readFileAsBuffer(file, 'data');
  }
}

// 处理DemControl文件选择
function handleDemControlFileSelect(e) {
  console.log('选择了DemControl文件');
  const file = e.target.files[0];
  if (file) {
    demControlFileName = file.name;
    if (controlFileName) {
      controlFileName.textContent = demControlFileName;
    }
    if (controlFileNameDisplay) {
      controlFileNameDisplay.classList.remove('d-none');
    }
    readFileAsBuffer(file, 'control');
  }
}

// 读取文件为ArrayBuffer并自动检测编码解析
function readFileAsBuffer(file, type) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      if (type === 'data') {
        demDecFileBuffer = e.target.result;
        
        // 自动检测编码
        const uint8Array = new Uint8Array(demDecFileBuffer);
        detectedDataEncoding = autoDetectEncoding(uint8Array, 'data');
        
        // 自动设置编码并解析文件
        dataFileEncoding.value = 'auto';
        parseDemDecFileWithSelectedEncoding();
      } else {
        demControlFileBuffer = e.target.result;
        
        // 自动检测编码
        const uint8Array = new Uint8Array(demControlFileBuffer);
        detectedControlEncoding = autoDetectEncoding(uint8Array, 'control');
        
        // 自动设置编码并解析文件
        controlFileEncoding.value = 'auto';
        parseDemControlFileWithSelectedEncoding();
      }
    } catch (error) {
      updateStatus(`❌ 文件读取失败：${error.message}`, 'danger');
      console.error('文件读取错误：', error);
    }
  };
  reader.readAsArrayBuffer(file);
}

// 更新编码预览
function updateEncodingPreview(type) {
  try {
    let buffer, encodingSelect, previewEl, resultEl;
    let detectedEncoding = '';
    
    if (type === 'data') {
      if (!demDecFileBuffer) return;
      buffer = demDecFileBuffer;
      encodingSelect = dataFileEncoding;
      previewEl = encodingPreview;
      resultEl = dataEncodingResult;
    } else {
      if (!demControlFileBuffer) return;
      buffer = demControlFileBuffer;
      encodingSelect = controlFileEncoding;
      previewEl = controlEncodingPreview;
      resultEl = controlEncodingResult;
    }
    
    // 确保所有必要元素都存在
    if (!encodingSelect || !previewEl || !resultEl) return;
    
    const encoding = encodingSelect.value;
    let previewContent = '';
    
    // 获取文件前2000个字节用于预览
    const uint8Array = new Uint8Array(buffer.slice(0, 2000));
    
    // 根据选择的编码解码
    switch(encoding) {
      case 'auto':
        // 自动检测并显示所有可能的编码预览
        previewContent = '=== 自动检测结果 ===\n';
        const encodings = ['gb2312', 'gbk', 'gb18030', 'utf8', 'utf8bom'];
        encodings.forEach(enc => {
          try {
            let content = decodeBuffer(uint8Array, enc);
            previewContent += `\n【${enc.toUpperCase()}】:\n${content.substring(0, 200)}...\n`;
          } catch (e) {
            previewContent += `\n【${enc.toUpperCase()}】: 解码失败\n`;
          }
        });
        
        // 执行自动检测并记录结果
        detectedEncoding = autoDetectEncoding(uint8Array, type);
        break;
      case 'utf8bom':
        // 处理UTF-8 BOM
        let content = decodeBuffer(uint8Array, 'utf8');
        // 移除BOM字符
        if (content.charCodeAt(0) === 0xFEFF) {
          content = content.substring(1);
        }
        previewContent = content.substring(0, 500);
        detectedEncoding = 'utf8bom';
        break;
      default:
        previewContent = decodeBuffer(uint8Array, encoding).substring(0, 500);
        detectedEncoding = encoding;
        break;
    }
    
    // 格式化预览内容
    previewEl.textContent = previewContent;
    
    // 显示编码检测结果
    if (detectedEncoding) {
      const encodingNames = {
        'gb2312': 'GB2312 (简体中文)',
        'gbk': 'GBK (扩展中文)',
        'gb18030': 'GB18030 (全面中文支持)',
        'utf8': 'UTF-8',
        'utf8bom': 'UTF-8 with BOM',
        'auto': '自动检测'
      };
      
      const displayName = encodingNames[detectedEncoding] || detectedEncoding.toUpperCase();
      resultEl.textContent = `✅ 编码检测结果：${displayName}`;
      resultEl.classList.remove('d-none');
      
      // 保存检测到的编码
      if (type === 'data') {
        detectedDataEncoding = detectedEncoding;
      } else {
        detectedControlEncoding = detectedEncoding;
      }
    }
  } catch (error) {
    if (previewEl) {
      previewEl.textContent = `预览失败：${error.message}`;
    }
  }
}

// ========== 导入浏览器专用编码库 ==========
import { TextDecoder as EncodingTextDecoder } from 'text-encoding';

// ========== 解码Buffer（完整支持GBK/GB2312/GB18030） ==========
function decodeBuffer(uint8Array, encoding) {
  try {
    // 统一编码名称格式
    const enc = encoding.toLowerCase().replace('-', '');
    
    // 映射编码名称到text-encoding支持的格式
    const encodingMap = {
      'gb2312': 'gbk', // GB2312是GBK子集，用GBK解码兼容
      'gbk': 'gbk',
      'gb18030': 'gbk', // GB18030是GBK超集，浏览器端用GBK兼容解析
      'utf8': 'utf-8',
      'utf8bom': 'utf-8',
      'utf-8': 'utf-8'
    };
    
    const targetEnc = encodingMap[enc] || 'utf-8';
    // 使用从text-encoding库导入的TextDecoder，确保支持gbk编码
    const decoder = new EncodingTextDecoder(targetEnc, { fatal: false, ignoreBOM: false });
    
    let content = decoder.decode(uint8Array);
    
    // 处理UTF8 BOM
    if (enc === 'utf8bom' && content.charCodeAt(0) === 0xFEFF) {
      content = content.substring(1);
    }
    
    return content;
  } catch (e) {
    // 终极降级处理
    let text = '';
    for (let i = 0; i < uint8Array.length; i++) {
      text += String.fromCharCode(uint8Array[i]);
    }
    return text;
  }
}

// 同时删除原代码中所有iconv-lite相关导入和调用

// 使用选定的编码解析DemDec文件
function parseDemDecFileWithSelectedEncoding() {
  if (!demDecFileBuffer) {
    updateStatus(`❌ 请先上传文件`, 'danger');
    return;
  }
  
  const selectedEncoding = dataFileEncoding.value;
  // 如果选择自动识别，使用检测到的编码
  const finalEncoding = selectedEncoding === 'auto' ? detectedDataEncoding || 'utf8' : selectedEncoding;
  
  // 检测文件类型和分隔符
  const isDatFile = demDecFileName.toLowerCase().endsWith('.dat');
  const delimiter = isDatFile ? '\t' : ',';
  
  // 显示最终使用的编码和文件类型
  updateStatus(`📝 正在使用${selectedEncoding === 'auto' ? `自动检测(${finalEncoding})` : finalEncoding}编码解析文件：${demDecFileName} (${isDatFile ? 'DAT格式，TAB分隔' : 'CSV格式，逗号分隔'})`, 'primary');
  
  try {
    let csvContent = '';
    const uint8Array = new Uint8Array(demDecFileBuffer);
    
    // 根据最终确定的编码解码
    if (finalEncoding === 'utf8bom') {
      csvContent = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
      // 移除BOM字符
      if (csvContent.charCodeAt(0) === 0xFEFF) {
        csvContent = csvContent.substring(1);
      }
      updateStatus(`✅ 使用${finalEncoding.toUpperCase()}编码解析文件：${demDecFileName}`, 'info');
    } else {
      try {
		// 新代码（纯浏览器版）
		csvContent = decodeBuffer(uint8Array, finalEncoding);
      } catch (e) {
        // 降级处理
        csvContent = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
      }
      updateStatus(`✅ 使用${finalEncoding.toUpperCase()}编码解析文件：${demDecFileName}`, 'info');
    }

    // 修复行分割逻辑
    const rows = csvContent.split(/\r?\n/).filter(row => row.trim() !== '');
    
    if (rows.length < 2) throw new Error(`${isDatFile ? 'DAT' : 'CSV'}文件数据不足（至少需要1行标题+1行数据）`);

    // 判断文件是否包含时间列（检查前10行）
    function hasTimeColumn() {
      const timeRegex = /^\d{4}[-/]?\d{2}[-/]?\d{2}\s?\d{2}[:.]?\d{2}[:.]?\d{2}[:.]?\d{0,3}$|^\d{2}[:.]?\d{2}[:.]?\d{2}[:.]?\d{0,3}$/;
      const checkRows = rows.slice(0, Math.min(10, rows.length));
      for (const row of checkRows) {
        const parsedRow = parseCSVLine(row, delimiter);
        for (const cell of parsedRow) {
          const value = cell?.trim();
          if (value && (timeRegex.test(value) || !isNaN(new Date(value).getTime()))) {
            return true;
          }
        }
      }
      return false;
    }

    // 判断一行是否为时间值
    function isTimeValue(value) {
      const timeRegex = /^\d{4}[-/]?\d{2}[-/]?\d{2}\s?\d{2}[:.]?\d{2}[:.]?\d{2}[:.]?\d{0,3}$|^\d{2}[:.]?\d{2}[:.]?\d{2}[:.]?\d{0,3}$/;
      return value && (timeRegex.test(value) || !isNaN(new Date(value).getTime()));
    }

    // 判断一行是否为标题行
    function isHeaderRow(row) {
      const parsedRow = parseCSVLine(row, delimiter);
      let hasNumber = false;
      let hasTime = false;
      
      for (const cell of parsedRow) {
        const value = cell?.trim();
        if (value) {
          // 检查是否包含数字值（非0的数值）
          if (!isNaN(Number(value)) && parseFloat(value) !== 0) {
            hasNumber = true;
          }
          // 检查是否包含时间值
          if (isTimeValue(value)) {
            hasTime = true;
          }
        }
      }
      
      // 文件包含时间列的情况
      if (fileHasTimeColumn) {
        // 数据行必须同时包含数字和时间
        return !(hasNumber && hasTime);
      } else {
        // 文件不包含时间列的情况，数据行必须包含数字
        return !hasNumber;
      }
    }

    // 自动判断标题行数量
    const fileHasTimeColumn = hasTimeColumn();
    let headerRowCount = 0;
    
    // 对于DAT文件，强制只使用第一行作为标题行
    if (isDatFile) {
      headerRowCount = 1;
    } else {
      // 对于CSV文件，自动判断标题行数量
      for (let i = 0; i < Math.min(5, rows.length - 1); i++) {
        if (isHeaderRow(rows[i])) {
          headerRowCount++;
        } else {
          break;
        }
      }
    }

    // 修复标题行处理逻辑
    let headerRows = rows.slice(0, headerRowCount);
    const parsedHeaderRows = headerRows.map(row => parseCSVLine(row, delimiter));
    csvHeaders = mergeHeaderRows(parsedHeaderRows);
    
    // 数据行从标题行后开始
    const dataStartIndex = headerRowCount;
    csvData = rows.slice(dataStartIndex).map(row => parseCSVLine(row, delimiter)).filter(row => row.length > 0);
    
    // 空数据检查
    if (csvData.length === 0) throw new Error('未解析到有效数据行');
    
    // 过滤掉全为0的列
    function isColumnAllZeros(colIndex) {
      for (let i = 0; i < csvData.length; i++) {
        const value = csvData[i][colIndex]?.trim();
        // 如果有任何一行不是0，就返回false
        if (value !== '' && value !== '0' && value !== '0.0' && parseFloat(value) !== 0) {
          return false;
        }
      }
      return true;
    }
    
    // 获取所有非全0列的索引
    const nonZeroColumns = [];
    for (let i = 0; i < csvHeaders.length; i++) {
      if (!isColumnAllZeros(i)) {
        nonZeroColumns.push(i);
      }
    }
    
    // 只保留非全0列的数据
    const filteredHeaders = nonZeroColumns.map(index => csvHeaders[index]);
    const filteredData = csvData.map(row => nonZeroColumns.map(index => row[index]));
    
    // 更新全局变量
    csvHeaders = filteredHeaders;
    csvData = filteredData;
    originalCsvData = JSON.parse(JSON.stringify(csvData)); // 备份原始数据

    // 强制刷新表格和选择器
    renderTable(csvHeaders, csvData);
    initAxisSelector();

    // 更新状态和启用按钮
    updateStatus(`✅ 文件解析成功【${demDecFileName}】：使用${finalEncoding.toUpperCase()}编码，共 ${csvData.length} 行数据，${csvHeaders.length} 列 (${headerRows.length}行标题已合并)`, 'success');
    enableControls(['xAxisSelect', 'yAxisSelect', 'drawChartBtn', 'resetDataBtn']);
    
    // 如果已选择DemControl文件且有选中时间，启用筛选按钮
    if (demControlFileSelected && selectedStartTime) {
      enableControls(['filterByControlBtn']);
    }
  } catch (error) {
    updateStatus(`❌ 文件解析失败【${demDecFileName}】：${error.message}，请尝试更换编码格式`, 'danger');
    console.error('解析错误详情：', error);
  }
}

// 使用选定的编码解析DemControl文件
function parseDemControlFileWithSelectedEncoding() {
  if (!demControlFileBuffer) {
    updateStatus(`❌ 请先上传文件`, 'danger');
    return;
  }
  
  const selectedEncoding = controlFileEncoding.value;
  // 如果选择自动识别，使用检测到的编码
  const finalEncoding = selectedEncoding === 'auto' ? detectedControlEncoding || 'utf8' : selectedEncoding;
  
  // 检测文件类型和分隔符
  const isDatFile = demControlFileName.toLowerCase().endsWith('.dat');
  const delimiter = isDatFile ? '\t' : ',';
  
  // 显示最终使用的编码和文件类型
  updateStatus(`📅 正在使用${selectedEncoding === 'auto' ? `自动检测(${finalEncoding})` : finalEncoding}编码解析文件：${demControlFileName} (${isDatFile ? 'DAT格式，TAB分隔' : 'CSV格式，逗号分隔'})`, 'primary');
  
  try {
    let csvContent = '';
    const uint8Array = new Uint8Array(demControlFileBuffer);
    
	// 新代码（纯浏览器版）
	csvContent = decodeBuffer(uint8Array, finalEncoding);

    
    // 解析DemControl文件
    const rows = csvContent.split(/\r?\n/).filter(row => row.trim() !== '');
    if (rows.length === 0) throw new Error('文件无有效数据');
    
    // 清空原有时间列表
    demControlTimeList = [];
    timeSelectorSelect.innerHTML = '';
    selectedStartTime = null;
    
    // 解析所有行的第一列时间
    for (let i = 0; i < rows.length; i++) {
      const row = parseCSVLine(rows[i], delimiter);
      const timeStr = row[0]?.trim();
      if (!timeStr) continue;
      
      // 增强时间格式兼容性
      let time = new Date(timeStr);
      if (isNaN(time.getTime())) {
        // 尝试不同的时间格式解析
        const timeFormats = [
          timeStr.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3 $4:$5:$6'),
          timeStr.replace(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/, '$1/$2/$3 $4:$5:$6'),
          timeStr.replace(/(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/, '$1-$2-$3 $4:$5:$6')
        ];
        
        for (const fmt of timeFormats) {
          time = new Date(fmt);
          if (!isNaN(time.getTime())) break;
        }
      }
      
      if (!isNaN(time.getTime())) {
        demControlTimeList.push({
          str: timeStr,
          date: time,
          index: i
        });
      }
    }

    if (demControlTimeList.length === 0) {
      throw new Error('文件中未找到有效时间数据，请检查第一列格式');
    }
    
    // 显示时间选择下拉框并加载时间选项
    timeSelectorContainer.classList.remove('d-none');
    renderTimeDropdown();
    
    demControlFileSelected = true;
    // 更新状态
    updateStatus(`✅ 文件解析成功【${demControlFileName}】：使用${finalEncoding.toUpperCase()}编码，共找到${demControlTimeList.length}个有效时间点`, 'success');
    
  } catch (error) {
    updateStatus(`❌ 文件解析失败【${demControlFileName}】：${error.message}，请尝试更换编码格式`, 'danger');
    console.error('解析错误详情：', error);
  }
}


// ========== 精简版GBK编码映射表（覆盖常用中文） ==========
const gbkTable = {
  0xB0A1: '啊', 0xB0A2: '阿', 0xB0A3: '埃', 0xB0A4: '挨', 0xB0A5: '哎',
  0xB0A6: '唉', 0xB0A7: '哀', 0xB0A8: '皑', 0xB0A9: '癌', 0xB0AA: '蔼',
  // 省略大量映射（如需完整表，可替换为完整GBK编码表，或使用CDN加载）
  // 注：以下仅保留核心映射，确保基础中文能解析，完整表可从网上获取
  0xD7F9: '做', 0xD7FA: '坐', 0xD7FB: '作', 0xD7FC: '昨', 0xD7FD: '左',
  0xD7FE: '佐', 0xD7FF: '撮'
};

// ========== 替换：自动编码检测（移除iconv-lite依赖） ==========
function autoDetectEncoding(uint8Array, type) {
  let content = '';
  let detectedEncoding = '';
  
  // 检测UTF-8 BOM
  if (uint8Array.length >= 3 && uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
    content = new TextDecoder('utf-8').decode(uint8Array);
    content = content.substring(1); // 移除BOM
    detectedEncoding = 'utf8bom';
  } 
  // 首先尝试UTF-8解码
  else {
    try {
      // 尝试用UTF-8解码
      const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
      content = utf8Decoder.decode(uint8Array);
      // 如果UTF-8解码成功，检测是否包含中文字符
      if (content.match(/[\u4e00-\u9fa5]/)) {
        // 包含中文字符，可能是UTF-8编码的中文
        detectedEncoding = 'utf8';
      } else {
        // 不包含中文字符，可能是ASCII或UTF-8编码的英文
        detectedEncoding = 'utf8';
      }
    } catch (e) {
      // UTF-8解码失败，尝试GBK解码
      try {
        content = decodeBuffer(uint8Array, 'gbk');
        // 验证是否为有效中文
        if (content.match(/[\u4e00-\u9fa5]/)) {
          detectedEncoding = 'gbk';
        } else {
          // GBK解码也不包含中文，降级到UTF-8
          content = decodeBuffer(uint8Array, 'utf8');
          detectedEncoding = 'utf8';
        }
      } catch (e2) {
        // 最终降级到UTF-8
        content = decodeBuffer(uint8Array, 'utf8');
        detectedEncoding = 'utf8';
      }
    }
  }
  
  // 更新状态
  updateStatus(`✅ 自动检测到${type === 'data' ? '数据' : '控制'}文件编码：${detectedEncoding.toUpperCase()}`, 'info');
  
  return detectedEncoding;
}

// ========== 标题合并函数 ==========
function mergeHeaderRows(headerRows) {
  if (!headerRows || headerRows.length === 0) {
    return ['列1'];
  }
  
  // 找到最大列数
  const maxCols = Math.max(...headerRows.map(row => row.length));
  const mergedHeaders = [];
  
  // 逐列处理
  for (let col = 0; col < maxCols; col++) {
    let mergedText = [];
    // 遍历所有标题行的当前列
    for (let row = 0; row < headerRows.length; row++) {
      // 获取当前行列的内容，去空格
      const cellText = (headerRows[row][col] || '').trim().replace(/\s+/g, '');
      if (cellText) {
        mergedText.push(cellText);
      }
    }
    // 如果合并后为空，用默认列名
    mergedHeaders.push(mergedText.join('-') || `列${col + 1}`);
  }
  
  return mergedHeaders;
}

// ========== 渲染时间下拉选择框 ==========
function renderTimeDropdown() {
  if (!timeSelectorSelect) return;
  
  timeSelectorSelect.innerHTML = '';
  
  // 添加默认选项
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '请选择筛选起始时间';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  timeSelectorSelect.appendChild(defaultOption);
  
  // 按时间排序
  demControlTimeList.sort((a, b) => a.date - b.date);
  
  // 生成时间选项
  demControlTimeList.forEach((timeItem, idx) => {
    const timeOption = document.createElement('option');
    timeOption.value = idx; // 使用索引作为值
    timeOption.dataset.timeStr = timeItem.str;
    
    // 格式化显示时间
    const formattedTime = timeItem.date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    timeOption.textContent = `时间点 ${idx + 1}：${formattedTime} (原始: ${timeItem.str})`;
    timeSelectorSelect.appendChild(timeOption);
  });
  
  // 默认选中第一个有效时间并自动筛选数据
  if (demControlTimeList.length > 0 && timeSelectorSelect.options.length > 1) {
    timeSelectorSelect.selectedIndex = 1;
    handleTimeSelectChange();
    // 自动触发筛选（如果有数据文件的话）
    if (csvData.length > 0 && selectedStartTime) {
      setTimeout(() => filterDataByDemControl(), 100);
    }
  }
}

// ========== 处理时间下拉框选择变更 ==========
function handleTimeSelectChange() {
  if (!timeSelectorSelect) return;
  
  const selectedIndex = timeSelectorSelect.selectedIndex;
  if (selectedIndex === 0 || !timeSelectorSelect.options[selectedIndex]) {
    selectedStartTime = null;
    disableControls(['filterByControlBtn']);
    return;
  }
  
  // 获取选中的时间对象
  const timeIdx = parseInt(timeSelectorSelect.value);
  if (isNaN(timeIdx) || timeIdx < 0 || timeIdx >= demControlTimeList.length) {
    selectedStartTime = null;
    disableControls(['filterByControlBtn']);
    return;
  }
  
  selectedStartTime = demControlTimeList[timeIdx];
  
  // 启用筛选按钮
  if (csvData.length > 0) {
    enableControls(['filterByControlBtn']);
    updateStatus(`ℹ️ 已选择时间点：${selectedStartTime.str}，可点击筛选按钮分析该时间后15分钟的数据`, 'info');
  } else {
    updateStatus(`ℹ️ 已选择时间点：${selectedStartTime.str}，请先上传DemDec数据文件进行筛选`, 'info');
  }
}

// ========== 核心功能函数 ==========
// 按DemControl文件选中的时间筛选数据
function filterDataByDemControl() {
  if (!selectedStartTime) {
    updateStatus(`❌ 请先选择一个有效的起始时间`, 'danger');
    return;
  }
  if (csvData.length === 0 || originalCsvData.length === 0) {
    updateStatus(`❌ 请先上传DemDec数据文件`, 'danger');
    return;
  }

  // 自动恢复原始数据
  csvData = JSON.parse(JSON.stringify(originalCsvData));
  updateStatus(`🔄 已自动恢复原始数据，正在按所选时间筛选：${selectedStartTime.str} + 15分钟`, 'primary');

  try {
    // 获取选中的起始时间和计算结束时间
    const startTime = selectedStartTime.date;
    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + 15);

    // 获取X轴选择的时间列索引
    const timeColIndex = parseInt(xAxisSelect.value || 0);
    
    // 增强时间筛选逻辑
    const filteredData = [];
    csvData.forEach(row => {
      const rowTimeStr = row[timeColIndex]?.trim();
      if (!rowTimeStr) return;
      
      // 多种时间格式解析尝试
      let rowTime = new Date(rowTimeStr);
      if (isNaN(rowTime.getTime())) {
        // 尝试不同格式
        const timeFormats = [
          rowTimeStr.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3 $4:$5:$6'),
          rowTimeStr.replace(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/, '$1/$2/$3 $4:$5:$6'),
          rowTimeStr.replace(/(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/, '$1-$2-$3 $4:$5:$6'),
          // 支持 21:42:29:450 格式（时:分:秒:毫秒）
          rowTimeStr.replace(/(\d{2}):(\d{2}):(\d{2}):(\d{3})/, (match, hh, mm, ss, ms) => {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            return `${year}-${month}-${day} ${hh}:${mm}:${ss}.${ms}`;
          })
        ];
        
        for (const fmt of timeFormats) {
          rowTime = new Date(fmt);
          if (!isNaN(rowTime.getTime())) break;
        }
      }
      
      if (!isNaN(rowTime.getTime()) && rowTime >= startTime && rowTime <= endTime) {
        filteredData.push(row);
      }
    });

    if (filteredData.length === 0) {
      updateStatus(`⚠️ 未找到${startTime.toLocaleString()} ~ ${endTime.toLocaleString()}范围内的数据，已显示全部数据`, 'warning');
      renderTable(csvHeaders, csvData);
      if (chartInstance) drawLineChart();
      return;
    }

    // 更新数据并重新渲染
    csvData = filteredData;
    renderTable(csvHeaders, csvData);
    
    // 筛选后自动重新绘制图表
    if (chartInstance) {
      drawLineChart();
    } else if (xAxisSelect.value && yAxisSelect.selectedOptions.length > 0) {
      drawLineChart();
    }

    updateStatus(`✅ 数据筛选成功：找到${filteredData.length}行${startTime.toLocaleString()}~${endTime.toLocaleString()}范围内的数据，已自动更新图表`, 'success');
  } catch (error) {
    updateStatus(`❌ 筛选失败：${error.message}`, 'danger');
    console.error('筛选错误详情：', error);
  }
}

// 绘制折线图
function drawLineChart() {
  // 验证选择
  const xColIndex = parseInt(xAxisSelect.value);
  if (isNaN(xColIndex) || xColIndex >= csvHeaders.length) {
    updateStatus(`❌ 请选择有效的X轴列`, 'danger');
    return;
  }

  const yColIndexes = Array.from(yAxisSelect.selectedOptions)
    .map(option => parseInt(option.value))
    .filter(index => !isNaN(index) && index < csvHeaders.length);
  
  if (yColIndexes.length === 0) {
    updateStatus(`❌ 请至少选择一个Y轴列`, 'danger');
    return;
  }
  if (yColIndexes.some(index => index === xColIndex)) {
    updateStatus(`❌ Y轴列不能与X轴列重复`, 'danger');
    return;
  }

  // 提取X轴数据和时间值
  const xData = [];
  const xTimeValues = []; // 存储解析后的时间值
  csvData.forEach(row => {
    const xValue = row[xColIndex]?.trim() || '';
    xData.push(xValue);
    
    // 尝试解析时间值
    let timeValue = null;
    try {
      // 尝试不同的时间格式解析
      let rowTime = new Date(xValue);
      if (isNaN(rowTime.getTime())) {
        // 尝试解析 21:42:29:450 格式
        const timeMatch = xValue.match(/(\d{2}):(\d{2}):(\d{2}):(\d{3})/);
        if (timeMatch) {
          const [, hh, mm, ss, ms] = timeMatch;
          const today = new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const day = String(today.getDate()).padStart(2, '0');
          rowTime = new Date(`${year}-${month}-${day} ${hh}:${mm}:${ss}.${ms}`);
        }
      }
      if (!isNaN(rowTime.getTime())) {
        timeValue = rowTime;
      }
    } catch (e) {
      // 忽略时间解析错误
    }
    xTimeValues.push(timeValue);
  });

  // 提取多列Y轴数据
  const datasets = [];
  let totalDataPoints = 0;
  
  yColIndexes.forEach((yColIndex, idx) => {
      const yData = [];
      const textMapping = new Map();
      const reverseTextMapping = new Map();
      let textCounter = 1;
      let validPoints = 0;
      const rowTextValues = []; // 保存每行的原始文字值

      csvData.forEach((row, rowIdx) => {
        const xValue = row[xColIndex]?.trim();
        const yValue = row[yColIndex]?.trim() || '';
        
        if (xValue && yValue) {
          // 处理文字数据
          let numericValue;
          if (!isNaN(Number(yValue)) && yValue !== '') {
            numericValue = Number(yValue);
            
            // 过滤掉0值数据，不显示在绘图中
            if (numericValue === 0) {
              yData.push(null);
              rowTextValues.push(null);
              return;
            }
            rowTextValues.push(yValue);
          } else {
            if (!textMapping.has(yValue)) {
              textMapping.set(yValue, textCounter++);
              reverseTextMapping.set(textCounter - 1, yValue);
            }
            numericValue = textMapping.get(yValue);
            rowTextValues.push(yValue);
          }
          
          yData.push(numericValue);
          validPoints++;
        } else {
          yData.push(null);
          rowTextValues.push(null);
        }
      });

      // 分配颜色
      const color = chartColors[idx % chartColors.length];
      
      // 创建数据集
      datasets.push({
        label: csvHeaders[yColIndex]?.trim() || `Y轴${idx+1}`,
        data: yData,
        borderColor: color.border,
        backgroundColor: color.background,
        borderWidth: 2,
        tension: 0.2,
        fill: false,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: color.border,
        pointBorderWidth: 1,
        // 保存文字映射关系，用于tooltip显示
        textMapping: textMapping,
        reverseTextMapping: reverseTextMapping,
        rowTextValues: rowTextValues
      });
      totalDataPoints += validPoints;
    });

  if (xData.length === 0 || totalDataPoints === 0) {
    updateStatus(`❌ 所选列无有效数据`, 'danger');
    return;
  }

  // 保存原始数据，用于时间范围重置
  originalChartData = {
    xData: [...xData],
    xTimeValues: [...xTimeValues],
    datasets: JSON.parse(JSON.stringify(datasets)),
    xColIndex: xColIndex
  };

  // 应用时间范围过滤
  let filteredXData = xData;
  let filteredDatasets = datasets;
  if (selectedTimeRange) {
    const { start, end } = selectedTimeRange;
    const filteredIndices = [];
    
    // 找出在时间范围内的数据索引
    xTimeValues.forEach((timeValue, index) => {
      if (timeValue && timeValue >= start && timeValue <= end) {
        filteredIndices.push(index);
      }
    });
    
    // 过滤数据
    if (filteredIndices.length > 0) {
      filteredXData = filteredIndices.map(index => xData[index]);
      filteredDatasets = datasets.map(dataset => {
        const filteredData = filteredIndices.map(index => dataset.data[index]);
        const filteredRowTextValues = filteredIndices.map(index => dataset.rowTextValues[index]);
        return {
          ...dataset,
          data: filteredData,
          rowTextValues: filteredRowTextValues
        };
      });
    }
  }

  // 销毁原有图表
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
  
  // 显示canvas
  lineChart.style.display = 'block';
  chartContainer.innerHTML = '';
  chartContainer.appendChild(lineChart);

  // 计算X轴标注间隔
  const getXAxisTickInterval = (dataLength) => {
    if (dataLength <= 20) return 1;
    if (dataLength <= 50) return 5;
    if (dataLength <= 100) return 10;
    if (dataLength <= 500) return 20;
    return Math.ceil(dataLength / 30);
  };

  // 创建新图表
  chartInstance = new Chart(lineChart, {
    type: 'line',
    data: { 
      labels: filteredXData, 
      datasets: filteredDatasets 
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { 
            display: true, 
            text: csvHeaders[xColIndex]?.trim() || 'X轴', 
            font: { size: 14, weight: 'bold', family: "'Microsoft YaHei', sans-serif" } 
          },
          ticks: {
            autoSkip: true,
            maxRotation: 45,
            minRotation: 45,
            maxTicksLimit: 20,
            font: { family: "'Microsoft YaHei', sans-serif" },
            callback: function(value, index, values) {
              // 确保最多显示20个标签
              const step = Math.ceil(values.length / 20);
              return index % step === 0 ? this.getLabelForValue(value) : '';
            },
            align: 'end'
          },
          grid: { display: true, color: 'rgba(0, 0, 0, 0.1)', drawTicks: true, tickLength: 5 }
        },
        y: {
          title: { 
            display: true, 
            text: '数值/文字映射值', 
            font: { size: 14, weight: 'bold', family: "'Microsoft YaHei', sans-serif" } 
          },
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
          ticks: { font: { family: "'Microsoft YaHei', sans-serif" } }
        }
      },
      plugins: {
        legend: { 
          position: 'top', 
          labels: { 
            boxWidth: 12, 
            font: { size: 12, family: "'Microsoft YaHei', sans-serif" } 
          } 
        },
        tooltip: { 
          mode: 'index', 
          intersect: false, 
          boxPadding: 6,
          titleFont: { family: "'Microsoft YaHei', sans-serif" },
          bodyFont: { family: "'Microsoft YaHei', sans-serif" },
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.raw;
              const index = context.dataIndex;
              
              // 查找原始文字值
              let originalText = null;
              if (context.dataset.rowTextValues && context.dataset.rowTextValues[index]) {
                originalText = context.dataset.rowTextValues[index];
              }
              
              // 如果是数值映射的文字，显示原始文字
              if (originalText && isNaN(Number(originalText))) {
                return `${label}: ${value} (原始: ${originalText})`;
              } else {
                return `${label}: ${value}`;
              }
            }
          }
        },
        title: {
          display: true,
          text: '注：文字数据已转换为数值映射，数值为原始值',
          font: { size: 12, style: 'italic', family: "'Microsoft YaHei', sans-serif" },
          color: '#6c757d'
        }
      },
      elements: { line: { borderWidth: 2 } }
    }
  });

  // 启用导出按钮
  enableControls(['exportChartBtn']);
  
  // 更新时间范围选择器的可见性
  updateTimeRangeSelectorVisibility();
  
  // 初始化时间范围选择器的默认值
  initTimeRangeSelector();
  
  updateStatus(`✅ 折线图绘制成功：X轴【${csvHeaders[xColIndex]?.trim() || '列'}】，Y轴共${yColIndexes.length}列，有效数据点${totalDataPoints}个`, 'success');
}

// 导出图表为图片
function exportChartAsImage() {
  if (!chartInstance) {
    updateStatus(`❌ 暂无图表可导出，请先绘制折线图`, 'danger');
    return;
  }

  try {
    // 导出为PNG图片
    const url = lineChart.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.href = url;
    // 修复文件名格式
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `DemDec可视化图表_${timestamp}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    updateStatus(`✅ 图表已成功导出为PNG图片`, 'success');
  } catch (error) {
    updateStatus(`❌ 图表导出失败：${error.message}`, 'danger');
    console.error('导出错误详情：', error);
  }
}

// 重置为原始数据
function resetToOriginalData() {
  if (originalCsvData.length === 0) {
    updateStatus(`ℹ️ 暂无原始数据可重置`, 'info');
    return;
  }

  // 恢复原始数据
  csvData = JSON.parse(JSON.stringify(originalCsvData));
  renderTable(csvHeaders, csvData);
  
  // 重新绘制图表
  if (chartInstance) {
    drawLineChart();
  }

  updateStatus(`✅ 已重置为原始数据【${demDecFileName}】，共${csvData.length}行`, 'success');
}

// 清空所有文件
function clearAllFiles() {
  // 重置全局变量
  csvHeaders = [];
  csvData = [];
  originalCsvData = [];
  demControlFileSelected = false;
  demControlTimeList = [];
  selectedStartTime = null;
  demDecFileBuffer = null;
  demControlFileBuffer = null;
  demDecFileName = '';
  demControlFileName = '';
  detectedDataEncoding = '';
  detectedControlEncoding = '';
  
  // 清空文件输入
  demDecFileInput.value = '';
  demControlFileInput.value = '';
  
  // 隐藏文件名称显示
  if (dataFileNameDisplay) {
    dataFileNameDisplay.classList.add('d-none');
  }
  if (controlFileNameDisplay) {
    controlFileNameDisplay.classList.add('d-none');
  }
  if (dataFileName) {
    dataFileName.textContent = '';
  }
  if (controlFileName) {
    controlFileName.textContent = '';
  }
  
  // 隐藏编码选择器和检测结果
  encodingSelector.classList.add('d-none');
  controlEncodingSelector.classList.add('d-none');
  dataEncodingResult.classList.add('d-none');
  controlEncodingResult.classList.add('d-none');
  
  // 重置表格
  tableHeader.innerHTML = '<tr><th colspan="100%" class="text-center text-muted">📄 未上传数据文件，暂无表格数据</th></tr>';
  tableBody.innerHTML = '';
  dataCountHint.style.display = 'none';
  
  // 重置图表
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
  lineChart.style.display = 'none';
  chartContainer.innerHTML = '<div class="d-flex align-items-center justify-content-center h-100 text-muted">📊 未绘制图表，上传数据文件并配置坐标轴后点击「绘制折线图」</div>';
  
  // 重置时间选择下拉框
  timeSelectorContainer.classList.add('d-none');
  timeSelectorSelect.innerHTML = '';
  
  // 禁用所有按钮
  disableControls(['xAxisSelect', 'yAxisSelect', 'drawChartBtn', 'filterByControlBtn', 'exportChartBtn', 'resetDataBtn']);
  
  // 重置选择器
  xAxisSelect.innerHTML = '<option value="">请先上传DemDec数据文件</option>';
  yAxisSelect.innerHTML = '<option value="">请先上传DemDec数据文件</option>';
  
  // 更新状态
  updateStatus(`🧹 已清空所有文件，恢复初始状态`, 'info');
}

// ========== 辅助函数 ==========
// 解析CSV或DAT行
function parseCSVLine(line, delimiter = ',') {
  // 处理空行
  if (!line || line.trim() === '') {
    return [];
  }
  
  // 简单分割方法，支持带引号的字段
  const result = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      // 移除多余的引号
      currentField = currentField.replace(/^["']|["']$/g, '').trim();
      result.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  // 添加最后一个字段
  currentField = currentField.replace(/^["']|["']$/g, '').trim();
  result.push(currentField);
  
  return result;
}

// 渲染表格（支持分页）
function renderTable(headers, dataRows) {
  if (!headers || headers.length === 0) {
    headers = ['列1'];
  }
  
  // 显示数据行数提示
  if (totalDataCount) {
    totalDataCount.textContent = dataRows.length;
  }
  
  // 重置当前页码
  currentPage = 1;
  
  // 计算总页数
  const totalPages = Math.ceil(dataRows.length / ITEMS_PER_PAGE);
  
  // 渲染表头（只渲染一次，不随分页变化）
  tableHeader.innerHTML = '';
  const headerRow = document.createElement('tr');
  headers.forEach((header, index) => {
    const th = document.createElement('th');
    th.textContent = header.trim() || `列${index + 1}`;
    // 设置表头字体
    th.style.fontFamily = "'Microsoft YaHei', sans-serif";
    headerRow.appendChild(th);
  });
  tableHeader.appendChild(headerRow);
  
  // 更新分页控件
  function updatePagination() {
    const paginationControls = document.getElementById('paginationControls');
    const pageInfo = document.getElementById('pageInfo');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    
    if (dataRows.length <= ITEMS_PER_PAGE) {
      paginationControls.classList.add('d-none');
    } else {
      paginationControls.classList.remove('d-none');
      pageInfo.textContent = `第 ${currentPage} 页 / 共 ${totalPages} 页`;
      prevPageBtn.disabled = currentPage === 1;
      nextPageBtn.disabled = currentPage === totalPages;
    }
  }
  
  // 渲染当前页数据（只渲染数据行，不重新渲染表头）
  function renderCurrentPageData() {
    // 计算当前页的数据范围
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const displayRows = dataRows.slice(startIndex, endIndex);

    // 清空表格内容
    tableBody.innerHTML = '';

    // 渲染数据行
    if (displayRows.length === 0) {
      const emptyRow = document.createElement('tr');
      const emptyCell = document.createElement('td');
      emptyCell.colSpan = headers.length;
      emptyCell.textContent = '暂无数据';
      emptyCell.className = 'text-center text-muted';
      emptyCell.style.fontFamily = "'Microsoft YaHei', sans-serif";
      emptyRow.appendChild(emptyCell);
      tableBody.appendChild(emptyRow);
      return;
    }
    
    displayRows.forEach((row, rowIndex) => {
      const tr = document.createElement('tr');
      // 确保每行数据列数与表头一致
      for (let cellIndex = 0; cellIndex < headers.length; cellIndex++) {
        const td = document.createElement('td');
        const cellValue = row[cellIndex]?.trim() || '-';
        td.textContent = cellValue;
        // 设置单元格字体
        td.style.fontFamily = "'Microsoft YaHei', sans-serif";
        // 标记文字类型数据
        if (isNaN(Number(cellValue)) && cellValue !== '-') {
          td.style.color = '#6f42c1';
          td.style.fontWeight = '500';
        }
        tr.appendChild(td);
      }
      tableBody.appendChild(tr);
    });
  }
  
  // 绑定分页事件
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const pageInput = document.getElementById('pageInput');
  const jumpBtn = document.getElementById('jumpBtn');
  
  prevPageBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderCurrentPageData();
      updatePagination();
    }
  };
  
  nextPageBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderCurrentPageData();
      updatePagination();
    }
  };
  
  // 添加页码跳转功能
  jumpBtn.onclick = () => {
    const pageNum = parseInt(pageInput.value);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      currentPage = pageNum;
      renderCurrentPageData();
      updatePagination();
      pageInput.value = '';
    }
  };
  
  // 按下回车键也可以跳转
  pageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      jumpBtn.click();
    }
  });
  
  // 初始渲染数据
  renderCurrentPageData();
  updatePagination();
}

// 表格显示/隐藏切换功能
function initTableToggle() {
  const toggleBtn = document.getElementById('toggleTableBtn');
  const tableContainer = document.getElementById('tableContainer');
  
  toggleBtn.onclick = () => {
    if (tableContainer.style.display === 'none' || tableContainer.style.display === '') {
      tableContainer.style.display = 'block';
      toggleBtn.innerHTML = '🔼 隐藏数据表格';
    } else {
      tableContainer.style.display = 'none';
      toggleBtn.innerHTML = '🔽 显示数据表格';
    }
  };
}

// 判断是否为时间相关列
function isTimeColumn(header) {
  const timeKeywords = ['时间', 'time', '日期', 'date', '时刻', 'timestamp'];
  const headerLower = header.toLowerCase();
  return timeKeywords.some(keyword => headerLower.includes(keyword.toLowerCase()));
}

// 初始化坐标轴选择器
function initAxisSelector() {
  if (!csvHeaders || csvHeaders.length === 0) {
    return;
  }
  
  xAxisSelect.innerHTML = '';
  yAxisSelect.innerHTML = '';

  csvHeaders.forEach((header, index) => {
    const displayName = header.trim() || `列${index + 1}`;
    // X轴选项（包含所有列）
    const xOption = document.createElement('option');
    xOption.value = index;
    xOption.textContent = displayName;
    if (index === 0) xOption.selected = true;
    xAxisSelect.appendChild(xOption);

    // Y轴选项（排除时间相关列）
    if (!isTimeColumn(displayName)) {
      const yOption = document.createElement('option');
      yOption.value = index;
      yOption.textContent = displayName;
      if (yAxisSelect.options.length === 0) yOption.selected = true;
      yAxisSelect.appendChild(yOption);
    }
  });
  
  // 确保控件启用
  xAxisSelect.disabled = false;
  yAxisSelect.disabled = false;
  drawChartBtn.disabled = false;
}

// 初始化时间范围选择器
function initTimeRangeSelector() {
  const timeRangeSelector = document.getElementById('timeRangeSelector');
  const timeRangeStart = document.getElementById('timeRangeStart');
  const timeRangeEnd = document.getElementById('timeRangeEnd');
  
  if (!timeRangeSelector || !timeRangeStart || !timeRangeEnd) return;
  
  // 检查是否有原始图表数据
  if (!originalChartData || !originalChartData.xTimeValues) return;
  
  // 找出所有有效的时间值
  const validTimeValues = originalChartData.xTimeValues.filter(time => time !== null);
  if (validTimeValues.length === 0) return;
  
  // 格式化时间为datetime-local输入框支持的格式
  const formatDateTimeLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };
  
  // 如果用户已经选择了时间范围，保持用户的选择
  if (selectedTimeRange) {
    timeRangeStart.value = formatDateTimeLocal(selectedTimeRange.start);
    timeRangeEnd.value = formatDateTimeLocal(selectedTimeRange.end);
  } else {
    // 否则设置默认时间范围为数据的最小和最大值
    const minTime = new Date(Math.min(...validTimeValues.map(time => time.getTime())));
    const maxTime = new Date(Math.max(...validTimeValues.map(time => time.getTime())));
    timeRangeStart.value = formatDateTimeLocal(minTime);
    timeRangeEnd.value = formatDateTimeLocal(maxTime);
  }
}

// 更新时间范围选择器的可见性
function updateTimeRangeSelectorVisibility() {
  const timeRangeSelector = document.getElementById('timeRangeSelector');
  if (!timeRangeSelector) return;
  
  // 检查X轴是否选择了时间相关列
  const xColIndex = parseInt(xAxisSelect.value);
  if (isNaN(xColIndex) || xColIndex >= csvHeaders.length) {
    timeRangeSelector.classList.add('d-none');
    return;
  }
  
  const xHeader = csvHeaders[xColIndex]?.trim() || '';
  const isTimeCol = isTimeColumn(xHeader);
  
  // 检查是否有有效的时间数据
  const hasValidTimeData = originalChartData && 
                          originalChartData.xTimeValues && 
                          originalChartData.xTimeValues.some(time => time !== null);
  
  if (isTimeCol && hasValidTimeData) {
    timeRangeSelector.classList.remove('d-none');
  } else {
    timeRangeSelector.classList.add('d-none');
  }
}

// 应用时间范围
function applyTimeRange() {
  const timeRangeStart = document.getElementById('timeRangeStart');
  const timeRangeEnd = document.getElementById('timeRangeEnd');
  
  if (!timeRangeStart || !timeRangeEnd) return;
  
  const startTimeStr = timeRangeStart.value;
  const endTimeStr = timeRangeEnd.value;
  
  if (!startTimeStr || !endTimeStr) {
    updateStatus(`❌ 请选择完整的时间范围`, 'danger');
    return;
  }
  
  const startTime = new Date(startTimeStr);
  const endTime = new Date(endTimeStr);
  
  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    updateStatus(`❌ 时间格式错误`, 'danger');
    return;
  }
  
  if (startTime > endTime) {
    updateStatus(`❌ 开始时间不能晚于结束时间`, 'danger');
    return;
  }
  
  // 保存选择的时间范围
  selectedTimeRange = { start: startTime, end: endTime };
  
  // 重新绘制图表
  drawLineChart();
  
  updateStatus(`✅ 时间范围应用成功：${startTime.toLocaleString()} ~ ${endTime.toLocaleString()}`, 'success');
}

// 重置时间范围
function resetTimeRange() {
  const timeRangeStart = document.getElementById('timeRangeStart');
  const timeRangeEnd = document.getElementById('timeRangeEnd');
  
  if (!timeRangeStart || !timeRangeEnd) return;
  
  // 清除时间范围选择
  selectedTimeRange = null;
  
  // 重新初始化时间范围选择器
  initTimeRangeSelector();
  
  // 重新绘制图表
  drawLineChart();
  
  updateStatus(`✅ 时间范围已重置为全部数据`, 'success');
}

// 自动设置时间范围
function autoTimeRange() {
  const xColIndex = parseInt(xAxisSelect.value);
  if (isNaN(xColIndex) || xColIndex >= csvHeaders.length) {
    updateStatus(`❌ 请先选择X轴列`, 'danger');
    return;
  }
  
  // 获取所有Y轴选择的列
  const yColIndexes = Array.from(yAxisSelect.selectedOptions)
    .map(option => parseInt(option.value))
    .filter(index => !isNaN(index) && index < csvHeaders.length);
  
  if (yColIndexes.length === 0) {
    updateStatus(`❌ 请至少选择一个Y轴列`, 'danger');
    return;
  }
  
  // 提取X轴时间和Y轴数据
  const xTimeValues = [];
  const yDataList = yColIndexes.map(() => []);
  
  csvData.forEach((row) => {
    const xValue = row[xColIndex]?.trim() || '';
    
    // 解析时间值
    let timeValue = null;
    try {
      let rowTime = new Date(xValue);
      if (isNaN(rowTime.getTime())) {
        const timeMatch = xValue.match(/(\d{2}):(\d{2}):(\d{2}):(\d{3})/);
        if (timeMatch) {
          const [, hh, mm, ss, ms] = timeMatch;
          const today = new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const day = String(today.getDate()).padStart(2, '0');
          rowTime = new Date(`${year}-${month}-${day} ${hh}:${mm}:${ss}.${ms}`);
        }
      }
      if (!isNaN(rowTime.getTime())) {
        timeValue = rowTime;
      }
    } catch (e) {}
    xTimeValues.push(timeValue);
    
    // 收集Y轴数据
    yColIndexes.forEach((yColIdx, idx) => {
      const yValue = row[yColIdx]?.trim() || '';
      yDataList[idx].push(yValue);
    });
  });
  
  // 判断Y轴是否为文字类型
  const isTextData = yDataList.some((yData) => {
    const sampleValue = yData.find(val => val && val !== '');
    return sampleValue && isNaN(Number(sampleValue));
  });
  
  // 判断数据是否为有效（非0且非"失锁"）
  const isValidData = (value) => {
    if (!value || value === '') return false;
    if (isTextData) {
      return value !== '失锁' && value.trim() !== '失锁';
    } else {
      return parseFloat(value) !== 0;
    }
  };
  
  // 判断数据是否为边界值（0或"失锁"）
  const isBoundaryData = (value) => {
    if (!value || value === '') return false;
    if (isTextData) {
      return value === '失锁' || value.trim() === '失锁';
    } else {
      return parseFloat(value) === 0;
    }
  };
  
  // 确定时间范围中心点
  let centerTime = null;
  let centerIndex = -1;
  
  if (selectedTimeRange && selectedTimeRange.start && selectedTimeRange.end) {
    // 如果用户已经选择了时间范围，以该范围的中心为参考
    centerTime = new Date((selectedTimeRange.start.getTime() + selectedTimeRange.end.getTime()) / 2);
    // 找到中心点在数据中的索引
    for (let i = 0; i < xTimeValues.length; i++) {
      if (xTimeValues[i] && xTimeValues[i] >= centerTime) {
        centerIndex = i;
        break;
      }
    }
    if (centerIndex === -1) centerIndex = Math.floor(xTimeValues.length / 2);
  } else {
    // 否则使用全部数据的中心点
    const validTimeValues = xTimeValues.filter(time => time !== null);
    if (validTimeValues.length > 0) {
      const minTime = new Date(Math.min(...validTimeValues.map(time => time.getTime())));
      const maxTime = new Date(Math.max(...validTimeValues.map(time => time.getTime())));
      centerTime = new Date((minTime.getTime() + maxTime.getTime()) / 2);
      // 找到中心点在数据中的索引
      for (let i = 0; i < xTimeValues.length; i++) {
        if (xTimeValues[i] && xTimeValues[i] >= centerTime) {
          centerIndex = i;
          break;
        }
      }
      if (centerIndex === -1) centerIndex = Math.floor(xTimeValues.length / 2);
    } else {
      updateStatus(`❌ 无法解析时间数据`, 'danger');
      return;
    }
  }
  
  // 找到中心点左侧最近的非零/非"失锁"数据
  let validLeftIndex = -1;
  for (let i = centerIndex; i >= 0; i--) {
    let hasValidData = false;
    for (const yData of yDataList) {
      if (isValidData(yData[i])) {
        hasValidData = true;
        break;
      }
    }
    if (hasValidData) {
      validLeftIndex = i;
      break;
    }
  }
  
  // 找到中心点右侧最近的非零/非"失锁"数据
  let validRightIndex = -1;
  for (let i = centerIndex; i < xTimeValues.length; i++) {
    let hasValidData = false;
    for (const yData of yDataList) {
      if (isValidData(yData[i])) {
        hasValidData = true;
        break;
      }
    }
    if (hasValidData) {
      validRightIndex = i;
      break;
    }
  }
  
  if (validLeftIndex === -1 && validRightIndex === -1) {
    updateStatus(`❌ 未找到有效的Y轴数据`, 'danger');
    return;
  }
  
  // 从有效数据区域向左扩展，找到第一个0/失锁的位置
  let leftBoundIndex = validLeftIndex >= 0 ? validLeftIndex : 0;
  if (validLeftIndex >= 0) {
    for (let i = validLeftIndex - 1; i >= 0; i--) {
      let allBoundary = true;
      for (const yData of yDataList) {
        if (isValidData(yData[i])) {
          allBoundary = false;
          break;
        }
      }
      if (allBoundary) {
        leftBoundIndex = i;
      } else {
        break;
      }
    }
  }
  
  // 从有效数据区域向右扩展，找到第一个0/失锁的位置
  let rightBoundIndex = validRightIndex >= 0 ? validRightIndex : xTimeValues.length - 1;
  if (validRightIndex >= 0) {
    for (let i = validRightIndex + 1; i < xTimeValues.length; i++) {
      let allBoundary = true;
      for (const yData of yDataList) {
        if (isValidData(yData[i])) {
          allBoundary = false;
          break;
        }
      }
      if (allBoundary) {
        rightBoundIndex = i;
      } else {
        break;
      }
    }
  }
  
  // 计算扩展后的时间范围（向左右延伸3分钟）
  const threeMinutes = 3 * 60 * 1000;
  let newStartTime = null;
  let newEndTime = null;
  
  if (leftBoundIndex >= 0 && xTimeValues[leftBoundIndex]) {
    const leftTime = xTimeValues[leftBoundIndex];
    newStartTime = new Date(leftTime.getTime() - threeMinutes);
  } else if (centerTime) {
    newStartTime = new Date(centerTime.getTime() - threeMinutes);
  }
  
  if (rightBoundIndex >= 0 && xTimeValues[rightBoundIndex]) {
    const rightTime = xTimeValues[rightBoundIndex];
    newEndTime = new Date(rightTime.getTime() + threeMinutes);
  } else if (centerTime) {
    newEndTime = new Date(centerTime.getTime() + threeMinutes);
  }
  
  if (!newStartTime || !newEndTime) {
    updateStatus(`❌ 无法计算时间范围`, 'danger');
    return;
  }
  
  // 更新选择的时间范围
  selectedTimeRange = { start: newStartTime, end: newEndTime };
  
  // 格式化时间为datetime-local输入框支持的格式
  const formatDateTimeLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };
  
  // 更新时间范围选择器的显示
  const timeRangeStart = document.getElementById('timeRangeStart');
  const timeRangeEnd = document.getElementById('timeRangeEnd');
  if (timeRangeStart && timeRangeEnd) {
    timeRangeStart.value = formatDateTimeLocal(newStartTime);
    timeRangeEnd.value = formatDateTimeLocal(newEndTime);
  }
  
  // 重新绘制图表
  drawLineChart();
  
  const dataType = isTextData ? '文字' : '数值';
  updateStatus(`✅ 智能时间范围已设置（${dataType}数据）：${newStartTime.toLocaleTimeString()} ~ ${newEndTime.toLocaleTimeString()}（左右延伸3分钟）`, 'success');
}

// 更新状态提示
function updateStatus(message, type) {
  if (statusText) {
    statusText.textContent = message;
    // 重置样式
    statusText.className = 'status-text text-center p-3';
    // 设置字体
    statusText.style.fontFamily = "'Microsoft YaHei', sans-serif";
    switch(type) {
      case 'success':
        statusText.classList.add('text-success', 'bg-success-subtle', 'border', 'border-success');
        break;
      case 'danger':
        statusText.classList.add('text-danger', 'bg-danger-subtle', 'border', 'border-danger');
        break;
      case 'primary':
        statusText.classList.add('text-primary', 'bg-primary-subtle', 'border', 'border-primary');
        break;
      case 'warning':
        statusText.classList.add('text-warning', 'bg-warning-subtle', 'border', 'border-warning');
        break;
      case 'info':
      default:
        statusText.classList.add('text-secondary', 'bg-light', 'border', 'border-secondary');
        break;
    }
  }
}
// 启用控件
function enableControls(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.disabled = false;
      // 为按钮添加激活样式
      if (el.tagName === 'BUTTON') {
        el.classList.remove('btn-secondary', 'btn-primary');
        el.classList.add('btn-primary');
      }
    }
  });
}

// 禁用控件（补充缺失的函数）
function disableControls(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.disabled = true;
      // 为按钮添加禁用样式
      if (el.tagName === 'BUTTON') {
        el.classList.remove('btn-primary');
        el.classList.add('btn-secondary');
      }
    }
  });
}

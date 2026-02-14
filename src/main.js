// ========== 全局拖拽拦截（关键修复：阻止拖拽下载） ==========
// 拦截整个页面的拖拽默认行为，避免文件拖入时触发下载
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());

// ========== DOM元素获取 ==========
// 文件上传相关
let dataFileUploadArea;
let demDecFileInput;
let controlFileUploadArea;
let demControlFileInput;
let filterByControlBtn;

// 文件名称显示元素
let dataFileNameDisplay;
let dataFileName;
let controlFileNameDisplay;
let controlFileName;

// 编码选择器相关
let encodingSelector;
let dataFileEncoding;
let encodingPreview;
let confirmEncodingBtn;
let controlEncodingSelector;
let controlFileEncoding;
let controlEncodingPreview;
let confirmControlEncodingBtn;

// 编码检测结果显示元素
let dataEncodingResult;
let controlEncodingResult;

// 时间选择下拉框相关
let timeSelectorContainer;
let timeSelectorSelect;

// 选择器相关
let xAxisSelect;
let yAxisSelect;
let yAxis2Select;
let drawChartBtn;

// 按钮相关
let exportChartBtn;
let resetDataBtn;
let clearAllBtn;

// 显示区域相关
let statusText;
let tableContainer;
let tableHeader;
let tableBody;
let chartContainer;
let lineChart;
// 数据行数提示
let dataCountHint;
let totalDataCount;

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
console.log('开始绑定事件...');
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded事件触发，开始初始化...');
  // 初始化所有DOM元素
  console.log('开始获取DOM元素...');
  dataFileUploadArea = document.getElementById('dataFileUploadArea');
  console.log('dataFileUploadArea:', dataFileUploadArea);
  demDecFileInput = document.getElementById('demDecFileInput');
  console.log('demDecFileInput:', demDecFileInput);
  controlFileUploadArea = document.getElementById('controlFileUploadArea');
  console.log('controlFileUploadArea:', controlFileUploadArea);
  demControlFileInput = document.getElementById('demControlFileInput');
  console.log('demControlFileInput:', demControlFileInput);
  filterByControlBtn = document.getElementById('filterByControlBtn');
  dataFileNameDisplay = document.getElementById('dataFileNameDisplay');
  dataFileName = document.getElementById('dataFileName');
  controlFileNameDisplay = document.getElementById('controlFileNameDisplay');
  controlFileName = document.getElementById('controlFileName');
  encodingSelector = document.getElementById('encodingSelector');
  dataFileEncoding = document.getElementById('dataFileEncoding');
  encodingPreview = document.getElementById('encodingPreview');
  confirmEncodingBtn = document.getElementById('confirmEncodingBtn');
  controlEncodingSelector = document.getElementById('controlEncodingSelector');
  controlFileEncoding = document.getElementById('controlFileEncoding');
  controlEncodingPreview = document.getElementById('controlEncodingPreview');
  confirmControlEncodingBtn = document.getElementById('confirmControlEncodingBtn');
  dataEncodingResult = document.getElementById('dataEncodingResult');
  controlEncodingResult = document.getElementById('controlEncodingResult');
  timeSelectorContainer = document.getElementById('timeSelectorContainer');
  timeSelectorSelect = document.getElementById('timeSelectorSelect');
  xAxisSelect = document.getElementById('xAxisSelect');
  yAxisSelect = document.getElementById('yAxisSelect');
  yAxis2Select = document.getElementById('yAxis2Select');
  drawChartBtn = document.getElementById('drawChartBtn');
  exportChartBtn = document.getElementById('exportChartBtn');
  resetDataBtn = document.getElementById('resetDataBtn');
  clearAllBtn = document.getElementById('clearAllBtn');
  statusText = document.getElementById('statusText');
  tableContainer = document.getElementById('tableContainer');
  tableHeader = document.getElementById('tableHeader');
  tableBody = document.getElementById('tableBody');
  chartContainer = document.getElementById('chartContainer');
  lineChart = document.getElementById('lineChart');
  dataCountHint = document.getElementById('dataCountHint');
  totalDataCount = document.getElementById('totalDataCount');
  console.log('DOM元素获取完成');

  
  // ========== 修复：DemDec数据文件上传事件 ==========
  if (dataFileUploadArea && demDecFileInput) {
    // 简化事件处理：为上传区域及其所有子元素添加点击事件
    dataFileUploadArea.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      demDecFileInput.click();
      console.log('点击数据文件上传区域，触发文件选择框');
    });
    
    // 确保文件输入元素本身也能响应点击
    demDecFileInput.addEventListener('click', function(e) {
      e.stopPropagation();
      console.log('文件输入元素被点击');
    });
  }
  
  // ========== 修复：DemControl时间筛选文件上传事件 ==========
  if (controlFileUploadArea && demControlFileInput) {
    // 简化事件处理：为上传区域及其所有子元素添加点击事件
    controlFileUploadArea.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      demControlFileInput.click();
      console.log('点击控制文件上传区域，触发文件选择框');
    });
    
    // 确保文件输入元素本身也能响应点击
    demControlFileInput.addEventListener('click', function(e) {
      e.stopPropagation();
      console.log('文件输入元素被点击');
    });
  }
  
  // 保留原有拖拽事件绑定（无需修改）
  if (dataFileUploadArea) {
    dataFileUploadArea.addEventListener('dragover', (e) => handleDragOver(e, 'data'));
    dataFileUploadArea.addEventListener('dragleave', (e) => handleDragLeave(e, 'data'));
    dataFileUploadArea.addEventListener('drop', (e) => handleDrop(e, 'data'));
  }
  if (demDecFileInput) {
    demDecFileInput.addEventListener('change', (e) => handleDemDecFileSelect(e));
  }
  
  if (controlFileUploadArea) {
    controlFileUploadArea.addEventListener('dragover', (e) => handleDragOver(e, 'control'));
    controlFileUploadArea.addEventListener('dragleave', (e) => handleDragLeave(e, 'control'));
    controlFileUploadArea.addEventListener('drop', (e) => handleDrop(e, 'control'));
  }
  if (demControlFileInput) {
    demControlFileInput.addEventListener('change', (e) => handleDemControlFileSelect(e));
  }
  
  // 其他事件绑定保持不变
  if (dataFileEncoding) {
    dataFileEncoding.addEventListener('change', () => updateEncodingPreview('data'));
  }
  if (controlFileEncoding) {
    controlFileEncoding.addEventListener('change', () => updateEncodingPreview('control'));
  }
  if (confirmEncodingBtn) {
    confirmEncodingBtn.addEventListener('click', () => parseDemDecFileWithSelectedEncoding());
  }
  if (confirmControlEncodingBtn) {
    confirmControlEncodingBtn.addEventListener('click', () => parseDemControlFileWithSelectedEncoding());
  }
  if (filterByControlBtn) {
    filterByControlBtn.addEventListener('click', filterDataByDemControl);
  }
  if (drawChartBtn) {
    drawChartBtn.addEventListener('click', drawLineChart);
  }
  if (exportChartBtn) {
    exportChartBtn.addEventListener('click', exportChartAsImage);
  }
  if (resetDataBtn) {
    resetDataBtn.addEventListener('click', resetToOriginalData);
  }
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllFiles);
  }
  if (timeSelectorSelect) {
    timeSelectorSelect.addEventListener('change', handleTimeSelectChange);
  }
  
  // 时间范围选择器事件绑定
  const applyTimeRangeBtn = document.getElementById('applyTimeRangeBtn');
  const resetTimeRangeBtn = document.getElementById('resetTimeRangeBtn');
  const autoTimeRangeBtn = document.getElementById('autoTimeRangeBtn');
  const sliderHandleMin = document.getElementById('sliderHandleMin');
  const sliderHandleMax = document.getElementById('sliderHandleMax');
  const sliderWrapper = document.querySelector('.x-axis-slider-container .slider-wrapper');
  
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
  
  // 初始化滑块拖动功能
  if (sliderHandleMin && sliderHandleMax && sliderWrapper) {
    let isDragging = false;
    let currentHandle = null;
    
    // 计算鼠标位置
    function getMousePosition(e) {
      const rect = sliderWrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      return percentage;
    }
    
    // 鼠标按下事件
    function onMouseDown(e) {
      if (e.target === sliderHandleMin || e.target === sliderHandleMax) {
        isDragging = true;
        currentHandle = e.target;
      }
    }
    
    // 鼠标移动事件
    function onMouseMove(e) {
      if (isDragging && currentHandle) {
        const percentage = getMousePosition(e);
        const min = parseFloat(sliderHandleMin.style.left) || 0;
        const max = parseFloat(sliderHandleMax.style.left) || 100;
        
        if (currentHandle === sliderHandleMin) {
          if (percentage < max - 2) {
            currentHandle.style.left = `${percentage}%`;
            handleXAxisSliderChangeFromDrag(percentage, max);
          }
        } else if (currentHandle === sliderHandleMax) {
          if (percentage > min + 2) {
            currentHandle.style.left = `${percentage}%`;
            handleXAxisSliderChangeFromDrag(min, percentage);
          }
        }
      }
    }
    
    // 鼠标释放事件
    function onMouseUp() {
      isDragging = false;
      currentHandle = null;
    }
    
    // 添加事件监听器
    sliderHandleMin.addEventListener('mousedown', onMouseDown);
    sliderHandleMax.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
  
  // 初始化表格显示/隐藏切换功能
  initTableToggle();
  
  // 初始化时间范围选择器
    initTimeRangeSelector();
    
    // 为Excel工作表选择按钮添加事件监听器
    const confirmSheetBtn = document.getElementById('confirmSheetBtn');
    if (confirmSheetBtn) {
      confirmSheetBtn.addEventListener('click', selectExcelSheet);
      console.log('Excel工作表选择按钮事件监听器已添加');
    }
    
    // 为重置按钮添加事件监听器，重新显示Sheet选择器
    if (resetDataBtn) {
      resetDataBtn.addEventListener('click', function() {
        const sheetSelector = document.getElementById('sheetSelector');
        if (sheetSelector) {
          sheetSelector.classList.add('d-none');
        }
      });
    }
    
    // 为清空所有文件按钮添加事件监听器，重新显示Sheet选择器
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', function() {
        const sheetSelector = document.getElementById('sheetSelector');
        if (sheetSelector) {
          sheetSelector.classList.add('d-none');
        }
      });
    }
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
  try {
    const file = e.target.files[0];
    if (file) {
      demDecFileName = file.name;
      if (dataFileName) {
        dataFileName.textContent = demDecFileName;
      }
      if (dataFileNameDisplay) {
        dataFileNameDisplay.classList.remove('d-none');
      }
      console.log('准备更新状态...');
      updateStatus(`📁 开始处理文件：${file.name}`, 'info');
      console.log('状态已更新，准备读取文件...');
      readFileAsBuffer(file, 'data');
    }
  } catch (error) {
    console.error('文件选择处理错误：', error);
    updateStatus(`❌ 文件选择处理失败：${error.message}`, 'danger');
  }
}

// 处理DemControl文件选择
function handleDemControlFileSelect(e) {
  console.log('选择了DemControl文件');
  try {
    const file = e.target.files[0];
    if (file) {
      demControlFileName = file.name;
      if (controlFileName) {
        controlFileName.textContent = demControlFileName;
      }
      if (controlFileNameDisplay) {
        controlFileNameDisplay.classList.remove('d-none');
      }
      console.log('准备更新状态...');
      updateStatus(`📁 开始处理文件：${file.name}`, 'info');
      console.log('状态已更新，准备读取文件...');
      readFileAsBuffer(file, 'control');
    }
  } catch (error) {
    console.error('文件选择处理错误：', error);
    updateStatus(`❌ 文件选择处理失败：${error.message}`, 'danger');
  }
}

// 读取文件为ArrayBuffer并自动检测编码解析
function readFileAsBuffer(file, type) {
  console.log('开始读取文件：', file.name, '类型：', type);
  console.log('文件大小：', file.size, '字节');
  console.log('文件类型：', file.type);
  try {
    // 检查是否为Excel文件
    const isExcelFile = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
    console.log('是否为Excel文件：', isExcelFile);
    
    if (isExcelFile) {
      console.log('检测到Excel文件，使用xlsx库解析');
      updateStatus(`📁 开始处理Excel文件：${file.name}`, 'info');
      
      // 使用FileReader读取文件为ArrayBuffer
      const reader = new FileReader();
      reader.onloadstart = function() {
        console.log('开始读取Excel文件...');
      };
      reader.onprogress = function(e) {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          console.log('Excel文件读取进度：', percentComplete.toFixed(2), '%');
        }
      };
      reader.onload = function(e) {
        try {
          console.log('Excel文件读取完成，开始解析...');
          const arrayBuffer = e.target.result;
          console.log('读取到的ArrayBuffer大小：', arrayBuffer.byteLength, '字节');
          
          // 使用xlsx库解析Excel文件
          console.log('开始使用XLSX库解析Excel文件...');
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          console.log('Excel文件解析完成');
          
          // 获取所有工作表名称
          const sheetNames = workbook.SheetNames;
          console.log('Excel文件包含的工作表：', sheetNames);
          console.log('工作表数量：', sheetNames.length);
          
          // 如果只有一个工作表，直接使用
          if (sheetNames.length === 1) {
            const firstSheetName = sheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            console.log('只有一个工作表，使用：', firstSheetName);
            updateStatus(`📋 只找到一个工作表：${firstSheetName}，直接使用`, 'info');
            processExcelSheet(worksheet, file, type);
          } else {
            // 如果有多个工作表，显示选择对话框
            console.log('有多个工作表，显示选择下拉列表');
            showSheetSelectionDialog(workbook, file, type);
          }
        } catch (error) {
          console.error('Excel文件读取错误：', error);
          console.error('错误堆栈：', error.stack);
          updateStatus(`❌ Excel文件读取失败：${error.message}`, 'danger');
        }
      };
      reader.onerror = function(error) {
        console.error('Excel文件读取器错误：', error);
        console.error('错误目标：', error.target);
        if (error.target && error.target.error) {
          console.error('读取器错误详情：', error.target.error);
          updateStatus(`❌ Excel文件读取失败：${error.target.error.message}`, 'danger');
        } else {
          updateStatus(`❌ Excel文件读取失败：未知错误`, 'danger');
        }
      };
      reader.onabort = function() {
        console.error('Excel文件读取被中止');
        updateStatus(`❌ Excel文件读取被中止`, 'danger');
      };
      reader.readAsArrayBuffer(file);
      console.log('Excel文件读取已开始');
    } else {
      // 非Excel文件，使用原有逻辑处理
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          console.log('文件读取完成，开始处理...');
          if (type === 'data') {
            demDecFileBuffer = e.target.result;
            console.log('DemDec文件缓冲已设置，大小：', demDecFileBuffer.byteLength);
            
            // 自动检测编码
            const uint8Array = new Uint8Array(demDecFileBuffer);
            detectedDataEncoding = autoDetectEncoding(uint8Array, 'data');
            console.log('编码检测完成，检测到的编码：', detectedDataEncoding);
            
            // 确保dataFileEncoding已初始化
            if (!dataFileEncoding) {
              dataFileEncoding = document.getElementById('dataFileEncoding');
              console.log('dataFileEncoding已初始化：', dataFileEncoding);
            }
            
            // 自动设置编码并解析文件
            if (dataFileEncoding) {
              dataFileEncoding.value = 'auto';
              console.log('编码已设置为auto');
            }
            console.log('准备解析DemDec文件...');
            parseDemDecFileWithSelectedEncoding();
          } else {
            demControlFileBuffer = e.target.result;
            console.log('DemControl文件缓冲已设置，大小：', demControlFileBuffer.byteLength);
            
            // 自动检测编码
            const uint8Array = new Uint8Array(demControlFileBuffer);
            detectedControlEncoding = autoDetectEncoding(uint8Array, 'control');
            console.log('编码检测完成，检测到的编码：', detectedControlEncoding);
            
            // 确保controlFileEncoding已初始化
            if (!controlFileEncoding) {
              controlFileEncoding = document.getElementById('controlFileEncoding');
              console.log('controlFileEncoding已初始化：', controlFileEncoding);
            }
            
            // 自动设置编码并解析文件
            if (controlFileEncoding) {
              controlFileEncoding.value = 'auto';
              console.log('编码已设置为auto');
            }
            console.log('准备解析DemControl文件...');
            parseDemControlFileWithSelectedEncoding();
          }
        } catch (error) {
          console.error('文件读取处理错误：', error);
          updateStatus(`❌ 文件读取失败：${error.message}`, 'danger');
        }
      };
      reader.onerror = function(error) {
        console.error('文件读取器错误：', error);
        updateStatus(`❌ 文件读取失败：${error.target.error.message}`, 'danger');
      };
      reader.readAsArrayBuffer(file);
      console.log('文件读取已开始');
    }
  } catch (error) {
    console.error('文件读取初始化错误：', error);
    console.error('错误堆栈：', error.stack);
    updateStatus(`❌ 文件读取初始化失败：${error.message}`, 'danger');
  }
}

// 处理Excel工作表
function processExcelSheet(worksheet, file, type) {
  try {
    console.log('开始处理Excel工作表，文件大小：', file.size, '字节');
    
    // 直接将工作表转换为CSV格式，跳过中间的JSON转换步骤
    console.log('开始将工作表直接转换为CSV格式...');
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    console.log('Excel工作表解析完成，转换为CSV格式，CSV长度：', csvContent.length);
    
    // 将CSV内容转换为ArrayBuffer
    console.log('开始将CSV内容转换为ArrayBuffer...');
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(csvContent);
    const buffer = uint8Array.buffer;
    console.log('CSV内容转换为ArrayBuffer完成，缓冲区大小：', buffer.byteLength);
    
    if (type === 'data') {
      demDecFileBuffer = buffer;
      demDecFileName = file.name;
      console.log('DemDec Excel文件缓冲已设置，大小：', demDecFileBuffer.byteLength);
      console.log('DemDec文件名已设置：', demDecFileName);
      
      // 自动设置编码为UTF-8（Excel文件解析后默认为UTF-8）
      detectedDataEncoding = 'utf8';
      console.log('Excel文件编码设置为：utf8');
      
      // 确保dataFileEncoding已初始化
      if (!dataFileEncoding) {
        dataFileEncoding = document.getElementById('dataFileEncoding');
        console.log('dataFileEncoding已初始化：', dataFileEncoding);
      }
      
      // 自动设置编码并解析文件
      if (dataFileEncoding) {
        dataFileEncoding.value = 'utf8';
        console.log('编码已设置为utf8');
      }
      console.log('准备解析DemDec Excel文件...');
      parseDemDecFileWithSelectedEncoding();
    } else {
      demControlFileBuffer = buffer;
      demControlFileName = file.name;
      console.log('DemControl Excel文件缓冲已设置，大小：', demControlFileBuffer.byteLength);
      console.log('DemControl文件名已设置：', demControlFileName);
      
      // 自动设置编码为UTF-8（Excel文件解析后默认为UTF-8）
      detectedControlEncoding = 'utf8';
      console.log('Excel文件编码设置为：utf8');
      
      // 确保controlFileEncoding已初始化
      if (!controlFileEncoding) {
        controlFileEncoding = document.getElementById('controlFileEncoding');
        console.log('controlFileEncoding已初始化：', controlFileEncoding);
      }
      
      // 自动设置编码并解析文件
      if (controlFileEncoding) {
        controlFileEncoding.value = 'utf8';
        console.log('编码已设置为utf8');
      }
      console.log('准备解析DemControl Excel文件...');
      parseDemControlFileWithSelectedEncoding();
    }
  } catch (error) {
    console.error('Excel工作表处理错误：', error);
    updateStatus(`❌ Excel工作表处理失败：${error.message}`, 'danger');
  }
}

// 存储Excel文件的workbook对象，用于工作表选择
let excelWorkbookCache = null;
let excelFileCache = null;
let excelFileTypeCache = null;

// 显示Sheet选择下拉列表
function showSheetSelectionDialog(workbook, file, type) {
  try {
    console.log('开始显示Sheet选择下拉列表');
    // 缓存workbook对象和文件信息
    excelWorkbookCache = workbook;
    excelFileCache = file;
    excelFileTypeCache = type;
    console.log('已缓存workbook对象和文件信息');
    
    // 获取所有工作表名称
    const sheetNames = workbook.SheetNames;
    console.log('准备显示Sheet选择下拉列表，工作表数量：', sheetNames.length);
    console.log('工作表名称列表：', sheetNames);
    
    // 获取Sheet选择器元素
    console.log('开始获取Sheet选择器元素...');
    const sheetSelector = document.getElementById('sheetSelector');
    console.log('sheetSelector元素：', sheetSelector);
    if (sheetSelector) {
      console.log('sheetSelector类名：', sheetSelector.className);
      console.log('sheetSelector样式：', sheetSelector.style);
    }
    
    const sheetSelect = document.getElementById('sheetSelect');
    console.log('sheetSelect元素：', sheetSelect);
    if (sheetSelect) {
      console.log('sheetSelect类名：', sheetSelect.className);
    }
    
    if (!sheetSelector || !sheetSelect) {
      console.error('未找到Sheet选择器元素');
      throw new Error('未找到Sheet选择器元素');
    }
    
    // 清空现有选项
    sheetSelect.innerHTML = '';
    console.log('已清空现有选项');
    
    // 添加工作表选项
    console.log('开始添加工作表选项...');
    sheetNames.forEach((sheetName, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = sheetName;
      sheetSelect.appendChild(option);
      console.log('添加工作表选项：', sheetName, '索引：', index);
    });
    console.log('工作表选项添加完成');
    
    // 显示Sheet选择器
    console.log('开始显示Sheet选择器...');
    console.log('显示前sheetSelector类名：', sheetSelector.className);
    sheetSelector.classList.remove('d-none');
    console.log('显示后sheetSelector类名：', sheetSelector.className);
    console.log('Sheet选择下拉列表已成功显示');
    
    // 强制重排，确保元素显示
    sheetSelector.offsetHeight; // 触发重排
    console.log('已触发重排，确保元素显示');
    
    // 更新状态提示
    updateStatus(`📋 Excel文件 "${file.name}" 包含 ${sheetNames.length} 个工作表，请选择要读取的工作表`, 'info');
    console.log('状态提示已更新');
  } catch (error) {
    console.error('显示Sheet选择下拉列表错误：', error);
    console.error('错误堆栈：', error.stack);
    updateStatus(`❌ 显示Sheet选择下拉列表失败：${error.message}`, 'danger');
    
    // 如果下拉列表显示失败，直接使用第一个工作表
    console.log('下拉列表显示失败，直接使用第一个工作表');
    const firstSheetName = workbook.SheetNames[0];
    const firstWorksheet = workbook.Sheets[firstSheetName];
    updateStatus(`⚠️  直接使用第一个工作表：${firstSheetName}`, 'warning');
    processExcelSheet(firstWorksheet, file, type);
  }
}

// 选择Excel工作表
function selectExcelSheet() {
  try {
    // 获取选中的工作表索引
    const selectElement = document.getElementById('sheetSelect');
    const selectedIndex = parseInt(selectElement.value);
    
    // 从缓存中获取workbook对象和文件信息
    const workbook = excelWorkbookCache;
    const file = excelFileCache;
    const type = excelFileTypeCache;
    
    console.log('从缓存中获取Excel文件信息：');
    console.log('workbook:', workbook);
    console.log('file:', file);
    console.log('type:', type);
    
    if (!workbook || !file || type === null) {
      console.error('缺少Excel文件信息，尝试重新从workbook对象中获取');
      throw new Error('缺少Excel文件信息');
    }
    
    // 获取所有工作表名称
    const sheetNames = workbook.SheetNames;
    console.log('获取所有工作表名称：', sheetNames);
    
    // 获取选中的工作表名称和内容
    const selectedSheetName = sheetNames[selectedIndex];
    const selectedWorksheet = workbook.Sheets[selectedSheetName];
    
    console.log('选中的工作表：', selectedSheetName);
    updateStatus(`📁 开始处理Excel工作表：${selectedSheetName}`, 'info');
    
    // 隐藏Sheet选择器
    const sheetSelector = document.getElementById('sheetSelector');
    if (sheetSelector) {
      sheetSelector.classList.add('d-none');
      console.log('Sheet选择器已隐藏');
    }
    
    // 处理选中的工作表
    processExcelSheet(selectedWorksheet, file, type);
    
    // 注意：不再清除缓存，以便用户可以重新选择工作表
    console.log('工作表处理完成，保留缓存以便重新选择工作表');
  } catch (error) {
    console.error('选择Excel工作表错误：', error);
    console.error('错误堆栈：', error.stack);
    updateStatus(`❌ 选择Excel工作表失败：${error.message}`, 'danger');
    
    // 发生错误时仍然清除缓存
    console.log('发生错误，清除缓存');
    excelWorkbookCache = null;
    excelFileCache = null;
    excelFileTypeCache = null;
  }
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
  console.log('开始解析DemDec文件...');
  try {
    if (!demDecFileBuffer) {
      console.log('文件缓冲为空，返回');
      updateStatus(`❌ 请先上传文件`, 'danger');
      return;
    }
    console.log('文件缓冲存在，大小：', demDecFileBuffer.byteLength);
    
    // 确保dataFileEncoding已初始化
    if (!dataFileEncoding) {
      dataFileEncoding = document.getElementById('dataFileEncoding');
      console.log('dataFileEncoding已初始化：', dataFileEncoding);
    }
    
    const selectedEncoding = dataFileEncoding ? dataFileEncoding.value : 'auto';
    // 如果选择自动识别，使用检测到的编码
    const finalEncoding = selectedEncoding === 'auto' ? detectedDataEncoding || 'utf8' : selectedEncoding;
    console.log('使用编码:', finalEncoding);
    
    // 检测文件类型和分隔符
    const isDatFile = demDecFileName.toLowerCase().endsWith('.dat') || demDecFileName.toLowerCase().endsWith('.txt');
    let delimiter = isDatFile ? '\t' : ',';
    console.log('文件类型：', isDatFile ? 'DAT' : 'CSV', '分隔符：', delimiter);
    
    // 显示最终使用的编码和文件类型
    console.log('准备更新状态...');
    updateStatus(`📝 正在使用${selectedEncoding === 'auto' ? `自动检测(${finalEncoding})` : finalEncoding}编码解析文件：${demDecFileName} (${isDatFile ? 'DAT格式，TAB分隔' : 'CSV格式，逗号分隔'})`, 'primary');
    console.log('状态已更新，开始解析文件内容...');
  
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
    
    // 自动检测分隔符
    function detectDelimiter(sampleRows) {
      const counts = { ',': 0, '\t': 0, ' ': 0 };
      const avgFieldsPerRow = {};
      
      // 分析前10行数据
      const analysisRows = sampleRows.slice(0, Math.min(10, sampleRows.length));
      
      // 计算每种分隔符的出现次数和平均字段数
      analysisRows.forEach(row => {
        // 计算逗号数量
        const commaMatches = row.match(/,/g);
        if (commaMatches) counts[','] += commaMatches.length;
        
        // 计算TAB数量
        const tabMatches = row.match(/\t/g);
        if (tabMatches) counts['\t'] += tabMatches.length;
        
        // 计算连续空格组数
        const spaceMatches = row.match(/\s+/g);
        if (spaceMatches) counts[' '] += spaceMatches.length;
      });
      
      // 计算每种分隔符的平均字段数
      avgFieldsPerRow[','] = analysisRows.length > 0 ? counts[','] / analysisRows.length : 0;
      avgFieldsPerRow['\t'] = analysisRows.length > 0 ? counts['\t'] / analysisRows.length : 0;
      avgFieldsPerRow[' '] = analysisRows.length > 0 ? counts[' '] / analysisRows.length : 0;
      
      // 按照优先级选择分隔符
      // 1. 优先使用逗号，平均每行至少有1个逗号
      if (avgFieldsPerRow[','] >= 1) {
        return ',';
      }
      // 2. 如果没有足够的逗号，使用TAB，平均每行至少有1个TAB
      else if (avgFieldsPerRow['\t'] >= 1) {
        return '\t';
      }
      // 3. 如果没有足够的TAB，使用空格
      else {
        return ' ';
      }
    }
    
    // 检测分隔符
    const detectedDelimiter = detectDelimiter(rows);
    if (detectedDelimiter !== delimiter) {
      delimiter = detectedDelimiter;
      updateStatus(`🔍 自动检测到分隔符：${delimiter === ' ' ? '空格' : delimiter === '\t' ? 'TAB' : delimiter}`, 'info');
    }
    
    // 对于空格分隔的文件，需要特殊处理
    const isSpaceSeparated = delimiter === ' ';

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
    
    // 检测是否为新格式（第一行数据包含冒号）
    let isNewFormat = false;
    if (rows.length > headerRowCount) {
      const firstDataRow = rows[headerRowCount];
      const parsedFirstDataRow = parseCSVLine(firstDataRow, delimiter);
      isNewFormat = parsedFirstDataRow.length > 1 && parsedFirstDataRow.slice(1).some(field => {
        // 检查原始字段是否包含冒号（因为parseCSVLine已经处理过了）
        return firstDataRow.split(delimiter).slice(1).some(originalField => originalField.includes(':'));
      });
    }
    
    if (isNewFormat) {
      // 对于新格式，从第一行数据中提取表头
      if (rows.length > headerRowCount) {
        const firstDataRow = rows[headerRowCount];
        const originalFields = firstDataRow.split(delimiter).map(field => field.trim());
        
        csvHeaders = ['时间']; // 第一列是时间，设置标题为"时间"
        
        // 从其他列中提取项目标题
        originalFields.slice(1).forEach(field => {
          if (field.includes(':')) {
            const parts = field.split(':');
            if (parts.length >= 2) {
              // 提取冒号前面的项目标题
              const title = parts[0].trim();
              csvHeaders.push(title);
            } else {
              csvHeaders.push(field);
            }
          } else {
            csvHeaders.push(field);
          }
        });
      }
    } else {
      // 对于旧格式，使用原来的表头处理逻辑
      csvHeaders = mergeHeaderRows(parsedHeaderRows);
      
      // 如果没有标题栏，为其添加标题栏
      if (csvHeaders.length === 0 || (csvHeaders.length === 1 && csvHeaders[0] === '列1')) {
        // 检查是否有数据行
        if (rows.length > headerRowCount) {
          const firstDataRow = rows[headerRowCount];
          const parsedFirstDataRow = parseCSVLine(firstDataRow, delimiter);
          
          // 创建标题栏，第一列为"时间"，其他列按顺序命名
          const newHeaders = ['时间'];
          for (let i = 1; i < parsedFirstDataRow.length; i++) {
            newHeaders.push(`列${i + 1}`);
          }
          csvHeaders = newHeaders;
        }
      }
    }
    
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

    // 销毁之前的图表实例
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    lineChart.style.display = 'none';
    chartContainer.innerHTML = '<div class="d-flex align-items-center justify-content-center h-100 text-muted">📊 未绘制图表，上传数据文件并配置坐标轴后点击「绘制折线图」</div>';

    console.log('解析完成，数据行数:', csvData.length, '列数:', csvHeaders.length);
    
    // 强制刷新表格和选择器
    renderTable(csvHeaders, csvData);
    initAxisSelector();

    // 更新状态和启用按钮
    console.log('准备更新解析成功状态...');
    updateStatus(`✅ 文件解析成功【${demDecFileName}】：使用${finalEncoding.toUpperCase()}编码，共 ${csvData.length} 行数据，${csvHeaders.length} 列 (${headerRows.length}行标题已合并)`, 'success');
    console.log('状态已更新，准备启用控件...');
    enableControls(['xAxisSelect', 'yAxisSelect', 'yAxis2Select', 'drawChartBtn', 'resetDataBtn']);
    
    // 时间筛选文件导入区域已设置为一直显示，无需动态控制
    
    // 添加"重新选择工作表"按钮
    console.log('添加"重新选择工作表"按钮...');
    const dataFileSection = document.querySelector('.file-upload-section:nth-child(1)');
    if (dataFileSection) {
      // 检查是否已经存在重新选择按钮
      let reselectBtn = document.getElementById('reselectSheetBtn');
      if (!reselectBtn) {
        reselectBtn = document.createElement('button');
        reselectBtn.id = 'reselectSheetBtn';
        reselectBtn.className = 'btn btn-sm btn-outline-secondary mt-2';
        reselectBtn.textContent = '🔄 重新选择工作表';
        reselectBtn.addEventListener('click', function() {
          // 重新显示Sheet选择器
          const sheetSelector = document.getElementById('sheetSelector');
          if (sheetSelector) {
            sheetSelector.classList.remove('d-none');
            console.log('重新显示Sheet选择器');
          }
        });
        dataFileSection.appendChild(reselectBtn);
        console.log('"重新选择工作表"按钮已添加');
      }
    }
    
    // 如果已选择DemControl文件且有选中时间，启用筛选按钮
    if (demControlFileSelected && selectedStartTime) {
      enableControls(['filterByControlBtn']);
    }
    console.log('DemDec文件解析完成');
  } catch (error) {
    console.error('解析错误详情：', error);
    updateStatus(`❌ 文件解析失败【${demDecFileName}】：${error.message}，请尝试更换编码格式`, 'danger');
  }
}

// 使用选定的编码解析DemControl文件
function parseDemControlFileWithSelectedEncoding() {
  console.log('开始解析DemControl文件...');
  try {
    if (!demControlFileBuffer) {
      console.log('文件缓冲为空，返回');
      updateStatus(`❌ 请先上传文件`, 'danger');
      return;
    }
    console.log('文件缓冲存在，大小：', demControlFileBuffer.byteLength);
    
    // 确保controlFileEncoding已初始化
    if (!controlFileEncoding) {
      controlFileEncoding = document.getElementById('controlFileEncoding');
      console.log('controlFileEncoding已初始化：', controlFileEncoding);
    }
    
    const selectedEncoding = controlFileEncoding ? controlFileEncoding.value : 'auto';
    // 如果选择自动识别，使用检测到的编码
    const finalEncoding = selectedEncoding === 'auto' ? detectedControlEncoding || 'utf8' : selectedEncoding;
    console.log('使用编码:', finalEncoding);
    
    // 检测文件类型和分隔符
    const isDatFile = demControlFileName.toLowerCase().endsWith('.dat') || demControlFileName.toLowerCase().endsWith('.txt');
    let delimiter = isDatFile ? '\t' : ',';
    console.log('文件类型：', isDatFile ? 'DAT' : 'CSV', '分隔符：', delimiter);
    
    // 显示最终使用的编码和文件类型
    console.log('准备更新状态...');
    updateStatus(`📅 正在使用${selectedEncoding === 'auto' ? `自动检测(${finalEncoding})` : finalEncoding}编码解析文件：${demControlFileName} (${isDatFile ? 'DAT格式，TAB分隔' : 'CSV格式，逗号分隔'})`, 'primary');
    console.log('状态已更新，开始解析文件内容...');
  
    let csvContent = '';
    const uint8Array = new Uint8Array(demControlFileBuffer);
    
	// 新代码（纯浏览器版）
	csvContent = decodeBuffer(uint8Array, finalEncoding);

    
    // 解析DemControl文件
    const rows = csvContent.split(/\r?\n/).filter(row => row.trim() !== '');
    if (rows.length === 0) throw new Error('文件无有效数据');
    
    // 自动检测分隔符
    function detectDelimiter(sampleRows) {
      const counts = { ',': 0, '\t': 0, ' ': 0 };
      const avgFieldsPerRow = {};
      
      // 分析前10行数据
      const analysisRows = sampleRows.slice(0, Math.min(10, sampleRows.length));
      
      // 计算每种分隔符的出现次数和平均字段数
      analysisRows.forEach(row => {
        // 计算逗号数量
        const commaMatches = row.match(/,/g);
        if (commaMatches) counts[','] += commaMatches.length;
        
        // 计算TAB数量
        const tabMatches = row.match(/\t/g);
        if (tabMatches) counts['\t'] += tabMatches.length;
        
        // 计算连续空格组数
        const spaceMatches = row.match(/\s+/g);
        if (spaceMatches) counts[' '] += spaceMatches.length;
      });
      
      // 计算每种分隔符的平均字段数
      avgFieldsPerRow[','] = analysisRows.length > 0 ? counts[','] / analysisRows.length : 0;
      avgFieldsPerRow['\t'] = analysisRows.length > 0 ? counts['\t'] / analysisRows.length : 0;
      avgFieldsPerRow[' '] = analysisRows.length > 0 ? counts[' '] / analysisRows.length : 0;
      
      // 按照优先级选择分隔符
      // 1. 优先使用逗号，平均每行至少有1个逗号
      if (avgFieldsPerRow[','] >= 1) {
        return ',';
      }
      // 2. 如果没有足够的逗号，使用TAB，平均每行至少有1个TAB
      else if (avgFieldsPerRow['\t'] >= 1) {
        return '\t';
      }
      // 3. 如果没有足够的TAB，使用空格
      else {
        return ' ';
      }
    }
    
    // 检测分隔符
    const detectedDelimiter = detectDelimiter(rows);
    if (detectedDelimiter !== delimiter) {
      delimiter = detectedDelimiter;
      updateStatus(`🔍 自动检测到分隔符：${delimiter === ' ' ? '空格' : delimiter === '\t' ? 'TAB' : delimiter}`, 'info');
    }
    
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
    
    console.log('解析完成，找到时间点数量:', demControlTimeList.length);
    
    // 显示时间选择下拉框并加载时间选项
    if (timeSelectorContainer) {
      timeSelectorContainer.classList.remove('d-none');
    }
    renderTimeDropdown();
    
    demControlFileSelected = true;
    // 更新状态
    console.log('准备更新解析成功状态...');
    updateStatus(`✅ 文件解析成功【${demControlFileName}】：使用${finalEncoding.toUpperCase()}编码，共找到${demControlTimeList.length}个有效时间点`, 'success');
    console.log('DemControl文件解析完成');
  } catch (error) {
    console.error('解析错误详情：', error);
    updateStatus(`❌ 文件解析失败【${demControlFileName}】：${error.message}，请尝试更换编码格式`, 'danger');
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

  // 获取左侧Y轴选择的列
  const y1ColIndexes = Array.from(yAxisSelect.selectedOptions)
    .map(option => parseInt(option.value))
    .filter(index => !isNaN(index) && index < csvHeaders.length);
  
  // 获取右侧Y轴选择的列
  const y2ColIndexes = Array.from(yAxis2Select.selectedOptions)
    .map(option => parseInt(option.value))
    .filter(index => !isNaN(index) && index < csvHeaders.length);
  
  // 合并所有Y轴列并去重
  const allYColIndexes = [...new Set([...y1ColIndexes, ...y2ColIndexes])];
  
  if (allYColIndexes.length === 0) {
    updateStatus(`❌ 请至少选择一个Y轴列`, 'danger');
    return;
  }
  if (allYColIndexes.some(index => index === xColIndex)) {
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
  let idx = 0;
  
  // 处理左侧Y轴数据
  y1ColIndexes.forEach(yColIndex => {
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
            // 为特定文字设置固定映射值
            if (yValue === '失锁' || yValue === '失锁\n' || yValue.trim() === '失锁' || yValue === 'U' || yValue === 'U\n' || yValue.trim() === 'U') {
              numericValue = 0;
              textMapping.set(yValue, 0);
              reverseTextMapping.set(0, yValue === 'U' || yValue === 'U\n' || yValue.trim() === 'U' ? 'U (失锁)' : '失锁');
            } else if (yValue === '锁定' || yValue === '锁定\n' || yValue.trim() === '锁定' || yValue === 'L' || yValue === 'L\n' || yValue.trim() === 'L') {
              numericValue = 1;
              textMapping.set(yValue, 1);
              reverseTextMapping.set(1, yValue === 'L' || yValue === 'L\n' || yValue.trim() === 'L' ? 'L (锁定)' : '锁定');
            } else if (yValue === '不工作' || yValue === '不工作\n' || yValue.trim() === '不工作') {
              numericValue = -1;
              textMapping.set(yValue, -1);
              reverseTextMapping.set(-1, '不工作');
            } else {
              // 其他文字使用自动递增映射
              if (!textMapping.has(yValue)) {
                textMapping.set(yValue, textCounter++);
                reverseTextMapping.set(textCounter - 1, yValue);
              }
              numericValue = textMapping.get(yValue);
            }
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
      
      // 创建数据集 - 左侧Y轴
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
        yAxisID: 'y', // 左侧Y轴
        // 保存文字映射关系，用于tooltip显示
        textMapping: textMapping,
        reverseTextMapping: reverseTextMapping,
        rowTextValues: rowTextValues
      });
      totalDataPoints += validPoints;
      idx++;
    });
  
  // 处理右侧Y轴数据
  y2ColIndexes.forEach(yColIndex => {
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
            // 为特定文字设置固定映射值
            if (yValue === '失锁' || yValue === '失锁\n' || yValue.trim() === '失锁' || yValue === 'U' || yValue === 'U\n' || yValue.trim() === 'U') {
              numericValue = 0;
              textMapping.set(yValue, 0);
              reverseTextMapping.set(0, yValue === 'U' || yValue === 'U\n' || yValue.trim() === 'U' ? 'U (失锁)' : '失锁');
            } else if (yValue === '锁定' || yValue === '锁定\n' || yValue.trim() === '锁定' || yValue === 'L' || yValue === 'L\n' || yValue.trim() === 'L') {
              numericValue = 1;
              textMapping.set(yValue, 1);
              reverseTextMapping.set(1, yValue === 'L' || yValue === 'L\n' || yValue.trim() === 'L' ? 'L (锁定)' : '锁定');
            } else if (yValue === '不工作' || yValue === '不工作\n' || yValue.trim() === '不工作') {
              numericValue = -1;
              textMapping.set(yValue, -1);
              reverseTextMapping.set(-1, '不工作');
            } else {
              // 其他文字使用自动递增映射
              if (!textMapping.has(yValue)) {
                textMapping.set(yValue, textCounter++);
                reverseTextMapping.set(textCounter - 1, yValue);
              }
              numericValue = textMapping.get(yValue);
            }
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
      
      // 创建数据集 - 右侧Y轴
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
        yAxisID: 'y1', // 右侧Y轴
        // 保存文字映射关系，用于tooltip显示
        textMapping: textMapping,
        reverseTextMapping: reverseTextMapping,
        rowTextValues: rowTextValues
      });
      totalDataPoints += validPoints;
      idx++;
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

  // 应用X轴范围过滤
  let filteredXData = xData;
  let filteredDatasets = datasets;
  if (selectedTimeRange) {
    const { start, end, isIndexBased } = selectedTimeRange;
    const filteredIndices = [];
    
    if (isIndexBased) {
      // 基于索引的过滤
      for (let i = start; i <= end; i++) {
        if (i >= 0 && i < xData.length) {
          filteredIndices.push(i);
        }
      }
    } else {
      // 基于时间的过滤
      const xHeader = csvHeaders[xColIndex]?.trim() || '';
      const isTimeCol = isTimeColumn(xHeader);
      
      if (isTimeCol) {
        // 时间类型X轴：基于时间值过滤
        xTimeValues.forEach((timeValue, index) => {
          if (timeValue && timeValue >= start && timeValue <= end) {
            filteredIndices.push(index);
          }
        });
      } else {
        // 非时间类型X轴：不过滤
        filteredIndices.push(...Array.from({ length: xData.length }, (_, i) => i));
      }
    }
    
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
  
  // 显示canvas并设置固定高度
  lineChart.style.display = 'block';
  lineChart.style.height = '400px'; // 进一步减小图表高度
  chartContainer.style.height = '450px'; // 设置图表容器固定高度
  chartContainer.style.overflow = 'hidden'; // 防止内容溢出
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
      backgroundColor: 'white',
      animation: false,
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
            text: '左侧Y轴', 
            font: { size: 14, weight: 'bold', family: "'Microsoft YaHei', sans-serif" } 
          },
          position: 'left',
          beginAtZero: false, // 不再强制从0开始，让Y轴根据数据范围自动调整
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
          ticks: { font: { family: "'Microsoft YaHei', sans-serif" } },
          // 添加数据范围之外的空白区域
          suggestedMin: function(context) {
            const datasets = context.chart.data.datasets.filter(dataset => dataset.yAxisID === 'y' && !dataset.hidden);
            if (datasets.length === 0) return 0;
            
            let min = Infinity;
            let hasValidValue = false;
            datasets.forEach(dataset => {
              dataset.data.forEach(value => {
                if (value !== null && value !== undefined && !isNaN(value)) {
                  hasValidValue = true;
                  if (value < min) {
                    min = value;
                  }
                }
              });
            });
            if (!hasValidValue) return 0;
            // 最小值以下留10%空白，如果最小值为正数，则从0开始
            return min > 0 ? 0 : min * 1.1;
          },
          suggestedMax: function(context) {
            const datasets = context.chart.data.datasets.filter(dataset => dataset.yAxisID === 'y' && !dataset.hidden);
            if (datasets.length === 0) return 1;
            
            let max = -Infinity;
            let hasValidValue = false;
            datasets.forEach(dataset => {
              dataset.data.forEach(value => {
                if (value !== null && value !== undefined && !isNaN(value)) {
                  hasValidValue = true;
                  if (value > max) {
                    max = value;
                  }
                }
              });
            });
            if (!hasValidValue) return 1;
            // 最大值以上留10%空白，不再设置最小阈值
            return max > 0 ? max * 1.1 : 1;
          }
        },
        y1: {
          title: { 
            display: true, 
            text: '右侧Y轴', 
            font: { size: 14, weight: 'bold', family: "'Microsoft YaHei', sans-serif" } 
          },
          position: 'right',
          beginAtZero: false, // 不再强制从0开始，让Y轴根据数据范围自动调整
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
          ticks: { font: { family: "'Microsoft YaHei', sans-serif" } },
          // 添加数据范围之外的空白区域
          suggestedMin: function(context) {
            const datasets = context.chart.data.datasets.filter(dataset => dataset.yAxisID === 'y1' && !dataset.hidden);
            if (datasets.length === 0) return 0;
            
            let min = Infinity;
            let hasValidValue = false;
            datasets.forEach(dataset => {
              dataset.data.forEach(value => {
                if (value !== null && value !== undefined && !isNaN(value)) {
                  hasValidValue = true;
                  if (value < min) {
                    min = value;
                  }
                }
              });
            });
            if (!hasValidValue) return 0;
            // 最小值以下留10%空白，如果最小值为正数，则从0开始
            return min > 0 ? 0 : min * 1.1;
          },
          suggestedMax: function(context) {
            const datasets = context.chart.data.datasets.filter(dataset => dataset.yAxisID === 'y1' && !dataset.hidden);
            if (datasets.length === 0) return 1;
            
            let max = -Infinity;
            let hasValidValue = false;
            datasets.forEach(dataset => {
              dataset.data.forEach(value => {
                if (value !== null && value !== undefined && !isNaN(value)) {
                  hasValidValue = true;
                  if (value > max) {
                    max = value;
                  }
                }
              });
            });
            if (!hasValidValue) return 1;
            // 最大值以上留10%空白，不再设置最小阈值
            return max > 0 ? max * 1.1 : 1;
          }
        }
      },
      plugins: {
        legend: { 
          display: false // 禁用默认图例，使用自定义图例
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

  // 创建自定义图例
  createCustomLegend(filteredDatasets);
  
  // 启用导出按钮
  enableControls(['exportChartBtn']);
  
  // 更新时间范围选择器的可见性
  updateTimeRangeSelectorVisibility();
  
  // 初始化时间范围选择器的默认值
  initTimeRangeSelector();
  
  // 显示X轴拖动条
  const xAxisSliderContainer = document.getElementById('xAxisSliderContainer');
  if (xAxisSliderContainer) {
    xAxisSliderContainer.classList.remove('d-none');
    
    // 初始化拖动条的时间值
    const sliderValueMin = document.getElementById('sliderValueMin');
    const sliderValueMax = document.getElementById('sliderValueMax');
    if (sliderValueMin && sliderValueMax) {
      // 检查X轴是否为时间类型
      const xHeader = csvHeaders[xColIndex]?.trim() || '';
      const isTimeCol = isTimeColumn(xHeader);
      
      if (isTimeCol && originalChartData && originalChartData.xTimeValues) {
        // 找出所有有效的时间值
        const validTimeValues = originalChartData.xTimeValues.filter(time => time !== null);
        if (validTimeValues.length > 0) {
          // 获取最小和最大时间值
          const minTime = new Date(Math.min(...validTimeValues.map(time => time.getTime())));
          const maxTime = new Date(Math.max(...validTimeValues.map(time => time.getTime())));
          
          // 检查是否有日期信息
          const hasDateInfo = validTimeValues.some(time => {
            const today = new Date();
            return time.getFullYear() !== today.getFullYear() || 
                   time.getMonth() !== today.getMonth() || 
                   time.getDate() !== today.getDate();
          });
          
          // 根据是否有日期信息格式化显示
          if (hasDateInfo) {
            sliderValueMin.textContent = minTime.toLocaleString();
            sliderValueMax.textContent = maxTime.toLocaleString();
          } else {
            sliderValueMin.textContent = minTime.toLocaleTimeString();
            sliderValueMax.textContent = maxTime.toLocaleTimeString();
          }
        }
      }
    }
  }
  
  updateStatus(`✅ 折线图绘制成功：X轴【${csvHeaders[xColIndex]?.trim() || '列'}】，Y轴共${allYColIndexes.length}列，有效数据点${totalDataPoints}个`, 'success');
}

// 创建自定义图例，分开显示左侧和右侧Y轴的曲线
function createCustomLegend(datasets) {
  // 移除旧的图例容器
  const oldLegend = document.querySelector('.custom-legend');
  if (oldLegend && oldLegend.parentNode) {
    oldLegend.parentNode.removeChild(oldLegend);
  }
  
  // 创建新的图例容器
  const legendContainer = document.createElement('div');
  legendContainer.className = 'custom-legend';
  legendContainer.style.cssText = `
    display: flex;
    justify-content: space-around;
    margin-top: 10px;
    margin-bottom: 30px;
    padding: 10px;
    background-color: #f8f9fa;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    flex-wrap: wrap;
    max-width: 100%;
  `;
  
  // 分离左侧和右侧Y轴的数据集
  const leftYAxisDatasets = datasets.filter(dataset => dataset.yAxisID === 'y');
  const rightYAxisDatasets = datasets.filter(dataset => dataset.yAxisID === 'y1');
  
  // 创建左侧Y轴图例
  if (leftYAxisDatasets.length > 0) {
    const leftLegend = document.createElement('div');
    leftLegend.className = 'legend-section';
    leftLegend.style.cssText = `
      flex: 1;
      margin: 0 10px;
    `;
    
    const leftTitle = document.createElement('h6');
    leftTitle.textContent = '左侧Y轴曲线';
    leftTitle.style.cssText = `
      margin-bottom: 10px;
      font-family: 'Microsoft YaHei', sans-serif;
      color: #495057;
      text-align: center;
    `;
    leftLegend.appendChild(leftTitle);
    
    leftYAxisDatasets.forEach(dataset => {
      const legendItem = document.createElement('div');
      legendItem.className = 'legend-item';
      legendItem.style.cssText = `
        display: flex;
        align-items: center;
        margin-bottom: 5px;
        font-family: 'Microsoft YaHei', sans-serif;
        font-size: 12px;
        cursor: pointer;
        padding: 2px 5px;
        border-radius: 4px;
      `;
      
      // 添加悬停效果
      legendItem.addEventListener('mouseenter', function() {
        this.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
      });
      
      legendItem.addEventListener('mouseleave', function() {
        this.style.backgroundColor = 'transparent';
      });
      
      const colorBox = document.createElement('span');
      colorBox.style.cssText = `
        display: inline-block;
        width: 12px;
        height: 12px;
        background-color: ${dataset.borderColor};
        margin-right: 8px;
        border-radius: 2px;
        opacity: ${dataset.hidden ? '0.5' : '1'};
      `;
      
      const label = document.createElement('span');
      label.textContent = dataset.label;
      label.style.opacity = dataset.hidden ? '0.5' : '1';
      label.style.textDecoration = dataset.hidden ? 'line-through' : 'none';
      
      // 添加点击事件，切换数据集可见性
      legendItem.addEventListener('click', function() {
        // 切换数据集可见性
        dataset.hidden = !dataset.hidden;
        // 更新图表
        chartInstance.update();
        // 更新图例项外观
        if (dataset.hidden) {
          label.style.opacity = '0.5';
          label.style.textDecoration = 'line-through';
          colorBox.style.opacity = '0.5';
        } else {
          label.style.opacity = '1';
          label.style.textDecoration = 'none';
          colorBox.style.opacity = '1';
        }
      });
      
      legendItem.appendChild(colorBox);
      legendItem.appendChild(label);
      leftLegend.appendChild(legendItem);
    });
    
    legendContainer.appendChild(leftLegend);
  }
  
  // 创建右侧Y轴图例
  if (rightYAxisDatasets.length > 0) {
    const rightLegend = document.createElement('div');
    rightLegend.className = 'legend-section';
    rightLegend.style.cssText = `
      flex: 1;
      margin: 0 10px;
    `;
    
    const rightTitle = document.createElement('h6');
    rightTitle.textContent = '右侧Y轴曲线';
    rightTitle.style.cssText = `
      margin-bottom: 10px;
      font-family: 'Microsoft YaHei', sans-serif;
      color: #495057;
      text-align: center;
    `;
    rightLegend.appendChild(rightTitle);
    
    rightYAxisDatasets.forEach(dataset => {
      const legendItem = document.createElement('div');
      legendItem.className = 'legend-item';
      legendItem.style.cssText = `
        display: flex;
        align-items: center;
        margin-bottom: 5px;
        font-family: 'Microsoft YaHei', sans-serif;
        font-size: 12px;
        cursor: pointer;
        padding: 2px 5px;
        border-radius: 4px;
      `;
      
      // 添加悬停效果
      legendItem.addEventListener('mouseenter', function() {
        this.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
      });
      
      legendItem.addEventListener('mouseleave', function() {
        this.style.backgroundColor = 'transparent';
      });
      
      const colorBox = document.createElement('span');
      colorBox.style.cssText = `
        display: inline-block;
        width: 12px;
        height: 12px;
        background-color: ${dataset.borderColor};
        margin-right: 8px;
        border-radius: 2px;
        opacity: ${dataset.hidden ? '0.5' : '1'};
      `;
      
      const label = document.createElement('span');
      label.textContent = dataset.label;
      label.style.opacity = dataset.hidden ? '0.5' : '1';
      label.style.textDecoration = dataset.hidden ? 'line-through' : 'none';
      
      // 添加点击事件，切换数据集可见性
      legendItem.addEventListener('click', function() {
        // 切换数据集可见性
        dataset.hidden = !dataset.hidden;
        // 更新图表
        chartInstance.update();
        // 更新图例项外观
        if (dataset.hidden) {
          label.style.opacity = '0.5';
          label.style.textDecoration = 'line-through';
          colorBox.style.opacity = '0.5';
        } else {
          label.style.opacity = '1';
          label.style.textDecoration = 'none';
          colorBox.style.opacity = '1';
        }
      });
      
      legendItem.appendChild(colorBox);
      legendItem.appendChild(label);
      rightLegend.appendChild(legendItem);
    });
    
    legendContainer.appendChild(rightLegend);
  }
  
  // 将图例添加到图表容器外部
  if (legendContainer.children.length > 0) {
    // 找到图表容器
    const chartContainer = document.getElementById('chartContainer');
    if (chartContainer && chartContainer.parentNode) {
      // 在图表容器前添加图例
      chartContainer.parentNode.insertBefore(legendContainer, chartContainer);
    }
  }
}

// 导出图表为图片
function exportChartAsImage() {
  if (!chartInstance) {
    updateStatus(`❌ 暂无图表可导出，请先绘制折线图`, 'danger');
    return;
  }

  try {
    // 设置DPI为300
    const dpi = 300;
    const scaleFactor = dpi / 96; // 96是默认DPI
    
    // 创建临时canvas用于导出，确保背景为白色且分辨率为300dpi
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = lineChart.width * scaleFactor;
    tempCanvas.height = lineChart.height * scaleFactor;
    const tempCtx = tempCanvas.getContext('2d');
    
    // 设置缩放
    tempCtx.scale(scaleFactor, scaleFactor);
    
    // 填充白色背景
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, lineChart.width, lineChart.height);
    
    // 绘制图表内容
    tempCtx.drawImage(lineChart, 0, 0);
    
    // 导出为JPG图片
    const url = tempCanvas.toDataURL('image/jpeg', 1.0);
    const a = document.createElement('a');
    a.href = url;
    // 修复文件名格式
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `DemDec可视化图表_${timestamp}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    updateStatus(`✅ 图表已成功导出为300dpi白色背景的JPG图片`, 'success');
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
  disableControls(['xAxisSelect', 'yAxisSelect', 'yAxis2Select', 'drawChartBtn', 'filterByControlBtn', 'exportChartBtn', 'resetDataBtn']);
  
  // 重置选择器
  xAxisSelect.innerHTML = '<option value="">请先上传DemDec数据文件</option>';
  yAxisSelect.innerHTML = '<option value="">请先上传DemDec数据文件</option>';
  yAxis2Select.innerHTML = '<option value="">请先上传DemDec数据文件</option>';
  
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
  
  // 对于空格分隔的文件，特殊处理：将连续空格视为单个分隔符
  if (delimiter === ' ') {
    // 先移除所有逗号和TAB，然后按连续空格分割
    const processedLine = line.replace(/,/g, '').replace(/\t/g, '');
    return processedLine.trim().split(/\s+/).map(field => field.replace(/^["']|["']$/g, '').trim());
  }
  // 对于逗号分隔的文件
  else if (delimiter === ',') {
    // 简单分割方法，支持带引号的字段
    const result = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        // 移除多余的引号和空格
        currentField = currentField.replace(/^["']|["']$/g, '').replace(/\s+/g, ' ').trim();
        result.push(currentField);
        currentField = '';
      } else if (!inQuotes && (char === '\t' || char === ' ')) {
        // 在非引号内，将TAB和空格替换为单个空格
        currentField += ' ';
      } else {
        currentField += char;
      }
    }
    
    // 添加最后一个字段
    currentField = currentField.replace(/^["']|["']$/g, '').replace(/\s+/g, ' ').trim();
    result.push(currentField);
    
    return result;
  }
  // 对于TAB分隔的文件
  else if (delimiter === '\t') {
    // 按TAB分割，然后处理每个字段
    const fields = line.split('\t').map(field => {
      // 移除多余的引号、逗号和空格
      return field.replace(/^["']|["']$/g, '').replace(/,/g, '').replace(/\s+/g, ' ').trim();
    });
    
    // 检测是否为新格式（除第一列外，其他列包含冒号）
    const isNewFormat = fields.length > 1 && fields.slice(1).some(field => field.includes(':'));
    
    if (isNewFormat) {
      // 处理新格式：第一列是时间，其他列是 "项目标题:数值"
      const processedFields = [fields[0]]; // 保留第一列时间
      
      // 处理其他列
      fields.slice(1).forEach(field => {
        if (field.includes(':')) {
          // 提取冒号后面的数值部分
          const parts = field.split(':');
          if (parts.length >= 2) {
            // 移除数值部分的空格并添加到结果中
            const value = parts.slice(1).join(':').trim();
            processedFields.push(value);
          } else {
            processedFields.push(field);
          }
        } else {
          processedFields.push(field);
        }
      });
      
      return processedFields;
    }
    
    return fields;
  }
  
  // 默认情况
  return line.split(delimiter).map(field => field.replace(/^["']|["']$/g, '').trim());
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
  yAxis2Select.innerHTML = '';

  // 查找时间相关列的索引
  let timeColumnIndex = -1;
  csvHeaders.forEach((header, index) => {
    const displayName = header.trim() || `列${index + 1}`;
    if (isTimeColumn(displayName) && timeColumnIndex === -1) {
      timeColumnIndex = index;
    }
  });

  csvHeaders.forEach((header, index) => {
    const displayName = header.trim() || `列${index + 1}`;
    // X轴选项（包含所有列）
    const xOption = document.createElement('option');
    xOption.value = index;
    xOption.textContent = displayName;
    // 优先选择时间相关列，否则选择第一列
    if ((timeColumnIndex !== -1 && index === timeColumnIndex) || (timeColumnIndex === -1 && index === 0)) {
      xOption.selected = true;
    }
    xAxisSelect.appendChild(xOption);

    // Y轴选项（排除时间相关列）
      if (!isTimeColumn(displayName)) {
        const yOption = document.createElement('option');
        yOption.value = index;
        yOption.textContent = displayName;
        yAxisSelect.appendChild(yOption);
        
        // 右侧Y轴选项
        const y2Option = document.createElement('option');
        y2Option.value = index;
        y2Option.textContent = displayName;
        yAxis2Select.appendChild(y2Option);
      }
  });
  
  // 清除之前的Y轴选择，允许用户自由选择
  yAxisSelect.selectedIndex = -1;
  yAxis2Select.selectedIndex = -1;
  
  // 确保控件启用
  xAxisSelect.disabled = false;
  yAxisSelect.disabled = false;
  yAxis2Select.disabled = false;
  drawChartBtn.disabled = false;
  
  // 确保xAxisSelect.value被正确设置为选中的选项的值
  const selectedOption = xAxisSelect.querySelector('option[selected]');
  if (selectedOption) {
    xAxisSelect.value = selectedOption.value;
  }
  // 更新时间范围选择器的可见性，确保在读入文件后就显示
  updateTimeRangeSelectorVisibility();
}

// 初始化时间范围选择器
function initTimeRangeSelector() {
  const timeRangeSelector = document.getElementById('timeRangeSelector');
  const timeRangeStart = document.getElementById('timeRangeStart');
  const timeRangeEnd = document.getElementById('timeRangeEnd');
  
  if (!timeRangeSelector || !timeRangeStart || !timeRangeEnd) return;
  
  // 检查X轴类型
  const xColIndex = parseInt(xAxisSelect.value);
  if (isNaN(xColIndex) || xColIndex >= csvHeaders.length) return;
  
  const xHeader = csvHeaders[xColIndex]?.trim() || '';
  const isTimeCol = isTimeColumn(xHeader);
  
  if (isTimeCol) {
    // 从csvData中提取时间值
    const xTimeValues = [];
    csvData.forEach(row => {
      const xValue = row[xColIndex]?.trim() || '';
      
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
          } else {
            // 尝试解析其他常见时间格式
            // 格式1: 2023-12-31 23:59:59
            const format1Match = xValue.match(/(\d{4})[-/](\d{2})[-/](\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
            if (format1Match) {
              const [, year, month, day, hh, mm, ss] = format1Match;
              rowTime = new Date(`${year}-${month}-${day} ${hh}:${mm}:${ss}`);
            }
            // 格式2: 23:59:59
            else {
              const format2Match = xValue.match(/(\d{2}):(\d{2}):(\d{2})/);
              if (format2Match) {
                const [, hh, mm, ss] = format2Match;
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                rowTime = new Date(`${year}-${month}-${day} ${hh}:${mm}:${ss}`);
              }
            }
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
    
    // 找出所有有效的时间值
    const validTimeValues = xTimeValues.filter(time => time !== null);
    
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
    
    // 检查原始数据是否包含日期信息
    let hasDateInfo = false;
    if (validTimeValues.length > 0) {
      hasDateInfo = validTimeValues.some(time => {
        // 检查时间值是否包含非当天的日期
        const today = new Date();
        return time.getFullYear() !== today.getFullYear() || 
               time.getMonth() !== today.getMonth() || 
               time.getDate() !== today.getDate();
      });
    }
    
    // 如果用户已经选择了时间范围，保持用户的选择
    if (selectedTimeRange) {
      timeRangeStart.value = formatDateTimeLocal(selectedTimeRange.start);
      timeRangeEnd.value = formatDateTimeLocal(selectedTimeRange.end);
    } else if (validTimeValues.length > 0) {
      // 否则设置默认时间范围为数据的最小和最大值
      const minTime = new Date(Math.min(...validTimeValues.map(time => time.getTime())));
      const maxTime = new Date(Math.max(...validTimeValues.map(time => time.getTime())));
      timeRangeStart.value = formatDateTimeLocal(minTime);
      timeRangeEnd.value = formatDateTimeLocal(maxTime);
    } else {
      // 如果没有有效的时间值，设置默认时间范围为当前时间
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      timeRangeStart.value = formatDateTimeLocal(oneHourAgo);
      timeRangeEnd.value = formatDateTimeLocal(now);
    }
    
    // 根据是否有日期信息调整显示格式
    const timeRangeInputs = [timeRangeStart, timeRangeEnd];
    timeRangeInputs.forEach(input => {
      if (!hasDateInfo) {
        // 没有日期信息时，添加data-no-date属性以应用CSS样式
        input.setAttribute('data-no-date', 'true');
        // 调整输入框类型为time，只显示时间部分
        input.type = 'time';
      } else {
        // 有日期信息时，移除data-no-date属性，恢复为datetime-local类型
        input.removeAttribute('data-no-date');
        input.type = 'datetime-local';
      }
    });
  } else {
    // 非时间类型X轴处理
    // 这里可以添加非时间类型X轴的范围选择初始化逻辑
    // 例如，对于数值类型的X轴，可以计算数值范围
  }
}

// 更新时间范围选择器的可见性
function updateTimeRangeSelectorVisibility() {
  const timeRangeSelector = document.getElementById('timeRangeSelector');
  const xAxisSliderContainer = document.getElementById('xAxisSliderContainer');
  if (!timeRangeSelector || !xAxisSliderContainer) return;
  
  // 检查X轴是否已选择
  const xColIndex = parseInt(xAxisSelect.value);
  if (isNaN(xColIndex) || xColIndex >= csvHeaders.length) {
    timeRangeSelector.classList.add('d-none');
    xAxisSliderContainer.classList.add('d-none');
    return;
  }
  
  // 只要X轴已选择，就显示时间范围选择器
  timeRangeSelector.classList.remove('d-none');
  xAxisSliderContainer.classList.remove('d-none');
  // 初始化时间范围选择器，确保显示正确的时间范围
  initTimeRangeSelector();
  
  // 初始化X轴范围拖动条的时间值
  const sliderValueMin = document.getElementById('sliderValueMin');
  const sliderValueMax = document.getElementById('sliderValueMax');
  if (sliderValueMin && sliderValueMax) {
    // 检查X轴是否为时间类型
    const xHeader = csvHeaders[xColIndex]?.trim() || '';
    const isTimeCol = isTimeColumn(xHeader);
    
    if (isTimeCol) {
      // 从csvData中提取时间值
      const xTimeValues = [];
      csvData.forEach(row => {
        const xValue = row[xColIndex]?.trim() || '';
        
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
      
      // 找出所有有效的时间值
      const validTimeValues = xTimeValues.filter(time => time !== null);
      if (validTimeValues.length > 0) {
        // 获取最小和最大时间值
        const minTime = new Date(Math.min(...validTimeValues.map(time => time.getTime())));
        const maxTime = new Date(Math.max(...validTimeValues.map(time => time.getTime())));
        
        // 检查是否有日期信息
        const hasDateInfo = validTimeValues.some(time => {
          const today = new Date();
          return time.getFullYear() !== today.getFullYear() || 
                 time.getMonth() !== today.getMonth() || 
                 time.getDate() !== today.getDate();
        });
        
        // 根据是否有日期信息格式化显示
        if (hasDateInfo) {
          sliderValueMin.textContent = minTime.toLocaleString();
          sliderValueMax.textContent = maxTime.toLocaleString();
        } else {
          sliderValueMin.textContent = minTime.toLocaleTimeString();
          sliderValueMax.textContent = maxTime.toLocaleTimeString();
        }
        
        // 更新滑块的位置
        sliderValueMin.style.left = '0%';
        sliderValueMax.style.left = '100%';
      }
    }
  }
}

// 应用时间范围
function applyTimeRange() {
  const timeRangeStart = document.getElementById('timeRangeStart');
  const timeRangeEnd = document.getElementById('timeRangeEnd');
  
  if (!timeRangeStart || !timeRangeEnd) return;
  
  const startTimeStr = timeRangeStart.value;
  const endTimeStr = timeRangeEnd.value;
  
  // 检查X轴类型
  const xColIndex = parseInt(xAxisSelect.value);
  if (isNaN(xColIndex) || xColIndex >= csvHeaders.length) {
    updateStatus(`❌ 请选择有效的X轴列`, 'danger');
    return;
  }
  
  const xHeader = csvHeaders[xColIndex]?.trim() || '';
  const isTimeCol = isTimeColumn(xHeader);
  
  if (isTimeCol) {
    // 时间类型X轴处理
    if (!startTimeStr || !endTimeStr) {
      updateStatus(`❌ 请选择完整的时间范围`, 'danger');
      return;
    }
    
    let startTime, endTime;
    
    // 检查输入框类型，处理不同格式
    if (timeRangeStart.type === 'time') {
      // time类型输入框，格式为 HH:MM:SS
      const today = new Date();
      const startParts = startTimeStr.split(':');
      const endParts = endTimeStr.split(':');
      
      startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 
                         parseInt(startParts[0]), parseInt(startParts[1]), parseInt(startParts[2] || 0));
      endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 
                       parseInt(endParts[0]), parseInt(endParts[1]), parseInt(endParts[2] || 0));
    } else {
      // datetime-local类型输入框，直接转换
      startTime = new Date(startTimeStr);
      endTime = new Date(endTimeStr);
    }
    
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
    
    // 根据是否有日期信息选择不同的显示格式
    const hasDateInfo = startTime.getFullYear() !== new Date().getFullYear() || 
                       startTime.getMonth() !== new Date().getMonth() || 
                       startTime.getDate() !== new Date().getDate();
    
    if (hasDateInfo) {
      updateStatus(`✅ 时间范围应用成功：${startTime.toLocaleString()} ~ ${endTime.toLocaleString()}`, 'success');
    } else {
      updateStatus(`✅ 时间范围应用成功：${startTime.toLocaleTimeString()} ~ ${endTime.toLocaleTimeString()}`, 'success');
    }
  } else {
    // 非时间类型X轴处理
    // 这里可以添加非时间类型X轴的范围选择逻辑
    // 例如，对于数值类型的X轴，可以添加输入框来选择数值范围
    updateStatus(`ℹ️ 非时间类型X轴的范围调整功能正在开发中`, 'info');
  }
}

// 重置时间范围
function resetTimeRange() {
  const timeRangeStart = document.getElementById('timeRangeStart');
  const timeRangeEnd = document.getElementById('timeRangeEnd');
  const xAxisRangeSliderMin = document.getElementById('xAxisRangeSliderMin');
  const xAxisRangeSliderMax = document.getElementById('xAxisRangeSliderMax');
  const sliderHandleMin = document.getElementById('sliderHandleMin');
  const sliderHandleMax = document.getElementById('sliderHandleMax');
  const sliderSelectedArea = document.getElementById('sliderSelectedArea');
  
  if (!timeRangeStart || !timeRangeEnd) return;
  
  // 清除时间范围选择
  selectedTimeRange = null;
  
  // 重置拖动条
  if (xAxisRangeSliderMin && xAxisRangeSliderMax) {
    xAxisRangeSliderMin.value = 0;
    xAxisRangeSliderMax.value = 100;
  }
  
  // 重置滑块的可视化位置
  if (sliderHandleMin && sliderHandleMax && sliderSelectedArea) {
    sliderHandleMin.style.left = '0%';
    sliderHandleMax.style.left = '100%';
    sliderSelectedArea.style.left = '0%';
    sliderSelectedArea.style.width = '100%';
  }
  
  // 重新初始化时间范围选择器
  initTimeRangeSelector();
  
  // 重新绘制图表
  drawLineChart();
  
  updateStatus(`✅ 时间范围已重置为全部数据`, 'success');
}

// 处理X轴拖动条变化
function handleXAxisSliderChange(event) {
  const xAxisRangeSliderMin = document.getElementById('xAxisRangeSliderMin');
  const xAxisRangeSliderMax = document.getElementById('xAxisRangeSliderMax');
  const timeRangeStart = document.getElementById('timeRangeStart');
  const timeRangeEnd = document.getElementById('timeRangeEnd');
  const sliderHandleMin = document.getElementById('sliderHandleMin');
  const sliderHandleMax = document.getElementById('sliderHandleMax');
  const sliderSelectedArea = document.getElementById('sliderSelectedArea');
  const sliderValueMin = document.getElementById('sliderValueMin');
  const sliderValueMax = document.getElementById('sliderValueMax');
  
  if (!xAxisRangeSliderMin || !xAxisRangeSliderMax || !timeRangeStart || !timeRangeEnd || !sliderHandleMin || !sliderHandleMax || !sliderSelectedArea || !sliderValueMin || !sliderValueMax) return;
  
  // 检查X轴是否已选择
  const xColIndex = parseInt(xAxisSelect.value);
  if (isNaN(xColIndex) || xColIndex >= csvHeaders.length) return;
  
  // 检查是否有原始图表数据
  if (!originalChartData || !originalChartData.xData || originalChartData.xData.length === 0) return;
  
  let minValue = parseInt(xAxisRangeSliderMin.value);
  let maxValue = parseInt(xAxisRangeSliderMax.value);
  
  if (isNaN(minValue) || isNaN(maxValue)) return;
  
  // 确保最小值小于最大值
  if (minValue >= maxValue) {
    if (event && event.target === xAxisRangeSliderMin) {
      xAxisRangeSliderMin.value = maxValue - 2;
      minValue = maxValue - 2;
    } else {
      xAxisRangeSliderMax.value = minValue + 2;
      maxValue = minValue + 2;
    }
  }
  
  // 更新滑块的可视化位置
  sliderHandleMin.style.left = `${minValue}%`;
  sliderHandleMax.style.left = `${maxValue}%`;
  sliderSelectedArea.style.left = `${minValue}%`;
  sliderSelectedArea.style.width = `${maxValue - minValue}%`;
  
  // 计算X轴范围
  const totalDataPoints = originalChartData.xData.length;
  const startIndex = Math.floor(totalDataPoints * minValue / 100);
  const endIndex = Math.min(totalDataPoints - 1, Math.floor(totalDataPoints * maxValue / 100));
  
  // 检查X轴是否为时间类型
  const xHeader = csvHeaders[xColIndex]?.trim() || '';
  const isTimeCol = isTimeColumn(xHeader);
  
  // 更新滑块的可视化位置和坐标值标识
  if (isTimeCol && originalChartData.xTimeValues) {
    // 对于时间类型，使用格式化的时间显示
    const startTime = originalChartData.xTimeValues[startIndex];
    const endTime = originalChartData.xTimeValues[endIndex];
    if (startTime && endTime) {
      // 检查是否有日期部分（如果时间是当天的，可能只需要显示时间）
      const today = new Date();
      const isTodayStart = startTime.getFullYear() === today.getFullYear() && 
                          startTime.getMonth() === today.getMonth() && 
                          startTime.getDate() === today.getDate();
      const isTodayEnd = endTime.getFullYear() === today.getFullYear() && 
                        endTime.getMonth() === today.getMonth() && 
                        endTime.getDate() === today.getDate();
      
      if (isTodayStart && isTodayEnd) {
        // 只显示时间部分
        sliderValueMin.textContent = startTime.toLocaleTimeString();
        sliderValueMax.textContent = endTime.toLocaleTimeString();
      } else {
        // 显示完整的日期时间
        sliderValueMin.textContent = startTime.toLocaleString();
        sliderValueMax.textContent = endTime.toLocaleString();
      }
    } else {
      // 时间解析失败，使用原始数据
      sliderValueMin.textContent = originalChartData.xData[startIndex] || '';
      sliderValueMax.textContent = originalChartData.xData[endIndex] || '';
    }
  } else {
    // 非时间类型，使用原始数据
    sliderValueMin.textContent = originalChartData.xData[startIndex] || '';
    sliderValueMax.textContent = originalChartData.xData[endIndex] || '';
  }
  sliderValueMin.style.left = `${minValue}%`;
  sliderValueMax.style.left = `${maxValue}%`;
  
  if (isTimeCol && originalChartData.xTimeValues) {
    // 时间类型X轴处理
    const startTime = originalChartData.xTimeValues[startIndex];
    const endTime = originalChartData.xTimeValues[endIndex];
    
    if (startTime && endTime) {
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
      
      // 更新时间范围选择器
      timeRangeStart.value = formatDateTimeLocal(startTime);
      timeRangeEnd.value = formatDateTimeLocal(endTime);
      
      // 保存选择的时间范围
      selectedTimeRange = { start: startTime, end: endTime };
      
      // 重新绘制图表
      drawLineChart();
      
      updateStatus(`✅ X轴范围调整成功：${startTime.toLocaleString()} ~ ${endTime.toLocaleString()}`, 'success');
    } else {
      // 时间解析失败，尝试使用索引范围
      selectedTimeRange = { start: startIndex, end: endIndex, isIndexBased: true };
      drawLineChart();
      updateStatus(`✅ X轴范围调整成功：索引 ${startIndex} ~ ${endIndex}`, 'success');
    }
  } else {
    // 非时间类型X轴处理
    selectedTimeRange = { start: startIndex, end: endIndex, isIndexBased: true };
    drawLineChart();
    updateStatus(`✅ X轴范围调整成功：索引 ${startIndex} ~ ${endIndex}`, 'success');
  }
}

// 处理从滑块拖动事件中更新X轴范围
function handleXAxisSliderChangeFromDrag(minValue, maxValue) {
  const timeRangeStart = document.getElementById('timeRangeStart');
  const timeRangeEnd = document.getElementById('timeRangeEnd');
  const sliderHandleMin = document.getElementById('sliderHandleMin');
  const sliderHandleMax = document.getElementById('sliderHandleMax');
  const sliderSelectedArea = document.getElementById('sliderSelectedArea');
  const sliderValueMin = document.getElementById('sliderValueMin');
  const sliderValueMax = document.getElementById('sliderValueMax');
  
  if (!timeRangeStart || !timeRangeEnd || !sliderHandleMin || !sliderHandleMax || !sliderSelectedArea || !sliderValueMin || !sliderValueMax) return;
  
  // 检查X轴是否已选择
  const xColIndex = parseInt(xAxisSelect.value);
  if (isNaN(xColIndex) || xColIndex >= csvHeaders.length) return;
  
  // 检查是否有原始图表数据
  if (!originalChartData || !originalChartData.xData || originalChartData.xData.length === 0) return;
  
  // 确保最小值小于最大值
  if (minValue >= maxValue) {
    return;
  }
  
  // 更新滑块的可视化位置
  sliderHandleMin.style.left = `${minValue}%`;
  sliderHandleMax.style.left = `${maxValue}%`;
  sliderSelectedArea.style.left = `${minValue}%`;
  sliderSelectedArea.style.width = `${maxValue - minValue}%`;
  
  // 计算X轴范围
  const totalDataPoints = originalChartData.xData.length;
  const startIndex = Math.floor(totalDataPoints * minValue / 100);
  const endIndex = Math.min(totalDataPoints - 1, Math.floor(totalDataPoints * maxValue / 100));
  
  // 检查X轴是否为时间类型
  const xHeader = csvHeaders[xColIndex]?.trim() || '';
  const isTimeCol = isTimeColumn(xHeader);
  
  // 更新滑块的可视化位置和坐标值标识
  if (isTimeCol && originalChartData.xTimeValues) {
    // 对于时间类型，使用格式化的时间显示
    const startTime = originalChartData.xTimeValues[startIndex];
    const endTime = originalChartData.xTimeValues[endIndex];
    if (startTime && endTime) {
      // 检查是否有日期部分（如果时间是当天的，可能只需要显示时间）
      const today = new Date();
      const isTodayStart = startTime.getFullYear() === today.getFullYear() && 
                          startTime.getMonth() === today.getMonth() && 
                          startTime.getDate() === today.getDate();
      const isTodayEnd = endTime.getFullYear() === today.getFullYear() && 
                        endTime.getMonth() === today.getMonth() && 
                        endTime.getDate() === today.getDate();
      
      if (isTodayStart && isTodayEnd) {
        // 只显示时间部分
        sliderValueMin.textContent = startTime.toLocaleTimeString();
        sliderValueMax.textContent = endTime.toLocaleTimeString();
      } else {
        // 显示完整的日期时间
        sliderValueMin.textContent = startTime.toLocaleString();
        sliderValueMax.textContent = endTime.toLocaleString();
      }
    } else {
      // 时间解析失败，使用原始数据
      sliderValueMin.textContent = originalChartData.xData[startIndex] || '';
      sliderValueMax.textContent = originalChartData.xData[endIndex] || '';
    }
  } else {
    // 非时间类型，使用原始数据
    sliderValueMin.textContent = originalChartData.xData[startIndex] || '';
    sliderValueMax.textContent = originalChartData.xData[endIndex] || '';
  }
  sliderValueMin.style.left = `${minValue}%`;
  sliderValueMax.style.left = `${maxValue}%`;
  
  if (isTimeCol && originalChartData.xTimeValues) {
    // 时间类型X轴处理
    const startTime = originalChartData.xTimeValues[startIndex];
    const endTime = originalChartData.xTimeValues[endIndex];
    
    if (startTime && endTime) {
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
      
      // 更新时间范围选择器
      timeRangeStart.value = formatDateTimeLocal(startTime);
      timeRangeEnd.value = formatDateTimeLocal(endTime);
      
      // 保存选择的时间范围
      selectedTimeRange = { start: startTime, end: endTime };
      
      // 重新绘制图表
      drawLineChart();
      
      updateStatus(`✅ X轴范围调整成功：${startTime.toLocaleString()} ~ ${endTime.toLocaleString()}`, 'success');
    } else {
      // 时间解析失败，尝试使用索引范围
      selectedTimeRange = { start: startIndex, end: endIndex, isIndexBased: true };
      drawLineChart();
      updateStatus(`✅ X轴范围调整成功：索引 ${startIndex} ~ ${endIndex}`, 'success');
    }
  } else {
    // 非时间类型X轴处理
    selectedTimeRange = { start: startIndex, end: endIndex, isIndexBased: true };
    drawLineChart();
    updateStatus(`✅ X轴范围调整成功：索引 ${startIndex} ~ ${endIndex}`, 'success');
  }
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
  console.log('更新状态:', message, '类型:', type);
  // 确保statusText已初始化
  if (!statusText) {
    statusText = document.getElementById('statusText');
  }
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
    console.log('状态已更新');
  } else {
    console.error('statusText元素未找到');
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

// 主要应用逻辑
let originalData = [];
let filteredData = [];
let controlData = [];
let headers = [];
let xAxisIndex = 0;
let yAxisIndices = [];
let yAxis2Indices = [];
let currentChart = null;
let currentPage = 1;
let itemsPerPage = 50;
let selectedControlTime = null;

// DOM元素
const elements = {
  dataFileInput: document.getElementById('demDecFileInput'),
  controlFileInput: document.getElementById('demControlFileInput'),
  dataFileNameDisplay: document.getElementById('dataFileNameDisplay'),
  dataFileName: document.getElementById('dataFileName'),
  controlFileNameDisplay: document.getElementById('controlFileNameDisplay'),
  controlFileName: document.getElementById('controlFileName'),
  encodingSelector: document.getElementById('encodingSelector'),
  dataFileEncoding: document.getElementById('dataFileEncoding'),
  dataEncodingResult: document.getElementById('dataEncodingResult'),
  encodingPreview: document.getElementById('encodingPreview'),
  confirmEncodingBtn: document.getElementById('confirmEncodingBtn'),
  controlEncodingSelector: document.getElementById('controlEncodingSelector'),
  controlFileEncoding: document.getElementById('controlFileEncoding'),
  controlEncodingResult: document.getElementById('controlEncodingResult'),
  controlEncodingPreview: document.getElementById('controlEncodingPreview'),
  confirmControlEncodingBtn: document.getElementById('confirmControlEncodingBtn'),
  timeSelectorContainer: document.getElementById('timeSelectorContainer'),
  timeSelectorSelect: document.getElementById('timeSelectorSelect'),
  filterByControlBtn: document.getElementById('filterByControlBtn'),
  statusText: document.getElementById('statusText'),
  xAxisSelect: document.getElementById('xAxisSelect'),
  yAxisSelect: document.getElementById('yAxisSelect'),
  yAxis2Select: document.getElementById('yAxis2Select'),
  drawChartBtn: document.getElementById('drawChartBtn'),
  timeRangeSelector: document.getElementById('timeRangeSelector'),
  timeRangeStart: document.getElementById('timeRangeStart'),
  timeRangeEnd: document.getElementById('timeRangeEnd'),
  applyTimeRangeBtn: document.getElementById('applyTimeRangeBtn'),
  resetTimeRangeBtn: document.getElementById('resetTimeRangeBtn'),
  autoTimeRangeBtn: document.getElementById('autoTimeRangeBtn'),
  exportChartBtn: document.getElementById('exportChartBtn'),
  resetDataBtn: document.getElementById('resetDataBtn'),
  clearAllBtn: document.getElementById('clearAllBtn'),
  chartContainer: document.getElementById('chartContainer'),
  lineChart: document.getElementById('lineChart'),
  xAxisSliderContainer: document.getElementById('xAxisSliderContainer'),
  toggleTableBtn: document.getElementById('toggleTableBtn'),
  paginationControls: document.getElementById('paginationControls'),
  prevPageBtn: document.getElementById('prevPageBtn'),
  nextPageBtn: document.getElementById('nextPageBtn'),
  pageInfo: document.getElementById('pageInfo'),
  pageInput: document.getElementById('pageInput'),
  jumpBtn: document.getElementById('jumpBtn'),
  tableContainer: document.getElementById('tableContainer'),
  tableHeader: document.getElementById('tableHeader'),
  tableBody: document.getElementById('tableBody'),
  sheetSelector: document.getElementById('sheetSelector'),
  sheetSelect: document.getElementById('sheetSelect'),
  confirmSheetBtn: document.getElementById('confirmSheetBtn'),
  filterZeroColumns: document.getElementById('filterZeroColumns')
};

// 初始化事件监听器
function initEventListeners() {
  // 数据文件上传
  elements.dataFileInput.addEventListener('change', handleDataFileUpload);
  
  // 控制文件上传
  elements.controlFileInput.addEventListener('change', handleControlFileUpload);
  
  // 编码选择
  elements.dataFileEncoding.addEventListener('change', updateEncodingPreview);
  elements.confirmEncodingBtn.addEventListener('click', confirmDataEncoding);
  
  elements.controlFileEncoding.addEventListener('change', updateControlEncodingPreview);
  elements.confirmControlEncodingBtn.addEventListener('click', confirmControlEncoding);
  
  // 时间选择
  elements.timeSelectorSelect.addEventListener('change', handleTimeSelectChange);
  elements.filterByControlBtn.addEventListener('click', filterDataByControlTime);
  
  // 坐标轴选择
  elements.drawChartBtn.addEventListener('click', drawChart);
  
  // 时间范围选择
  elements.applyTimeRangeBtn.addEventListener('click', applyTimeRange);
  elements.resetTimeRangeBtn.addEventListener('click', resetTimeRange);
  elements.autoTimeRangeBtn.addEventListener('click', autoTimeRange);
  
  // 操作按钮
  elements.exportChartBtn.addEventListener('click', exportChart);
  elements.resetDataBtn.addEventListener('click', resetData);
  elements.clearAllBtn.addEventListener('click', clearAll);
  
  // 表格控制
  elements.toggleTableBtn.addEventListener('click', toggleTable);
  elements.prevPageBtn.addEventListener('click', () => changePage(currentPage - 1));
  elements.nextPageBtn.addEventListener('click', () => changePage(currentPage + 1));
  elements.jumpBtn.addEventListener('click', () => jumpToPage());
  
  // Excel工作表选择
  elements.confirmSheetBtn.addEventListener('click', confirmSheetSelection);
}

// 处理数据文件上传
function handleDataFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  elements.dataFileName.textContent = file.name;
  elements.dataFileNameDisplay.classList.remove('d-none');
  
  if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    handleExcelFile(file);
  } else {
    elements.encodingSelector.classList.remove('d-none');
    updateEncodingPreview();
  }
}

// 处理Excel文件
function handleExcelFile(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    
    // 显示工作表选择器
    elements.sheetSelector.classList.remove('d-none');
    elements.sheetSelect.innerHTML = '';
    
    workbook.SheetNames.forEach(sheetName => {
      const option = document.createElement('option');
      option.value = sheetName;
      option.textContent = sheetName;
      elements.sheetSelect.appendChild(option);
    });
  };
  reader.readAsArrayBuffer(file);
}

// 确认工作表选择
function confirmSheetSelection() {
  const selectedSheet = elements.sheetSelect.value;
  if (!selectedSheet) return;
  
  const file = elements.dataFileInput.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const worksheet = workbook.Sheets[selectedSheet];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    processDataFile(jsonData);
    elements.sheetSelector.classList.add('d-none');
  };
  reader.readAsArrayBuffer(file);
}

// 处理控制文件上传
function handleControlFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  elements.controlFileName.textContent = file.name;
  elements.controlFileNameDisplay.classList.remove('d-none');
  
  if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    handleControlExcelFile(file);
  } else {
    elements.controlEncodingSelector.classList.remove('d-none');
    updateControlEncodingPreview();
  }
}

// 处理控制文件Excel
function handleControlExcelFile(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheet];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    processControlFile(jsonData);
  };
  reader.readAsArrayBuffer(file);
}

// 更新编码预览
function updateEncodingPreview() {
  const file = elements.dataFileInput.files[0];
  if (!file) return;
  
  const encoding = elements.dataFileEncoding.value;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      let content;
      if (encoding === 'auto') {
        content = e.target.result;
      } else {
        const decoder = new TextDecoder(encoding);
        content = decoder.decode(new Uint8Array(e.target.result));
      }
      elements.encodingPreview.textContent = content.substring(0, 500) + (content.length > 500 ? '...' : '');
    } catch (error) {
      elements.encodingPreview.textContent = '编码解析失败，请尝试其他编码';
    }
  };
  reader.readAsArrayBuffer(file);
}

// 确认数据文件编码
function confirmDataEncoding() {
  const file = elements.dataFileInput.files[0];
  const encoding = elements.dataFileEncoding.value;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      let content;
      if (encoding === 'auto') {
        content = e.target.result;
      } else {
        const decoder = new TextDecoder(encoding);
        content = decoder.decode(new Uint8Array(e.target.result));
      }
      
      const lines = content.split('\n').filter(line => line.trim() !== '');
      const parsedData = parseCSVContent(lines);
      processDataFile(parsedData);
      elements.encodingSelector.classList.add('d-none');
    } catch (error) {
      elements.dataEncodingResult.textContent = '编码解析失败，请尝试其他编码';
      elements.dataEncodingResult.classList.remove('d-none');
    }
  };
  
  if (encoding === 'auto') {
    reader.readAsText(file);
  } else {
    reader.readAsArrayBuffer(file);
  }
}

// 更新控制文件编码预览
function updateControlEncodingPreview() {
  const file = elements.controlFileInput.files[0];
  if (!file) return;
  
  const encoding = elements.controlFileEncoding.value;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      let content;
      if (encoding === 'auto') {
        content = e.target.result;
      } else {
        const decoder = new TextDecoder(encoding);
        content = decoder.decode(new Uint8Array(e.target.result));
      }
      elements.controlEncodingPreview.textContent = content.substring(0, 500) + (content.length > 500 ? '...' : '');
    } catch (error) {
      elements.controlEncodingPreview.textContent = '编码解析失败，请尝试其他编码';
    }
  };
  
  if (encoding === 'auto') {
    reader.readAsText(file);
  } else {
    reader.readAsArrayBuffer(file);
  }
}

// 确认控制文件编码
function confirmControlEncoding() {
  const file = elements.controlFileInput.files[0];
  const encoding = elements.controlFileEncoding.value;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      let content;
      if (encoding === 'auto') {
        content = e.target.result;
      } else {
        const decoder = new TextDecoder(encoding);
        content = decoder.decode(new Uint8Array(e.target.result));
      }
      
      const lines = content.split('\n').filter(line => line.trim() !== '');
      const parsedData = parseCSVContent(lines);
      processControlFile(parsedData);
      elements.controlEncodingSelector.classList.add('d-none');
    } catch (error) {
      elements.controlEncodingResult.textContent = '编码解析失败，请尝试其他编码';
      elements.controlEncodingResult.classList.remove('d-none');
    }
  };
  
  if (encoding === 'auto') {
    reader.readAsText(file);
  } else {
    reader.readAsArrayBuffer(file);
  }
}

// 解析CSV内容
function parseCSVContent(lines) {
  const data = [];
  lines.forEach(line => {
    const row = line.split(',').map(cell => cell.trim());
    data.push(row);
  });
  return data;
}

// 处理数据文件
function processDataFile(data) {
  if (data.length === 0) return;
  
  // 合并前3行作为标题
  headers = [];
  for (let i = 0; i < data[0].length; i++) {
    let header = '';
    for (let j = 0; j < Math.min(3, data.length); j++) {
      if (data[j][i]) {
        header += data[j][i] + ' ';
      }
    }
    headers.push(header.trim() || `Column ${i + 1}`);
  }
  
  // 提取数据行
  originalData = [];
  for (let i = 3; i < data.length; i++) {
    if (data[i].length > 0) {
      originalData.push(data[i]);
    }
  }
  
  // 过滤全0列
  if (elements.filterZeroColumns.checked) {
    filterZeroColumns();
  } else {
    filteredData = [...originalData];
  }
  
  updateUIAfterDataLoad();
  updateStatus('✅ 数据文件加载成功！请选择坐标轴并绘制图表');
}

// 过滤全0列
function filterZeroColumns() {
  if (originalData.length === 0) return;
  
  const nonZeroColumns = [];
  for (let i = 0; i < headers.length; i++) {
    let hasNonZero = false;
    for (let j = 0; j < originalData.length; j++) {
      const value = parseFloat(originalData[j][i]);
      if (!isNaN(value) && value !== 0) {
        hasNonZero = true;
        break;
      }
    }
    if (hasNonZero) {
      nonZeroColumns.push(i);
    }
  }
  
  // 更新 headers 和数据
  headers = nonZeroColumns.map(i => headers[i]);
  filteredData = originalData.map(row => nonZeroColumns.map(i => row[i]));
}

// 处理控制文件
function processControlFile(data) {
  if (data.length === 0) return;
  
  // 提取时间数据
  controlData = [];
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data[i].length; j++) {
      const cell = data[i][j].trim();
      if (cell) {
        controlData.push(cell);
      }
    }
  }
  
  // 更新时间选择器
  updateTimeSelector();
  updateStatus('✅ 控制文件加载成功！请选择筛选起始时间');
}

// 更新时间选择器
function updateTimeSelector() {
  elements.timeSelectorSelect.innerHTML = '';
  controlData.forEach((time, index) => {
    const option = document.createElement('option');
    option.value = time;
    option.textContent = time;
    elements.timeSelectorSelect.appendChild(option);
  });
  elements.timeSelectorContainer.classList.remove('d-none');
  elements.filterByControlBtn.disabled = false;
}

// 处理时间选择变化
function handleTimeSelectChange() {
  selectedControlTime = elements.timeSelectorSelect.value;
}

// 根据控制文件时间过滤数据
function filterDataByControlTime() {
  if (!selectedControlTime || originalData.length === 0) return;
  
  const selectedTime = parseTime(selectedControlTime);
  if (isNaN(selectedTime)) return;
  
  const endTime = selectedTime + 15 * 60 * 1000; // 15分钟
  
  filteredData = originalData.filter(row => {
    const rowTime = parseTime(row[0]);
    return !isNaN(rowTime) && rowTime >= selectedTime && rowTime <= endTime;
  });
  
  // 更新时间范围选择器
  if (filteredData.length > 0) {
    const firstTime = parseTime(filteredData[0][0]);
    const lastTime = parseTime(filteredData[filteredData.length - 1][0]);
    
    if (!isNaN(firstTime) && !isNaN(lastTime)) {
      elements.timeRangeStart.value = formatDateTime(firstTime);
      elements.timeRangeEnd.value = formatDateTime(lastTime);
    }
  }
  
  updateUIAfterDataLoad();
  updateStatus(`✅ 已根据控制文件时间筛选数据，共 ${filteredData.length} 条记录`);
}

// 解析时间
function parseTime(timeStr) {
  // 尝试直接解析
  const date = new Date(timeStr);
  if (!isNaN(date.getTime())) {
    return date.getTime();
  }
  
  // 尝试不同的时间格式
  const patterns = [
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/,
    /^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/,
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/,
    /^(\d{4})\/(\d{2})\/(\d{2})T(\d{2}):(\d{2}):(\d{2})$/,
    /^(\d{2}):(\d{2}):(\d{2})$/,
    /^(\d{4})-(\d{2})-(\d{2})$/,
    /^(\d{4})\/(\d{2})\/(\d{2})$/
  ];
  
  for (const pattern of patterns) {
    const match = timeStr.match(pattern);
    if (match) {
      if (match.length === 7) {
        // 完整日期时间
        const [, year, month, day, hour, minute, second] = match;
        const date = new Date(year, month - 1, day, hour, minute, second);
        if (!isNaN(date.getTime())) {
          return date.getTime();
        }
      } else if (match.length === 4) {
        // 只有时间
        const [, hour, minute, second] = match;
        const date = new Date();
        date.setHours(hour, minute, second, 0);
        if (!isNaN(date.getTime())) {
          return date.getTime();
        }
      } else if (match.length === 5) {
        // 只有日期
        const [, year, month, day] = match;
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          return date.getTime();
        }
      }
    }
  }
  
  return NaN;
}

// 格式化日期时间
function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// 更新数据加载后的UI
function updateUIAfterDataLoad() {
  // 更新坐标轴选择器
  updateAxisSelectors();
  
  // 更新表格
  updateTable();
  
  // 启用相关按钮
  elements.drawChartBtn.disabled = false;
  elements.resetDataBtn.disabled = false;
  elements.exportChartBtn.disabled = false;
  elements.timeRangeSelector.classList.remove('d-none');
  
  // 自动设置时间范围
  autoTimeRange();
}

// 更新坐标轴选择器
function updateAxisSelectors() {
  elements.xAxisSelect.innerHTML = '';
  elements.yAxisSelect.innerHTML = '';
  elements.yAxis2Select.innerHTML = '';
  
  headers.forEach((header, index) => {
    const xOption = document.createElement('option');
    xOption.value = index;
    xOption.textContent = header;
    elements.xAxisSelect.appendChild(xOption);
    
    const yOption = document.createElement('option');
    yOption.value = index;
    yOption.textContent = header;
    elements.yAxisSelect.appendChild(yOption);
    
    const y2Option = document.createElement('option');
    y2Option.value = index;
    y2Option.textContent = header;
    elements.yAxis2Select.appendChild(y2Option);
  });
  
  elements.xAxisSelect.disabled = false;
  elements.yAxisSelect.disabled = false;
  elements.yAxis2Select.disabled = false;
}

// 绘制图表
function drawChart() {
  xAxisIndex = parseInt(elements.xAxisSelect.value);
  yAxisIndices = Array.from(elements.yAxisSelect.selectedOptions).map(option => parseInt(option.value));
  yAxis2Indices = Array.from(elements.yAxis2Select.selectedOptions).map(option => parseInt(option.value));
  
  if (yAxisIndices.length === 0 && yAxis2Indices.length === 0) {
    updateStatus('⚠️ 请至少选择一个Y轴数据列');
    return;
  }
  
  const ctx = elements.lineChart.getContext('2d');
  
  // 销毁现有图表
  if (currentChart) {
    currentChart.destroy();
  }
  
  // 准备数据
  const labels = filteredData.map(row => row[xAxisIndex]);
  const datasets = [];
  
  // 左侧Y轴数据
  const leftColors = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1'];
  yAxisIndices.forEach((index, i) => {
    const data = filteredData.map(row => parseFloat(row[index]) || 0);
    datasets.push({
      label: headers[index],
      data: data,
      borderColor: leftColors[i % leftColors.length],
      backgroundColor: leftColors[i % leftColors.length] + '20',
      borderWidth: 2,
      tension: 0.3,
      yAxisID: 'y'
    });
  });
  
  // 右侧Y轴数据
  const rightColors = ['#fd7e14', '#20c997', '#6c757d', '#343a40', '#17a2b8'];
  yAxis2Indices.forEach((index, i) => {
    const data = filteredData.map(row => parseFloat(row[index]) || 0);
    datasets.push({
      label: headers[index],
      data: data,
      borderColor: rightColors[i % rightColors.length],
      backgroundColor: rightColors[i % rightColors.length] + '20',
      borderWidth: 2,
      tension: 0.3,
      yAxisID: 'y1'
    });
  });
  
  // 创建图表
  currentChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: '左侧Y轴'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: '右侧Y轴'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      },
      plugins: {
        legend: {
          position: 'top'
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      }
    }
  });
  
  // 显示图表
  elements.chartContainer.innerHTML = '';
  elements.chartContainer.appendChild(elements.lineChart);
  elements.lineChart.style.display = 'block';
  
  updateStatus('✅ 图表绘制成功！');
}

// 应用时间范围
function applyTimeRange() {
  const startTime = elements.timeRangeStart.value;
  const endTime = elements.timeRangeEnd.value;
  
  if (!startTime || !endTime) {
    updateStatus('⚠️ 请选择完整的时间范围');
    return;
  }
  
  const startTimestamp = new Date(startTime).getTime();
  const endTimestamp = new Date(endTime).getTime();
  
  filteredData = originalData.filter(row => {
    const rowTime = parseTime(row[0]);
    return !isNaN(rowTime) && rowTime >= startTimestamp && rowTime <= endTimestamp;
  });
  
  updateUIAfterDataLoad();
  if (currentChart) {
    drawChart();
  }
  
  updateStatus(`✅ 已应用时间范围筛选，共 ${filteredData.length} 条记录`);
}

// 重置时间范围
function resetTimeRange() {
  filteredData = [...originalData];
  autoTimeRange();
  updateUIAfterDataLoad();
  if (currentChart) {
    drawChart();
  }
  updateStatus('✅ 时间范围已重置为全部数据');
}

// 自动设置时间范围
function autoTimeRange() {
  if (filteredData.length > 0) {
    const firstTime = parseTime(filteredData[0][0]);
    const lastTime = parseTime(filteredData[filteredData.length - 1][0]);
    
    if (!isNaN(firstTime) && !isNaN(lastTime)) {
      elements.timeRangeStart.value = formatDateTime(firstTime);
      elements.timeRangeEnd.value = formatDateTime(lastTime);
    }
  }
}

// 导出图表
function exportChart() {
  if (!currentChart) {
    updateStatus('⚠️ 请先绘制图表');
    return;
  }
  
  const dataUrl = elements.lineChart.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `chart-${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}.png`;
  link.click();
  
  updateStatus('✅ 图表已导出为图片');
}

// 重置数据
function resetData() {
  filteredData = [...originalData];
  autoTimeRange();
  updateUIAfterDataLoad();
  if (currentChart) {
    drawChart();
  }
  updateStatus('✅ 数据已重置为原始数据');
}

// 清空所有
function clearAll() {
  // 重置所有变量
  originalData = [];
  filteredData = [];
  controlData = [];
  headers = [];
  xAxisIndex = 0;
  yAxisIndices = [];
  yAxis2Indices = [];
  currentChart = null;
  currentPage = 1;
  selectedControlTime = null;
  
  // 重置UI
  elements.dataFileInput.value = '';
  elements.controlFileInput.value = '';
  elements.dataFileNameDisplay.classList.add('d-none');
  elements.controlFileNameDisplay.classList.add('d-none');
  elements.encodingSelector.classList.add('d-none');
  elements.controlEncodingSelector.classList.add('d-none');
  elements.timeSelectorContainer.classList.add('d-none');
  elements.timeRangeSelector.classList.add('d-none');
  elements.xAxisSelect.innerHTML = '<option value="">请先上传DemDec数据文件</option>';
  elements.yAxisSelect.innerHTML = '<option value="">请先上传DemDec数据文件</option>';
  elements.yAxis2Select.innerHTML = '<option value="">请先上传DemDec数据文件</option>';
  elements.xAxisSelect.disabled = true;
  elements.yAxisSelect.disabled = true;
  elements.yAxis2Select.disabled = true;
  elements.drawChartBtn.disabled = true;
  elements.exportChartBtn.disabled = true;
  elements.resetDataBtn.disabled = true;
  elements.chartContainer.innerHTML = '<div class="d-flex align-items-center justify-content-center h-100 text-muted">📊 未绘制图表，上传数据文件并配置坐标轴后点击「绘制折线图」</div>';
  elements.lineChart.style.display = 'none';
  elements.tableContainer.style.display = 'none';
  elements.paginationControls.classList.add('d-none');
  elements.sheetSelector.classList.add('d-none');
  
  updateStatus('📋 请先上传DemDec数据文件（左侧），可选上传DemControl时间筛选文件（右侧）');
}

// 切换表格显示
function toggleTable() {
  if (elements.tableContainer.style.display === 'none') {
    elements.tableContainer.style.display = 'block';
    elements.toggleTableBtn.innerHTML = '🔼 隐藏数据表格';
    elements.paginationControls.classList.remove('d-none');
    updateTable();
  } else {
    elements.tableContainer.style.display = 'none';
    elements.toggleTableBtn.innerHTML = '🔽 显示数据表格';
    elements.paginationControls.classList.add('d-none');
  }
}

// 更新表格
function updateTable() {
  if (filteredData.length === 0) {
    elements.tableHeader.innerHTML = '<tr><th colspan="100%" class="text-center text-muted">📄 暂无表格数据</th></tr>';
    elements.tableBody.innerHTML = '';
    return;
  }
  
  // 更新表头
  let headerHTML = '<tr>';
  headers.forEach(header => {
    headerHTML += `<th>${header}</th>`;
  });
  headerHTML += '</tr>';
  elements.tableHeader.innerHTML = headerHTML;
  
  // 计算分页
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
  const pageData = filteredData.slice(startIndex, endIndex);
  
  // 更新表格内容
  let bodyHTML = '';
  pageData.forEach(row => {
    bodyHTML += '<tr>';
    row.forEach(cell => {
      bodyHTML += `<td>${cell}</td>`;
    });
    bodyHTML += '</tr>';
  });
  elements.tableBody.innerHTML = bodyHTML;
  
  // 更新分页信息
  elements.pageInfo.textContent = `第 ${currentPage} 页 / 共 ${totalPages} 页`;
  elements.prevPageBtn.disabled = currentPage === 1;
  elements.nextPageBtn.disabled = currentPage === totalPages;
}

// 更改页码
function changePage(page) {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    updateTable();
  }
}

// 跳转到指定页码
function jumpToPage() {
  const page = parseInt(elements.pageInput.value);
  if (!isNaN(page)) {
    changePage(page);
  }
}

// 更新状态信息
function updateStatus(message) {
  elements.statusText.textContent = message;
}

// 初始化应用
function initApp() {
  initEventListeners();
  updateStatus('📋 请先上传DemDec数据文件（左侧），可选上传DemControl时间筛选文件（右侧）');
}

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);
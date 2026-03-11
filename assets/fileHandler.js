/**
 * 文件处理模块 - 处理文件上传、编码选择和数据处理
 * 
 * 该模块负责处理数据文件和控制文件的上传、编码检测、
 * Excel文件处理、数据解析和表格更新等功能。
 */

import { elements, originalData, filteredData, headers, controlData, currentPage, itemsPerPage, updateVariables } from './config.js';
import { parseCSVContent, updateStatus, parseTime, formatDateTime, detectEncoding, decodeData } from './utils.js';
import { initXAxisSlider } from './chartHandler.js';

/**
 * 处理数据文件上传
 * @param {Event} e - 文件上传事件
 * @example
 * // 当用户选择数据文件时调用
 * elements.dataFileInput.addEventListener('change', handleDataFileUpload);
 */
function handleDataFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  elements.dataFileName.textContent = file.name;
  elements.dataFileNameDisplay.classList.remove('d-none');
  
  if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    handleExcelFile(file);
  } else {
    // 自动检测编码并直接解析，不需要人工确认
    autoDetectAndProcessDataFile(file);
  }
}

/**
 * 自动检测数据文件编码并处理
 * @param {File} file - 数据文件对象
 */
function autoDetectAndProcessDataFile(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const buffer = new Uint8Array(e.target.result);
      const detectedEncoding = detectEncoding(buffer);
      let content = decodeData(buffer, detectedEncoding);
      
      const lines = content.split('\n').filter(line => line.trim() !== '');
      const parsedData = parseCSVContent(lines);
      processDataFile(parsedData, detectedEncoding);
      
      // 自动检测成功后，不显示编码选择器，除非用户需要手动修改
      // 但为了让用户知道检测结果，我们更新预览但不显示选择器
      updateEncodingPreview();
    } catch (error) {
      // 解码失败时显示编码选择器，让用户手动选择
      elements.encodingSelector.classList.remove('d-none');
      updateEncodingPreview();
      updateStatus('⚠️ 编码自动检测失败，请手动选择编码');
    }
  };
  reader.readAsArrayBuffer(file);
  
  // 暂时不显示编码选择器，等自动检测结果出来后再决定
  // 这样可以避免预览显示与实际处理不一致的问题
}

/**
 * 处理Excel文件
 * @param {File} file - Excel文件对象
 * @example
 * handleExcelFile(excelFile);
 */
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

/**
 * 确认工作表选择
 * @example
 * // 当用户确认工作表选择时调用
 * elements.confirmSheetBtn.addEventListener('click', confirmSheetSelection);
 */
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

/**
 * 处理控制文件上传
 * @param {Event} e - 文件上传事件
 * @example
 * // 当用户选择控制文件时调用
 * elements.controlFileInput.addEventListener('change', handleControlFileUpload);
 */
function handleControlFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  elements.controlFileName.textContent = file.name;
  elements.controlFileNameDisplay.classList.remove('d-none');
  
  if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    handleControlExcelFile(file);
  } else {
    // 自动检测编码并直接解析，不需要人工确认
    autoDetectAndProcessControlFile(file);
  }
}

/**
 * 自动检测控制文件编码并处理
 * @param {File} file - 控制文件对象
 */
function autoDetectAndProcessControlFile(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const buffer = new Uint8Array(e.target.result);
      const detectedEncoding = detectEncoding(buffer);
      let content = decodeData(buffer, detectedEncoding);
      
      const lines = content.split('\n').filter(line => line.trim() !== '');
      const parsedData = parseCSVContent(lines);
      processControlFile(parsedData, detectedEncoding);
    } catch (error) {
      // 解码失败时显示编码选择器，让用户手动选择
      elements.controlEncodingSelector.classList.remove('d-none');
      updateControlEncodingPreview();
      updateStatus('⚠️ 控制文件编码自动检测失败，请手动选择编码');
    }
  };
  reader.readAsArrayBuffer(file);
  
  // 始终显示编码选择器，供用户修改编码
  elements.controlEncodingSelector.classList.remove('d-none');
  updateControlEncodingPreview();
}

/**
 * 处理控制文件Excel
 * @param {File} file - Excel文件对象
 * @example
 * handleControlExcelFile(excelFile);
 */
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

/**
 * 更新数据文件编码预览
 * @example
 * // 当用户更改编码选择时调用
 * elements.dataFileEncoding.addEventListener('change', updateEncodingPreview);
 */
function updateEncodingPreview() {
  const file = elements.dataFileInput.files[0];
  if (!file) return;
  
  const encoding = elements.dataFileEncoding.value;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const buffer = new Uint8Array(e.target.result);
      let content;
      let detectedEncoding;
      
      if (encoding === 'auto') {
        detectedEncoding = detectEncoding(buffer);
        content = decodeData(buffer, detectedEncoding);
      } else {
        content = decodeData(buffer, encoding);
      }
      
      // 只显示最多3行内容
      const lines = content.split('\n');
      const previewContent = lines.slice(0, 3).join('\n');
      elements.encodingPreview.textContent = previewContent + (lines.length > 3 ? '...' : '');
      
      if (encoding === 'auto' && detectedEncoding) {
        const encodingNames = {
          gb2312: 'GB2312 (简体中文)',
          gbk: 'GBK (扩展中文)',
          gb18030: 'GB18030 (全面中文支持)',
          utf8: 'UTF-8',
          utf8bom: 'UTF-8 with BOM'
        };
        elements.dataEncodingResult.textContent = `自动检测结果：${encodingNames[detectedEncoding] || detectedEncoding.toUpperCase()}`;
        elements.dataEncodingResult.classList.remove('d-none');
      } else {
        elements.dataEncodingResult.classList.add('d-none');
      }
    } catch (error) {
      elements.encodingPreview.textContent = '编码解析失败，请尝试其他编码';
      elements.dataEncodingResult.classList.add('d-none');
    }
  };
  reader.readAsArrayBuffer(file);
}

/**
 * 确认数据文件编码
 * @example
 * // 当用户确认编码选择时调用
 * elements.confirmEncodingBtn.addEventListener('click', confirmDataEncoding);
 */
function confirmDataEncoding() {
  const file = elements.dataFileInput.files[0];
  const encoding = elements.dataFileEncoding.value;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const buffer = new Uint8Array(e.target.result);
      let content;
      let finalEncoding;
      
      if (encoding === 'auto') {
        finalEncoding = detectEncoding(buffer);
        content = decodeData(buffer, finalEncoding);
      } else {
        finalEncoding = encoding;
        content = decodeData(buffer, encoding);
      }
      
      const lines = content.split('\n').filter(line => line.trim() !== '');
      const parsedData = parseCSVContent(lines);
      processDataFile(parsedData, finalEncoding);
    } catch (error) {
      elements.dataEncodingResult.textContent = '编码解析失败，请尝试其他编码';
      elements.dataEncodingResult.classList.remove('d-none');
    }
  };
  
  reader.readAsArrayBuffer(file);
}

/**
 * 更新控制文件编码预览
 * @example
 * // 当用户更改控制文件编码选择时调用
 * elements.controlFileEncoding.addEventListener('change', updateControlEncodingPreview);
 */
function updateControlEncodingPreview() {
  const file = elements.controlFileInput.files[0];
  if (!file) return;
  
  const encoding = elements.controlFileEncoding.value;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const buffer = new Uint8Array(e.target.result);
      let content;
      let detectedEncoding;
      
      if (encoding === 'auto') {
        detectedEncoding = detectEncoding(buffer);
        content = decodeData(buffer, detectedEncoding);
      } else {
        content = decodeData(buffer, encoding);
      }
      
      // 只显示最多3行内容
      const lines = content.split('\n');
      const previewContent = lines.slice(0, 3).join('\n');
      elements.controlEncodingPreview.textContent = previewContent + (lines.length > 3 ? '...' : '');
      
      if (encoding === 'auto' && detectedEncoding) {
        const encodingNames = {
          gb2312: 'GB2312 (简体中文)',
          gbk: 'GBK (扩展中文)',
          gb18030: 'GB18030 (全面中文支持)',
          utf8: 'UTF-8',
          utf8bom: 'UTF-8 with BOM'
        };
        elements.controlEncodingResult.textContent = `自动检测结果：${encodingNames[detectedEncoding] || detectedEncoding.toUpperCase()}`;
        elements.controlEncodingResult.classList.remove('d-none');
      } else {
        elements.controlEncodingResult.classList.add('d-none');
      }
    } catch (error) {
      elements.controlEncodingPreview.textContent = '编码解析失败，请尝试其他编码';
      elements.controlEncodingResult.classList.add('d-none');
    }
  };
  
  reader.readAsArrayBuffer(file);
}

/**
 * 确认控制文件编码
 * @example
 * // 当用户确认控制文件编码选择时调用
 * elements.confirmControlEncodingBtn.addEventListener('click', confirmControlEncoding);
 */
function confirmControlEncoding() {
  const file = elements.controlFileInput.files[0];
  const encoding = elements.controlFileEncoding.value;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const buffer = new Uint8Array(e.target.result);
      let content;
      let finalEncoding;
      
      if (encoding === 'auto') {
        finalEncoding = detectEncoding(buffer);
        content = decodeData(buffer, finalEncoding);
      } else {
        finalEncoding = encoding;
        content = decodeData(buffer, encoding);
      }
      
      const lines = content.split('\n').filter(line => line.trim() !== '');
      const parsedData = parseCSVContent(lines);
      processControlFile(parsedData, finalEncoding);
    } catch (error) {
      elements.controlEncodingResult.textContent = '编码解析失败，请尝试其他编码';
      elements.controlEncodingResult.classList.remove('d-none');
    }
  };
  
  reader.readAsArrayBuffer(file);
}

/**
 * 处理数据文件
 * @param {Array<Array<string>>} data - 解析后的数据
 * @param {string} encoding - 检测到的编码
 * @example
 * processDataFile(parsedData, 'gb2312');
 */
function processDataFile(data, encoding) {
  if (data.length === 0) return;
  
  let newHeaders;
  let newOriginalData;
  let headerRows = 0;
  
  // 检查是否已经有标题行（第一行是否包含"时间"列）
  if (data[0] && data[0][0] === '时间') {
    // 已经有标题行
    newHeaders = data[0];
    headerRows = 1;
    // 提取数据行
    newOriginalData = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i].length > 0) {
        newOriginalData.push(data[i]);
      }
    }
  } else {
    // 检测前几行是否包含时间数据，避免将数据行错误识别为标题行
    let actualHeaderRows = 0;
    const maxHeaderRows = Math.min(3, data.length);
    
    // 检查前maxHeaderRows行，判断是否可能是标题行
    for (let j = 0; j < maxHeaderRows; j++) {
      if (data[j] && data[j].length > 0) {
        // 检查第一列是否是时间格式
        const firstCell = data[j][0].trim();
        const parsedTime = parseTime(firstCell);
        
        // 如果第一列是时间格式，那么这行不是标题行
        if (!isNaN(parsedTime)) {
          break;
        }
        
        // 检查其他列是否包含数字（如果大部分是数字，可能是数据行）
        let numericCount = 0;
        for (let k = 1; k < data[j].length; k++) {
          const cell = data[j][k].trim();
          if (!isNaN(Number(cell)) && cell !== '') {
            numericCount++;
          }
        }
        
        // 如果超过50%的列是数字，可能是数据行
        if (numericCount > data[j].length / 2) {
          break;
        }
        
        actualHeaderRows++;
      }
    }
    
    // 如果没有检测到标题行，创建默认标题行
    newHeaders = [];
    if (actualHeaderRows > 0) {
      // 合并标题行
      for (let i = 0; i < data[0].length; i++) {
        const headerParts = [];
        for (let j = 0; j < actualHeaderRows; j++) {
          if (data[j] && data[j][i]) {
            const trimmedPart = data[j][i].trim().replace(/\s+/g, '');
            if (trimmedPart) {
              headerParts.push(trimmedPart);
            }
          }
        }
        newHeaders.push(headerParts.join('') || `Column ${i + 1}`);
      }
    } else {
      // 没有标题行，创建默认标题
      for (let i = 0; i < data[0].length; i++) {
        if (i === 0) {
          newHeaders.push('时间');
        } else {
          newHeaders.push(`Column ${i + 1}`);
        }
      }
    }
    
    // 设置实际的标题行数
    headerRows = actualHeaderRows;
    
    // 提取数据行
    newOriginalData = [];
    for (let i = headerRows; i < data.length; i++) {
      if (data[i] && data[i].length > 0) {
        newOriginalData.push(data[i]);
      }
    }
  }
  
  // 过滤全0列
  let newFilteredData;
  if (elements.filterZeroColumns.checked) {
    newFilteredData = filterZeroColumns(newOriginalData, newHeaders);
  } else {
    newFilteredData = [...newOriginalData];
  }
  
  // 更新全局变量
  updateVariables({
    originalData: newOriginalData,
    filteredData: newFilteredData,
    headers: newHeaders
  });
  
  // 报告解析结果
  const encodingNames = {
    gb2312: 'GB2312 (简体中文)',
    gbk: 'GBK (扩展中文)',
    gb18030: 'GB18030 (全面中文支持)',
    utf8: 'UTF-8',
    utf8bom: 'UTF-8 with BOM'
  };
  const encodingName = encodingNames[encoding] || encoding.toUpperCase();
  
  updateUIAfterDataLoad();
  updateStatus(`✅ 数据文件加载成功！编码：${encodingName}，总行数：${data.length}，数据行数：${newOriginalData.length}，标题行数：${headerRows}`);
  
  // 自动检测成功后，不显示编码选择器
  // 但为了让用户知道检测结果，我们更新预览但不显示选择器
  updateEncodingPreview();
}

/**
 * 过滤全0列
 * @param {Array<Array<string>>} data - 数据二维数组
 * @param {Array<string>} headerList - 表头数组
 * @returns {Array<Array<string>>} 过滤后的数据
 * @example
 * const filteredData = filterZeroColumns(data, headers);
 */
function filterZeroColumns(data, headerList) {
  if (data.length === 0) return data;
  
  const nonZeroColumns = [];
  for (let i = 0; i < headerList.length; i++) {
    let hasNonZero = false;
    for (let j = 0; j < data.length; j++) {
      const value = parseFloat(data[j][i]);
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
  const newHeaders = nonZeroColumns.map(i => headerList[i]);
  const newData = data.map(row => nonZeroColumns.map(i => row[i]));
  
  // 更新全局变量
  updateVariables({
    headers: newHeaders
  });
  
  return newData;
}

/**
 * 处理控制文件
 * @param {Array<Array<string>>} data - 解析后的数据
 * @param {string} encoding - 检测到的编码
 * @example
 * processControlFile(parsedData, 'gb2312');
 */
function processControlFile(data, encoding) {
  if (data.length === 0) return;
  
  // 提取时间数据 - 优先提取第一列作为时间列
  const newControlData = [];
  for (let i = 0; i < data.length; i++) {
    // 优先使用第一列作为时间列
    if (data[i].length > 0) {
      const cell = data[i][0].trim();
      if (cell) {
        newControlData.push(cell);
      }
    }
  }
  
  // 如果第一列没有数据，尝试提取所有非空单元格
  if (newControlData.length === 0) {
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        const cell = data[i][j].trim();
        if (cell) {
          newControlData.push(cell);
        }
      }
    }
  }
  
  // 更新全局变量
  updateVariables({
    controlData: newControlData
  });
  
  // 报告解析结果
  const encodingNames = {
    gb2312: 'GB2312 (简体中文)',
    gbk: 'GBK (扩展中文)',
    gb18030: 'GB18030 (全面中文支持)',
    utf8: 'UTF-8',
    utf8bom: 'UTF-8 with BOM'
  };
  const encodingName = encodingNames[encoding] || encoding.toUpperCase();
  
  // 更新时间选择器
  updateTimeSelector();
  updateStatus(`✅ 控制文件加载成功！编码：${encodingName}，总行数：${data.length}，提取时间点数：${newControlData.length}`);
  
  // 显示编码选择器，以便用户可以在需要时手动选择编码
  elements.controlEncodingSelector.classList.remove('d-none');
  updateControlEncodingPreview();
}

/**
 * 更新时间选择器
 * @example
 * updateTimeSelector();
 */
function updateTimeSelector() {
  elements.timeSelectorSelect.innerHTML = '';
  if (controlData && controlData.length > 0) {
    let firstValidTime = null;
    controlData.forEach((time, index) => {
      // 只添加时间值，不添加标题行的"时间"字样
      if (time && time.trim() !== '时间' && time.trim() !== 'Time') {
        const option = document.createElement('option');
        option.value = time;
        option.textContent = time;
        elements.timeSelectorSelect.appendChild(option);
        // 记录第一个有效时间
        if (!firstValidTime) {
          firstValidTime = time;
        }
      }
    });
    // 自动选择第一个有效时间
    if (firstValidTime) {
      elements.timeSelectorSelect.value = firstValidTime;
      // 触发时间选择变化事件，更新X轴范围控件
      const event = new Event('change');
      elements.timeSelectorSelect.dispatchEvent(event);
    }
  }
  elements.timeSelectorContainer.classList.remove('d-none');
  elements.filterByControlBtn.disabled = false;
}

/**
 * 更新数据加载后的UI
 * @example
 * updateUIAfterDataLoad();
 */
function updateUIAfterDataLoad() {
  // 更新坐标轴选择器
  updateAxisSelectors();
  
  // 更新表格
  updateTable();
  
  // 启用相关按钮
  elements.drawChartBtn.disabled = false;
  elements.resetDataBtn.disabled = false;
  elements.exportChartBtn.disabled = false;
  elements.exportDataBtn.disabled = false;
  elements.clearYAxisBtn.disabled = false;
  elements.clearYAxis2Btn.disabled = false;
  elements.selectAllYAxisBtn.disabled = false;
  elements.selectAllYAxis2Btn.disabled = false;
  elements.timeRangeSelector.classList.remove('d-none');
  
  // 自动设置时间范围
  autoTimeRange();
  
  // 初始化X轴滑块
  initXAxisSlider();
}

/**
 * 更新坐标轴选择器
 * @example
 * updateAxisSelectors();
 */
function updateAxisSelectors() {
  elements.xAxisSelect.innerHTML = '';
  elements.yAxisSelect.innerHTML = '';
  elements.yAxis2Select.innerHTML = '';
  
  if (headers && headers.length > 0) {
    headers.forEach((header, index) => {
      const xOption = document.createElement('option');
      xOption.value = index;
      xOption.textContent = header;
      elements.xAxisSelect.appendChild(xOption);
      
      // 只有当X轴未选择时间列时，才将时间列添加到Y轴选项
      // 假设第一列是时间列
      if (index !== 0) {
        const yOption = document.createElement('option');
        yOption.value = index;
        yOption.textContent = header;
        elements.yAxisSelect.appendChild(yOption);
        
        const y2Option = document.createElement('option');
        y2Option.value = index;
        y2Option.textContent = header;
        elements.yAxis2Select.appendChild(y2Option);
      }
    });
    
    elements.xAxisSelect.disabled = false;
    elements.yAxisSelect.disabled = false;
    elements.yAxis2Select.disabled = false;
  }
}

/**
 * 更新表格
 * @example
 * updateTable();
 */
function updateTable() {
  if (filteredData.length === 0) {
    elements.tableHeader.innerHTML = '<tr><th colspan="100%" class="text-center text-muted">📄 暂无表格数据</th></tr>';
    elements.tableBody.innerHTML = '';
    return;
  }
  
  // 更新表头
  let headerHTML = '<tr>';
  headers.forEach((header, index) => {
    // 为时间列设置足够的宽度
    if (index === 0) {
      headerHTML += `<th style="min-width: 200px; white-space: nowrap;">${header}</th>`;
    } else {
      headerHTML += `<th>${header}</th>`;
    }
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
    row.forEach((cell, index) => {
      // 为时间列设置 nowrap
      if (index === 0) {
        bodyHTML += `<td style="white-space: nowrap;">${cell}</td>`;
      } else {
        bodyHTML += `<td>${cell}</td>`;
      }
    });
    bodyHTML += '</tr>';
  });
  elements.tableBody.innerHTML = bodyHTML;
  
  // 更新分页信息
  elements.pageInfo.textContent = `第 ${currentPage} 页 / 共 ${totalPages} 页`;
  elements.prevPageBtn.disabled = currentPage === 1;
  elements.nextPageBtn.disabled = currentPage === totalPages;
}

/**
 * 自动设置时间范围
 * @example
 * autoTimeRange();
 */
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

// 导出文件处理函数
export {
  handleDataFileUpload,
  handleControlFileUpload,
  confirmSheetSelection,
  updateEncodingPreview,
  confirmDataEncoding,
  updateControlEncodingPreview,
  confirmControlEncoding,
  updateTimeSelector,
  updateUIAfterDataLoad,
  updateTable,
  autoTimeRange
}
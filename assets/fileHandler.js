/**
 * 文件处理模块 - 处理文件上传、编码选择和数据处理
 * 
 * 该模块负责处理数据文件和控制文件的上传、编码检测、
 * Excel文件处理、数据解析和表格更新等功能。
 */

import { elements, rawData, rawHeaders, originalData, filteredData, headers, controlData, currentPage, itemsPerPage, tableDisplayMode, detectedDate, detectedDateSource, updateVariables } from './config.js';
import { parseCSVContent, updateStatus, parseTime, formatDateTime, parseDateFromFileName, detectEncoding, decodeData, mergeExcelSheets } from './utils.js';
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
  
  // 识别日期
  let detectedDate = null;
  let detectedDateSource = '未知';
  
  // 首先尝试从文件名解析日期
  const dateFromFileName = parseDateFromFileName(file.name);
  if (dateFromFileName) {
    detectedDate = dateFromFileName;
    detectedDateSource = `文件名 (${file.name})`;
    updateStatus(`📅 从文件名识别到日期：${detectedDate}`);
  } else if (file.lastModified) {
    // 如果文件名中没有日期，使用文件修改日期
    const fileDate = new Date(file.lastModified);
    detectedDate = `${fileDate.getFullYear()}-${String(fileDate.getMonth() + 1).padStart(2, '0')}-${String(fileDate.getDate()).padStart(2, '0')}`;
    detectedDateSource = `文件修改时间`;
    updateStatus(`📅 从文件修改时间识别到日期：${detectedDate}`);
  }
  
  // 保存文件名、文件日期和识别到的日期
  updateVariables({
    currentFileName: file.name,
    currentFileDate: file.lastModified ? new Date(file.lastModified) : new Date(),
    detectedDate: detectedDate,
    detectedDateSource: detectedDateSource
  });
  
  // 更新日期识别UI显示
  updateDetectedDateDisplay();
  
  if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    handleExcelFile(file);
  } else {
    // 检查是否需要手动选择编码
    const isManualEncoding = elements.manualEncoding && elements.manualEncoding.checked;
    
    if (isManualEncoding) {
      // 显示编码选择器，让用户手动选择编码
      elements.encodingSelector.classList.remove('d-none');
      updateEncodingPreview();
    } else {
      // 自动检测编码并处理
      autoDetectAndProcessDataFile(file);
    }
  }
}

/**
 * 更新日期识别结果显示
 */
function updateDetectedDateDisplay() {
  if (elements.detectedDateSource && elements.detectedDateValue && elements.detectedDateInput) {
    elements.detectedDateSource.textContent = `来源：${detectedDateSource}`;
    elements.detectedDateValue.textContent = `识别日期：${detectedDate || '未识别'}`;
    elements.detectedDateInput.value = detectedDate || '';
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
    updateStatus(`📊 开始读取Excel文件：${file.name}`);
    
    // 尝试多种配置解析，选择最佳结果（与测试页面一致）
    const configs = [
      { name: '标准配置', options: { type: 'array', cellStyles: true, cellText: true, cellDates: true, raw: false } },
      { name: 'GBK编码', options: { type: 'array', codepage: 936, cellStyles: true, cellText: true, cellDates: true, raw: false } },
      { name: 'UTF-8编码', options: { type: 'array', codepage: 65001, cellStyles: true, cellText: true, cellDates: true, raw: false } },
      { name: 'Raw模式', options: { type: 'array', raw: true } }
    ];
    
    let bestWorkbook = null;
    let bestConfigName = '';
    let bestFirstHeader = '';
    
    for (const config of configs) {
      try {
        const workbook = XLSX.read(data, config.options);
        
        if (workbook.SheetNames.length > 0) {
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const firstData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: false });
          
          if (firstData.length > 0 && firstData[0].length > 0) {
            const firstHeader = String(firstData[0][0]).trim();
            const hasGarbledChars = /[\ufffd\x00-\x1f\x7f-\x9f]/.test(firstHeader);
            
            if (!hasGarbledChars) {
              bestWorkbook = workbook;
              bestConfigName = config.name;
              bestFirstHeader = firstHeader;
              updateStatus(`✅ 使用${config.name}解析成功，表头首列: "${firstHeader}"`);
              break;
            }
            
            if (!bestWorkbook) {
              bestWorkbook = workbook;
              bestConfigName = config.name;
              bestFirstHeader = firstHeader;
            }
          }
        }
      } catch (error) {
        updateStatus(`⚠️ ${config.name}解析失败: ${error.message}`);
      }
    }
    
    if (!bestWorkbook) {
      updateStatus('❌ Excel文件解析失败');
      return;
    }
    
    updateStatus(`📊 读取完成，使用${bestConfigName}，包含${bestWorkbook.SheetNames.length}个工作表: ${bestWorkbook.SheetNames.join(', ')}`);
    
    // 检测是否为特殊格式的多Sheet文件
    const isMultiSheetFormat = detectMultiSheetFormat(bestWorkbook);
    
    if (isMultiSheetFormat && bestWorkbook.SheetNames.length > 1) {
      updateStatus(`🔍 检测到特殊多Sheet格式，开始自动合并...`);
      // 自动合并多Sheet数据
      const sheetsData = [];
      bestWorkbook.SheetNames.forEach((sheetName, index) => {
        const worksheet = bestWorkbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          raw: false,
          dateNF: 'yyyy-mm-dd hh:mm:ss',
          defval: ''
        });
        // 输出调试信息
        if (jsonData.length > 0 && jsonData[0].length > 0) {
          const firstRowSample = jsonData[0].slice(0, Math.min(5, jsonData[0].length)).map(h => {
            const str = String(h);
            return str.length > 20 ? str.substring(0, 20) + '...' : str;
          }).join(', ');
          updateStatus(`📋 Sheet ${index + 1}: ${sheetName}，行数:${jsonData.length}，列数:${jsonData[0].length}`);
          updateStatus(`   表头示例: ${firstRowSample}`);
        }
        // 使用对象格式，包含name和data属性
        sheetsData.push({ name: sheetName, data: jsonData });
      });
      
      const result = mergeExcelSheets(sheetsData);
      if (result.mergedData.length > 0) {
        updateStatus(`✅ ${result.info}`);
        const mergedHeadersSample = result.mergedData[0].slice(0, Math.min(5, result.mergedData[0].length)).join(', ');
        updateStatus(`📝 合并后表头: ${mergedHeadersSample}...`);
        processDataFile(result.mergedData, 'xlsx');
        return;
      } else {
        updateStatus(`⚠️ 多Sheet合并失败，切换到手动选择模式`);
      }
    }
    
    // 显示工作表选择器（单Sheet或合并失败时）
    elements.sheetSelector.classList.remove('d-none');
    elements.sheetSelect.innerHTML = '';
    
    bestWorkbook.SheetNames.forEach(sheetName => {
      const option = document.createElement('option');
      option.value = sheetName;
      option.textContent = sheetName;
      elements.sheetSelect.appendChild(option);
    });
  };
  reader.readAsArrayBuffer(file);
}

/**
 * 检测Excel文件是否为特殊多Sheet格式
 * 判断依据：每个Sheet都包含"时间"和"值"列
 * @param {Object} workbook - XLSX工作簿对象
 * @returns {boolean} 是否为特殊多Sheet格式
 */
function detectMultiSheetFormat(workbook) {
  if (!workbook || workbook.SheetNames.length < 2) {
    return false;
  }
  
  const requiredColumns = ['时间', '值'];
  
  // 检查第一个Sheet的结构
  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];
  const firstSheetData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
  
  if (!firstSheetData || firstSheetData.length < 2) {
    return false;
  }
  
  // 获取表头行
  const headers = firstSheetData[0];
  if (!headers || headers.length < 2) {
    return false;
  }
  
  // 检查是否包含所有必需的列
  const headerSet = new Set(headers.map(h => String(h).trim()));
  return requiredColumns.every(col => headerSet.has(col));
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
    // 添加完整的编码支持配置
    const workbook = XLSX.read(data, { 
      type: 'array',
      codepage: 936, // GBK编码，用于处理中文
      cellStyles: true,
      cellText: true,
      cellDates: true,
      raw: false
    });
    const worksheet = workbook.Sheets[selectedSheet];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      raw: false,
      dateNF: 'yyyy-mm-dd hh:mm:ss',
      defval: ''
    });
    
    if (jsonData.length > 0 && jsonData[0].length > 0) {
      const firstRowSample = jsonData[0].slice(0, Math.min(5, jsonData[0].length)).join(', ');
      updateStatus(`📋 选择Sheet: ${selectedSheet}，行数:${jsonData.length}，表头: ${firstRowSample}...`);
    }
    
    // 检查第一列是否为时间列
    // 如果第一行第一列不是"时间"，但数据行第一列是时间格式，则第一行是表头
    if (jsonData.length >= 2 && jsonData[0][0] !== '时间') {
      const firstCellOfData = String(jsonData[1][0]).trim();
      const parsedTime = parseTime(firstCellOfData);
      if (!isNaN(parsedTime)) {
        // 第一行是表头，将第一列标题改为"时间"
        jsonData[0][0] = '时间';
      }
    }
    
    processDataFile(jsonData, 'xlsx');
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
    // 检查是否需要手动选择编码（使用控制文件独立的手动编码复选框）
    const isManualEncoding = elements.manualControlEncoding && elements.manualControlEncoding.checked;
    
    if (isManualEncoding) {
      // 显示编码选择器，让用户手动选择编码
      elements.controlEncodingSelector.classList.remove('d-none');
      updateControlEncodingPreview();
    } else {
      // 自动检测编码并处理
      autoDetectAndProcessControlFile(file);
    }
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
      
      // 自动检测成功后，只在用户勾选了手动选择编码时更新预览
      const isManualEncoding = elements.manualControlEncoding && elements.manualControlEncoding.checked;
      if (isManualEncoding) {
        updateControlEncodingPreview();
      }
    } catch (error) {
      // 解码失败时显示编码选择器，让用户手动选择
      elements.controlEncodingSelector.classList.remove('d-none');
      updateControlEncodingPreview();
      updateStatus('⚠️ 控制文件编码自动检测失败，请手动选择编码');
    }
  };
  reader.readAsArrayBuffer(file);
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
    // 添加完整的编码支持配置
    const workbook = XLSX.read(data, { 
      type: 'array',
      codepage: 936, // GBK编码，用于处理中文
      cellStyles: true,
      cellText: true,
      cellDates: true,
      raw: false
    });
    const firstSheet = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheet];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      raw: false,
      dateNF: 'yyyy-mm-dd hh:mm:ss',
      defval: ''
    });
    
    processControlFile(jsonData, 'xlsx');
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
        
        // 只显示编码检测结果，不自动确认
        // 文件已经在 autoDetectAndProcessDataFile 中处理过了
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
      
      // 只有当用户没有勾选"手动选择编码"时，才隐藏编码选择器
      const isManualEncoding = elements.manualEncoding && elements.manualEncoding.checked;
      if (!isManualEncoding) {
        elements.encodingSelector.classList.add('d-none');
      }
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
        
        // 只显示编码检测结果，不自动确认
        // 文件已经在 autoDetectAndProcessControlFile 中处理过了
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
      
      // 只有当用户没有勾选"手动选择编码"时，才隐藏编码选择器
      const isManualEncoding = elements.manualControlEncoding && elements.manualControlEncoding.checked;
      if (!isManualEncoding) {
        elements.controlEncodingSelector.classList.add('d-none');
      }
    } catch (error) {
      elements.controlEncodingResult.textContent = '编码解析失败，请尝试其他编码';
      elements.controlEncodingResult.classList.remove('d-none');
    }
  };
  
  reader.readAsArrayBuffer(file);
}

/**
 * 处理数据文件
 * @param {Array<Array<string>>} data - 解析后的数据（已由parseCSVContent标准化）
 * @param {string} encoding - 检测到的编码
 * @example
 * processDataFile(parsedData, 'gb2312');
 */
function processDataFile(data, encoding) {
  if (data.length === 0) return;
  
  // 保存原始数据（未处理的格式）
  const savedRawHeaders = data.length > 0 ? [...data[0]] : [];
  const savedRawData = data.slice(1).map(row => [...row]);
  
  let newHeaders;
  let newOriginalData;
  
  // 判断是否为Excel文件
  const isExcel = encoding === 'xlsx';
  
  // 检查是否已经有标题行
  // 判断依据：第一行第一列是否为'时间'，或者第二行第一列是否为时间格式，或者是Excel文件
  const hasHeader = data[0] && data[0][0] === '时间';
  
  if (hasHeader) {
    // parseCSVContent已经处理好标题行
    newHeaders = data[0];
    newOriginalData = data.slice(1).filter(row => row.length > 0);
  } else if (isExcel) {
    // Excel文件强制认为第一行是标题行
    newHeaders = data[0].map((cell, index) => {
      const cellStr = String(cell).trim();
      if (index === 0) {
        return cellStr || '时间';
      }
      return cellStr || `列${index}`;
    });
    newOriginalData = data.slice(1).filter(row => row.length > 0);
  } else {
    // 检查第一行第一列是否为时间格式（用于判断是否有标题行）
    const firstRowFirstCell = data[0] ? String(data[0][0]).trim() : '';
    const isFirstRowTime = !isNaN(parseTime(firstRowFirstCell));
    
    // 检查第二行第一列是否为时间格式
    const hasDataHeader = data.length >= 2 && data[1] && data[1][0];
    const firstDataCell = hasDataHeader ? String(data[1][0]).trim() : '';
    const isTimeFormat = !isNaN(parseTime(firstDataCell));
    
    if (isTimeFormat && !isFirstRowTime) {
      // 第一行是表头，第二行开始是数据
      newHeaders = data[0].map((cell, index) => {
        const cellStr = String(cell).trim();
        if (index === 0) {
          return cellStr || '时间';
        }
        return cellStr || `列${index}`;
      });
      newOriginalData = data.slice(1).filter(row => row.length > 0);
    } else {
      // 无标题行（第一行也是数据），需要创建默认标题
      newHeaders = [];
      const firstRowLength = data[0] ? data[0].length : 0;
      for (let i = 0; i < firstRowLength; i++) {
        if (i === 0) {
          newHeaders.push('时间');
        } else {
          newHeaders.push(`列${i}`);
        }
      }
      // 所有行都是数据行
      newOriginalData = data.filter(row => row.length > 0);
    }
  }
  
  // 过滤空列（包含空数据的列）
  let dataAfterEmptyFilter;
  const nonEmptyColumns = filterEmptyColumns(newOriginalData, newHeaders);
  const filteredHeaders = nonEmptyColumns.headers;
  dataAfterEmptyFilter = nonEmptyColumns.data;
  
  // 过滤全0列
  let newFilteredData;
  let finalHeaders = filteredHeaders;
  if (elements.filterZeroColumns.checked) {
    const result = filterZeroColumns(dataAfterEmptyFilter, filteredHeaders);
    newFilteredData = result.data;
    finalHeaders = result.headers;
  } else {
    newFilteredData = [...dataAfterEmptyFilter];
  }
  
  // 更新全局变量
  console.log('[DEBUG] processDataFile - finalHeaders:', finalHeaders);
  console.log('[DEBUG] processDataFile - newOriginalData行数:', newOriginalData.length);
  console.log('[DEBUG] processDataFile - newFilteredData行数:', newFilteredData.length);
  console.log('[DEBUG] processDataFile - hasHeader:', hasHeader, 'isExcel:', isExcel);
  updateVariables({
    rawData: savedRawData,
    rawHeaders: savedRawHeaders,
    originalData: newOriginalData,
    filteredData: newFilteredData,
    headers: finalHeaders,
    currentFileEncoding: encoding
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
  updateStatus(`✅ 数据文件加载成功！编码：${encodingName}，总行数：${data.length}，数据行数：${newOriginalData.length}`);
  
  // 自动设置时间范围（仅在初始加载时调用）
  autoTimeRange();
  
  // 自动检测成功后，不显示编码选择器
  // 但为了让用户知道检测结果，我们更新预览但不显示选择器
  updateEncodingPreview();
}

/**
 * 过滤空列（所有数据都为空的列）
 * @param {Array<Array<string>>} data - 数据二维数组
 * @param {Array<string>} headerList - 表头数组
 * @returns {Object} 包含过滤后的headers和data
 * @example
 * const result = filterEmptyColumns(data, headers);
 */
function filterEmptyColumns(data, headerList) {
  if (data.length === 0 || headerList.length === 0) {
    return { headers: headerList, data: data };
  }
  
  const nonEmptyColumns = [];
  for (let i = 0; i < headerList.length; i++) {
    let hasData = false;
    for (let j = 0; j < data.length; j++) {
      const cell = data[j][i];
      if (cell !== undefined && cell !== null && cell.trim() !== '') {
        hasData = true;
        break;
      }
    }
    if (hasData) {
      nonEmptyColumns.push(i);
    }
  }
  
  // 如果所有列都有数据，直接返回原数据
  if (nonEmptyColumns.length === headerList.length) {
    return { headers: headerList, data: data };
  }
  
  // 更新 headers 和数据
  const newHeaders = nonEmptyColumns.map(i => headerList[i]);
  const newData = data.map(row => nonEmptyColumns.map(i => row[i]));
  
  return { headers: newHeaders, data: newData };
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
  if (data.length === 0) return { headers: headerList, data: data };
  
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
  
  return { headers: newHeaders, data: newData };
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
  
  // 只在用户勾选了手动选择编码时才显示编码选择器
  const isManualEncoding = elements.manualControlEncoding && elements.manualControlEncoding.checked;
  if (isManualEncoding) {
    elements.controlEncodingSelector.classList.remove('d-none');
    updateControlEncodingPreview();
  }
}

/**
 * 更新时间选择器
 * @example
 * updateTimeSelector();
 */
function updateTimeSelector() {
  elements.timeSelectorSelect.innerHTML = '';
  if (controlData && controlData.length > 0) {
    controlData.forEach((time, index) => {
      // 只添加时间值，不添加标题行的"时间"字样
      if (time && time.trim() !== '时间' && time.trim() !== 'Time') {
        const option = document.createElement('option');
        option.value = time;
        option.textContent = time;
        elements.timeSelectorSelect.appendChild(option);
      }
    });
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
  elements.equalAxisBtn.classList.remove('d-none');
  
  // 初始化X轴滑块
  initXAxisSlider();
}

/**
 * 更新坐标轴选择器
 * @example
 * updateAxisSelectors();
 */
function updateAxisSelectors() {
  // 保存用户的选择和滚动位置
  const selectedXAxis = elements.xAxisSelect.value;
  const selectedYAxis = Array.from(elements.yAxisSelect.selectedOptions).map(option => option.value);
  const selectedYAxis2 = Array.from(elements.yAxis2Select.selectedOptions).map(option => option.value);
  const yAxisScrollTop = elements.yAxisSelect.scrollTop;
  const yAxis2ScrollTop = elements.yAxis2Select.scrollTop;
  
  elements.xAxisSelect.innerHTML = '';
  elements.yAxisSelect.innerHTML = '';
  elements.yAxis2Select.innerHTML = '';
  
  if (headers && headers.length > 0) {
    headers.forEach((header, index) => {
      const xOption = document.createElement('option');
      xOption.value = index;
      xOption.textContent = header;
      if (index.toString() === selectedXAxis) {
        xOption.selected = true;
      }
      elements.xAxisSelect.appendChild(xOption);
      
      // 只有当X轴未选择时间列时，才将时间列添加到Y轴选项
      // 假设第一列是时间列
      if (index !== 0) {
        const yOption = document.createElement('option');
        yOption.value = index;
        yOption.textContent = header;
        if (selectedYAxis.includes(index.toString())) {
          yOption.selected = true;
        }
        elements.yAxisSelect.appendChild(yOption);
        
        const y2Option = document.createElement('option');
        y2Option.value = index;
        y2Option.textContent = header;
        if (selectedYAxis2.includes(index.toString())) {
          y2Option.selected = true;
        }
        elements.yAxis2Select.appendChild(y2Option);
      }
    });
    
    elements.xAxisSelect.disabled = false;
    elements.yAxisSelect.disabled = false;
    elements.yAxis2Select.disabled = false;
    
    // 恢复滚动位置
    setTimeout(() => {
      elements.yAxisSelect.scrollTop = yAxisScrollTop;
      elements.yAxis2Select.scrollTop = yAxis2ScrollTop;
    }, 0);
  }
}

/**
 * 更新表格
 * @example
 * updateTable();
 */
function updateTable() {
  // 根据显示模式选择数据
  const displayHeaders = tableDisplayMode === 'raw' ? rawHeaders : headers;
  let displayData;
  
  if (tableDisplayMode === 'raw') {
    // 原始数据模式：应用时间筛选，但不应用其他过滤（空列、全0列）
    displayData = rawData;
    
    // 应用时间筛选
    if (elements.timeRangeStart.value && elements.timeRangeEnd.value) {
      const startTimestamp = parseTime(elements.timeRangeStart.value);
      const endTimestamp = parseTime(elements.timeRangeEnd.value);
      
      if (!isNaN(startTimestamp) && !isNaN(endTimestamp)) {
        displayData = displayData.filter(row => {
          const rowTime = parseTime(row[0]);
          return !isNaN(rowTime) && rowTime >= startTimestamp && rowTime <= endTimestamp;
        });
      }
    }
  } else {
    // 处理后数据模式：应用所有过滤条件
    displayData = filteredData;
  }
  
  if (displayData.length === 0) {
    elements.tableHeader.innerHTML = '<tr><th colspan="100%" class="text-center text-muted">📄 暂无表格数据</th></tr>';
    elements.tableBody.innerHTML = '';
    return;
  }
  
  // 更新表头
  let headerHTML = '<tr>';
  displayHeaders.forEach((header, index) => {
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
  const totalPages = Math.ceil(displayData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, displayData.length);
  const pageData = displayData.slice(startIndex, endIndex);
  
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
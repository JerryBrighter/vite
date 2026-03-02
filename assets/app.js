/**
 * 应用程序入口文件 - 初始化和协调应用程序功能
 * 
 * 该文件负责初始化事件监听器、处理用户交互、
 * 协调各个模块之间的通信。
 */

import { elements, selectedControlTime, originalData, currentPage, updateVariables } from './config.js';
import { parseTime, formatDateTime, updateStatus } from './utils.js';
import { 
  handleDataFileUpload, 
  handleControlFileUpload, 
  confirmSheetSelection, 
  updateEncodingPreview, 
  confirmDataEncoding, 
  updateControlEncodingPreview, 
  confirmControlEncoding,
  updateUIAfterDataLoad
} from './fileHandler.js';
import { 
  drawChart, 
  applyTimeRange, 
  resetTimeRange, 
  autoTimeRange, 
  exportChart, 
  resetData, 
  clearAll, 
  toggleTable, 
  changePage, 
  jumpToPage
} from './chartHandler.js';

/**
 * 处理时间选择变化
 * @example
 * // 当用户更改时间选择器时调用
 * elements.timeSelectorSelect.addEventListener('change', handleTimeSelectChange);
 */
function handleTimeSelectChange() {
  const selectedTime = elements.timeSelectorSelect.value;
  updateVariables({
    selectedControlTime: selectedTime
  });
  
  // 更新时间范围选择器
  const parsedTime = parseTime(selectedTime);
  if (!isNaN(parsedTime)) {
    const endTime = parsedTime + 15 * 60 * 1000; // 15分钟
    elements.timeRangeStart.value = formatDateTime(parsedTime);
    elements.timeRangeEnd.value = formatDateTime(endTime);
    
    // 自动应用时间范围到拖动条
    applyTimeRange();
  }
}

/**
 * 根据控制文件时间过滤数据
 * @example
 * // 当用户点击根据控制文件过滤按钮时调用
 * elements.filterByControlBtn.addEventListener('click', filterDataByControlTime);
 */
function filterDataByControlTime() {
  if (!selectedControlTime || originalData.length === 0) return;
  
  const selectedTime = parseTime(selectedControlTime);
  if (isNaN(selectedTime)) return;
  
  const endTime = selectedTime + 15 * 60 * 1000; // 15分钟
  
  const newFilteredData = originalData.filter(row => {
    const rowTime = parseTime(row[0]);
    return !isNaN(rowTime) && rowTime >= selectedTime && rowTime <= endTime;
  });
  
  // 更新全局变量
  updateVariables({
    filteredData: newFilteredData
  });
  
  // 更新时间范围选择器
  if (newFilteredData.length > 0) {
    const firstTime = parseTime(newFilteredData[0][0]);
    const lastTime = parseTime(newFilteredData[newFilteredData.length - 1][0]);
    
    if (!isNaN(firstTime) && !isNaN(lastTime)) {
      elements.timeRangeStart.value = formatDateTime(firstTime);
      elements.timeRangeEnd.value = formatDateTime(lastTime);
    }
  }
  
  updateUIAfterDataLoad();
  updateStatus(`✅ 已根据控制文件时间筛选数据，共 ${newFilteredData.length} 条记录`);
}

/**
 * 处理每页显示行数变化
 * @example
 * // 当用户更改每页显示行数时调用
 * elements.pageSizeSelect.addEventListener('change', handlePageSizeChange);
 */
function handlePageSizeChange() {
  const newPageSize = parseInt(elements.pageSizeSelect.value);
  if (!isNaN(newPageSize)) {
    updateVariables({
      itemsPerPage: newPageSize,
      currentPage: 1 // 重置为第一页
    });
    updateUIAfterDataLoad();
  }
}

/**
 * 清除左侧Y轴选择
 * @example
 * // 当用户点击清除左侧Y轴按钮时调用
 * elements.clearYAxisBtn.addEventListener('click', clearYAxisSelection);
 */
function clearYAxisSelection() {
  // 清除所有选中项
  Array.from(elements.yAxisSelect.options).forEach(option => {
    option.selected = false;
  });
  // 更新全局变量
  updateVariables({
    yAxisIndices: []
  });
  updateStatus('✅ 已清除左侧Y轴选择');
}

/**
 * 清除右侧Y轴选择
 * @example
 * // 当用户点击清除右侧Y轴按钮时调用
 * elements.clearYAxis2Btn.addEventListener('click', clearYAxis2Selection);
 */
function clearYAxis2Selection() {
  // 清除所有选中项
  Array.from(elements.yAxis2Select.options).forEach(option => {
    option.selected = false;
  });
  // 更新全局变量
  updateVariables({
    yAxis2Indices: []
  });
  updateStatus('✅ 已清除右侧Y轴选择');
}

/**
 * 处理自动设置时间范围
 * @example
 * // 当用户点击自动设置时间范围按钮时调用
 * elements.autoTimeRangeBtn.addEventListener('click', handleAutoTimeRange);
 */
function handleAutoTimeRange() {
  autoTimeRange();
  applyTimeRange();
  updateStatus('✅ 已自动设置时间范围');
}

/**
 * 初始化事件监听器
 * @example
 * initEventListeners();
 */
function initEventListeners() {
  // 数据文件上传
  elements.dataFileInput.addEventListener('change', handleDataFileUpload);
  
  // 控制文件上传
  elements.controlFileInput.addEventListener('change', handleControlFileUpload);
  
  // 编码选择
  elements.dataFileEncoding.addEventListener('change', function() {
    updateEncodingPreview();
    confirmDataEncoding();
  });
  elements.confirmEncodingBtn.addEventListener('click', confirmDataEncoding);
  
  elements.controlFileEncoding.addEventListener('change', function() {
    updateControlEncodingPreview();
    confirmControlEncoding();
  });
  elements.confirmControlEncodingBtn.addEventListener('click', confirmControlEncoding);
  
  // 时间选择
  elements.timeSelectorSelect.addEventListener('change', handleTimeSelectChange);
  elements.filterByControlBtn.addEventListener('click', filterDataByControlTime);
  
  // 坐标轴选择
  elements.drawChartBtn.addEventListener('click', drawChart);
  elements.clearYAxisBtn.addEventListener('click', clearYAxisSelection);
  elements.clearYAxis2Btn.addEventListener('click', clearYAxis2Selection);
  
  // 时间范围选择
  elements.applyTimeRangeBtn.addEventListener('click', applyTimeRange);
  elements.resetTimeRangeBtn.addEventListener('click', resetTimeRange);
  elements.autoTimeRangeBtn.addEventListener('click', handleAutoTimeRange);
  
  // 操作按钮
  elements.exportChartBtn.addEventListener('click', exportChart);
  elements.resetDataBtn.addEventListener('click', resetData);
  elements.clearAllBtn.addEventListener('click', clearAll);
  
  // 表格控制
  elements.toggleTableBtn.addEventListener('click', toggleTable);
  elements.prevPageBtn.addEventListener('click', () => changePage(currentPage - 1));
  elements.nextPageBtn.addEventListener('click', () => changePage(currentPage + 1));
  elements.jumpBtn.addEventListener('click', jumpToPage);
  elements.pageSizeSelect.addEventListener('change', handlePageSizeChange);
  
  // Excel工作表选择
  elements.confirmSheetBtn.addEventListener('click', confirmSheetSelection);
}

/**
 * 初始化应用
 * @example
 * initApp();
 */
function initApp() {
  initEventListeners();
  updateStatus('📋 请先上传DemDec数据文件（左侧），可选上传DemControl时间筛选文件（右侧）');
}

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);
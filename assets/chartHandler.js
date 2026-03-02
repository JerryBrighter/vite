/**
 * 图表处理模块 - 处理图表绘制和相关操作
 * 
 * 该模块负责处理图表的绘制、时间范围调整、图表导出、
 * 表格显示切换等功能。
 */

import { elements, originalData, filteredData, headers, xAxisIndex, yAxisIndices, yAxis2Indices, currentChart, updateVariables } from './config.js';
import { parseTime, formatDateTime, updateStatus } from './utils.js';
import { updateUIAfterDataLoad, updateTable } from './fileHandler.js';

/**
 * 绘制图表
 * @example
 * // 当用户点击绘制图表按钮时调用
 * elements.drawChartBtn.addEventListener('click', drawChart);
 */
function drawChart() {
  const xIndex = parseInt(elements.xAxisSelect.value);
  const yIndices = Array.from(elements.yAxisSelect.selectedOptions).map(option => parseInt(option.value));
  const y2Indices = Array.from(elements.yAxis2Select.selectedOptions).map(option => parseInt(option.value));
  
  if (yIndices.length === 0 && y2Indices.length === 0) {
    updateStatus('⚠️ 请至少选择一个Y轴数据列');
    return;
  }
  
  const ctx = elements.lineChart.getContext('2d');
  
  // 销毁现有图表
  if (currentChart) {
    currentChart.destroy();
  }
  
  // 准备数据
  const labels = filteredData.map(row => row[xIndex]);
  const datasets = [];
  
  // 颜色配置
  const colors = [
    { border: '#0d6efd', background: 'rgba(13, 110, 253, 0.1)' },
    { border: '#dc3545', background: 'rgba(220, 53, 69, 0.1)' },
    { border: '#198754', background: 'rgba(25, 135, 84, 0.1)' },
    { border: '#ffc107', background: 'rgba(255, 193, 7, 0.1)' },
    { border: '#fd7e14', background: 'rgba(253, 126, 20, 0.1)' },
    { border: '#6f42c1', background: 'rgba(111, 66, 193, 0.1)' },
    { border: '#20c997', background: 'rgba(32, 201, 151, 0.1)' },
    { border: '#0dcaf0', background: 'rgba(13, 202, 240, 0.1)' }
  ];
  
  // 左侧Y轴数据
  let colorIndex = 0;
  yIndices.forEach((index, i) => {
    const { data, textMapping, reverseTextMapping, rowTextValues } = processDatasetData(filteredData, index);
    const color = colors[colorIndex % colors.length];
    datasets.push({
      label: headers[index]?.trim() || `Y轴${i + 1}`,
      data: data,
      textMapping: textMapping,
      reverseTextMapping: reverseTextMapping,
      rowTextValues: rowTextValues,
      borderColor: color.border,
      backgroundColor: color.background,
      borderWidth: 2,
      tension: 0.2,
      fill: false,
      pointRadius: 2,
      pointHoverRadius: 4,
      pointBackgroundColor: color.border,
      pointBorderWidth: 1,
      yAxisID: 'y'
    });
    colorIndex++;
  });
  
  // 右侧Y轴数据
  y2Indices.forEach((index, i) => {
    const { data, textMapping, reverseTextMapping, rowTextValues } = processDatasetData(filteredData, index);
    const color = colors[colorIndex % colors.length];
    datasets.push({
      label: headers[index]?.trim() || `Y轴${yIndices.length + i + 1}`,
      data: data,
      textMapping: textMapping,
      reverseTextMapping: reverseTextMapping,
      rowTextValues: rowTextValues,
      borderColor: color.border,
      backgroundColor: color.background,
      borderWidth: 2,
      tension: 0.2,
      fill: false,
      pointRadius: 2,
      pointHoverRadius: 4,
      pointBackgroundColor: color.border,
      pointBorderWidth: 1,
      yAxisID: 'y1'
    });
    colorIndex++;
  });
  
  // 创建图表
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      backgroundColor: 'white',
      animation: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        x: {
          title: {
            display: true,
            text: headers[xIndex]?.trim() || 'X轴',
            font: {
              size: 14,
              weight: 'bold',
              family: "'Microsoft YaHei', sans-serif"
            }
          },
          ticks: {
            autoSkip: true,
            maxRotation: 45,
            minRotation: 45,
            maxTicksLimit: 21,
            font: {
              family: "'Microsoft YaHei', sans-serif"
            },
            callback: function(value, index, values) {
              const step = Math.ceil(values.length / 21); // 增加总标签数量
              // 显示第一个标签、最后一个标签以及步长对应的标签
              return index === 0 || index === values.length - 1 || index % step === 0 ? this.getLabelForValue(value) : '';
            },
            align: 'end'
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.1)',
            drawTicks: true,
            tickLength: 5
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: '左侧Y轴',
            font: {
              size: 14,
              weight: 'bold',
              family: "'Microsoft YaHei', sans-serif"
            }
          },
          beginAtZero: false,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            font: {
              family: "'Microsoft YaHei', sans-serif"
            }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: '右侧Y轴',
            font: {
              size: 14,
              weight: 'bold',
              family: "'Microsoft YaHei', sans-serif"
            }
          },
          beginAtZero: false,
          grid: {
            drawOnChartArea: false
          },
          ticks: {
            font: {
              family: "'Microsoft YaHei', sans-serif"
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false // 不显示默认图例，使用自定义图例
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: {
            family: "'Microsoft YaHei', sans-serif"
          },
          bodyFont: {
            family: "'Microsoft YaHei', sans-serif"
          },
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                const dataset = context.dataset;
                if (dataset.reverseTextMapping && dataset.reverseTextMapping.has(context.parsed.y)) {
                  label += dataset.reverseTextMapping.get(context.parsed.y);
                } else {
                  label += context.parsed.y;
                }
              }
              return label;
            }
          }
        }
      }
    }
  });
  
  // 更新全局变量
  updateVariables({
    xAxisIndex: xIndex,
    yAxisIndices: yIndices,
    yAxis2Indices: y2Indices,
    currentChart: chart
  });
  
  // 显示图表
  elements.chartContainer.innerHTML = '';
  elements.chartContainer.appendChild(elements.lineChart);
  elements.lineChart.style.display = 'block';
  elements.lineChart.style.height = '400px';
  elements.chartContainer.style.height = '450px';
  elements.chartContainer.style.overflow = 'hidden';
  
  // 添加自定义图例
  addChartLegend(datasets);
  
  updateStatus('✅ 图表绘制成功！');
}

/**
 * 应用时间范围
 * @example
 * // 当用户点击应用时间范围按钮时调用
 * elements.applyTimeRangeBtn.addEventListener('click', applyTimeRange);
 */
function applyTimeRange() {
  const startTime = elements.timeRangeStart.value;
  const endTime = elements.timeRangeEnd.value;
  
  if (!startTime || !endTime) {
    updateStatus('⚠️ 请选择完整的时间范围');
    return;
  }
  
  const startTimestamp = new Date(startTime).getTime();
  const endTimestamp = new Date(endTime).getTime();
  
  const newFilteredData = originalData.filter(row => {
    const rowTime = parseTime(row[0]);
    return !isNaN(rowTime) && rowTime >= startTimestamp && rowTime <= endTimestamp;
  });
  
  // 更新全局变量
  updateVariables({
    filteredData: newFilteredData
  });
  
  // 更新表格和图表
  if (currentChart) {
    drawChart();
  }
  updateTable();
  
  // 更新拖动条位置，确保滑块范围与X轴范围一致
  initXAxisSlider();
  
  updateStatus(`✅ 已应用时间范围筛选，共 ${newFilteredData.length} 条记录`);
}

/**
 * 重置时间范围
 * @example
 * // 当用户点击重置时间范围按钮时调用
 * elements.resetTimeRangeBtn.addEventListener('click', resetTimeRange);
 */
function resetTimeRange() {
  // 更新全局变量
  updateVariables({
    filteredData: [...originalData]
  });
  
  autoTimeRange();
  updateUIAfterDataLoad();
  if (currentChart) {
    drawChart();
  }
  // 重置时需要更新拖动条位置，回到初始状态
  initXAxisSlider();
  updateStatus('✅ 时间范围已重置为全部数据');
}

/**
 * 自动设置时间范围
 * @example
 * autoTimeRange();
 */
function autoTimeRange() {
  if (originalData.length > 0) {
    const firstTime = parseTime(originalData[0][0]);
    const lastTime = parseTime(originalData[originalData.length - 1][0]);
    
    if (!isNaN(firstTime) && !isNaN(lastTime)) {
      elements.timeRangeStart.value = formatDateTime(firstTime);
      elements.timeRangeEnd.value = formatDateTime(lastTime);
    }
  }
}

/**
 * 导出图表
 * @example
 * // 当用户点击导出图表按钮时调用
 * elements.exportChartBtn.addEventListener('click', exportChart);
 */
function exportChart() {
  if (!currentChart) {
    updateStatus('⚠️ 请先绘制图表');
    return;
  }
  
  try {
    const canvas = document.createElement('canvas');
    canvas.width = elements.lineChart.width * 3.125;
    canvas.height = elements.lineChart.height * 3.125;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(3.125, 3.125);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, elements.lineChart.width, elements.lineChart.height);
    ctx.drawImage(elements.lineChart, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 1);
    const link = document.createElement('a');
    link.href = dataUrl;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `DemDec可视化图表_${timestamp}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    updateStatus('✅ 图表已成功导出为300dpi白色背景的JPG图片');
  } catch (error) {
    updateStatus(`❌ 图表导出失败：${error.message}`);
    console.error('导出错误详情：', error);
  }
}

/**
 * 重置数据
 * @example
 * // 当用户点击重置数据按钮时调用
 * elements.resetDataBtn.addEventListener('click', resetData);
 */
function resetData() {
  // 更新全局变量
  updateVariables({
    filteredData: [...originalData]
  });
  
  autoTimeRange();
  updateUIAfterDataLoad();
  if (currentChart) {
    drawChart();
  }
  updateStatus('✅ 数据已重置为原始数据');
}

/**
 * 清空所有
 * @example
 * // 当用户点击清空所有按钮时调用
 * elements.clearAllBtn.addEventListener('click', clearAll);
 */
function clearAll() {
  // 重置所有变量
  updateVariables({
    originalData: [],
    filteredData: [],
    controlData: [],
    headers: [],
    xAxisIndex: 0,
    yAxisIndices: [],
    yAxis2Indices: [],
    currentChart: null,
    currentPage: 1,
    selectedControlTime: null
  });
  
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
  elements.clearYAxisBtn.disabled = true;
  elements.clearYAxis2Btn.disabled = true;
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

/**
 * 切换表格显示
 * @example
 * // 当用户点击切换表格按钮时调用
 * elements.toggleTableBtn.addEventListener('click', toggleTable);
 */
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

/**
 * 更改页码
 * @param {number} page - 目标页码
 * @example
 * // 当用户点击上一页或下一页按钮时调用
 * elements.prevPageBtn.addEventListener('click', () => changePage(currentPage - 1));
 * elements.nextPageBtn.addEventListener('click', () => changePage(currentPage + 1));
 */
function changePage(page) {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  if (page >= 1 && page <= totalPages) {
    updateVariables({
      currentPage: page
    });
    updateTable();
  }
}

/**
 * 跳转到指定页码
 * @example
 * // 当用户点击跳转按钮时调用
 * elements.jumpBtn.addEventListener('click', jumpToPage);
 */
function jumpToPage() {
  const page = parseInt(elements.pageInput.value);
  if (!isNaN(page)) {
    changePage(page);
  }
}

/**
 * 处理数据集数据，包括文本值映射
 * @param {Array<Array<string>>} data - 数据二维数组
 * @param {number} columnIndex - 列索引
 * @returns {Object} 处理后的数据和映射
 * @example
 * const { data, textMapping, reverseTextMapping, rowTextValues } = processDatasetData(data, 1);
 */
function processDatasetData(data, columnIndex) {
  const processedData = [];
  const textMapping = new Map();
  const reverseTextMapping = new Map();
  const rowTextValues = [];
  let nextValue = 1;
  
  data.forEach(row => {
    const cellValue = row[columnIndex]?.trim() || '';
    if (cellValue) {
      if (!isNaN(Number(cellValue)) && cellValue !== '') {
        const numValue = Number(cellValue);
        if (numValue !== 0) {
          processedData.push(numValue);
          rowTextValues.push(cellValue);
        } else {
          processedData.push(null);
          rowTextValues.push(null);
        }
      } else {
        // 处理文本值
        let mappedValue;
        if (cellValue === '失锁' || cellValue === 'U') {
          mappedValue = 0;
          textMapping.set(cellValue, mappedValue);
          reverseTextMapping.set(mappedValue, cellValue === 'U' ? 'U (失锁)' : '失锁');
        } else if (cellValue === '锁定' || cellValue === 'L') {
          mappedValue = 1;
          textMapping.set(cellValue, mappedValue);
          reverseTextMapping.set(mappedValue, cellValue === 'L' ? 'L (锁定)' : '锁定');
        } else if (cellValue === '不工作') {
          mappedValue = -1;
          textMapping.set(cellValue, mappedValue);
          reverseTextMapping.set(mappedValue, '不工作');
        } else {
          if (!textMapping.has(cellValue)) {
            textMapping.set(cellValue, nextValue);
            reverseTextMapping.set(nextValue, cellValue);
            nextValue++;
          }
          mappedValue = textMapping.get(cellValue);
        }
        processedData.push(mappedValue);
        rowTextValues.push(cellValue);
      }
    } else {
      processedData.push(null);
      rowTextValues.push(null);
    }
  });
  
  return {
    data: processedData,
    textMapping: textMapping,
    reverseTextMapping: reverseTextMapping,
    rowTextValues: rowTextValues
  };
}

/**
 * 添加图表图例
 * @param {Array<Object>} datasets - 图表数据集
 * @example
 * addChartLegend(datasets);
 */
function addChartLegend(datasets) {
  // 清除旧的图例
  const oldLegends = document.querySelectorAll('.legend-container');
  oldLegends.forEach(legend => legend.remove());
  
  const legendContainer = document.createElement('div');
  legendContainer.className = 'legend-container';
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
  
  const leftDatasets = datasets.filter(d => d.yAxisID === 'y');
  const rightDatasets = datasets.filter(d => d.yAxisID === 'y1');
  
  if (leftDatasets.length > 0) {
    const leftSection = document.createElement('div');
    leftSection.className = 'legend-section';
    leftSection.style.cssText = `
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
    leftSection.appendChild(leftTitle);
    
    leftDatasets.forEach(dataset => {
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
      
      const labelText = document.createElement('span');
      labelText.textContent = dataset.label;
      labelText.style.opacity = dataset.hidden ? '0.5' : '1';
      labelText.style.textDecoration = dataset.hidden ? 'line-through' : 'none';
      
      legendItem.addEventListener('click', function() {
        dataset.hidden = !dataset.hidden;
        currentChart.update();
        if (dataset.hidden) {
          labelText.style.opacity = '0.5';
          labelText.style.textDecoration = 'line-through';
          colorBox.style.opacity = '0.5';
        } else {
          labelText.style.opacity = '1';
          labelText.style.textDecoration = 'none';
          colorBox.style.opacity = '1';
        }
      });
      
      legendItem.appendChild(colorBox);
      legendItem.appendChild(labelText);
      leftSection.appendChild(legendItem);
    });
    
    legendContainer.appendChild(leftSection);
  }
  
  if (rightDatasets.length > 0) {
    const rightSection = document.createElement('div');
    rightSection.className = 'legend-section';
    rightSection.style.cssText = `
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
    rightSection.appendChild(rightTitle);
    
    rightDatasets.forEach(dataset => {
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
      
      const labelText = document.createElement('span');
      labelText.textContent = dataset.label;
      labelText.style.opacity = dataset.hidden ? '0.5' : '1';
      labelText.style.textDecoration = dataset.hidden ? 'line-through' : 'none';
      
      legendItem.addEventListener('click', function() {
        dataset.hidden = !dataset.hidden;
        currentChart.update();
        if (dataset.hidden) {
          labelText.style.opacity = '0.5';
          labelText.style.textDecoration = 'line-through';
          colorBox.style.opacity = '0.5';
        } else {
          labelText.style.opacity = '1';
          labelText.style.textDecoration = 'none';
          colorBox.style.opacity = '1';
        }
      });
      
      legendItem.appendChild(colorBox);
      legendItem.appendChild(labelText);
      rightSection.appendChild(legendItem);
    });
    
    legendContainer.appendChild(rightSection);
  }
  
  if (legendContainer.children.length > 0) {
    const chartContainer = document.getElementById('chartContainer');
    if (chartContainer && chartContainer.parentNode) {
      chartContainer.parentNode.insertBefore(legendContainer, chartContainer);
    }
  }
}

/**
 * 初始化X轴滑块
 * @example
 * initXAxisSlider();
 */
function initXAxisSlider() {
  if (!elements.sliderHandleMin || !elements.sliderHandleMax) return;
  
  // 滑块初始化时始终位于拖动条的两端
  // 拖动条的范围由时间输入框控制
  const startIndex = 0;
  const endIndex = originalData.length - 1;
  
  // 初始化滑块位置为拖动条的两端
  updateXAxisSliderPosition(startIndex, endIndex);
  
  // 更新滑块标签，确保显示正确的时间值
  updateXAxisSliderLabels(startIndex, endIndex);
  
  // 添加滑块拖动事件
  addSliderEvents();
  
  elements.xAxisSliderContainer.classList.remove('d-none');
}

/**
 * 更新X轴滑块位置
 * @param {number} startIndex - 开始索引
 * @param {number} endIndex - 结束索引
 * @example
 * updateXAxisSliderPosition(0, 100);
 */
function updateXAxisSliderPosition(startIndex, endIndex) {
  if (!elements.sliderHandleMin || !elements.sliderHandleMax || !elements.sliderSelectedArea) return;
  
  // 拖动条的范围始终是0-100%
  // 滑块初始化时应该位于拖动条的两端
  let startPercent = 0;
  let endPercent = 100;
  
  const totalLength = originalData.length;
  if (totalLength > 0) {
    // 计算基于原始数据范围的百分比
    startPercent = (startIndex / totalLength) * 100;
    endPercent = (endIndex / totalLength) * 100;
  }
  
  // 更新滑块位置
  elements.sliderHandleMin.style.left = `${startPercent}%`;
  elements.sliderHandleMax.style.left = `${endPercent}%`;
  elements.sliderSelectedArea.style.left = `${startPercent}%`;
  elements.sliderSelectedArea.style.width = `${endPercent - startPercent}%`;
  
  // 更新标签
  updateXAxisSliderLabels(startIndex, endIndex);
}

/**
 * 添加滑块事件
 * @example
 * addSliderEvents();
 */
function addSliderEvents() {
  const sliderWrapper = elements.sliderHandleMin.parentElement;
  let isDragging = false;
  let draggingHandle = null;
  
  // 计算滑块位置百分比
  function calculatePercent(e) {
    const rect = sliderWrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    return Math.max(0, Math.min(100, (x / rect.width) * 100));
  }
  
  // 鼠标按下事件
  function handleMouseDown(e) {
    if (e.target === elements.sliderHandleMin || e.target === elements.sliderHandleMax) {
      isDragging = true;
      draggingHandle = e.target;
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      e.preventDefault(); // 防止默认行为
    }
  }
  
  // 鼠标移动事件
  function handleMouseMove(e) {
    if (!isDragging || !draggingHandle) return;
    
    const percent = calculatePercent(e);
    const currentMin = parseFloat(elements.sliderHandleMin.style.left) || 0;
    const currentMax = parseFloat(elements.sliderHandleMax.style.left) || 100;
    
    // 设置滑块间的最小距离为X轴范围的30分之一
    const minDistance = (currentMax - currentMin) / 30;
    
    // 获取拖动条的范围（基于时间输入框设置的范围）
    const startTime = elements.timeRangeStart.value;
    const endTime = elements.timeRangeEnd.value;
    
    let rangeStartIndex = 0;
    let rangeEndIndex = originalData.length - 1;
    
    if (startTime && endTime) {
      const startTimestamp = new Date(startTime).getTime();
      const endTimestamp = new Date(endTime).getTime();
      
      // 在原始数据中找到拖动条的范围
      for (let i = 0; i < originalData.length; i++) {
        const rowTime = parseTime(originalData[i][0]);
        if (!isNaN(rowTime) && rowTime >= startTimestamp) {
          rangeStartIndex = i;
          break;
        }
      }
      
      for (let i = originalData.length - 1; i >= 0; i--) {
        const rowTime = parseTime(originalData[i][0]);
        if (!isNaN(rowTime) && rowTime <= endTimestamp) {
          rangeEndIndex = i;
          break;
        }
      }
    }
    
    const rangeLength = rangeEndIndex - rangeStartIndex + 1;
    if (rangeLength <= 0) return;
    
    if (draggingHandle === elements.sliderHandleMin) {
      if (percent < currentMax - minDistance) {
        elements.sliderHandleMin.style.left = `${percent}%`;
        elements.sliderSelectedArea.style.left = `${percent}%`;
        elements.sliderSelectedArea.style.width = `${currentMax - percent}%`;
        elements.sliderValueMin.style.left = `${percent}%`;
        
        // 计算滑块在拖动条范围内的实际索引
        const index = rangeStartIndex + Math.floor((percent / 100) * (rangeLength - 1));
        elements.sliderValueMin.textContent = originalData[index]?.[0] || '开始';
      }
    } else if (draggingHandle === elements.sliderHandleMax) {
      if (percent > currentMin + minDistance) {
        elements.sliderHandleMax.style.left = `${percent}%`;
        elements.sliderSelectedArea.style.width = `${percent - currentMin}%`;
        elements.sliderValueMax.style.left = `${percent}%`;
        
        // 计算滑块在拖动条范围内的实际索引
        const index = rangeStartIndex + Math.floor((percent / 100) * (rangeLength - 1));
        elements.sliderValueMax.textContent = originalData[index]?.[0] || '结束';
      }
    }
  }
  
  // 鼠标释放事件
  function handleMouseUp() {
    isDragging = false;
    draggingHandle = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // 应用滑块变化
    const startPercent = parseFloat(elements.sliderHandleMin.style.left) || 0;
    const endPercent = parseFloat(elements.sliderHandleMax.style.left) || 100;
    
    // 获取拖动条的范围（基于时间输入框设置的范围）
    const startTime = elements.timeRangeStart.value;
    const endTime = elements.timeRangeEnd.value;
    
    let rangeStartIndex = 0;
    let rangeEndIndex = originalData.length - 1;
    
    if (startTime && endTime) {
      const startTimestamp = new Date(startTime).getTime();
      const endTimestamp = new Date(endTime).getTime();
      
      // 在原始数据中找到拖动条的范围
      for (let i = 0; i < originalData.length; i++) {
        const rowTime = parseTime(originalData[i][0]);
        if (!isNaN(rowTime) && rowTime >= startTimestamp) {
          rangeStartIndex = i;
          break;
        }
      }
      
      for (let i = originalData.length - 1; i >= 0; i--) {
        const rowTime = parseTime(originalData[i][0]);
        if (!isNaN(rowTime) && rowTime <= endTimestamp) {
          rangeEndIndex = i;
          break;
        }
      }
    }
    
    const rangeLength = rangeEndIndex - rangeStartIndex + 1;
    if (rangeLength <= 0) return;
    
    // 计算滑块在拖动条范围内的实际索引
    const startIndex = rangeStartIndex + Math.floor((startPercent / 100) * (rangeLength - 1));
    const endIndex = rangeStartIndex + Math.floor((endPercent / 100) * (rangeLength - 1));
    
    if (startIndex >= rangeStartIndex && endIndex <= rangeEndIndex && startIndex <= endIndex) {
      // 基于原始数据过滤，不更新时间范围输入框
      const newFilteredData = originalData.slice(startIndex, endIndex + 1);
      
      // 更新全局变量
      updateVariables({
        filteredData: newFilteredData
      });
      
      // 更新表格和图表
      if (currentChart) {
        drawChart();
      }
      updateTable();
      
      updateStatus(`✅ 已调整X轴范围，显示从 ${startIndex + 1} 到 ${endIndex + 1} 条记录`);
    }
  }
  
  // 添加事件监听器
  elements.sliderHandleMin.addEventListener('mousedown', handleMouseDown);
  elements.sliderHandleMax.addEventListener('mousedown', handleMouseDown);
  
  // 添加触摸事件支持
  elements.sliderHandleMin.addEventListener('touchstart', function(e) {
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    handleMouseDown(mouseEvent);
  });
  
  elements.sliderHandleMax.addEventListener('touchstart', function(e) {
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    handleMouseDown(mouseEvent);
  });
  
  document.addEventListener('touchmove', function(e) {
    if (!isDragging) return;
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    handleMouseMove(mouseEvent);
  });
  
  document.addEventListener('touchend', handleMouseUp);
}

/**
 * 更新X轴滑块标签
 * @param {number} startIndex - 开始索引
 * @param {number} endIndex - 结束索引
 * @example
 * updateXAxisSliderLabels(0, 100);
 */
function updateXAxisSliderLabels(startIndex, endIndex) {
  if (!elements.sliderValueMin || !elements.sliderValueMax) return;
  
  // 从时间输入框获取时间值，确保与X轴时间范围输入框的数值一致
  const startTime = elements.timeRangeStart.value;
  const endTime = elements.timeRangeEnd.value;
  
  if (startTime && endTime) {
    // 显示时间输入框中的时间值
    elements.sliderValueMin.textContent = startTime;
    elements.sliderValueMax.textContent = endTime;
  } else {
    // 如果时间输入框没有值，从原始数据中获取
    elements.sliderValueMin.textContent = originalData[startIndex]?.[0] || '开始';
    elements.sliderValueMax.textContent = originalData[endIndex]?.[0] || '结束';
  }
  
  // 更新标签位置
  elements.sliderValueMin.style.left = elements.sliderHandleMin.style.left;
  elements.sliderValueMax.style.left = elements.sliderHandleMax.style.left;
  
  // 添加位置调整，确保标签不会超出容器
  elements.sliderValueMin.style.transform = 'translateX(-50%)';
  elements.sliderValueMax.style.transform = 'translateX(-50%)';
}

// 导出图表处理函数
export {
  drawChart,
  applyTimeRange,
  resetTimeRange,
  autoTimeRange,
  exportChart,
  resetData,
  clearAll,
  toggleTable,
  changePage,
  jumpToPage,
  initXAxisSlider
}
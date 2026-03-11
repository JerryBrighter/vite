/**
 * 配置文件 - 存储全局变量和DOM元素引用
 * 
 * 该文件包含应用程序的全局状态变量和DOM元素引用，
 * 提供变量更新函数以确保状态的一致性。
 */

// 全局数据变量
/**
 * 原始数据 - 从文件加载的完整数据
 * @type {Array<Array<string>>}
 */
let originalData = [];

/**
 * 过滤后的数据 - 应用时间范围或其他筛选条件后的数据
 * @type {Array<Array<string>>}
 */
let filteredData = [];

/**
 * 控制文件数据 - 从控制文件加载的时间筛选数据
 * @type {Array<string>}
 */
let controlData = [];

/**
 * 表头数据 - 从数据文件提取的列标题
 * @type {Array<string>}
 */
let headers = [];

// 图表配置变量
/**
 * X轴索引 - 当前选择的X轴数据列索引
 * @type {number}
 */
let xAxisIndex = 0;

/**
 * 左侧Y轴索引 - 当前选择的左侧Y轴数据列索引数组
 * @type {Array<number>}
 */
let yAxisIndices = [];

/**
 * 右侧Y轴索引 - 当前选择的右侧Y轴数据列索引数组
 * @type {Array<number>}
 */
let yAxis2Indices = [];

/**
 * 当前图表实例 - Chart.js图表对象
 * @type {Chart|null}
 */
let currentChart = null;

// 分页变量
/**
 * 当前页码 - 数据表格的当前页码
 * @type {number}
 */
let currentPage = 1;

/**
 * 每页显示数量 - 数据表格每页显示的行数
 * @type {number}
 */
let itemsPerPage = 10;

// 控制文件变量
/**
 * 选中的控制时间 - 从控制文件选择的时间值
 * @type {string|null}
 */
let selectedControlTime = null;

// DOM元素引用
/**
 * DOM元素集合 - 应用程序中所有需要操作的DOM元素
 * @type {Object}
 */
const elements = {
  // 文件上传元素
  dataFileInput: document.getElementById('demDecFileInput'),           // 数据文件输入框
  controlFileInput: document.getElementById('demControlFileInput'),    // 控制文件输入框
  dataFileNameDisplay: document.getElementById('dataFileNameDisplay'),  // 数据文件名显示区域
  dataFileName: document.getElementById('dataFileName'),               // 数据文件名文本
  controlFileNameDisplay: document.getElementById('controlFileNameDisplay'), // 控制文件名显示区域
  controlFileName: document.getElementById('controlFileName'),         // 控制文件名文本
  
  // 编码选择元素
  encodingSelector: document.getElementById('encodingSelector'),       // 数据文件编码选择容器
  dataFileEncoding: document.getElementById('dataFileEncoding'),       // 数据文件编码选择器
  dataEncodingResult: document.getElementById('dataEncodingResult'),   // 数据文件编码检测结果
  encodingPreview: document.getElementById('encodingPreview'),         // 数据文件编码预览
  confirmEncodingBtn: document.getElementById('confirmEncodingBtn'),   // 确认数据文件编码按钮
  controlEncodingSelector: document.getElementById('controlEncodingSelector'), // 控制文件编码选择容器
  controlFileEncoding: document.getElementById('controlFileEncoding'), // 控制文件编码选择器
  controlEncodingResult: document.getElementById('controlEncodingResult'), // 控制文件编码检测结果
  controlEncodingPreview: document.getElementById('controlEncodingPreview'), // 控制文件编码预览
  confirmControlEncodingBtn: document.getElementById('confirmControlEncodingBtn'), // 确认控制文件编码按钮
  
  // 时间选择元素
  timeSelectorContainer: document.getElementById('timeSelectorContainer'), // 时间选择器容器
  timeSelectorSelect: document.getElementById('timeSelectorSelect'),       // 时间选择器下拉框
  filterByControlBtn: document.getElementById('filterByControlBtn'),       // 根据控制文件过滤按钮
  
  // 状态显示元素
  statusText: document.getElementById('statusText'),                     // 状态文本显示
  
  // 坐标轴选择元素
  xAxisSelect: document.getElementById('xAxisSelect'),                 // X轴选择器
  yAxisSelect: document.getElementById('yAxisSelect'),                 // 左侧Y轴选择器
  yAxis2Select: document.getElementById('yAxis2Select'),               // 右侧Y轴选择器
  clearYAxisBtn: document.getElementById('clearYAxisBtn'),             // 清除左侧Y轴按钮
  clearYAxis2Btn: document.getElementById('clearYAxis2Btn'),           // 清除右侧Y轴按钮
  selectAllYAxisBtn: document.getElementById('selectAllYAxisBtn'),     // 全选左侧Y轴按钮
  selectAllYAxis2Btn: document.getElementById('selectAllYAxis2Btn'),   // 全选右侧Y轴按钮
  drawChartBtn: document.getElementById('drawChartBtn'),               // 绘制图表按钮
  
  // 时间范围选择元素
  timeRangeSelector: document.getElementById('timeRangeSelector'),     // 时间范围选择器容器
  timeRangeStart: document.getElementById('timeRangeStart'),           // 开始时间输入框
  timeRangeEnd: document.getElementById('timeRangeEnd'),               // 结束时间输入框
  applyTimeRangeBtn: document.getElementById('applyTimeRangeBtn'),     // 应用时间范围按钮
  resetTimeRangeBtn: document.getElementById('resetTimeRangeBtn'),     // 重置时间范围按钮
  autoTimeRangeBtn: document.getElementById('autoTimeRangeBtn'),       // 自动设置时间范围按钮
  
  // 操作按钮
  exportChartBtn: document.getElementById('exportChartBtn'),           // 导出图表按钮
  exportDataBtn: document.getElementById('exportDataBtn'),             // 导出数据按钮
  resetDataBtn: document.getElementById('resetDataBtn'),               // 重置数据按钮
  clearAllBtn: document.getElementById('clearAllBtn'),                 // 清空所有按钮
  
  // 图表元素
  chartContainer: document.getElementById('chartContainer'),           // 图表容器
  lineChart: document.getElementById('lineChart'),                     // 折线图canvas
  
  // 表格元素
  toggleTableBtn: document.getElementById('toggleTableBtn'),           // 切换表格显示按钮
  paginationControls: document.getElementById('paginationControls'),   // 分页控制容器
  prevPageBtn: document.getElementById('prevPageBtn'),                 // 上一页按钮
  nextPageBtn: document.getElementById('nextPageBtn'),                 // 下一页按钮
  pageInfo: document.getElementById('pageInfo'),                       // 页码信息显示
  pageInput: document.getElementById('pageInput'),                     // 页码输入框
  jumpBtn: document.getElementById('jumpBtn'),                         // 跳转按钮
  pageSizeSelect: document.getElementById('pageSizeSelect'),           // 每页显示行数选择器
  tableContainer: document.getElementById('tableContainer'),           // 表格容器
  tableHeader: document.getElementById('tableHeader'),                 // 表格表头
  tableBody: document.getElementById('tableBody'),                     // 表格内容
  
  // Excel工作表选择元素
  sheetSelector: document.getElementById('sheetSelector'),             // 工作表选择容器
  sheetSelect: document.getElementById('sheetSelect'),                 // 工作表选择器
  confirmSheetBtn: document.getElementById('confirmSheetBtn'),         // 确认工作表选择按钮
  
  // 其他元素
  filterZeroColumns: document.getElementById('filterZeroColumns'),     // 过滤全0列复选框
  
  // X轴滑块元素
  xAxisSliderContainer: document.getElementById('xAxisSliderContainer'), // X轴滑块容器
  sliderSelectedArea: document.getElementById('sliderSelectedArea'),     // 滑块选择区域
  sliderHandleMin: document.getElementById('sliderHandleMin'),           // 滑块最小值手柄
  sliderHandleMax: document.getElementById('sliderHandleMax'),           // 滑块最大值手柄
  sliderValueMin: document.getElementById('sliderValueMin'),             // 滑块最小值标签
  sliderValueMax: document.getElementById('sliderValueMax')              // 滑块最大值标签
};

// 导出配置
export { 
  originalData, 
  filteredData, 
  controlData, 
  headers, 
  xAxisIndex, 
  yAxisIndices, 
  yAxis2Indices, 
  currentChart, 
  currentPage, 
  itemsPerPage, 
  selectedControlTime,
  elements
};

/**
 * 更新全局变量
 * @param {Object} newValues - 要更新的变量值
 * @example
 * updateVariables({ filteredData: newData, currentPage: 1 });
 */
export function updateVariables(newValues) {
  if (newValues.originalData !== undefined) originalData = newValues.originalData;
  if (newValues.filteredData !== undefined) filteredData = newValues.filteredData;
  if (newValues.controlData !== undefined) controlData = newValues.controlData;
  if (newValues.headers !== undefined) headers = newValues.headers;
  if (newValues.xAxisIndex !== undefined) xAxisIndex = newValues.xAxisIndex;
  if (newValues.yAxisIndices !== undefined) yAxisIndices = newValues.yAxisIndices;
  if (newValues.yAxis2Indices !== undefined) yAxis2Indices = newValues.yAxis2Indices;
  if (newValues.currentChart !== undefined) currentChart = newValues.currentChart;
  if (newValues.currentPage !== undefined) currentPage = newValues.currentPage;
  if (newValues.itemsPerPage !== undefined) itemsPerPage = newValues.itemsPerPage;
  if (newValues.selectedControlTime !== undefined) selectedControlTime = newValues.selectedControlTime;
}
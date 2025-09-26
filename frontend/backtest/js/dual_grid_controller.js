/**
 * ECharts双Grid控制器 (GridController)
 * 管理两个独立的图表网格，专为双Grid布局设计
 * 
 * 核心功能：
 * - 初始化上下两个 ECharts 实例
 * - 处理图表尺寸自适应
 * - 管理图表数据更新
 * - 协调双 Grid 的交互行为
 */

class GridController {
    constructor() {
        this.isInitialized = false;
        this.isUpdating = false;
        
        // ECharts 实例
        this.charts = {
            grid1: null, // 上部图表 (PPIE数据组)
            grid2: null  // 下部图表 (VVIE数据组)
        };
        
        // 图表容器引用
        this.containers = {
            grid1: null,
            grid2: null
        };
        
        // 数据缓存
        this.dataBuffer = {
            grid1: { p_data: [], pib_data: [], psd_data: [], peb_data: [] },
            grid2: { v_data: [], vib_data: [], vsd_data: [], veb_data: [] }
        };
        
        // 配置参数
        this.config = {
            maxDataPoints: 1000,
            updateInterval: 100,
            enableAnimation: true,
            enableDataZoom: true,
            theme: 'light'
        };
        
        // 性能监控
        this.performance = {
            lastUpdateTime: 0,
            updateCount: 0,
            averageUpdateTime: 0,
            errorCount: 0
        };
        
        // 事件回调
        this.eventCallbacks = {
            onChartReady: [],
            onDataUpdate: [],
            onResize: [],
            onError: []
        };
        
        // 状态管理
        this.state = {
            grid1Visible: true,
            grid2Visible: true,
            isResizing: false
        };
        
        console.log('📊 GridController 初始化...');
        this.init();
    }
    
    /**
     * 初始化双Grid控制器
     */
    async init() {
        try {
            this.getChartContainers();
            await this.initChartInstances();
            this.setupChartOptions();
            this.bindEventListeners();
            this.startPerformanceMonitoring();
            
            this.isInitialized = true;
            console.log('✅ GridController 初始化完成');
            
            this.triggerEvent('onChartReady', {
                grid1Ready: !!this.charts.grid1,
                grid2Ready: !!this.charts.grid2,
                timestamp: Date.now()
            });
            
        } catch (error) {
            console.error('❌ GridController 初始化失败:', error);
            this.triggerEvent('onError', { type: 'initialization', error });
            throw error;
        }
    }
    
    /**
     * 获取图表容器引用
     */
    getChartContainers() {
        this.containers.grid1 = document.getElementById('grid1-chart');
        this.containers.grid2 = document.getElementById('grid2-chart');
        
        if (!this.containers.grid1) {
            throw new Error('Grid1 图表容器未找到');
        }
        if (!this.containers.grid2) {
            throw new Error('Grid2 图表容器未找到');
        }
        
        console.log('✅ 图表容器引用获取完成');
    }
    
    /**
     * 初始化 ECharts 实例
     */
    async initChartInstances() {
        try {
            // 初始化 Grid1 (PPIE数据组)
            if (this.containers.grid1) {
                this.charts.grid1 = echarts.init(this.containers.grid1, this.config.theme);
                this.charts.grid1.group = 'dualGridGroup';
                console.log('✅ Grid1 ECharts实例创建完成');
            }
            
            // 初始化 Grid2 (VVIE数据组)
            if (this.containers.grid2) {
                this.charts.grid2 = echarts.init(this.containers.grid2, this.config.theme);
                this.charts.grid2.group = 'dualGridGroup';
                console.log('✅ Grid2 ECharts实例创建完成');
            }
            
            // 启用图表联动
            if (this.charts.grid1 && this.charts.grid2) {
                echarts.connect('dualGridGroup');
                console.log('✅ 双Grid图表联动启用');
            }
            
        } catch (error) {
            console.error('❌ ECharts实例初始化失败:', error);
            throw error;
        }
    }
    
    /**
     * 配置图表选项
     */
    setupChartOptions() {
        // 配置 Grid1 (PPIE数据组)
        if (this.charts.grid1) {
            const grid1Option = this.createGrid1Option();
            this.charts.grid1.setOption(grid1Option);
            console.log('✅ Grid1 图表选项配置完成');
        }
        
        // 配置 Grid2 (VVIE数据组)
        if (this.charts.grid2) {
            const grid2Option = this.createGrid2Option();
            this.charts.grid2.setOption(grid2Option);
            console.log('✅ Grid2 图表选项配置完成');
        }
    }
    
    /**
     * 创建 Grid1 图表选项 (PPIE数据组)
     */
    createGrid1Option() {
        return {
            title: {
                text: 'PPIE数据组 - 价格相关指标',
                left: 'center',
                top: 10,
                textStyle: { fontSize: 14, fontWeight: 'bold', color: '#333' }
            },
            
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } },
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#ddd',
                borderWidth: 1,
                textStyle: { color: '#333', fontSize: 12 },
                formatter: this.createTooltipFormatter('PPIE')
            },
            
            legend: {
                data: ['P-价格主序列', 'PIB-价格指标B', 'PSD-价格标准差', 'PEB-价格扩展指标'],
                top: 35, left: 'center', itemGap: 20,
                textStyle: { fontSize: 11, color: '#666' }
            },
            
            grid: { left: '3%', right: '3%', top: '15%', bottom: '15%', containLabel: true },
            
            xAxis: {
                type: 'time', boundaryGap: false,
                axisLabel: {
                    formatter: (value) => echarts.format.formatTime('hh:mm:ss', value),
                    fontSize: 10, color: '#666'
                },
                axisLine: { lineStyle: { color: '#e8e8e8' } },
                splitLine: { show: true, lineStyle: { color: '#f5f5f5', type: 'dashed' } }
            },
            
            yAxis: {
                type: 'value', scale: true,
                axisLabel: { fontSize: 10, color: '#666', formatter: '{value}' },
                axisLine: { lineStyle: { color: '#e8e8e8' } },
                splitLine: { lineStyle: { color: '#f5f5f5', type: 'dashed' } }
            },
            
            dataZoom: this.config.enableDataZoom ? [
                { type: 'inside', start: 70, end: 100 },
                {
                    type: 'slider', start: 70, end: 100, height: 20, bottom: 20,
                    fillerColor: 'rgba(24, 144, 255, 0.2)', borderColor: '#1890ff',
                    handleStyle: { borderColor: '#1890ff', borderWidth: 1 },
                    textStyle: { color: '#666', fontSize: 10 }
                }
            ] : [],
            
            series: [
                {
                    name: 'P-价格主序列', type: 'line', data: [], smooth: true, symbol: 'none',
                    lineStyle: { width: 2, color: '#5470c6' }
                },
                {
                    name: 'PIB-价格指标B', type: 'line', data: [], smooth: true, symbol: 'none',
                    lineStyle: { width: 2, color: '#91cc75' }
                },
                {
                    name: 'PSD-价格标准差', type: 'line', data: [], smooth: true, symbol: 'none',
                    lineStyle: { width: 2, color: '#fac858' }
                },
                {
                    name: 'PEB-价格扩展指标', type: 'line', data: [], smooth: true, symbol: 'none',
                    lineStyle: { width: 2, color: '#ee6666' }
                }
            ],
            
            animation: this.config.enableAnimation,
            animationDuration: 300,
            animationEasing: 'cubicOut'
        };
    }
    
    /**
     * 创建 Grid2 图表选项 (VVIE数据组)
     */
    createGrid2Option() {
        return {
            title: {
                text: 'VVIE数据组 - 成交量相关指标',
                left: 'center', top: 10,
                textStyle: { fontSize: 14, fontWeight: 'bold', color: '#333' }
            },
            
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } },
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#ddd', borderWidth: 1,
                textStyle: { color: '#333', fontSize: 12 },
                formatter: this.createTooltipFormatter('VVIE')
            },
            
            legend: {
                data: ['V-成交量主序列', 'VIB-成交量指标B', 'VSD-成交量标准差', 'VEB-成交量扩展指标'],
                top: 35, left: 'center', itemGap: 20,
                textStyle: { fontSize: 11, color: '#666' }
            },
            
            grid: { left: '3%', right: '3%', top: '15%', bottom: '15%', containLabel: true },
            
            xAxis: {
                type: 'time', boundaryGap: false,
                axisLabel: {
                    formatter: (value) => echarts.format.formatTime('hh:mm:ss', value),
                    fontSize: 10, color: '#666'
                },
                axisLine: { lineStyle: { color: '#e8e8e8' } },
                splitLine: { show: true, lineStyle: { color: '#f5f5f5', type: 'dashed' } }
            },
            
            yAxis: {
                type: 'value', scale: true,
                axisLabel: { fontSize: 10, color: '#666', formatter: '{value}' },
                axisLine: { lineStyle: { color: '#e8e8e8' } },
                splitLine: { lineStyle: { color: '#f5f5f5', type: 'dashed' } }
            },
            
            dataZoom: this.config.enableDataZoom ? [
                { type: 'inside', start: 70, end: 100 },
                {
                    type: 'slider', start: 70, end: 100, height: 20, bottom: 20,
                    fillerColor: 'rgba(82, 196, 26, 0.2)', borderColor: '#52c41a',
                    handleStyle: { borderColor: '#52c41a', borderWidth: 1 },
                    textStyle: { color: '#666', fontSize: 10 }
                }
            ] : [],
            
            series: [
                {
                    name: 'V-成交量主序列', type: 'line', data: [], smooth: true, symbol: 'none',
                    lineStyle: { width: 2, color: '#73c0de' }
                },
                {
                    name: 'VIB-成交量指标B', type: 'line', data: [], smooth: true, symbol: 'none',
                    lineStyle: { width: 2, color: '#3ba272' }
                },
                {
                    name: 'VSD-成交量标准差', type: 'line', data: [], smooth: true, symbol: 'none',
                    lineStyle: { width: 2, color: '#fc8452' }
                },
                {
                    name: 'VEB-成交量扩展指标', type: 'line', data: [], smooth: true, symbol: 'none',
                    lineStyle: { width: 2, color: '#9a60b4' }
                }
            ],
            
            animation: this.config.enableAnimation,
            animationDuration: 300,
            animationEasing: 'cubicOut'
        };
    }
    
    /**
     * 创建工具提示格式化器
     */
    createTooltipFormatter(dataGroup) {
        return (params) => {
            if (!params || params.length === 0) return '';
            
            const time = new Date(params[0].value[0]).toLocaleTimeString();
            let html = `<div style="font-size: 12px; line-height: 1.5;">`;
            html += `<div style="font-weight: bold; margin-bottom: 8px; color: #333;">`;
            html += `${dataGroup} - ${time}</div>`;
            
            params.forEach(param => {
                const color = param.color;
                const name = param.seriesName;
                const value = typeof param.value[1] === 'number' 
                    ? param.value[1].toFixed(4) 
                    : param.value[1];
                    
                html += `<div style="margin: 4px 0; display: flex; align-items: center;">`;
                html += `<span style="display: inline-block; width: 10px; height: 10px; background: ${color}; border-radius: 50%; margin-right: 8px;"></span>`;
                html += `<span style="flex: 1;">${name}: </span>`;
                html += `<strong style="color: ${color};">${value}</strong></div>`;
            });
            
            html += `</div>`;
            return html;
        };
    }
    
    /**
     * 绑定事件监听器
     */
    bindEventListeners() {
        // 图表点击事件
        if (this.charts.grid1) {
            this.charts.grid1.on('click', (params) => {
                this.handleChartClick('grid1', params);
            });
        }
        
        if (this.charts.grid2) {
            this.charts.grid2.on('click', (params) => {
                this.handleChartClick('grid2', params);
            });
        }
        
        // 窗口大小变化事件
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 150));
        
        console.log('✅ 事件监听器绑定完成');
    }
    
    /**
     * 处理图表点击事件
     */
    handleChartClick(gridId, params) {
        console.log(`📊 ${gridId} 图表点击:`, params);
    }
    
    /**
     * 处理窗口大小变化
     */
    handleResize() {
        if (this.state.isResizing) return;
        
        this.state.isResizing = true;
        
        try {
            // 调整图表尺寸
            if (this.charts.grid1 && this.state.grid1Visible) {
                this.charts.grid1.resize();
            }
            
            if (this.charts.grid2 && this.state.grid2Visible) {
                this.charts.grid2.resize();
            }
            
            console.log('📊 图表尺寸调整完成');
            
            this.triggerEvent('onResize', {
                timestamp: Date.now(),
                grid1Resized: this.state.grid1Visible,
                grid2Resized: this.state.grid2Visible
            });
            
        } catch (error) {
            console.error('❌ 图表尺寸调整失败:', error);
            this.triggerEvent('onError', { type: 'resize', error });
        } finally {
            setTimeout(() => {
                this.state.isResizing = false;
            }, 100);
        }
    }
    
    /**
     * 更新图表数据
     */
    updateChartsData(data) {
        if (!this.isInitialized || this.isUpdating) {
            return false;
        }
        
        const startTime = performance.now();
        this.isUpdating = true;
        
        try {
            // 验证数据格式
            if (!this.validateDataFormat(data)) {
                console.warn('⚠️ 数据格式无效，跳过更新');
                return false;
            }
            
            // 更新 Grid1 数据 (PPIE)
            if (data.ppie && this.charts.grid1 && this.state.grid1Visible) {
                this.updateGrid1Data(data.ppie, data.metadata);
            }
            
            // 更新 Grid2 数据 (VVIE)
            if (data.vvie && this.charts.grid2 && this.state.grid2Visible) {
                this.updateGrid2Data(data.vvie, data.metadata);
            }
            
            // 更新性能统计
            const updateTime = performance.now() - startTime;
            this.updatePerformanceStats(updateTime);
            
            this.triggerEvent('onDataUpdate', {
                timestamp: Date.now(),
                updateTime,
                dataValid: true
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ 图表数据更新失败:', error);
            this.performance.errorCount++;
            this.triggerEvent('onError', { type: 'data_update', error });
            return false;
            
        } finally {
            this.isUpdating = false;
        }
    }
    
    /**
     * 更新 Grid1 数据 (PPIE数据组)
     */
    updateGrid1Data(ppieData, metadata) {
        const timestamp = metadata?.timestamp || Date.now();
        
        // 添加数据到缓存
        if (ppieData.P !== undefined) {
            this.dataBuffer.grid1.p_data.push([timestamp, ppieData.P]);
        }
        if (ppieData.PIB !== undefined) {
            this.dataBuffer.grid1.pib_data.push([timestamp, ppieData.PIB]);
        }
        if (ppieData.PSD !== undefined) {
            this.dataBuffer.grid1.psd_data.push([timestamp, ppieData.PSD]);
        }
        if (ppieData.PEB !== undefined) {
            this.dataBuffer.grid1.peb_data.push([timestamp, ppieData.PEB]);
        }
        
        // 限制数据点数量
        this.limitDataBuffer('grid1');
        
        // 更新图表
        this.charts.grid1.setOption({
            series: [
                { data: this.dataBuffer.grid1.p_data },
                { data: this.dataBuffer.grid1.pib_data },
                { data: this.dataBuffer.grid1.psd_data },
                { data: this.dataBuffer.grid1.peb_data }
            ]
        }, false);
    }
    
    /**
     * 更新 Grid2 数据 (VVIE数据组)
     */
    updateGrid2Data(vvieData, metadata) {
        const timestamp = metadata?.timestamp || Date.now();
        
        // 添加数据到缓存
        if (vvieData.V !== undefined) {
            this.dataBuffer.grid2.v_data.push([timestamp, vvieData.V]);
        }
        if (vvieData.VIB !== undefined) {
            this.dataBuffer.grid2.vib_data.push([timestamp, vvieData.VIB]);
        }
        if (vvieData.VSD !== undefined) {
            this.dataBuffer.grid2.vsd_data.push([timestamp, vvieData.VSD]);
        }
        if (vvieData.VEB !== undefined) {
            this.dataBuffer.grid2.veb_data.push([timestamp, vvieData.VEB]);
        }
        
        // 限制数据点数量
        this.limitDataBuffer('grid2');
        
        // 更新图表
        this.charts.grid2.setOption({
            series: [
                { data: this.dataBuffer.grid2.v_data },
                { data: this.dataBuffer.grid2.vib_data },
                { data: this.dataBuffer.grid2.vsd_data },
                { data: this.dataBuffer.grid2.veb_data }
            ]
        }, false);
    }
    
    /**
     * 限制数据缓存大小
     */
    limitDataBuffer(gridId) {
        const buffer = this.dataBuffer[gridId];
        const maxPoints = this.config.maxDataPoints;
        
        for (const key in buffer) {
            if (buffer[key].length > maxPoints) {
                buffer[key] = buffer[key].slice(-maxPoints);
            }
        }
    }
    
    /**
     * 验证数据格式
     */
    validateDataFormat(data) {
        if (!data || typeof data !== 'object') return false;
        return !!(data.ppie || data.vvie);
    }
    
    /**
     * 设置Grid可见性
     */
    setGridVisibility(gridId, visible) {
        if (gridId === 'grid1') {
            this.state.grid1Visible = visible;
        } else if (gridId === 'grid2') {
            this.state.grid2Visible = visible;
        }
        
        // 调整图表尺寸
        setTimeout(() => {
            this.handleResize();
        }, 50);
        
        console.log(`📊 ${gridId} 可见性设置为: ${visible}`);
    }
    
    /**
     * 清空图表数据
     */
    clearChartsData() {
        try {
            // 清空数据缓存
            for (const gridId in this.dataBuffer) {
                for (const series in this.dataBuffer[gridId]) {
                    this.dataBuffer[gridId][series] = [];
                }
            }
            
            // 清空图表显示
            if (this.charts.grid1) {
                this.charts.grid1.setOption({
                    series: [{ data: [] }, { data: [] }, { data: [] }, { data: [] }]
                });
            }
            
            if (this.charts.grid2) {
                this.charts.grid2.setOption({
                    series: [{ data: [] }, { data: [] }, { data: [] }, { data: [] }]
                });
            }
            
            console.log('🧹 图表数据清空完成');
            return true;
            
        } catch (error) {
            console.error('❌ 清空图表数据失败:', error);
            return false;
        }
    }
    
    /**
     * 更新性能统计
     */
    updatePerformanceStats(updateTime) {
        this.performance.updateCount++;
        this.performance.lastUpdateTime = updateTime;
        
        // 计算平均更新时间
        this.performance.averageUpdateTime = 
            (this.performance.averageUpdateTime * (this.performance.updateCount - 1) + updateTime) 
            / this.performance.updateCount;
    }
    
    /**
     * 启动性能监控
     */
    startPerformanceMonitoring() {
        setInterval(() => {
            if (this.performance.updateCount > 0) {
                console.debug('📊 GridController 性能统计:', {
                    updateCount: this.performance.updateCount,
                    averageUpdateTime: this.performance.averageUpdateTime.toFixed(2) + 'ms',
                    errorCount: this.performance.errorCount,
                    memoryUsage: this.getMemoryUsage()
                });
            }
        }, 30000);
    }
    
    /**
     * 获取内存使用情况
     */
    getMemoryUsage() {
        const totalDataPoints = Object.values(this.dataBuffer).reduce((total, grid) => {
            return total + Object.values(grid).reduce((gridTotal, series) => {
                return gridTotal + series.length;
            }, 0);
        }, 0);
        
        return {
            totalDataPoints,
            estimatedMemoryMB: (totalDataPoints * 16 / 1024 / 1024).toFixed(2)
        };
    }
    
    /**
     * 获取图表状态
     */
    getChartsStatus() {
        return {
            isInitialized: this.isInitialized,
            grid1Ready: !!this.charts.grid1,
            grid2Ready: !!this.charts.grid2,
            grid1Visible: this.state.grid1Visible,
            grid2Visible: this.state.grid2Visible,
            performance: this.performance,
            memoryUsage: this.getMemoryUsage()
        };
    }
    
    /**
     * 注册事件回调
     */
    on(eventType, callback) {
        if (this.eventCallbacks[eventType]) {
            this.eventCallbacks[eventType].push(callback);
        }
    }
    
    /**
     * 触发事件
     */
    triggerEvent(eventType, data) {
        if (this.eventCallbacks[eventType]) {
            this.eventCallbacks[eventType].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ 事件回调执行失败 (${eventType}):`, error);
                }
            });
        }
    }
    
    /**
     * 防抖函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * 销毁控制器
     */
    destroy() {
        console.log('🧹 销毁 GridController...');
        
        // 销毁 ECharts 实例
        if (this.charts.grid1) {
            this.charts.grid1.dispose();
            this.charts.grid1 = null;
        }
        
        if (this.charts.grid2) {
            this.charts.grid2.dispose();
            this.charts.grid2 = null;
        }
        
        // 清空数据缓存
        for (const gridId in this.dataBuffer) {
            for (const series in this.dataBuffer[gridId]) {
                this.dataBuffer[gridId][series] = [];
            }
        }
        
        // 清空事件回调
        for (const eventType in this.eventCallbacks) {
            this.eventCallbacks[eventType] = [];
        }
        
        // 重置状态
        this.isInitialized = false;
        this.isUpdating = false;
        
        console.log('✅ GridController 销毁完成');
    }
}

/**
 * 初始化双Grid控制器
 */
function initGridController() {
    try {
        return new GridController();
    } catch (error) {
        console.error('❌ GridController 创建失败:', error);
        throw error;
    }
}

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GridController, initGridController };
} else if (typeof window !== 'undefined') {
    window.GridController = GridController;
    window.initGridController = initGridController;
}
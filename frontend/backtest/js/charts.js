/**
 * ECharts双网格图表配置模块
 * 负责PPIE和VVIE数据组的可视化展示
 * 
 * 功能特性:
 * - Grid1: PPIE数据组 (P/PIB/PSD/PEB)
 * - Grid2: VVIE数据组 (V/VIB/VSD/VIB2)
 * - 实时数据更新和性能优化
 * - 交互功能和缩放控制
 */

class ChartsManager {
    constructor() {
        this.ppieChart = null;
        this.vvieChart = null;
        this.isInitialized = false;
        this.dataBuffer = {
            ppie: {
                p_data: [],
                pib_data: [],
                psd_data: [],
                peb_data: []
            },
            vvie: {
                v_data: [],
                vib_data: [],
                vsd_data: [],
                veb_data: []
            }
        };

        // 数据缓存配置
        this.maxDataPoints = 1000; // 最大数据点数量
        this.updateBatchSize = 10;  // 批量更新大小

        // 初始化图表
        this.initCharts();
        this.bindEvents();
    }

    /**
     * 初始化图表实例
     */
    initCharts() {
        try {
            // 初始化PPIE图表
            const ppieContainer = document.getElementById('ppie-chart');
            if (ppieContainer) {
                this.ppieChart = echarts.init(ppieContainer);
                this.ppieChart.group = 'chartGroup';  // 设置图表组
                this.setupPPIEChart();
            }

            // 初始化VVIE图表
            const vvieContainer = document.getElementById('vvie-chart');
            if (vvieContainer) {
                this.vvieChart = echarts.init(vvieContainer);
                this.vvieChart.group = 'chartGroup';  // 设置相同的图表组
                this.setupVVIEChart();
            }

                        // 启用图表联动
            this.enableChartsConnection();

            this.isInitialized = true;
            console.log('✅ ECharts图表初始化完成');

        } catch (error) {
            console.error('❌ 图表初始化失败:', error);
            throw error;
        }
    }

    /**
     * 配置PPIE数据组图表 (Grid1)
     */
    setupPPIEChart() {
        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    label: {
                        backgroundColor: '#6a7985'
                    }
                },
                formatter: function (params) {
                    let html = `<div style="font-size: 14px;">`;
                    html += `<div style="margin-bottom: 8px; font-weight: bold;">`;
                    html += `时间: ${new Date(params[0].value[0]).toLocaleTimeString()}`;
                    html += `</div>`;

                    params.forEach(param => {
                        const color = param.color;
                        const name = param.seriesName;
                        const value = param.value[1];
                        html += `<div style="margin: 4px 0;">`;
                        html += `<span style="display: inline-block; width: 10px; height: 10px; background: ${color}; border-radius: 50%; margin-right: 8px;"></span>`;
                        html += `${name}: <strong>${value}</strong>`;
                        html += `</div>`;
                    });

                    html += `</div>`;
                    return html;
                }
            },

            legend: {
                data: ['P-价格主序列', 'PIB-价格指标B', 'PSD-价格标准差', 'PEB-价格扩展指标'],
                top: 5,
                textStyle: {
                    fontSize: 12
                }
            },

            grid: {
                left: '0.5%',
                right: '0.5%',
                top: '5%',
                bottom: '5%',
                containLabel: true
            },

            xAxis: {
                type: 'time',
                boundaryGap: false,
                axisLabel: {
                    formatter: function (value) {
                        return new Date(value).toLocaleTimeString();
                    },
                    fontSize: 11
                },
                axisLine: {
                    lineStyle: {
                        color: '#d9d9d9'
                    }
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: '#f0f0f0',
                        type: 'dashed'
                    }
                }
            },

            yAxis: {
                type: 'value',
                scale: true,
                axisLabel: {
                    fontSize: 11,
                    formatter: '{value}'
                },
                axisLine: {
                    lineStyle: {
                        color: '#d9d9d9'
                    }
                },
                splitLine: {
                    lineStyle: {
                        color: '#f0f0f0',
                        type: 'dashed'
                    }
                }
            },

            dataZoom: [
                {
                    type: 'inside',
                    start: 0,
                    end: 100
                },
                {
                    type: 'slider',
                    start: 0,
                    end: 100,
                    height: 10,
                    bottom: 10,
                    textStyle: {
                        fontSize: 10
                    }
                }
            ],

            series: [
                {
                    name: 'P-价格主序列',
                    type: 'line',
                    data: [],
                    smooth: true,
                    symbol: 'none',
                    lineStyle: {
                        width: 0.8,
                        color: '#5470c6'
                    },
                    // areaStyle: {
                    //     opacity: 0.1,
                    //     color: '#5470c6'
                    // }
                },
                {
                    name: 'PIB-价格指标B',
                    type: 'line',
                    data: [],
                    smooth: true,
                    symbol: 'none',
                    lineStyle: {
                        width: 0.8,
                        color: '#91cc75'
                    }
                },
                {
                    name: 'PSD-价格标准差',
                    type: 'line',
                    data: [],
                    smooth: true,
                    symbol: 'none',
                    lineStyle: {
                        width: 0.8,
                        color: '#fac858'
                    }
                },
                {
                    name: 'PEB-价格扩展指标',
                    type: 'line',
                    data: [],
                    smooth: true,
                    symbol: 'none',
                    lineStyle: {
                        width: 0.8,
                        color: '#ee6666'
                    }
                }
            ],

            animation: false, // 关闭动画提升性能

            // 性能优化配置
            blendMode: 'lighter',
            progressive: 400,
            progressiveThreshold: 1000
        };

        this.ppieChart.setOption(option);
    }

    /**
     * 配置VVIE数据组图表 (Grid2)
     */
    setupVVIEChart() {
        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    label: {
                        backgroundColor: '#6a7985'
                    }
                },
                formatter: function (params) {
                    let html = `<div style="font-size: 14px;">`;
                    html += `<div style="margin-bottom: 8px; font-weight: bold;">`;
                    html += `时间: ${new Date(params[0].value[0]).toLocaleTimeString()}`;
                    html += `</div>`;

                    params.forEach(param => {
                        const color = param.color;
                        const name = param.seriesName;
                        const value = param.value[1];
                        html += `<div style="margin: 4px 0;">`;
                        html += `<span style="display: inline-block; width: 10px; height: 10px; background: ${color}; border-radius: 50%; margin-right: 8px;"></span>`;
                        html += `${name}: <strong>${value}</strong>`;
                        html += `</div>`;
                    });

                    html += `</div>`;
                    return html;
                }
            },

            legend: {
                data: ['V-成交量主序列', 'VIB-成交量指标B', 'VSD-成交量标准差', 'VEB-成交量指标'],
                top: 5,
                textStyle: {
                    fontSize: 12
                }
            },

            grid: {
                left: '0.5%',
                right: '0.5%',
                top: '5%',
                bottom: '5%',
                containLabel: true
            },

            xAxis: {
                type: 'time',
                boundaryGap: false,
                axisLabel: {
                    formatter: function (value) {
                        return new Date(value).toLocaleTimeString();
                    },
                    fontSize: 11
                },
                axisLine: {
                    lineStyle: {
                        color: '#d9d9d9'
                    }
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: '#f0f0f0',
                        type: 'dashed'
                    }
                }
            },

            yAxis: {
                type: 'value',
                scale: true,
                axisLabel: {
                    fontSize: 11,
                    formatter: '{value}'
                },
                axisLine: {
                    lineStyle: {
                        color: '#d9d9d9'
                    }
                },
                splitLine: {
                    lineStyle: {
                        color: '#f0f0f0',
                        type: 'dashed'
                    }
                }
            },

            dataZoom: [
                {
                    type: 'inside',
                    start: 0,
                    end: 100
                },
                {
                    type: 'slider',
                    start: 0,
                    end: 100,
                    height: 10,
                    bottom: 10,
                    textStyle: {
                        fontSize: 10
                    }
                }
            ],

            series: [
                {
                    name: 'V-成交量主序列',
                    type: 'line',
                    data: [],
                    smooth: true,
                    symbol: 'none',
                    lineStyle: {
                        width: 0.8,
                        color: '#73c0de'
                    },
                    // areaStyle: {
                    //     opacity: 0.1,
                    //     color: '#73c0de'
                    // }
                },
                {
                    name: 'VIB-成交量指标B',
                    type: 'line',
                    data: [],
                    smooth: true,
                    symbol: 'none',
                    lineStyle: {
                        width: 0.8,
                        color: '#3ba272'
                    }
                },
                {
                    name: 'VSD-成交量标准差',
                    type: 'line',
                    data: [],
                    smooth: true,
                    symbol: 'none',
                    lineStyle: {
                        width: 0.8,
                        color: '#fc8452'
                    }
                },
                {
                    name: 'VEB-成交量指标',
                    type: 'line',
                    data: [],
                    smooth: true,
                    symbol: 'none',
                    lineStyle: {
                        width: 0.8,
                        color: '#9a60b4'
                    }
                }
            ],

            animation: false, // 关闭动画提升性能

            // 性能优化配置
            blendMode: 'lighter',
            progressive: 400,
            progressiveThreshold: 1000
        };

        this.vvieChart.setOption(option);
    }

    /**
     * 设置图表xAxis的时间范围
     * @param {Date|string|number} startTime - 开始时间
     * @param {Date|string|number} endTime - 结束时间
     */
    setTimeRange(startTime, endTime) {
        const start = new Date(startTime).getTime();
        const end = new Date(endTime).getTime();

        if (this.ppieChart) {
            this.ppieChart.setOption({
                xAxis: {
                    min: start,
                    max: end
                }
            });
        }

        if (this.vvieChart) {
            this.vvieChart.setOption({
                xAxis: {
                    min: start,
                    max: end
                }
            });
        }

        console.log(`⏰ 设置时间范围: ${new Date(start).toLocaleString()} - ${new Date(end).toLocaleString()}`);
    }

        /**
     * 启用图表联动功能
     */
    enableChartsConnection() {
        if (!this.ppieChart || !this.vvieChart) return;

        // 启用坐标轴联动
        echarts.connect('chartGroup');

        // // 手动绑定缩放联动事件
        // this.ppieChart.on('dataZoom', (params) => {
        //     if (params.batch) {
        //         // 批量缩放事件
        //         params.batch.forEach(item => {
        //             this.vvieChart.dispatchAction({
        //                 type: 'dataZoom',
        //                 dataZoomIndex: item.dataZoomIndex,
        //                 start: item.start,
        //                 end: item.end
        //             });
        //         });
        //     } else {
        //         // 单个缩放事件
        //         this.vvieChart.dispatchAction({
        //             type: 'dataZoom',
        //             dataZoomIndex: params.dataZoomIndex,
        //             start: params.start,
        //             end: params.end
        //         });
        //     }
        // });
        //
        // this.vvieChart.on('dataZoom', (params) => {
        //     if (params.batch) {
        //         params.batch.forEach(item => {
        //             this.ppieChart.dispatchAction({
        //                 type: 'dataZoom',
        //                 dataZoomIndex: item.dataZoomIndex,
        //                 start: item.start,
        //                 end: item.end
        //             });
        //         });
        //     } else {
        //         this.ppieChart.dispatchAction({
        //             type: 'dataZoom',
        //             dataZoomIndex: params.dataZoomIndex,
        //             start: params.start,
        //             end: params.end
        //         });
        //     }
        // });

        console.log('🔗 图表联动已启用');
    }


    /**
     * 更新图表数据
     * @param {Object} newData - 新数据包含ppie_group和vvie_group
     */
    updateChartsData(newData) {
        if (!this.isInitialized) {
            console.warn('⚠️ 图表未初始化，跳过数据更新');
            return;
        }

        try {
            // 更新PPIE数据
            if (newData.ppie_group) {
                this.updatePPIEData(newData.ppie_group);
            }

            // 更新VVIE数据
            if (newData.vvie_group) {
                this.updateVVIEData(newData.vvie_group);
            }

        } catch (error) {
            console.error('❌ 图表数据更新失败:', error);
        }
    }

    /**
     * 更新PPIE图表数据
     */
    updatePPIEData(ppieData) {
        // 更新数据缓存
        for (const [key, value] of Object.entries(ppieData)) {
            if (this.dataBuffer.ppie[key] && Array.isArray(value)) {
                this.dataBuffer.ppie[key].push(...value);

                // 限制数据点数量
                if (this.dataBuffer.ppie[key].length > this.maxDataPoints) {
                    this.dataBuffer.ppie[key] = this.dataBuffer.ppie[key].slice(-this.maxDataPoints);
                }
            }
        }

        // 更新图表
        this.ppieChart.setOption({
            series: [
                { data: this.dataBuffer.ppie.p_data },
                { data: this.dataBuffer.ppie.pib_data },
                { data: this.dataBuffer.ppie.psd_data },
                { data: this.dataBuffer.ppie.peb_data }
            ]
        });
    }

    /**
     * 更新VVIE图表数据
     */
    updateVVIEData(vvieData) {
        // 更新数据缓存
        for (const [key, value] of Object.entries(vvieData)) {
            if (this.dataBuffer.vvie[key] && Array.isArray(value)) {
                this.dataBuffer.vvie[key].push(...value);

                // 限制数据点数量
                if (this.dataBuffer.vvie[key].length > this.maxDataPoints) {
                    this.dataBuffer.vvie[key] = this.dataBuffer.vvie[key].slice(-this.maxDataPoints);
                }
            }
        }

        // 更新图表
        this.vvieChart.setOption({
            series: [
                { data: this.dataBuffer.vvie.v_data },
                { data: this.dataBuffer.vvie.vib_data },
                { data: this.dataBuffer.vvie.vsd_data },
                { data: this.dataBuffer.vvie.veb_data }
            ]
        });
    }

    /**
     * 清空图表数据
     */
    clearChartsData() {
        // 清空数据缓存
        for (const group of Object.values(this.dataBuffer)) {
            for (const key of Object.keys(group)) {
                group[key] = [];
            }
        }

        // 清空图表
        if (this.ppieChart) {
            this.ppieChart.setOption({
                series: [
                    { data: [] },
                    { data: [] },
                    { data: [] },
                    { data: [] }
                ]
            });
        }

        if (this.vvieChart) {
            this.vvieChart.setOption({
                series: [
                    { data: [] },
                    { data: [] },
                    { data: [] },
                    { data: [] }
                ]
            });
        }

        console.log('🗑️ 图表数据已清空');
    }

    /**
     * 重置图表缩放
     */
    resetZoom() {
        if (this.ppieChart) {
            this.ppieChart.dispatchAction({
                type: 'dataZoom',
                start: 70,
                end: 100
            });
        }

        if (this.vvieChart) {
            this.vvieChart.dispatchAction({
                type: 'dataZoom',
                start: 70,
                end: 100
            });
        }

        console.log('🔍 图表缩放已重置');
    }

    /**
     * 导出图表数据
     */
    exportChartsData() {
        const exportData = {
            timestamp: new Date().toISOString(),
            ppie_data: this.dataBuffer.ppie,
            vvie_data: this.dataBuffer.vvie,
            total_points: {
                ppie: this.dataBuffer.ppie.p_data.length,
                vvie: this.dataBuffer.vvie.v_data.length
            }
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `charts_data_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        link.click();

        URL.revokeObjectURL(url);
        console.log('💾 图表数据已导出');
    }

    /**
     * 绑定图表事件
     */
    bindEvents() {
        // 窗口大小变化时重新调整图表大小
        window.addEventListener('resize', () => {
            if (this.ppieChart) {
                this.ppieChart.resize();
            }
            if (this.vvieChart) {
                this.vvieChart.resize();
            }
        });

        // 绑定控制按钮事件
        $('#ppie-zoom-reset').on('click', () => {
            if (this.ppieChart) {
                this.ppieChart.dispatchAction({
                    type: 'dataZoom',
                    start: 70,
                    end: 100
                });
            }
        });

        $('#vvie-zoom-reset').on('click', () => {
            if (this.vvieChart) {
                this.vvieChart.dispatchAction({
                    type: 'dataZoom',
                    start: 70,
                    end: 100
                });
            }
        });

        $('#ppie-export').on('click', () => {
            this.exportSeriesData('ppie');
        });

        $('#vvie-export').on('click', () => {
            this.exportSeriesData('vvie');
        });
    }

    /**
     * 导出特定序列数据
     */
    exportSeriesData(seriesType) {
        const data = this.dataBuffer[seriesType];
        const exportData = {
            type: seriesType.toUpperCase(),
            timestamp: new Date().toISOString(),
            data: data,
            total_points: Object.values(data)[0]?.length || 0
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${seriesType}_data_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        link.click();

        URL.revokeObjectURL(url);
        console.log(`💾 ${seriesType.toUpperCase()}数据已导出`);
    }

    /**
     * 获取图表状态信息
     */
    getChartsStatus() {
        return {
            initialized: this.isInitialized,
            ppie_points: this.dataBuffer.ppie.p_data.length,
            vvie_points: this.dataBuffer.vvie.v_data.length,
            max_points: this.maxDataPoints,
            memory_usage: this.calculateMemoryUsage()
        };
    }

    /**
     * 计算内存使用量估算
     */
    calculateMemoryUsage() {
        let totalPoints = 0;

        for (const group of Object.values(this.dataBuffer)) {
            for (const series of Object.values(group)) {
                totalPoints += series.length;
            }
        }

        // 每个数据点大约16字节 [timestamp, value]
        const estimatedBytes = totalPoints * 16;
        return {
            points: totalPoints,
            bytes: estimatedBytes,
            mb: (estimatedBytes / 1024 / 1024).toFixed(2)
        };
    }

    /**
     * 销毁图表实例
     */
    destroy() {
        if (this.ppieChart) {
            this.ppieChart.dispose();
            this.ppieChart = null;
        }

        if (this.vvieChart) {
            this.vvieChart.dispose();
            this.vvieChart = null;
        }

        this.isInitialized = false;
        console.log('🔄 图表实例已销毁');
    }
}

// 全局图表管理器实例
window.chartsManager = null;

// 图表模块初始化函数
function initChartsModule() {
    try {
        window.chartsManager = new ChartsManager();
        console.log('✅ 图表模块初始化完成');
        return window.chartsManager;
    } catch (error) {
        console.error('❌ 图表模块初始化失败:', error);
        throw error;
    }
}

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChartsManager, initChartsModule };
}
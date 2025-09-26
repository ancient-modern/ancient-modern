/**
 * ECharts图表组件模块
 * 实现K线、成交量、MACD、KDJ等图表
 */

class ChartComponents {
    constructor() {
        this.charts = {};
        this.themes = this.getChartTheme();
        this.currentData = {};
    }

    /**
     * 获取暗色主题配置
     */
    getChartTheme() {
        return {
            backgroundColor: '#3e3e40',
            textStyle: {
                color: '#e6e6e6'
            },
            title: {
                textStyle: {
                    color: '#e6e6e6'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(42, 42, 43, 0.95)',
                borderColor: '#606063',
                textStyle: {
                    color: '#e6e6e6'
                }
            },
            legend: {
                textStyle: {
                    color: '#e6e6e6'
                }
            },
            grid: {
                borderColor: '#606063'
            },
            categoryAxis: {
                axisLine: {
                    lineStyle: {
                        color: '#606063'
                    }
                },
                axisTick: {
                    lineStyle: {
                        color: '#606063'
                    }
                },
                axisLabel: {
                    textStyle: {
                        color: '#e6e6e6'
                    }
                },
                splitLine: {
                    lineStyle: {
                        color: ['#606063']
                    }
                }
            },
            valueAxis: {
                axisLine: {
                    lineStyle: {
                        color: '#606063'
                    }
                },
                axisTick: {
                    lineStyle: {
                        color: '#606063'
                    }
                },
                axisLabel: {
                    textStyle: {
                        color: '#e6e6e6'
                    }
                },
                splitLine: {
                    lineStyle: {
                        color: ['#606063']
                    }
                }
            }
        };
    }

    /**
     * 初始化K线图
     */
    initKlineChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        const chart = echarts.init(container, 'dark');
        chart.group = 'stock-group';
        const option = {
            backgroundColor: this.themes.backgroundColor,
            animation: false,
            grid: {
                left: '2%',
                right: '2%',
                top: '3%',
                bottom: '5%'
            },
            xAxis: {
                type: 'category',
                data: [],
                boundaryGap: false,
                axisLine: { onZero: false },
                splitLine: { show: false },
                min: 'dataMin',
                max: 'dataMax',
                axisPointer: {
                    z: 100
                }
            },
            yAxis: {
                scale: true,
                splitArea: {
                    show: true
                }
            },
            dataZoom: [
                {
                    type: 'inside',
                    xAxisIndex: [0],
                    start: 0,
                    end: 100
                },
                {
                    show: false,
                    xAxisIndex: [0],
                    type: 'slider',
                    top: '90%',
                    start: 0,
                    end: 100,
                    group: 'stock-zoom-group'
                }
            ],
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross'
                },
                backgroundColor: 'rgba(42, 42, 43, 0.95)',
                borderColor: '#606063',
                textStyle: {
                    color: '#e6e6e6'
                },
                // formatter: function (params) {
                //     let result = `时间: ${params[0].name}<br/>`;
                //     params.forEach(param => {
                //         if (param.seriesName === 'K线') {
                //             const data = param.data;
                //             result += `开盘: ${data[1]}<br/>最高: ${data[4]}<br/>最低: ${data[3]}<br/>收盘: ${data[2]}<br/>`;
                //         } else {
                //             console.log(param);
                //             result += `${param.seriesName}: ${param.value}<br/>`;
                //         }
                //     });
                //     return result;
                // }
            },
            series: [
                {
                    name: 'K线',
                    type: 'candlestick',
                    data: [],
                    itemStyle: {
                        color: '#00da3c',
                        color0: '#ec0000',
                        borderColor: '#00da3c',
                        borderColor0: '#ec0000'
                    }
                },
                {
                    name: 'MA3',
                    type: 'line',
                    data: [],
                    smooth: true,
                    lineStyle: {
                        opacity: 0.8,
                        width: 1,
                        color: '#FF6B6B'
                    },
                    showSymbol: false
                },
                {
                    name: 'MA5',
                    type: 'line',
                    data: [],
                    smooth: true,
                    lineStyle: {
                        opacity: 0.8,
                        width: 1,
                        color: '#4ECDC4'
                    },
                    showSymbol: false
                },
                {
                    name: 'MA10',
                    type: 'line',
                    data: [],
                    smooth: true,
                    lineStyle: {
                        opacity: 0.8,
                        width: 1,
                        color: '#45B7D1'
                    },
                    showSymbol: false
                },
                {
                    name: 'MA15',
                    type: 'line',
                    data: [],
                    smooth: true,
                    lineStyle: {
                        opacity: 0.8,
                        width: 1,
                        color: '#F7DC6F'
                    },
                    showSymbol: false
                }
            ]
        };

        chart.setOption(option);
        this.charts['kline'] = chart;
        return chart;
    }

    /**
     * 初始化成交量图
     */
    initVolumeChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        const chart = echarts.init(container, 'dark');
        chart.group = 'stock-group';
        const option = {
            backgroundColor: this.themes.backgroundColor,
            animation: false,
            grid: {
                left: '3%',
                right: '3%',
                top: '3%',
                bottom: '14%'
            },
            xAxis: {
                type: 'category',
                data: [],
                boundaryGap: false,
                axisLine: { onZero: false },
                splitLine: { show: false },
                min: 'dataMin',
                max: 'dataMax'
            },
            yAxis: {
                scale: true,
                splitArea: {
                    show: true
                }
            },
            dataZoom: [
                {
                    type: 'inside',
                    xAxisIndex: [0],
                    start: 0,
                    end: 100
                },
                {
                    show: false,
                    xAxisIndex: [0],
                    type: 'slider',
                    top: '90%',
                    start: 0,
                    end: 100,
                    group: 'stock-zoom-group'
                }
            ],
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross'
                },
                backgroundColor: 'rgba(42, 42, 43, 0.95)',
                borderColor: '#606063',
                textStyle: {
                    color: '#e6e6e6'
                }
            },
            series: [
                {
                    name: '成交量',
                    type: 'bar',
                    data: [],
                    itemStyle: {
                        color: function (params) {
                            return params.dataIndex % 2 === 0 ? '#00da3c' : '#ec0000';
                        }
                    }
                },
                {
                    name: '5分钟均量',
                    type: 'line',
                    data: [],
                    smooth: true,
                    lineStyle: {
                        opacity: 0.8,
                        width: 1,
                        color: '#FF6B6B'
                    },
                    showSymbol: false
                },
                {
                    name: '10分钟均量',
                    type: 'line',
                    data: [],
                    smooth: true,
                    lineStyle: {
                        opacity: 0.8,
                        width: 1,
                        color: '#4ECDC4'
                    },
                    showSymbol: false
                },
                {
                    name: '15分钟均量',
                    type: 'line',
                    data: [],
                    smooth: true,
                    lineStyle: {
                        opacity: 0.8,
                        width: 1,
                        color: '#45B7D1'
                    },
                    showSymbol: false
                }
            ]
        };

        chart.setOption(option);
        this.charts['volume'] = chart;
        return chart;
    }

    /**
     * 初始化MACD图
     */
    initMACDChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        const chart = echarts.init(container, 'dark');
        chart.group = 'stock-group';
        const option = {
            backgroundColor: this.themes.backgroundColor,
            animation: false,
            grid: {
                left: '2%',
                right: '2%',
                top: '5%',
                bottom: '15%'
            },
            xAxis: {
                type: 'category',
                data: [],
                boundaryGap: false,
                axisLine: { onZero: false },
                splitLine: { show: false },
                min: 'dataMin',
                max: 'dataMax'
            },
            yAxis: {
                scale: true,
                splitArea: {
                    show: true
                }
            },
            dataZoom: [
                {
                    type: 'inside',
                    xAxisIndex: [0],
                    start: 0,
                    end: 100
                },
                {
                    show: false,
                    xAxisIndex: [0],
                    type: 'slider',
                    top: '90%',
                    start: 0,
                    end: 100,
                    group: 'stock-zoom-group'
                }
            ],
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross'
                },
                backgroundColor: 'rgba(42, 42, 43, 0.95)',
                borderColor: '#606063',
                textStyle: {
                    color: '#e6e6e6'
                }
            },
            series: [
                {
                    name: 'DIF',
                    type: 'line',
                    data: [],
                    smooth: true,
                    lineStyle: {
                        opacity: 0.8,
                        width: 1,
                        color: '#FF6B6B'
                    },
                    showSymbol: false
                },
                {
                    name: 'DEA',
                    type: 'line',
                    data: [],
                    smooth: true,
                    lineStyle: {
                        opacity: 0.8,
                        width: 1,
                        color: '#4ECDC4'
                    },
                    showSymbol: false
                },
                {
                    name: 'MACD',
                    type: 'bar',
                    data: [],
                    itemStyle: {
                        color: function (params) {
                            return params.value >= 0 ? '#00da3c' : '#ec0000';
                        }
                    }
                }
            ]
        };

        chart.setOption(option);
        this.charts['macd'] = chart;
        return chart;
    }

    /**
     * 初始化KDJ图
     */
    initKDJChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        const chart = echarts.init(container, 'dark');
        chart.group = 'stock-group';
        const option = {
            backgroundColor: this.themes.backgroundColor,
            animation: false,
            grid: {
                left: '1.5%',
                right: '1.5%',
                top: '3%',
                bottom: '22%'
            },
            xAxis: {
                type: 'category',
                data: [],
                boundaryGap: false,
                axisLine: { onZero: false },
                splitLine: { show: false },
                min: 'dataMin',
                max: 'dataMax'
            },
            yAxis: {
                scale: true,
                splitArea: {
                    show: true
                },
                min: 115,
                max: -5
            },
            dataZoom: [
                {
                    type: 'inside',
                    xAxisIndex: [0],
                    start: 0,
                    end: 100
                },
                {
                    show: true,
                    height: 8,
                    xAxisIndex: [0],
                    type: 'slider',
                    top: '90%',
                    start: 0,
                    end: 100,
                    group: 'stock-zoom-group'
                }
            ],
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross'
                },
                backgroundColor: 'rgba(42, 42, 43, 0.95)',
                borderColor: '#606063',
                textStyle: {
                    color: '#e6e6e6'
                }
            },
            series: [
                {
                    name: 'K',
                    type: 'line',
                    data: [],
                    smooth: true,
                    lineStyle: {
                        opacity: 0.8,
                        width: 1,
                        color: '#FF6B6B'
                    },
                    showSymbol: false
                },
                {
                    name: 'D',
                    type: 'line',
                    data: [],
                    smooth: true,
                    lineStyle: {
                        opacity: 0.8,
                        width: 1,
                        color: '#4ECDC4'
                    },
                    showSymbol: false
                },
                {
                    name: 'J',
                    type: 'line',
                    data: [],
                    smooth: true,
                    lineStyle: {
                        opacity: 0.8,
                        width: 1,
                        color: '#45B7D1'
                    },
                    showSymbol: false
                }
            ]
        };

        chart.setOption(option);
        this.charts['kdj'] = chart;
        return chart;
    }

    /**
 * 联动所有图表
 */
    linkCharts() {
        echarts.connect('stock-group');
        echarts.connect('stock-zoom-group');
    }

    /**
     * 更新K线图数据
     */
    updateKlineChart(data) {
        const chart = this.charts['kline'];
        if (!chart || !data) return;

        const klineData = data.map(item => [
            item.open,
            item.close,
            item.low,
            item.high
        ]);

        const times = data.map(item => this.formatTime(item.timestamp));
        const closes = data.map(item => item.close);

        // 计算移动平均线
        const ma3 = window.dataCalculator.calculateMA(closes, 3);
        const ma5 = window.dataCalculator.calculateMA(closes, 5);
        const ma10 = window.dataCalculator.calculateMA(closes, 10);
        const ma15 = window.dataCalculator.calculateMA(closes, 15);

        chart.setOption({
            xAxis: {
                data: times
            },
            series: [
                { data: klineData },
                { data: ma3 },
                { data: ma5 },
                { data: ma10 },
                { data: ma15 }
            ]
        });

        // 更新状态栏
        this.updateKlineStatus(data[data.length - 1], ma3, ma5, ma10, ma15);
        this.currentData.kline = data;
    }

    /**
     * 更新成交量图数据
     */
    updateVolumeChart(data) {
        const chart = this.charts['volume'];
        if (!chart || !data) return;

        const times = data.map(item => this.formatTime(item.timestamp));
        const volumes = data.map(item => item.volume);

        // 计算成交量移动平均
        const volumeMa5 = window.dataCalculator.calculateMA(volumes, 5);
        const volumeMa10 = window.dataCalculator.calculateMA(volumes, 10);
        const volumeMa15 = window.dataCalculator.calculateMA(volumes, 15);

        chart.setOption({
            xAxis: {
                data: times
            },
            series: [
                { data: volumes },
                { data: volumeMa5 },
                { data: volumeMa10 },
                { data: volumeMa15 }
            ]
        });

        // 更新状态栏
        this.updateVolumeStatus(data[data.length - 1], volumeMa5, volumeMa10, volumeMa15);
        this.currentData.volume = data;
    }

    /**
     * 更新MACD图数据
     */
    updateMACDChart(data) {
        const chart = this.charts['macd'];
        if (!chart || !data) return;

        const times = data.map(item => this.formatTime(item.timestamp));
        const closes = data.map(item => item.close);

        // 计算MACD
        const macdData = window.dataCalculator.calculateMACD(closes);

        chart.setOption({
            xAxis: {
                data: times
            },
            series: [
                { data: macdData.dif },
                { data: macdData.dea },
                { data: macdData.macd }
            ]
        });

        // 更新状态栏
        this.updateMACDStatus(macdData);
        this.currentData.macd = macdData;
    }

    /**
     * 更新KDJ图数据
     */
    updateKDJChart(data) {
        const chart = this.charts['kdj'];
        if (!chart || !data) return;

        const times = data.map(item => this.formatTime(item.timestamp));
        const highs = data.map(item => item.high);
        const lows = data.map(item => item.low);
        const closes = data.map(item => item.close);

        // 计算KDJ
        const kdjData = window.dataCalculator.calculateKDJ(highs, lows, closes);

        chart.setOption({
            xAxis: {
                data: times
            },
            series: [
                { data: kdjData.k },
                { data: kdjData.d },
                { data: kdjData.j }
            ]
        });

        // 更新状态栏
        this.updateKDJStatus(kdjData);
        this.currentData.kdj = kdjData;
    }

    /**
     * 更新K线状态栏
     */
    updateKlineStatus(lastData, ma3, ma5, ma10, ma15) {
        const statusElement = document.getElementById('kline-status');
        if (!statusElement || !lastData) return;

        const isUp = lastData.open > lastData.close;

        const lastIndex = ma3.length - 1;
        statusElement.innerHTML = `
            开盘: <span class="${isUp ? 'price-sell' : 'price-buy'}">${lastData.open.toFixed(2)}</span>
            最高: <span class="${isUp ? 'price-sell' : 'price-buy'}">${lastData.high.toFixed(2)}</span>
            最低: <span class="${isUp ? 'price-sell' : 'price-buy'}">${lastData.low.toFixed(2)}</span>
            收盘: <span class="${isUp ? 'price-sell' : 'price-buy'}">${lastData.close.toFixed(2)}</span>
            MA3: <span>${ma3[lastIndex] ? ma3[lastIndex].toFixed(2) : '--'}</span>
            MA5: <span>${ma5[lastIndex] ? ma5[lastIndex].toFixed(2) : '--'}</span>
            MA10: <span>${ma10[lastIndex] ? ma10[lastIndex].toFixed(2) : '--'}</span>
            MA15: <span>${ma15[lastIndex] ? ma15[lastIndex].toFixed(2) : '--'}</span>
        `;
    }

    /**
     * 更新成交量状态栏
     */
    updateVolumeStatus(lastData, ma5, ma10, ma15) {
        const statusElement = document.getElementById('volume-status');
        if (!statusElement || !lastData) return;

        const lastIndex = ma5.length - 1;
        statusElement.innerHTML = `
            成交量: ${this.formatVolume(lastData.volume)} 
            5分钟均量: ${ma5[lastIndex] ? this.formatVolume(ma5[lastIndex]) : '--'} 
            10分钟均量: ${ma10[lastIndex] ? this.formatVolume(ma10[lastIndex]) : '--'} 
            15分钟均量: ${ma15[lastIndex] ? this.formatVolume(ma15[lastIndex]) : '--'}
        `;
    }

    /**
     * 更新MACD状态栏
     */
    updateMACDStatus(macdData) {
        const statusElement = document.getElementById('macd-status');
        if (!statusElement || !macdData) return;

        const lastIndex = macdData.dif.length - 1;
        statusElement.innerHTML = `
            DIF: ${macdData.dif[lastIndex] ? macdData.dif[lastIndex].toFixed(4) : '--'} 
            DEA: ${macdData.dea[lastIndex] ? macdData.dea[lastIndex].toFixed(4) : '--'} 
            MACD: ${macdData.macd[lastIndex] ? macdData.macd[lastIndex].toFixed(4) : '--'}
        `;
    }

    /**
     * 更新KDJ状态栏
     */
    updateKDJStatus(kdjData) {
        const statusElement = document.getElementById('kdj-status');
        if (!statusElement || !kdjData) return;

        const lastIndex = kdjData.k.length - 1;
        statusElement.innerHTML = `
            K: ${kdjData.k[lastIndex] ? kdjData.k[lastIndex].toFixed(2) : '--'} 
            D: ${kdjData.d[lastIndex] ? kdjData.d[lastIndex].toFixed(2) : '--'} 
            J: ${kdjData.j[lastIndex] ? kdjData.j[lastIndex].toFixed(2) : '--'}
        `;
    }

    /**
     * 重新调整图表大小
     */
    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.resize();
            }
        });
    }

    /**
     * 销毁所有图表
     */
    dispose() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.dispose();
            }
        });
        this.charts = {};
    }

    /**
     * 格式化时间
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }

    /**
     * 格式化成交量
     */
    formatVolume(volume) {
        if (volume >= 10000) {
            return (volume / 10000).toFixed(1) + '万';
        } else if (volume >= 1000) {
            return (volume / 1000).toFixed(1) + 'k';
        }
        return volume.toString();
    }
}

// 创建全局实例
window.chartComponents = new ChartComponents();
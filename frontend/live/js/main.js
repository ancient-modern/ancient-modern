/**
 * 主应用程序
 * 整合所有模块，管理数据流和用户交互
 */

class TradingApp {
    constructor() {
        this.currentSymbol = 'MOCK_STOCK';
        this.isDataLoading = false;
        this.updateInterval = null;
        this.priceUpdateInterval = null;
        this.accounts = [];
        
        this.init();
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            console.log('正在初始化交易数据可视化平台...');
            
            // 等待DOM加载完成
            await this.waitForDOM();
            
            // 初始化图表
            this.initCharts();
            
            // 加载布局配置
            await window.layoutManager.loadLayout();
            
            // 生成示例数据
            await this.generateSampleData();
            
            // 初始化账户数据
            await this.initAccountData();
            
            // 启动数据更新
            this.startDataUpdates();
            
            // 启动时间更新
            this.startTimeUpdate();
            
            // 初始化5档价格
            this.initPriceData();
            
            console.log('平台初始化完成');
            
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.showError('应用初始化失败: ' + error.message);
        }
    }

    /**
     * 等待DOM加载完成
     */
    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    /**
     * 初始化图表
     */
    initCharts() {
        console.log('正在初始化图表组件...');
        
        window.chartComponents.initKlineChart('kline-chart');
        window.chartComponents.initVolumeChart('volume-chart');
        window.chartComponents.initMACDChart('macd-chart');
        window.chartComponents.initKDJChart('kdj-chart');

         window.chartComponents.linkCharts();
        
        console.log('图表组件初始化完成');
    }

    /**
     * 生成示例交易数据
     */
    async generateSampleData() {
        console.log('正在生成示例数据...');
        
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const dataPoints = 200; // 生成200个数据点
        const interval = 5 * 60 * 1000; // 5分钟间隔
        
        let basePrice = 100;
        const data = [];
        
        for (let i = 0; i < dataPoints; i++) {
            const timestamp = now - (dataPoints - i) * interval;
            
            // 生成随机价格变动
            const change = (Math.random() - 0.5) * 4; // -2到2的随机变动
            basePrice = Math.max(50, basePrice + change);
            
            const open = basePrice + (Math.random() - 0.5) * 2;
            const close = open + (Math.random() - 0.5) * 3;
            const high = Math.max(open, close) + Math.random() * 2;
            const low = Math.min(open, close) - Math.random() * 2;
            const volume = Math.floor(Math.random() * 1000000) + 100000;
            
            const dataPoint = {
                timestamp,
                symbol: this.currentSymbol,
                open: parseFloat(open.toFixed(2)),
                high: parseFloat(high.toFixed(2)),
                low: parseFloat(low.toFixed(2)),
                close: parseFloat(close.toFixed(2)),
                volume,
                date: new Date(timestamp).toISOString().split('T')[0]
            };
            
            data.push(dataPoint);
            basePrice = close;
        }
        
        // 保存到数据库
        try {
            await window.dataStorage.saveTradingDataBatch(data);
            console.log(`已生成并保存${data.length}条示例数据`);
            
            // 更新图表
            this.updateAllCharts(data);
            
        } catch (error) {
            console.error('保存示例数据失败:', error);
        }
    }

    /**
     * 初始化账户数据
     */
    async initAccountData() {
        console.log('正在初始化账户数据...');
        
        const accounts = [
            {
                account_id: 'test_account_1',
                balance: 100000,
                available: 85000,
                market_value: 15000,
                pnl: 500,
                positions: [
                    { symbol: this.currentSymbol, quantity: 1000, avg_price: 98.5 }
                ]
            },
            {
                account_id: 'test_account_2',
                balance: 50000,
                available: 30000,
                market_value: 20000,
                pnl: -200,
                positions: [
                    { symbol: this.currentSymbol, quantity: 500, avg_price: 102.3 }
                ]
            },
            {
                account_id: 'test_account_3',
                balance: 200000,
                available: 150000,
                market_value: 50000,
                pnl: 1200,
                positions: [
                    { symbol: this.currentSymbol, quantity: 2000, avg_price: 96.8 }
                ]
            }
        ];

        // 保存账户数据
        for (const account of accounts) {
            await window.dataStorage.saveAccountInfo(account);
        }
        
        this.accounts = accounts;
        this.updateAccountDisplay();
        
        console.log('账户数据初始化完成');
    }

    /**
     * 初始化5档价格数据
     */
    initPriceData() {
        this.updatePriceData();
        
        // 每3秒更新一次价格数据
        this.priceUpdateInterval = setInterval(() => {
            this.updatePriceData();
        }, 3000);
    }

    /**
     * 更新5档价格数据
     */
    async updatePriceData() {
        try {
            // 获取最新价格作为基准
            const latestData = await window.dataStorage.getTradingData(this.currentSymbol, null, null, 1);
            let basePrice = 100;
            
            if (latestData && latestData.length > 0) {
                basePrice = latestData[0].close;
            }
            
            // 生成5档买卖价格
            const bidPrices = [];
            const bidVolumes = [];
            const askPrices = [];
            const askVolumes = [];
            
            for (let i = 0; i < 5; i++) {
                // 买价递减
                bidPrices.push((basePrice - (i + 1) * 0.01).toFixed(2));
                bidVolumes.push(Math.floor(Math.random() * 10000) + 1000);
                
                // 卖价递增
                askPrices.push((basePrice + (i + 1) * 0.01).toFixed(2));
                askVolumes.push(Math.floor(Math.random() * 10000) + 1000);
            }
            
            const priceData = {
                symbol: this.currentSymbol,
                bid_prices: bidPrices,
                bid_volumes: bidVolumes,
                ask_prices: askPrices,
                ask_volumes: askVolumes
            };
            
            // 保存价格数据
            await window.dataStorage.savePriceLevels(priceData);
            
            // 更新显示
            this.updatePriceDisplay(priceData);
            
        } catch (error) {
            console.error('更新价格数据失败:', error);
        }
    }

    /**
     * 更新价格显示
     */
    updatePriceDisplay(priceData) {
        const container = $('#price-data');
        let html = '';
        
        for (let i = 0; i < 5; i++) {
            html += `
                <div class="price-row">
                    <span>卖${5 - i}</span>
                    <span class="price-sell">${priceData.ask_prices[4 - i]}</span>
                    <span>${this.formatVolume(priceData.ask_volumes[4 - i])}</span>
                    <span class="price-buy">${priceData.bid_prices[4 - i]}</span>
                    <span>${this.formatVolume(priceData.bid_volumes[4 - i])}</span>
                </div>
            `;
        }
        
        container.html(html);
        container.addClass('data-updated');
        setTimeout(() => container.removeClass('data-updated'), 500);
    }

    /**
     * 更新账户显示
     */
    updateAccountDisplay() {
        this.accounts.forEach((account, index) => {
            const accountNum = index + 1;
            const balanceElement = $(`#account${accountNum}-balance`);
            const availableElement = $(`#account${accountNum}-available`);
            const marketValueElement = $(`#account${accountNum}-market-value`);
            const pnlElement = $(`#account${accountNum}-pnl`);
            
            if (balanceElement.length) {
                balanceElement.text(`¥${this.formatMoney(account.balance)}`);
                availableElement.text(`¥${this.formatMoney(account.available)}`);
                marketValueElement.text(`¥${this.formatMoney(account.market_value)}`);
                
                // 设置盈亏颜色
                pnlElement.text(`${account.pnl >= 0 ? '+' : ''}¥${this.formatMoney(Math.abs(account.pnl))}`);
                pnlElement.removeClass('profit loss');
                pnlElement.addClass(account.pnl >= 0 ? 'profit' : 'loss');
            }
        });
    }

    /**
     * 更新所有图表
     */
    updateAllCharts(data) {
        if (!data || data.length === 0) return;
        
        window.chartComponents.updateKlineChart(data);
        window.chartComponents.updateVolumeChart(data);
        window.chartComponents.updateMACDChart(data);
        window.chartComponents.updateKDJChart(data);
    }

    /**
     * 启动数据更新
     */
    startDataUpdates() {
        // 每30秒添加新的数据点
        this.updateInterval = setInterval(async () => {
            await this.addNewDataPoint();
        }, 1000);
    }

    /**
     * 添加新的数据点
     */
    async addNewDataPoint() {
        try {
            // 获取最新数据
            const latestData = await window.dataStorage.getTradingData(this.currentSymbol, null, null, 1);
            if (!latestData || latestData.length === 0) return;
            
            const lastData = latestData[0];
            const now = Date.now();
            
            // 生成新的数据点
            const change = (Math.random() - 0.5) * 3;
            const open = lastData.close;
            const close = open + change;
            const high = Math.max(open, close) + Math.random() * 1;
            const low = Math.min(open, close) - Math.random() * 1;
            const volume = Math.floor(Math.random() * 800000) + 200000;
            
            const newData = {
                timestamp: now,
                symbol: this.currentSymbol,
                open: parseFloat(open.toFixed(2)),
                high: parseFloat(high.toFixed(2)),
                low: parseFloat(low.toFixed(2)),
                close: parseFloat(close.toFixed(2)),
                volume,
                date: new Date(now).toISOString().split('T')[0]
            };
            
            // 保存新数据
            await window.dataStorage.saveTradingData(newData);
            
            // 获取最新的数据集合
            const allData = await window.dataStorage.getTradingData(this.currentSymbol, null, null, 200);
            allData.reverse(); // 按时间正序排列
            
            // 更新图表
            this.updateAllCharts(allData);
            
            // 更新账户的模拟盈亏
            await this.updateAccountPnL(newData.close);
            
        } catch (error) {
            console.error('添加新数据点失败:', error);
        }
    }

    /**
     * 更新账户盈亏
     */
    async updateAccountPnL(currentPrice) {
        for (let i = 0; i < this.accounts.length; i++) {
            const account = this.accounts[i];
            
            // 计算持仓盈亏
            if (account.positions && account.positions.length > 0) {
                const position = account.positions[0];
                const priceDiff = currentPrice - position.avg_price;
                const newPnl = priceDiff * position.quantity;
                
                account.pnl = parseFloat(newPnl.toFixed(2));
                account.market_value = parseFloat((currentPrice * position.quantity).toFixed(2));
                
                // 保存更新的账户信息
                await window.dataStorage.saveAccountInfo(account);
            }
        }
        
        // 更新显示
        this.updateAccountDisplay();
    }

    /**
     * 启动时间更新
     */
    startTimeUpdate() {
        const updateTime = () => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false });
            $('#current-time').text(timeStr);
        };
        
        updateTime();
        setInterval(updateTime, 1000);
    }

    /**
     * 格式化金额
     */
    formatMoney(amount) {
        return amount.toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
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

    /**
     * 显示错误信息
     */
    showError(message) {
        $('#data-status').text(`错误: ${message}`).css('color', '#ec0000');
        console.error(message);
    }

    /**
     * 显示加载状态
     */
    showLoading(message = '正在加载数据...') {
        $('#data-status').text(message).css('color', '#b3b3b3');
    }

    /**
     * 显示正常状态
     */
    showNormal(message = '数据连接正常') {
        $('#data-status').text(message).css('color', '#00da3c');
    }

    /**
     * 清理资源
     */
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        if (this.priceUpdateInterval) {
            clearInterval(this.priceUpdateInterval);
        }
        
        window.chartComponents.dispose();
    }

    /**
     * 重新加载数据
     */
    async reloadData() {
        try {
            this.showLoading('正在重新加载数据...');
            
            const data = await window.dataStorage.getTradingData(this.currentSymbol, null, null, 200);
            data.reverse();
            
            this.updateAllCharts(data);
            this.showNormal();
            
        } catch (error) {
            this.showError('重新加载数据失败: ' + error.message);
        }
    }

    /**
     * 导出数据
     */
    async exportData() {
        try {
            const data = await window.dataStorage.getTradingData(this.currentSymbol, null, null, 1000);
            const jsonStr = JSON.stringify(data, null, 2);
            
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `trading_data_${this.currentSymbol}_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
        } catch (error) {
            this.showError('导出数据失败: ' + error.message);
        }
    }
}

// 页面加载完成后启动应用
$(document).ready(() => {
    window.tradingApp = new TradingApp();
    
    // 绑定键盘快捷键
    $(document).on('keydown', (e) => {
        // Ctrl+R: 重新加载数据
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            window.tradingApp.reloadData();
        }
        
        // Ctrl+E: 导出数据
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            window.tradingApp.exportData();
        }
        
        // Ctrl+S: 保存布局
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            window.layoutManager.saveLayout();
        }
    });
    
    // 页面卸载时清理资源
    $(window).on('beforeunload', () => {
        if (window.tradingApp) {
            window.tradingApp.cleanup();
        }
    });
});
/**
 * 数据存储模块
 * 使用Dexie.js管理IndexedDB本地存储
 */

class TradingDataStorage {
    constructor() {
        // 初始化数据库
        this.db = new Dexie('TradingDataDB');
        
        // 定义数据库架构
        this.db.version(1).stores({
            trading_data: '++id, timestamp, symbol, open, high, low, close, volume, date',
            indicators: '++id, timestamp, symbol, macd_dif, macd_dea, macd, kdj_k, kdj_d, kdj_j, ma3, ma5, ma10, ma15, volume_ma5, volume_ma10, volume_ma15',
            account_info: '++id, account_id, balance, available, market_value, pnl, positions, update_time',
            user_settings: 'setting_key, setting_value',
            price_levels: '++id, timestamp, symbol, bid_prices, bid_volumes, ask_prices, ask_volumes'
        });

        // 打开数据库
        this.db.open().catch(err => {
            console.error('数据库打开失败:', err);
        });
    }

    /**
     * 保存K线数据
     */
    async saveTradingData(data) {
        try {
            return await this.db.trading_data.add(data);
        } catch (error) {
            console.error('保存交易数据失败:', error);
            throw error;
        }
    }

    /**
     * 批量保存K线数据
     */
    async saveTradingDataBatch(dataArray) {
        try {
            return await this.db.trading_data.bulkAdd(dataArray);
        } catch (error) {
            console.error('批量保存交易数据失败:', error);
            throw error;
        }
    }

    /**
     * 获取K线数据
     */
    async getTradingData(symbol, startTime, endTime, limit = 1000) {
        try {
            let query = this.db.trading_data.where('symbol').equals(symbol);
            
            if (startTime && endTime) {
                query = query.and(item => item.timestamp >= startTime && item.timestamp <= endTime);
            }
            
            return query.limit(limit).reverse().toArray();
        } catch (error) {
            console.error('获取交易数据失败:', error);
            throw error;
        }
    }

    /**
     * 保存技术指标数据
     */
    async saveIndicators(data) {
        try {
            return await this.db.indicators.add(data);
        } catch (error) {
            console.error('保存指标数据失败:', error);
            throw error;
        }
    }

    /**
     * 获取技术指标数据
     */
    async getIndicators(symbol, startTime, endTime, limit = 1000) {
        try {
            let query = this.db.indicators.where('symbol').equals(symbol);
            
            if (startTime && endTime) {
                query = query.and(item => item.timestamp >= startTime && item.timestamp <= endTime);
            }
            
            return query.limit(limit).reverse().toArray();
        } catch (error) {
            console.error('获取指标数据失败:', error);
            throw error;
        }
    }

    /**
     * 保存账户信息
     */
    async saveAccountInfo(accountData) {
        try {
            // 先删除旧数据，再插入新数据
            await this.db.account_info.where('account_id').equals(accountData.account_id).delete();
            return await this.db.account_info.add({
                ...accountData,
                update_time: Date.now()
            });
        } catch (error) {
            console.error('保存账户信息失败:', error);
            throw error;
        }
    }

    /**
     * 获取账户信息
     */
    async getAccountInfo(accountId) {
        try {
            return await this.db.account_info.where('account_id').equals(accountId).first();
        } catch (error) {
            console.error('获取账户信息失败:', error);
            throw error;
        }
    }

    /**
     * 获取所有账户信息
     */
    async getAllAccountInfo() {
        try {
            return await this.db.account_info.orderBy('account_id').toArray();
        } catch (error) {
            console.error('获取所有账户信息失败:', error);
            throw error;
        }
    }

    /**
     * 保存5档价格数据
     */
    async savePriceLevels(data) {
        try {
            return await this.db.price_levels.add({
                ...data,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('保存5档价格数据失败:', error);
            throw error;
        }
    }

    /**
     * 获取最新5档价格数据
     */
    async getLatestPriceLevels(symbol) {
        try {
            return await this.db.price_levels
                .where('symbol').equals(symbol)
                .orderBy('timestamp')
                .reverse()
                .first();
        } catch (error) {
            console.error('获取5档价格数据失败:', error);
            throw error;
        }
    }

    /**
     * 保存用户设置
     */
    async saveSetting(key, value) {
        try {
            return await this.db.user_settings.put({
                setting_key: key,
                setting_value: value
            });
        } catch (error) {
            console.error('保存用户设置失败:', error);
            throw error;
        }
    }

    /**
     * 获取用户设置
     */
    async getSetting(key, defaultValue = null) {
        try {
            const setting = await this.db.user_settings.get(key);
            return setting ? setting.setting_value : defaultValue;
        } catch (error) {
            console.error('获取用户设置失败:', error);
            return defaultValue;
        }
    }

    /**
     * 清理过期数据
     */
    async cleanupOldData(daysToKeep = 30) {
        try {
            const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
            
            await Promise.all([
                this.db.trading_data.where('timestamp').below(cutoffTime).delete(),
                this.db.indicators.where('timestamp').below(cutoffTime).delete(),
                this.db.price_levels.where('timestamp').below(cutoffTime).delete()
            ]);
            
            console.log(`清理了${daysToKeep}天前的历史数据`);
        } catch (error) {
            console.error('清理历史数据失败:', error);
            throw error;
        }
    }

    /**
     * 获取数据库统计信息
     */
    async getStorageStats() {
        try {
            const [tradingCount, indicatorCount, accountCount, priceCount] = await Promise.all([
                this.db.trading_data.count(),
                this.db.indicators.count(),
                this.db.account_info.count(),
                this.db.price_levels.count()
            ]);

            return {
                tradingDataCount: tradingCount,
                indicatorCount: indicatorCount,
                accountCount: accountCount,
                priceLevelCount: priceCount
            };
        } catch (error) {
            console.error('获取存储统计失败:', error);
            throw error;
        }
    }

    /**
     * 导出数据
     */
    async exportData(tableName) {
        try {
            return await this.db[tableName].toArray();
        } catch (error) {
            console.error(`导出${tableName}数据失败:`, error);
            throw error;
        }
    }

    /**
     * 重置数据库
     */
    async resetDatabase() {
        try {
            await this.db.delete();
            await this.db.open();
            console.log('数据库重置成功');
        } catch (error) {
            console.error('重置数据库失败:', error);
            throw error;
        }
    }
}

// 数据计算工具类
class DataCalculator {
    /**
     * 计算移动平均线
     */
    static calculateMA(prices, period) {
        const result = [];
        for (let i = 0; i < prices.length; i++) {
            if (i < period - 1) {
                result.push(null);
            } else {
                const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
                result.push(sum / period);
            }
        }
        return result;
    }

    /**
     * 计算MACD指标
     */
    static calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        const ema12 = this.calculateEMA(prices, fastPeriod);
        const ema26 = this.calculateEMA(prices, slowPeriod);
        
        const dif = ema12.map((value, index) => 
            value !== null && ema26[index] !== null ? value - ema26[index] : null
        );
        
        const dea = this.calculateEMA(dif.filter(v => v !== null), signalPeriod);
        const macd = dif.map((difValue, index) => 
            difValue !== null && dea[index] !== null ? 2 * (difValue - dea[index]) : null
        );

        return { dif, dea, macd };
    }

    /**
     * 计算EMA (指数移动平均)
     */
    static calculateEMA(prices, period) {
        const result = [];
        const multiplier = 2 / (period + 1);
        let ema = prices.find(price => price !== null);

        for (let i = 0; i < prices.length; i++) {
            if (prices[i] === null) {
                result.push(null);
                continue;
            }

            if (result.length === 0) {
                result.push(prices[i]);
                ema = prices[i];
            } else {
                ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
                result.push(ema);
            }
        }
        return result;
    }

    /**
     * 计算KDJ指标
     */
    static calculateKDJ(highs, lows, closes, period = 9) {
        const rsv = [];
        const k = [];
        const d = [];
        const j = [];

        for (let i = 0; i < closes.length; i++) {
            if (i < period - 1) {
                rsv.push(null);
                k.push(null);
                d.push(null);
                j.push(null);
            } else {
                const periodHighs = highs.slice(i - period + 1, i + 1);
                const periodLows = lows.slice(i - period + 1, i + 1);
                const currentClose = closes[i];

                const highestHigh = Math.max(...periodHighs);
                const lowestLow = Math.min(...periodLows);
                
                const currentRSV = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
                rsv.push(currentRSV);

                // K值计算
                const prevK = k[i - 1] || 50;
                const currentK = (2 * prevK + currentRSV) / 3;
                k.push(currentK);

                // D值计算
                const prevD = d[i - 1] || 50;
                const currentD = (2 * prevD + currentK) / 3;
                d.push(currentD);

                // J值计算
                const currentJ = 3 * currentK - 2 * currentD;
                j.push(currentJ);
            }
        }

        return { k, d, j, rsv };
    }
}

// 创建全局实例
window.dataStorage = new TradingDataStorage();
window.dataCalculator = DataCalculator;
/**
 * Dexie本地存储模块
 * 基于IndexedDB的数据持久化解决方案
 * 
 * 功能特性:
 * - 实时数据本地缓存
 * - 交易会话记录管理
 * - 图表配置备份
 * - 连接日志存储
 * - 数据查询和清理策略
 */

class DatabaseManager {
    constructor() {
        this.db = null;
        this.isInitialized = false;
        this.cacheStats = {
            totalRecords: 0,
            todayRecords: 0,
            cacheSize: 0
        };
        
        // 数据清理配置
        this.cleanupConfig = {
            realtimeDataDays: 7,     // 实时数据保留7天
            tradingSessions: 30,      // 交易会话保留30天
            connectionLogsDays: 3     // 连接日志保留3天
        };
        
        this.initDatabase();
    }
    
    /**
     * 初始化Dexie数据库
     */
    initDatabase() {
        try {
            // 创建数据库实例
            this.db = new Dexie('RealtimeDataVisualizationDB');
            
            // 定义数据库模式
            this.db.version(3).stores({
                // 实时数据序列表
                realtime_series: '++id, timestamp, series_name, value, trading_session, sequence_id',
                
                // 交易会话记录表
                trading_sessions: '++id, session_date, start_time, end_time, data_count, session_id',
                
                // 图表配置表
                chart_configs: '++id, config_id, grid_name, chart_options, created_at, updated_at',
                
                // 连接日志表
                connection_logs: '++id, timestamp, event_type, message, session_id, duration'
            });
            
            // 设置索引
            // this.setupIndexes();
            
            // 打开数据库
            this.db.open().then(() => {
                this.isInitialized = true;
                console.log('✅ Dexie数据库初始化完成');
                this.updateCacheStats();
                // this.scheduleCleanup();
            }).catch(error => {
                console.error('❌ 数据库打开失败:', error);
                throw error;
            });
            
        } catch (error) {
            console.error('❌ 数据库初始化失败:', error);
            throw error;
        }
    }
    
    /**
     * 设置数据库索引
     */
    setupIndexes() {
        // 为常用查询字段添加复合索引
        this.db.realtime_series.hook('ready', () => {
            // 时间戳和序列名复合索引
            this.db.realtime_series.defineIndex('timestamp+series_name', ['timestamp', 'series_name']);
            
            // 交易会话和时间戳索引
            this.db.realtime_series.defineIndex('trading_session+timestamp', ['trading_session', 'timestamp']);
        });
        
        this.db.trading_sessions.hook('ready', () => {
            // 会话日期索引
            this.db.trading_sessions.defineIndex('session_date', 'session_date');
        });
    }
    
    /**
     * 保存实时数据到数据库
     * @param {Object} dataPacket - 实时数据包
     */
    async saveRealtimeData(dataPacket) {
        if (!this.isInitialized) {
            console.warn('⚠️ 数据库未初始化，跳过数据保存');
            return;
        }
        
        try {
            const { metadata, ppie_group, vvie_group } = dataPacket;
            const timestamp = metadata.timestamp;
            const trading_session = metadata.trading_session || '';
            const sequence_id = metadata.sequence_id;
            
            // 准备批量插入的数据
            const records = [];
            
            // 处理PPIE数据组
            for (const [seriesName, dataPoints] of Object.entries(ppie_group)) {
                for (const [pointTime, pointValue] of dataPoints) {
                    records.push({
                        timestamp: pointTime,
                        series_name: seriesName.replace('_data', '').toUpperCase(),
                        value: pointValue,
                        trading_session: trading_session,
                        sequence_id: sequence_id,
                        data_group: 'PPIE'
                    });
                }
            }
            
            // 处理VVIE数据组
            for (const [seriesName, dataPoints] of Object.entries(vvie_group)) {
                for (const [pointTime, pointValue] of dataPoints) {
                    records.push({
                        timestamp: pointTime,
                        series_name: seriesName.replace('_data', '').toUpperCase(),
                        value: pointValue,
                        trading_session: trading_session,
                        sequence_id: sequence_id,
                        data_group: 'VVIE'
                    });
                }
            }
            
            // 批量插入数据
            await this.db.realtime_series.bulkAdd(records);
            
            // 更新统计信息
            this.cacheStats.totalRecords += records.length;
            this.updateCacheDisplay();
            
            console.debug(`💾 保存${records.length}条实时数据到缓存`);
            
        } catch (error) {
            console.error('❌ 保存实时数据失败:', error);
            throw error;
        }
    }
    
    /**
     * 查询历史数据
     * @param {Object} options - 查询选项
     */
    async queryHistoricalData(options = {}) {
        if (!this.isInitialized) {
            throw new Error('数据库未初始化');
        }
        
        try {
            const {
                startTime,
                endTime,
                seriesNames = [],
                tradingSession,
                limit = 1000,
                offset = 0
            } = options;
            
            let query = this.db.realtime_series;
            
            // 时间范围过滤
            if (startTime && endTime) {
                query = query.where('timestamp').between(startTime, endTime);
            } else if (startTime) {
                query = query.where('timestamp').above(startTime);
            } else if (endTime) {
                query = query.where('timestamp').below(endTime);
            }
            
            // 序列名过滤
            if (seriesNames.length > 0) {
                query = query.filter(record => seriesNames.includes(record.series_name));
            }
            
            // 交易会话过滤
            if (tradingSession) {
                query = query.filter(record => record.trading_session === tradingSession);
            }
            
            // 分页和排序
            const results = await query
                .orderBy('timestamp')
                .offset(offset)
                .limit(limit)
                .toArray();
            
            console.log(`📊 查询历史数据: ${results.length} 条记录`);
            return this.formatHistoricalData(results);
            
        } catch (error) {
            console.error('❌ 查询历史数据失败:', error);
            throw error;
        }
    }
    
    /**
     * 格式化历史数据为图表格式
     */
    formatHistoricalData(records) {
        const formattedData = {
            ppie_group: {
                p_data: [],
                pib_data: [],
                psd_data: [],
                peb_data: []
            },
            vvie_group: {
                v_data: [],
                vib_data: [],
                vsd_data: [],
                veb_data: []
            }
        };
        
        // 按序列名分组数据
        records.forEach(record => {
            const seriesKey = `${record.series_name.toLowerCase()}_data`;
            const dataPoint = [record.timestamp, record.value];
            
            if (record.data_group === 'PPIE' && formattedData.ppie_group[seriesKey]) {
                formattedData.ppie_group[seriesKey].push(dataPoint);
            } else if (record.data_group === 'VVIE' && formattedData.vvie_group[seriesKey]) {
                formattedData.vvie_group[seriesKey].push(dataPoint);
            }
        });
        
        // 按时间戳排序
        for (const group of Object.values(formattedData)) {
            for (const series of Object.values(group)) {
                series.sort((a, b) => a[0] - b[0]);
            }
        }
        
        return formattedData;
    }
    
    /**
     * 保存交易会话记录
     */
    async saveTradingSession(sessionData) {
        if (!this.isInitialized) {
            return;
        }
        
        try {
            const session = {
                session_date: new Date().toDateString(),
                start_time: sessionData.start_time,
                end_time: sessionData.end_time || Date.now(),
                data_count: sessionData.data_count || 0,
                session_id: sessionData.session_id,
                created_at: Date.now()
            };
            
            await this.db.trading_sessions.add(session);
            console.log('💾 交易会话记录已保存:', session.session_id);
            
        } catch (error) {
            console.error('❌ 保存交易会话失败:', error);
        }
    }
    
    /**
     * 保存图表配置
     */
    async saveChartConfig(configId, gridName, chartOptions) {
        if (!this.isInitialized) {
            return;
        }
        
        try {
            const config = {
                config_id: configId,
                grid_name: gridName,
                chart_options: JSON.stringify(chartOptions),
                created_at: Date.now(),
                updated_at: Date.now()
            };
            
            // 检查是否已存在配置
            const existing = await this.db.chart_configs
                .where('config_id')
                .equals(configId)
                .first();
            
            if (existing) {
                // 更新现有配置
                await this.db.chart_configs
                    .where('config_id')
                    .equals(configId)
                    .modify({ 
                        chart_options: config.chart_options,
                        updated_at: config.updated_at 
                    });
            } else {
                // 创建新配置
                await this.db.chart_configs.add(config);
            }
            
            console.log('💾 图表配置已保存:', configId);
            
        } catch (error) {
            console.error('❌ 保存图表配置失败:', error);
        }
    }
    
    /**
     * 加载图表配置
     */
    async loadChartConfig(configId) {
        if (!this.isInitialized) {
            return null;
        }
        
        try {
            const config = await this.db.chart_configs
                .where('config_id')
                .equals(configId)
                .first();
            
            if (config) {
                return JSON.parse(config.chart_options);
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ 加载图表配置失败:', error);
            return null;
        }
    }
    
    /**
     * 记录连接日志
     */
    async logConnection(eventType, message, sessionId = '', duration = 0) {
        if (!this.isInitialized) {
            return;
        }
        
        try {
            const log = {
                timestamp: Date.now(),
                event_type: eventType,
                message: message,
                session_id: sessionId,
                duration: duration
            };
            
            await this.db.connection_logs.add(log);
            
        } catch (error) {
            console.error('❌ 记录连接日志失败:', error);
        }
    }
    
    /**
     * 获取缓存统计信息
     */
    async updateCacheStats() {
        if (!this.isInitialized) {
            return;
        }
        
        try {
            // 总记录数
            this.cacheStats.totalRecords = await this.db.realtime_series.count();
            
            // 今日记录数
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTimestamp = today.getTime();
            
            this.cacheStats.todayRecords = await this.db.realtime_series
                .where('timestamp')
                .above(todayTimestamp)
                .count();
            
            // 计算缓存大小（估算）
            const sampleRecord = await this.db.realtime_series.limit(1).first();
            if (sampleRecord) {
                const recordSize = JSON.stringify(sampleRecord).length * 2; // 估算字节数
                this.cacheStats.cacheSize = this.cacheStats.totalRecords * recordSize;
            }
            
            this.updateCacheDisplay();
            
        } catch (error) {
            console.error('❌ 更新缓存统计失败:', error);
        }
    }
    
    /**
     * 更新缓存显示
     */
    updateCacheDisplay() {
        $('#cached-count').text(this.cacheStats.totalRecords.toLocaleString());
    }
    
    /**
     * 数据清理任务
     */
    async performCleanup() {
        if (!this.isInitialized) {
            return;
        }
        
        try {
            const now = Date.now();
            let totalCleaned = 0;
            
            // 清理过期实时数据
            const realtimeDataCutoff = now - (this.cleanupConfig.realtimeDataDays * 24 * 60 * 60 * 1000);
            const cleanedRealtime = await this.db.realtime_series
                .where('timestamp')
                .below(realtimeDataCutoff)
                .delete();
            totalCleaned += cleanedRealtime;
            
            // 清理过期交易会话
            const sessionsCutoff = now - (this.cleanupConfig.tradingSessions * 24 * 60 * 60 * 1000);
            const cleanedSessions = await this.db.trading_sessions
                .where('created_at')
                .below(sessionsCutoff)
                .delete();
            totalCleaned += cleanedSessions;
            
            // 清理过期连接日志
            const logsCutoff = now - (this.cleanupConfig.connectionLogsDays * 24 * 60 * 60 * 1000);
            const cleanedLogs = await this.db.connection_logs
                .where('timestamp')
                .below(logsCutoff)
                .delete();
            totalCleaned += cleanedLogs;
            
            if (totalCleaned > 0) {
                console.log(`🗑️ 数据清理完成: 清理了 ${totalCleaned} 条过期记录`);
                this.updateCacheStats();
            }
            
        } catch (error) {
            console.error('❌ 数据清理失败:', error);
        }
    }
    
    /**
     * 计划定期清理
     */
    scheduleCleanup() {
        // 每小时执行一次清理
        setInterval(() => {
            this.performCleanup();
        }, 60 * 60 * 1000);
        
        // 启动时立即执行一次清理
        setTimeout(() => {
            this.performCleanup();
        }, 5000);
    }
    
    /**
     * 导出数据库数据
     */
    async exportData(options = {}) {
        if (!this.isInitialized) {
            throw new Error('数据库未初始化');
        }
        
        try {
            const {
                includeRealtimeData = true,
                includeTradingSessions = true,
                includeChartConfigs = true,
                startTime,
                endTime
            } = options;
            
            const exportData = {
                metadata: {
                    exported_at: new Date().toISOString(),
                    start_time: startTime,
                    end_time: endTime,
                    database_version: 1
                },
                data: {}
            };
            
            // 导出实时数据
            if (includeRealtimeData) {
                let query = this.db.realtime_series;
                
                if (startTime && endTime) {
                    query = query.where('timestamp').between(startTime, endTime);
                }
                
                exportData.data.realtime_series = await query.toArray();
            }
            
            // 导出交易会话
            if (includeTradingSessions) {
                exportData.data.trading_sessions = await this.db.trading_sessions.toArray();
            }
            
            // 导出图表配置
            if (includeChartConfigs) {
                exportData.data.chart_configs = await this.db.chart_configs.toArray();
            }
            
            return exportData;
            
        } catch (error) {
            console.error('❌ 导出数据失败:', error);
            throw error;
        }
    }
    
    /**
     * 清空所有数据
     */
    async clearAllData() {
        if (!this.isInitialized) {
            return;
        }
        
        try {
            await this.db.realtime_series.clear();
            await this.db.trading_sessions.clear();
            await this.db.chart_configs.clear();
            await this.db.connection_logs.clear();
            
            this.cacheStats = {
                totalRecords: 0,
                todayRecords: 0,
                cacheSize: 0
            };
            
            this.updateCacheDisplay();
            console.log('🗑️ 所有数据已清空');
            
        } catch (error) {
            console.error('❌ 清空数据失败:', error);
            throw error;
        }
    }
    
    /**
     * 获取数据库状态
     */
    getDatabaseStatus() {
        return {
            isInitialized: this.isInitialized,
            cacheStats: this.cacheStats,
            cleanupConfig: this.cleanupConfig,
            databaseName: this.db?.name || 'Unknown'
        };
    }
    
    /**
     * 销毁数据库连接
     */
    async destroy() {
        if (this.db) {
            await this.db.close();
            this.db = null;
        }
        
        this.isInitialized = false;
        console.log('🔄 数据库连接已关闭');
    }
}

// 全局数据库管理器实例
window.databaseManager = null;

// 数据库模块初始化函数
function initDatabaseModule() {
    try {
        window.databaseManager = new DatabaseManager();
        console.log('✅ 数据库模块初始化完成');
        return window.databaseManager;
    } catch (error) {
        console.error('❌ 数据库模块初始化失败:', error);
        throw error;
    }
}

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DatabaseManager, initDatabaseModule };
}
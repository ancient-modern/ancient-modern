/**
 * 主应用入口文件
 * 负责系统初始化、模块协调和全局事件管理
 * 
 * 系统架构:
 * - 数据库管理器 (DatabaseManager)
 * - 图表管理器 (ChartsManager) 
 * - WebSocket管理器 (WebSocketManager)
 * - 工具栏管理器 (ToolbarManager)
 */

class Application {
    constructor() {
        this.isInitialized = false;
        this.modules = {
            database: null,
            charts: null,
            websocket: null,
            toolbar: null
        };
        
        this.config = {
            serverUrl: 'http://localhost:8000',
            reconnectAttempts: 10,
            dataUpdateInterval: 3000,
            debugMode: true
        };
        
        this.stats = {
            startTime: new Date(),
            totalDataReceived: 0,
            totalErrors: 0,
            lastErrorTime: null
        };
        
        // 全局数据更新暂停标志
        window.isDataUpdatePaused = false;
        
        console.log('🚀 实时数据可视化应用启动...');
        this.init();
    }
    
    /**
     * 应用初始化
     */
    async init() {
        try {
            this.showLoadingOverlay('正在初始化系统...');
            
            // 1. 初始化数据库模块
            await this.initDatabaseModule();
            
            // 2. 初始化图表模块
            await this.initChartsModule();
            
            // 3. 初始化WebSocket模块
            await this.initWebSocketModule();
            
            // 4. 初始化工具栏模块
            await this.initToolbarModule();
            
            // 5. 绑定模块间事件
            this.bindModuleEvents();
            
            // 6. 完成初始化
            this.completeInitialization();
            
        } catch (error) {
            console.error('❌ 应用初始化失败:', error);
            this.handleInitializationError(error);
        }
    }
    
    /**
     * 初始化数据库模块
     */
    async initDatabaseModule() {
        try {
            this.updateLoadingText('初始化数据库...');
            
            if (typeof initDatabaseModule === 'function') {
                this.modules.database = initDatabaseModule();
                
                // 等待数据库完全初始化
                let attempts = 0;
                while (!this.modules.database.isInitialized && attempts < 50) {
                    await this.sleep(100);
                    attempts++;
                }
                
                if (!this.modules.database.isInitialized) {
                    throw new Error('数据库初始化超时');
                }
                
                console.log('✅ 数据库模块初始化完成');
            } else {
                throw new Error('数据库模块未找到');
            }
            
        } catch (error) {
            console.error('❌ 数据库模块初始化失败:', error);
            throw error;
        }
    }
    
    /**
     * 初始化图表模块
     */
    async initChartsModule() {
        try {
            this.updateLoadingText('初始化图表系统...');
            
            if (typeof initChartsModule === 'function') {
                this.modules.charts = initChartsModule();
                
                // 等待图表完全初始化
                let attempts = 0;
                while (!this.modules.charts.isInitialized && attempts < 50) {
                    await this.sleep(100);
                    attempts++;
                }

                this.modules.charts.setTimeRange(new Date(),new Date(Date.now() + 5 * 60 * 60 * 1000));
                
                if (!this.modules.charts.isInitialized) {
                    throw new Error('图表初始化超时');
                }
                
                console.log('✅ 图表模块初始化完成');
            } else {
                throw new Error('图表模块未找到');
            }
            
        } catch (error) {
            console.error('❌ 图表模块初始化失败:', error);
            throw error;
        }
    }
    
    /**
     * 初始化WebSocket模块
     */
    async initWebSocketModule() {
        try {
            this.updateLoadingText('初始化通信模块...');
            
            if (typeof initWebSocketModule === 'function') {
                this.modules.websocket = initWebSocketModule(this.config.serverUrl);
                console.log('✅ WebSocket模块初始化完成');
            } else {
                throw new Error('WebSocket模块未找到');
            }
            
        } catch (error) {
            console.error('❌ WebSocket模块初始化失败:', error);
            throw error;
        }
    }
    
    /**
     * 初始化工具栏模块
     */
    async initToolbarModule() {
        try {
            this.updateLoadingText('初始化用户界面...');
            
            if (typeof initToolbarModule === 'function') {
                this.modules.toolbar = initToolbarModule();
                console.log('✅ 工具栏模块初始化完成');
            } else {
                throw new Error('工具栏模块未找到');
            }
            
        } catch (error) {
            console.error('❌ 工具栏模块初始化失败:', error);
            throw error;
        }
    }
    
    /**
     * 绑定模块间事件
     */
    bindModuleEvents() {
        this.updateLoadingText('配置模块间通信...');
        
        // WebSocket事件绑定
        if (this.modules.websocket) {
            // 连接状态变化
            this.modules.websocket.on('onConnect', () => {
                console.log('🔗 WebSocket连接成功');
                if (this.modules.toolbar) {
                    this.modules.toolbar.updateConnectionState('connected');
                }
                this.logEvent('websocket_connected');
            });
            
            this.modules.websocket.on('onDisconnect', (reason) => {
                console.log('🔌 WebSocket连接断开:', reason);
                if (this.modules.toolbar) {
                    this.modules.toolbar.updateConnectionState('disconnected');
                }
                this.logEvent('websocket_disconnected', { reason });
            });
            
            // 实时数据接收
            this.modules.websocket.on('onData', (data) => {
                this.handleRealtimeData(data);
            });
            
            // 错误处理
            this.modules.websocket.on('onError', (error) => {
                console.error('❌ WebSocket错误:', error);
                this.handleError('websocket_error', error);
            });
            
            // 状态变化
            this.modules.websocket.on('onStatusChange', (status) => {
                if (this.modules.toolbar) {
                    this.modules.toolbar.updateConnectionState(status);
                }
            });
        }
        
        console.log('✅ 模块间事件绑定完成');
    }
    
    /**
     * 处理实时数据
     */
    handleRealtimeData(data) {
        try {
            // 检查数据更新是否暂停
            if (window.isDataUpdatePaused) {
                console.debug('⏸️ 数据更新已暂停，跳过数据处理');
                return;
            }
            
            // 更新统计信息
            this.stats.totalDataReceived++;
            
            // 更新图表
            if (this.modules.charts) {
                this.modules.charts.updateChartsData(data);
            }
            
            // 保存到数据库（异步）
            if (this.modules.database) {
                this.modules.database.saveRealtimeData(data).catch(error => {
                    console.warn('⚠️ 数据保存失败:', error);
                });
            }
            
            // 更新服务器时间
            if (data.metadata && data.metadata.server_time && this.modules.toolbar) {
                this.modules.toolbar.updateServerTime(data.metadata.server_time);
            }
            
            // 调试信息
            if (this.config.debugMode) {
                console.debug('📊 处理实时数据:', {
                    sequence: data.metadata?.sequence_id,
                    timestamp: data.metadata?.timestamp,
                    total_received: this.stats.totalDataReceived
                });
            }
            
        } catch (error) {
            console.error('❌ 实时数据处理失败:', error);
            this.handleError('data_processing_error', error);
        }
    }
    
    /**
     * 处理错误
     */
    handleError(errorType, error) {
        this.stats.totalErrors++;
        this.stats.lastErrorTime = new Date();
        
        // 记录错误日志
        if (this.modules.database) {
            this.modules.database.logConnection('error', `${errorType}: ${error.message}`, '', 0);
        }
        
        // 显示错误给用户
        if (this.modules.toolbar) {
            let userMessage = '系统错误';
            
            switch (errorType) {
                case 'websocket_error':
                    userMessage = '网络连接错误: ' + error.message;
                    break;
                case 'data_processing_error':
                    userMessage = '数据处理错误: ' + error.message;
                    break;
                case 'chart_error':
                    userMessage = '图表更新错误: ' + error.message;
                    break;
                default:
                    userMessage = error.message || '未知错误';
            }
            
            this.modules.toolbar.showError(userMessage);
        }
        
        this.logEvent('error', { type: errorType, message: error.message });
    }
    
    /**
     * 完成初始化
     */
    completeInitialization() {
        this.isInitialized = true;
        this.hideLoadingOverlay();
        
        console.log('🎉 应用初始化完成！');
        console.log('📊 系统状态:', this.getSystemStatus());
        
        // 显示成功消息
        if (this.modules.toolbar) {
            this.modules.toolbar.showNotification('系统初始化完成，可以开始连接服务器', 'success');
        }
        
        this.logEvent('app_initialized');
        
        // 自动连接（如果配置启用）
        // this.autoConnect();
    }
    
    /**
     * 处理初始化错误
     */
    handleInitializationError(error) {
        this.hideLoadingOverlay();
        
        console.error('💥 应用初始化失败:', error);
        
        // 显示错误模态框
        $('#error-message').text(`系统初始化失败: ${error.message}`);
        $('#error-modal').show();
        
        this.logEvent('app_init_failed', { error: error.message });
    }
    
    /**
     * 自动连接到服务器
     */
    autoConnect() {
        if (this.modules.websocket && this.modules.toolbar) {
            setTimeout(() => {
                console.log('🔄 尝试自动连接到服务器...');
                this.modules.toolbar.handleConnectionToggle();
            }, 2000);
        }
    }
    
    /**
     * 显示加载遮罩
     */
    showLoadingOverlay(text = '正在加载...') {
        $('#loading-overlay').show();
        this.updateLoadingText(text);
    }
    
    /**
     * 隐藏加载遮罩
     */
    hideLoadingOverlay() {
        $('#loading-overlay').fadeOut(500);
    }
    
    /**
     * 更新加载文本
     */
    updateLoadingText(text) {
        $('.loading-text').text(text);
    }
    
    /**
     * 记录事件
     */
    logEvent(eventType, data = {}) {
        const event = {
            timestamp: new Date().toISOString(),
            type: eventType,
            data: data,
            stats: { ...this.stats }
        };
        
        console.log(`📝 事件记录: ${eventType}`, event);
        
        // 保存到数据库
        if (this.modules.database) {
            this.modules.database.logConnection(eventType, JSON.stringify(data), '', 0);
        }
    }
    
    /**
     * 获取系统状态
     */
    getSystemStatus() {
        return {
            isInitialized: this.isInitialized,
            uptime: Date.now() - this.stats.startTime.getTime(),
            stats: this.stats,
            modules: {
                database: this.modules.database?.getDatabaseStatus() || null,
                charts: this.modules.charts?.getChartsStatus() || null,
                websocket: this.modules.websocket?.getConnectionInfo() || null,
                toolbar: this.modules.toolbar?.getToolbarStatus() || null
            }
        };
    }
    
    /**
     * 导出系统诊断信息
     */
    exportDiagnostics() {
        try {
            const diagnostics = {
                timestamp: new Date().toISOString(),
                system_status: this.getSystemStatus(),
                browser_info: {
                    userAgent: navigator.userAgent,
                    language: navigator.language,
                    platform: navigator.platform,
                    cookieEnabled: navigator.cookieEnabled,
                    onLine: navigator.onLine
                },
                performance: {
                    memory: performance.memory ? {
                        used: performance.memory.usedJSHeapSize,
                        total: performance.memory.totalJSHeapSize,
                        limit: performance.memory.jsHeapSizeLimit
                    } : null,
                    timing: performance.timing
                }
            };
            
            const diagStr = JSON.stringify(diagnostics, null, 2);
            const diagBlob = new Blob([diagStr], { type: 'application/json' });
            const url = URL.createObjectURL(diagBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `system_diagnostics_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            
            if (this.modules.toolbar) {
                this.modules.toolbar.showNotification('系统诊断信息已导出', 'success');
            }
            
            this.logEvent('diagnostics_exported');
            
        } catch (error) {
            console.error('❌ 导出诊断信息失败:', error);
            if (this.modules.toolbar) {
                this.modules.toolbar.showError('导出诊断信息失败: ' + error.message);
            }
        }
    }
    
    /**
     * 重启应用
     */
    restart() {
        console.log('🔄 重启应用...');
        
        try {
            // 断开WebSocket连接
            if (this.modules.websocket) {
                this.modules.websocket.disconnect();
            }
            
            // 清理模块
            this.cleanup();
            
            // 重新初始化
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } catch (error) {
            console.error('❌ 重启失败:', error);
            window.location.reload();
        }
    }
    
    /**
     * 清理资源
     */
    cleanup() {
        console.log('🧹 清理应用资源...');
        
        try {
            // 销毁各个模块
            if (this.modules.websocket) {
                this.modules.websocket.destroy();
            }
            
            if (this.modules.charts) {
                this.modules.charts.destroy();
            }
            
            if (this.modules.database) {
                this.modules.database.destroy();
            }
            
            // 清空模块引用
            for (const key in this.modules) {
                this.modules[key] = null;
            }
            
            this.isInitialized = false;
            
        } catch (error) {
            console.error('❌ 清理资源失败:', error);
        }
    }
    
    /**
     * 睡眠函数
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 全局应用实例
window.app = null;

// 当DOM准备就绪时启动应用
$(document).ready(function() {
    console.log('🌐 DOM就绪，启动应用...');
    
    try {
        window.app = new Application();
    } catch (error) {
        console.error('💥 应用启动失败:', error);
        
        // 显示启动错误
        $('#loading-overlay .loading-text').text('应用启动失败: ' + error.message);
        setTimeout(() => {
            $('#loading-overlay').hide();
            alert('应用启动失败，请刷新页面重试。错误信息: ' + error.message);
        }, 2000);
    }
});

// 页面卸载时清理资源
$(window).on('beforeunload', function() {
    if (window.app) {
        window.app.cleanup();
    }
});

// 全局错误处理
window.addEventListener('error', function(event) {
    console.error('💥 全局错误:', event.error);
    
    if (window.app && window.app.modules.toolbar) {
        window.app.modules.toolbar.showError('页面错误: ' + event.error.message);
    }
});

// 全局未处理的Promise拒绝
window.addEventListener('unhandledrejection', function(event) {
    console.error('💥 未处理的Promise拒绝:', event.reason);
    
    if (window.app && window.app.modules.toolbar) {
        window.app.modules.toolbar.showError('异步操作错误: ' + event.reason);
    }
});

// 导出应用类给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Application };
}
/**
 * 双Grid布局主应用程序
 * 负责系统初始化、模块协调和全局事件管理
 * 
 * 系统架构:
 * - 页面布局管理器 (PageLayoutManager)
 * - 双Grid控制器 (GridController)
 * - 工具栏管理器 (DualGridToolbarManager)
 * - 数据库管理器 (DatabaseManager) - 复用现有
 * - WebSocket管理器 (WebSocketManager) - 复用现有
 */

class DualGridApplication {
    constructor() {
        this.isInitialized = false;
        this.modules = {
            layoutManager: null,
            gridController: null,
            toolbarManager: null,
            database: null,
            websocket: null
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
        
        console.log('🚀 双Grid布局应用启动...');
        this.init();
    }
    
    /**
     * 应用初始化
     */
    async init() {
        try {
            this.showLoadingOverlay('正在初始化双Grid布局系统...');
            
            // 1. 初始化数据库模块 (复用现有)
            await this.initDatabaseModule();
            
            // 2. 初始化页面布局管理器
            await this.initLayoutManager();
            
            // 3. 初始化双Grid控制器
            await this.initGridController();
            
            // 4. 初始化工具栏管理器
            await this.initToolbarManager();
            
            // 5. 初始化WebSocket模块 (复用现有)
            await this.initWebSocketModule();
            
            // 6. 绑定模块间事件
            this.bindModuleEvents();
            
            // 7. 完成初始化
            this.completeInitialization();
            
        } catch (error) {
            console.error('❌ 双Grid应用初始化失败:', error);
            this.handleInitializationError(error);
        }
    }
    
    /**
     * 初始化数据库模块 (复用现有)
     */
    async initDatabaseModule() {
        try {
            this.updateLoadingText('初始化数据库...');
            
            // 检查现有数据库模块是否存在
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
     * 初始化页面布局管理器
     */
    async initLayoutManager() {
        try {
            this.updateLoadingText('初始化布局管理器...');
            
            if (typeof initPageLayoutManager === 'function') {
                this.modules.layoutManager = initPageLayoutManager();
                
                // 等待布局管理器初始化
                let attempts = 0;
                while (!this.modules.layoutManager.isInitialized && attempts < 50) {
                    await this.sleep(100);
                    attempts++;
                }
                
                if (!this.modules.layoutManager.isInitialized) {
                    throw new Error('布局管理器初始化超时');
                }
                
                console.log('✅ 页面布局管理器初始化完成');
            } else {
                throw new Error('页面布局管理器模块未找到');
            }
            
        } catch (error) {
            console.error('❌ 页面布局管理器初始化失败:', error);
            throw error;
        }
    }
    
    /**
     * 初始化双Grid控制器
     */
    async initGridController() {
        try {
            this.updateLoadingText('初始化图表系统...');
            
            if (typeof initGridController === 'function') {
                this.modules.gridController = initGridController();
                
                // 等待Grid控制器初始化
                let attempts = 0;
                while (!this.modules.gridController.isInitialized && attempts < 50) {
                    await this.sleep(100);
                    attempts++;
                }
                
                if (!this.modules.gridController.isInitialized) {
                    throw new Error('Grid控制器初始化超时');
                }
                
                console.log('✅ 双Grid控制器初始化完成');
            } else {
                throw new Error('双Grid控制器模块未找到');
            }
            
        } catch (error) {
            console.error('❌ 双Grid控制器初始化失败:', error);
            throw error;
        }
    }
    
    /**
     * 初始化工具栏管理器
     */
    async initToolbarManager() {
        try {
            this.updateLoadingText('初始化用户界面...');
            
            if (typeof initDualGridToolbarManager === 'function') {
                this.modules.toolbarManager = initDualGridToolbarManager();
                
                // 等待工具栏管理器初始化
                let attempts = 0;
                while (!this.modules.toolbarManager.isInitialized && attempts < 50) {
                    await this.sleep(100);
                    attempts++;
                }
                
                if (!this.modules.toolbarManager.isInitialized) {
                    throw new Error('工具栏管理器初始化超时');
                }
                
                console.log('✅ 工具栏管理器初始化完成');
            } else {
                throw new Error('工具栏管理器模块未找到');
            }
            
        } catch (error) {
            console.error('❌ 工具栏管理器初始化失败:', error);
            throw error;
        }
    }
    
    /**
     * 初始化WebSocket模块 (复用现有)
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
     * 绑定模块间事件
     */
    bindModuleEvents() {
        this.updateLoadingText('配置模块间通信...');
        
        // 1. 布局管理器事件绑定
        if (this.modules.layoutManager && this.modules.gridController) {
            // 布局变化时调整图表尺寸
            this.modules.layoutManager.on('onLayoutChange', (data) => {
                console.log('🔄 布局变化，调整图表尺寸');
                
                // 设置Grid可见性
                this.modules.gridController.setGridVisibility('grid1', data.upperVisible);
                this.modules.gridController.setGridVisibility('grid2', data.lowerVisible);
                
                // 延迟调用resize确保CSS动画完成
                setTimeout(() => {
                    this.modules.gridController.handleResize();
                }, 350);
            });
            
            this.modules.layoutManager.on('onTransitionEnd', (data) => {
                console.log('✅ 布局切换动画完成');
                // 确保图表尺寸正确
                this.modules.gridController.handleResize();
            });
        }
        
        // 2. 工具栏管理器事件绑定
        if (this.modules.toolbarManager) {
            // 布局切换事件
            this.modules.toolbarManager.on('onToggleLayout', (data) => {
                if (this.modules.layoutManager) {
                    this.modules.layoutManager.toggleLayout();
                }
            });
            
            // 连接事件
            this.modules.toolbarManager.on('onConnect', (data) => {
                if (this.modules.websocket) {
                    this.modules.websocket.connect();
                }
            });
            
            this.modules.toolbarManager.on('onDisconnect', (data) => {
                if (this.modules.websocket) {
                    this.modules.websocket.disconnect();
                }
            });
            
            // 数据控制事件
            this.modules.toolbarManager.on('onPauseData', (data) => {
                window.isDataUpdatePaused = true;
                console.log('⏸️ 数据更新已暂停');
            });
            
            this.modules.toolbarManager.on('onResumeData', (data) => {
                window.isDataUpdatePaused = false;
                console.log('▶️ 数据更新已恢复');
            });
            
            this.modules.toolbarManager.on('onClearData', (data) => {
                if (this.modules.gridController) {
                    this.modules.gridController.clearChartsData();
                }
            });
        }
        
        // 3. WebSocket事件绑定
        if (this.modules.websocket) {
            // 连接状态变化
            this.modules.websocket.on('onConnect', () => {
                console.log('🔗 WebSocket连接成功');
                if (this.modules.toolbarManager) {
                    this.modules.toolbarManager.updateConnectionStatus('connected');
                    this.modules.toolbarManager.showSuccess('服务器连接成功');
                }
                this.logEvent('websocket_connected');
            });
            
            this.modules.websocket.on('onDisconnect', (reason) => {
                console.log('🔌 WebSocket连接断开:', reason);
                if (this.modules.toolbarManager) {
                    this.modules.toolbarManager.updateConnectionStatus('disconnected');
                    this.modules.toolbarManager.showWarning('服务器连接已断开');
                }
                this.logEvent('websocket_disconnected', { reason });
            });
            
            // 连接中状态
            this.modules.websocket.on('onConnecting', () => {
                console.log('🔄 WebSocket连接中...');
                if (this.modules.toolbarManager) {
                    this.modules.toolbarManager.updateConnectionStatus('connecting');
                }
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
        }
        
        // 4. Grid控制器事件绑定
        if (this.modules.gridController) {
            this.modules.gridController.on('onError', (data) => {
                this.handleError('grid_controller_error', data.error);
            });
            
            this.modules.gridController.on('onDataUpdate', (data) => {
                // 通知工具栏数据更新
                if (this.modules.toolbarManager) {
                    this.modules.toolbarManager.notifyDataUpdate(data);
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
            if (this.modules.gridController) {
                this.modules.gridController.updateChartsData(data);
            }
            
            // 保存到数据库（异步）
            if (this.modules.database) {
                this.modules.database.saveRealtimeData(data).catch(error => {
                    console.warn('⚠️ 数据保存失败:', error);
                });
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
        if (this.modules.toolbarManager) {
            let userMessage = '系统错误';
            
            switch (errorType) {
                case 'websocket_error':
                    userMessage = '网络连接错误: ' + error.message;
                    break;
                case 'data_processing_error':
                    userMessage = '数据处理错误: ' + error.message;
                    break;
                case 'grid_controller_error':
                    userMessage = '图表更新错误: ' + error.message;
                    break;
                default:
                    userMessage = error.message || '未知错误';
            }
            
            this.modules.toolbarManager.showError(userMessage);
        }
        
        this.logEvent('error', { type: errorType, message: error.message });
    }
    
    /**
     * 完成初始化
     */
    completeInitialization() {
        this.isInitialized = true;
        this.hideLoadingOverlay();
        
        console.log('🎉 双Grid布局应用初始化完成！');
        console.log('📊 系统状态:', this.getSystemStatus());
        
        // 显示成功消息
        if (this.modules.toolbarManager) {
            this.modules.toolbarManager.showSuccess('双Grid布局系统初始化完成，可以开始连接服务器');
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
        
        console.error('💥 双Grid应用初始化失败:', error);
        
        // 显示错误模态框
        const errorModal = document.getElementById('errorModal');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorModal && errorMessage) {
            errorMessage.textContent = `双Grid系统初始化失败: ${error.message}`;
            errorModal.style.display = 'flex';
        }
        
        this.logEvent('app_init_failed', { error: error.message });
    }
    
    /**
     * 显示加载遮罩
     */
    showLoadingOverlay(text = '正在加载...') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            this.updateLoadingText(text);
        }
    }
    
    /**
     * 隐藏加载遮罩
     */
    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
    
    /**
     * 更新加载文本
     */
    updateLoadingText(text) {
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = text;
        }
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
                layoutManager: this.modules.layoutManager?.getLayoutState() || null,
                gridController: this.modules.gridController?.getChartsStatus() || null,
                toolbarManager: this.modules.toolbarManager?.getToolbarStatus() || null,
                database: this.modules.database?.getDatabaseStatus() || null,
                websocket: this.modules.websocket?.getConnectionInfo() || null
            }
        };
    }
    
    /**
     * 睡眠函数
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 清理资源
     */
    cleanup() {
        console.log('🧹 清理双Grid应用资源...');
        
        try {
            // 销毁各个模块
            if (this.modules.websocket) {
                this.modules.websocket.destroy();
            }
            
            if (this.modules.gridController) {
                this.modules.gridController.destroy();
            }
            
            if (this.modules.toolbarManager) {
                this.modules.toolbarManager.destroy();
            }
            
            if (this.modules.layoutManager) {
                this.modules.layoutManager.destroy();
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
}

// 全局应用实例
window.dualGridApp = null;

// 错误处理函数
window.closeErrorModal = function() {
    const errorModal = document.getElementById('errorModal');
    if (errorModal) {
        errorModal.style.display = 'none';
    }
};

window.retryOperation = function() {
    window.closeErrorModal();
    if (window.dualGridApp) {
        window.dualGridApp.cleanup();
    }
    setTimeout(() => {
        window.location.reload();
    }, 1000);
};

// 当DOM准备就绪时启动应用
$(document).ready(function() {
    console.log('🌐 DOM就绪，启动双Grid布局应用...');
    
    try {
        window.dualGridApp = new DualGridApplication();
    } catch (error) {
        console.error('💥 双Grid应用启动失败:', error);
        
        // 显示启动错误
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = '应用启动失败: ' + error.message;
        }
        
        setTimeout(() => {
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            alert('双Grid应用启动失败，请刷新页面重试。错误信息: ' + error.message);
        }, 2000);
    }
});

// 页面卸载时清理资源
$(window).on('beforeunload', function() {
    if (window.dualGridApp) {
        window.dualGridApp.cleanup();
    }
});

// 全局错误处理
window.addEventListener('error', function(event) {
    console.error('💥 全局错误:', event.error);
    
    if (window.dualGridApp && window.dualGridApp.modules.toolbarManager) {
        window.dualGridApp.modules.toolbarManager.showError('页面错误: ' + event.error.message);
    }
});

// 全局未处理的Promise拒绝
window.addEventListener('unhandledrejection', function(event) {
    console.error('💥 未处理的Promise拒绝:', event.reason);
    
    if (window.dualGridApp && window.dualGridApp.modules.toolbarManager) {
        window.dualGridApp.modules.toolbarManager.showError('异步操作错误: ' + event.reason);
    }
});

// 导出应用类给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DualGridApplication };
}
/**
 * 工具栏组件模块
 * 负责连接控制、状态监控和用户交互
 * 
 * 功能特性:
 * - 连接控制按钮管理
 * - 数据流控制
 * - 状态监控显示
 * - 图表操作控制
 * - 错误处理和用户反馈
 */

class ToolbarManager {
    constructor() {
        this.isDataFlowPaused = false;
        this.connectionState = 'disconnected';
        this.serverTime = new Date();
        this.lastUpdateTime = null;
        
        // 按钮状态配置
        this.buttonStates = {
            connect: {
                connected: { text: '断开连接', icon: '🔌', class: 'warning' },
                disconnected: { text: '连接服务器', icon: '🔗', class: 'primary' },
                connecting: { text: '连接中...', icon: '⏳', class: 'secondary' }
            },
            dataFlow: {
                running: { text: '暂停数据', icon: '⏸️', class: 'secondary' },
                paused: { text: '恢复数据', icon: '▶️', class: 'success' }
            }
        };
        
        this.bindEvents();
        this.startStatusUpdater();
    }
    
    /**
     * 绑定工具栏事件
     */
    bindEvents() {
        // 连接控制按钮
        $('#connect-btn').on('click', () => {
            this.handleConnectionToggle();
        });
        
        // 数据流控制按钮
        $('#data-flow-btn').on('click', () => {
            this.handleDataFlowToggle();
        });
        
        // 清空数据按钮
        $('#clear-data-btn').on('click', () => {
            this.handleClearData();
        });
        
        // 图表控制按钮 (在charts.js中已定义，这里只做状态管理)
        console.log('✅ 工具栏事件绑定完成');
    }
    
    /**
     * 处理连接切换
     */
    handleConnectionToggle() {
        try {
            if (!window.websocketManager) {
                this.showError('WebSocket管理器未初始化');
                return;
            }
            
            const connectionInfo = window.websocketManager.getConnectionInfo();
            
            if (connectionInfo.isConnected) {
                // 断开连接
                this.updateConnectionState('disconnecting');
                window.websocketManager.disconnect();
                this.logAction('用户主动断开连接');
                
            } else if (connectionInfo.isConnecting) {
                // 取消连接
                window.websocketManager.disconnect();
                this.updateConnectionState('disconnected');
                this.logAction('用户取消连接');
                
            } else {
                // 建立连接
                this.updateConnectionState('connecting');
                window.websocketManager.connect();
                this.logAction('用户发起连接');
            }
            
        } catch (error) {
            console.error('❌ 连接切换失败:', error);
            this.showError('连接操作失败: ' + error.message);
        }
    }
    
    /**
     * 处理数据流切换
     */
    handleDataFlowToggle() {
        try {
            this.isDataFlowPaused = !this.isDataFlowPaused;
            
            const btn = $('#data-flow-btn');
            const state = this.isDataFlowPaused ? 'paused' : 'running';
            const config = this.buttonStates.dataFlow[state];
            
            // 更新按钮状态
            btn.find('.btn-icon').text(config.icon);
            btn.find('.btn-text').text(config.text);
            btn.removeClass('primary secondary success warning').addClass(config.class);
            
            // 通知其他模块数据流状态变化
            if (window.chartsManager) {
                if (this.isDataFlowPaused) {
                    // 暂停数据更新 - 这里可以设置一个标志
                    window.isDataUpdatePaused = true;
                } else {
                    // 恢复数据更新
                    window.isDataUpdatePaused = false;
                }
            }
            
            const action = this.isDataFlowPaused ? '暂停数据流' : '恢复数据流';
            this.logAction(action);
            this.showNotification(action + '成功', 'success');
            
        } catch (error) {
            console.error('❌ 数据流切换失败:', error);
            this.showError('数据流操作失败: ' + error.message);
        }
    }
    
    /**
     * 处理清空数据
     */
    handleClearData() {
        try {
            // 显示确认对话框
            if (!confirm('确定要清空所有图表数据吗？此操作不可撤销。')) {
                return;
            }
            
            // 清空图表数据
            if (window.chartsManager) {
                window.chartsManager.clearChartsData();
            }
            
            // 清空数据库缓存（可选）
            const clearCache = confirm('是否同时清空本地缓存数据？');
            if (clearCache && window.databaseManager) {
                window.databaseManager.clearAllData().then(() => {
                    this.showNotification('本地缓存已清空', 'success');
                }).catch(error => {
                    console.error('❌ 清空缓存失败:', error);
                    this.showError('清空缓存失败: ' + error.message);
                });
            }
            
            this.logAction('清空图表数据');
            this.showNotification('图表数据已清空', 'success');
            
        } catch (error) {
            console.error('❌ 清空数据失败:', error);
            this.showError('清空数据失败: ' + error.message);
        }
    }
    
    /**
     * 更新连接状态
     */
    updateConnectionState(state) {
        this.connectionState = state;
        
        const btn = $('#connect-btn');
        const dataFlowBtn = $('#data-flow-btn');
        
        // 更新连接按钮状态
        if (this.buttonStates.connect[state]) {
            const config = this.buttonStates.connect[state];
            btn.find('.btn-icon').text(config.icon);
            btn.find('.btn-text').text(config.text);
            btn.removeClass('primary secondary success warning').addClass(config.class);
        }
        
        // 根据连接状态启用/禁用其他按钮
        switch (state) {
            case 'connected':
                dataFlowBtn.prop('disabled', false);
                this.updateDataFlowEnabled(true);
                break;
                
            case 'disconnected':
            case 'error':
            case 'failed':
                dataFlowBtn.prop('disabled', true);
                this.updateDataFlowEnabled(false);
                this.isDataFlowPaused = false;
                break;
                
            case 'connecting':
            case 'reconnecting':
                dataFlowBtn.prop('disabled', true);
                break;
        }
        
        this.logAction(`连接状态变更: ${state}`);
    }
    
    /**
     * 更新数据流控制状态
     */
    updateDataFlowEnabled(enabled) {
        const btn = $('#data-flow-btn');
        
        if (enabled) {
            const state = this.isDataFlowPaused ? 'paused' : 'running';
            const config = this.buttonStates.dataFlow[state];
            
            btn.find('.btn-icon').text(config.icon);
            btn.find('.btn-text').text(config.text);
            btn.removeClass('primary secondary success warning').addClass(config.class);
        } else {
            btn.find('.btn-icon').text('⏸️');
            btn.find('.btn-text').text('暂停数据');
            btn.removeClass('primary secondary success warning').addClass('secondary');
        }
    }
    
    /**
     * 更新服务器时间显示
     */
    updateServerTime(timeString) {
        if (timeString) {
            this.serverTime = new Date(timeString);
        }
        
        const timeElement = $('#server-time');
        timeElement.text(this.serverTime.toLocaleTimeString());
        this.lastUpdateTime = new Date();
    }
    
    /**
     * 更新交易时间状态
     */
    updateTradingTimeStatus(isTradingTime) {
        const statusIndicator = $('#trading-status');
        const statusText = $('#trading-time-text');
        
        if (isTradingTime) {
            statusIndicator.removeClass('non-trading').addClass('trading');
            statusText.text('交易时间');
        } else {
            statusIndicator.removeClass('trading').addClass('non-trading');
            statusText.text('非交易时间');
        }
    }
    
    /**
     * 显示错误信息
     */
    showError(message) {
        console.error('❌ 工具栏错误:', message);
        
        // 更新错误模态框
        $('#error-message').text(message);
        $('#error-modal').show();
        
        // 也可以在页面顶部显示错误提示
        this.showNotification(message, 'error');
    }
    
    /**
     * 显示通知信息
     */
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = $(`
            <div class="notification notification-${type}">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `);
        
        // 添加到页面
        $('body').append(notification);
        
        // 显示动画
        notification.fadeIn(300);
        
        // 绑定关闭事件
        notification.find('.notification-close').on('click', () => {
            notification.fadeOut(300, () => notification.remove());
        });
        
        // 自动消失
        setTimeout(() => {
            notification.fadeOut(300, () => notification.remove());
        }, 5000);
        
        console.log(`📢 通知: ${message} [${type}]`);
    }
    
    /**
     * 记录用户操作
     */
    logAction(action) {
        const timestamp = new Date().toISOString();
        console.log(`👤 用户操作: ${action} [${timestamp}]`);
        
        // 记录到数据库（如果可用）
        if (window.databaseManager) {
            window.databaseManager.logConnection('user_action', action, '', 0);
        }
    }
    
    /**
     * 启动状态更新器
     */
    startStatusUpdater() {
        // 每秒更新一次状态
        setInterval(() => {
            this.updateStatus();
        }, 1000);
        
        console.log('✅ 状态更新器已启动');
    }
    
    /**
     * 更新总体状态
     */
    updateStatus() {
        // 更新服务器时间（如果没有从服务器接收到）
        if (!this.lastUpdateTime || (Date.now() - this.lastUpdateTime.getTime() > 5000)) {
            // 超过5秒没有更新，使用本地时间
            this.updateServerTime();
        }
        
        // 检查WebSocket连接状态
        if (window.websocketManager) {
            const connectionInfo = window.websocketManager.getConnectionInfo();
            const networkQuality = window.websocketManager.getNetworkQuality();
            
            // 更新连接时长
            if (connectionInfo.isConnected && connectionInfo.connectionDuration) {
                this.updateConnectionDuration(connectionInfo.connectionDuration);
            }
            
            // 检查网络质量
            if (networkQuality.quality === 'poor') {
                this.showNetworkWarning();
            }
        }
        
        // 更新数据库状态
        if (window.databaseManager) {
            const dbStatus = window.databaseManager.getDatabaseStatus();
            // 这里可以显示数据库状态信息
        }
    }
    
    /**
     * 更新连接时长显示
     */
    updateConnectionDuration(duration) {
        const seconds = Math.floor(duration / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        $('#connection-duration').text(timeString);
    }
    
    /**
     * 显示网络警告
     */
    showNetworkWarning() {
        // 避免重复显示警告
        if (!this.networkWarningShown) {
            this.showNotification('网络连接质量较差，可能影响数据接收', 'warning');
            this.networkWarningShown = true;
            
            // 30秒后重置警告状态
            setTimeout(() => {
                this.networkWarningShown = false;
            }, 30000);
        }
    }
    
    /**
     * 导出系统状态报告
     */
    exportStatusReport() {
        try {
            const report = {
                timestamp: new Date().toISOString(),
                connection: window.websocketManager ? window.websocketManager.getConnectionInfo() : null,
                charts: window.chartsManager ? window.chartsManager.getChartsStatus() : null,
                database: window.databaseManager ? window.databaseManager.getDatabaseStatus() : null,
                toolbar: {
                    connectionState: this.connectionState,
                    isDataFlowPaused: this.isDataFlowPaused,
                    lastUpdateTime: this.lastUpdateTime
                }
            };
            
            const reportStr = JSON.stringify(report, null, 2);
            const reportBlob = new Blob([reportStr], { type: 'application/json' });
            const url = URL.createObjectURL(reportBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `system_status_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            this.showNotification('系统状态报告已导出', 'success');
            this.logAction('导出系统状态报告');
            
        } catch (error) {
            console.error('❌ 导出状态报告失败:', error);
            this.showError('导出状态报告失败: ' + error.message);
        }
    }
    
    /**
     * 获取工具栏状态
     */
    getToolbarStatus() {
        return {
            connectionState: this.connectionState,
            isDataFlowPaused: this.isDataFlowPaused,
            serverTime: this.serverTime,
            lastUpdateTime: this.lastUpdateTime
        };
    }
    
    /**
     * 重置工具栏状态
     */
    resetToolbarState() {
        this.isDataFlowPaused = false;
        this.connectionState = 'disconnected';
        this.lastUpdateTime = null;
        
        // 重置按钮状态
        this.updateConnectionState('disconnected');
        this.updateDataFlowEnabled(false);
        
        this.logAction('工具栏状态已重置');
        console.log('🔄 工具栏状态已重置');
    }
}

// 全局模态框控制函数
function closeErrorModal() {
    $('#error-modal').hide();
}

function retryConnection() {
    closeErrorModal();
    if (window.toolbarManager) {
        window.toolbarManager.handleConnectionToggle();
    }
}

// 全局工具栏管理器实例
window.toolbarManager = null;

// 工具栏模块初始化函数
function initToolbarModule() {
    try {
        window.toolbarManager = new ToolbarManager();
        console.log('✅ 工具栏模块初始化完成');
        return window.toolbarManager;
    } catch (error) {
        console.error('❌ 工具栏模块初始化失败:', error);
        throw error;
    }
}

// CSS样式注入（通知组件）
const notificationStyles = `
<style>
.notification {
    position: fixed;
    top: 40px;
    right: 10px;
    min-width: 300px;
    max-width: 500px;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    display: none;
    font-size: 14px;
}

.notification-info {
    background: #e6f7ff;
    border-left: 4px solid #1890ff;
    color: #003a8c;
}

.notification-success {
    background: #f6ffed;
    border-left: 4px solid #52c41a;
    color: #135200;
}

.notification-warning {
    background: #fffbe6;
    border-left: 4px solid #faad14;
    color: #613400;
}

.notification-error {
    background: #fff1f0;
    border-left: 4px solid #ff4d4f;
    color: #5c0011;
}

.notification-message {
    flex: 1;
    margin-right: 10px;
}

.notification-close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    opacity: 0.7;
    padding: 0;
    line-height: 1;
}

.notification-close:hover {
    opacity: 1;
}

.notification {
    display: flex;
    align-items: center;
}
</style>
`;

// 注入样式
$('head').append(notificationStyles);

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ToolbarManager, initToolbarModule };
}
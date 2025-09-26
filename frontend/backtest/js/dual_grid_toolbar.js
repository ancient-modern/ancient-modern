/**
 * 双Grid工具栏管理器 (DualGridToolbarManager)
 * 提供用户交互控制和状态显示
 * 
 * 核心功能：
 * - 管理切换按钮的状态
 * - 显示系统状态信息
 * - 处理用户交互事件
 * - 提供快捷操作功能
 * - 通知消息管理
 */

class DualGridToolbarManager {
    constructor() {
        this.isInitialized = false;
        
        // DOM元素引用
        this.elements = {
            // 切换和状态元素
            toggleButton: null,
            connectionDot: null,
            connectionText: null,
            layoutMode: null,
            
            // 状态信息元素
            dataUpdateCount: null,
            lastUpdateTime: null,
            
            // 工具按钮元素
            connectButton: null,
            pauseDataButton: null,
            clearDataButton: null,
            fullscreenButton: null,
            
            // 通知容器
            notificationContainer: null
        };
        
        // 状态管理
        this.state = {
            connectionStatus: 'disconnected', // 'disconnected' | 'connecting' | 'connected'
            dataUpdatePaused: false,
            isFullscreen: false,
            dataCount: 0,
            lastUpdate: null
        };
        
        // 事件回调
        this.eventCallbacks = {
            onToggleLayout: [],
            onConnect: [],
            onDisconnect: [],
            onPauseData: [],
            onResumeData: [],
            onClearData: [],
            onFullscreen: []
        };
        
        // 通知管理
        this.notifications = {
            queue: [],
            maxVisible: 3,
            defaultDuration: 3000
        };
        
        console.log('🔧 DualGridToolbarManager 初始化...');
        this.init();
    }
    
    /**
     * 初始化工具栏管理器
     */
    init() {
        try {
            // 获取DOM元素引用
            this.getDOMReferences();
            
            // 绑定事件监听器
            this.bindEventListeners();
            
            // 初始化状态显示
            this.initializeStateDisplay();
            
            // 启动状态更新定时器
            this.startStateUpdateTimer();
            
            this.isInitialized = true;
            console.log('✅ DualGridToolbarManager 初始化完成');
            
        } catch (error) {
            console.error('❌ DualGridToolbarManager 初始化失败:', error);
            throw error;
        }
    }
    
    /**
     * 获取DOM元素引用
     */
    getDOMReferences() {
        // 切换和状态元素
        this.elements.toggleButton = document.getElementById('toggleLayoutBtn');
        this.elements.connectionDot = document.getElementById('connectionDot');
        this.elements.connectionText = document.getElementById('connectionText');
        this.elements.layoutMode = document.getElementById('layoutMode');
        
        // 状态信息元素
        this.elements.dataUpdateCount = document.getElementById('dataUpdateCount');
        this.elements.lastUpdateTime = document.getElementById('lastUpdateTime');
        
        // 工具按钮元素
        this.elements.connectButton = document.getElementById('connectBtn');
        this.elements.pauseDataButton = document.getElementById('pauseDataBtn');
        this.elements.clearDataButton = document.getElementById('clearDataBtn');
        this.elements.fullscreenButton = document.getElementById('fullscreenBtn');
        
        // 通知容器
        this.elements.notificationContainer = document.getElementById('notificationContainer');
        
        // 验证必需元素
        const requiredElements = ['toggleButton', 'connectButton'];
        for (const elementName of requiredElements) {
            if (!this.elements[elementName]) {
                console.warn(`⚠️ 必需的DOM元素未找到: ${elementName}`);
            }
        }
        
        console.log('✅ 工具栏DOM元素引用获取完成');
    }
    
    /**
     * 绑定事件监听器
     */
    bindEventListeners() {
        // 布局切换按钮
        if (this.elements.toggleButton) {
            this.elements.toggleButton.addEventListener('click', (event) => {
                event.preventDefault();
                this.handleToggleLayout();
            });
        }
        
        // 连接按钮
        if (this.elements.connectButton) {
            this.elements.connectButton.addEventListener('click', (event) => {
                event.preventDefault();
                this.handleConnectionToggle();
            });
        }
        
        // 暂停数据按钮
        if (this.elements.pauseDataButton) {
            this.elements.pauseDataButton.addEventListener('click', (event) => {
                event.preventDefault();
                this.handleDataPauseToggle();
            });
        }
        
        // 清空数据按钮
        if (this.elements.clearDataButton) {
            this.elements.clearDataButton.addEventListener('click', (event) => {
                event.preventDefault();
                this.handleClearData();
            });
        }
        
        // 全屏按钮
        if (this.elements.fullscreenButton) {
            this.elements.fullscreenButton.addEventListener('click', (event) => {
                event.preventDefault();
                this.handleFullscreenToggle();
            });
        }
        
        // 键盘快捷键
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });
        
        // 全屏状态变化监听
        document.addEventListener('fullscreenchange', () => {
            this.handleFullscreenChange();
        });
        
        // 通知点击关闭
        if (this.elements.notificationContainer) {
            this.elements.notificationContainer.addEventListener('click', (event) => {
                if (event.target.classList.contains('notification')) {
                    this.removeNotification(event.target);
                }
            });
        }
        
        console.log('✅ 工具栏事件监听器绑定完成');
    }
    
    /**
     * 初始化状态显示
     */
    initializeStateDisplay() {
        // 更新连接状态显示
        this.updateConnectionStatus('disconnected');
        
        // 初始化数据统计显示
        this.updateDataCount(0);
        this.updateLastUpdateTime('--:--:--');
        
        // 初始化布局模式显示
        this.updateLayoutMode('全显示');
        
        console.log('✅ 初始状态显示设置完成');
    }
    
    /**
     * 处理布局切换
     */
    handleToggleLayout() {
        console.log('🔄 处理布局切换请求');
        
        // 触发布局切换事件
        this.triggerEvent('onToggleLayout', {
            timestamp: Date.now(),
            source: 'toolbar_button'
        });
        
        // 显示操作反馈
        this.showNotification('布局切换中...', 'info', 1000);
    }
    
    /**
     * 处理连接切换
     */
    handleConnectionToggle() {
        console.log('🔗 处理连接切换请求');
        
        if (this.state.connectionStatus === 'connected') {
            // 当前已连接，执行断开
            this.triggerEvent('onDisconnect', {
                timestamp: Date.now(),
                source: 'toolbar_button'
            });
            this.showNotification('正在断开连接...', 'warning', 2000);
        } else {
            // 当前未连接，执行连接
            this.triggerEvent('onConnect', {
                timestamp: Date.now(),
                source: 'toolbar_button'
            });
            this.showNotification('正在连接服务器...', 'info', 2000);
        }
    }
    
    /**
     * 处理数据暂停切换
     */
    handleDataPauseToggle() {
        console.log('⏸️ 处理数据暂停切换请求');
        
        if (this.state.dataUpdatePaused) {
            // 当前已暂停，执行恢复
            this.state.dataUpdatePaused = false;
            this.updateDataPauseButton(false);
            this.triggerEvent('onResumeData', {
                timestamp: Date.now(),
                source: 'toolbar_button'
            });
            this.showNotification('数据更新已恢复', 'success', 2000);
        } else {
            // 当前未暂停，执行暂停
            this.state.dataUpdatePaused = true;
            this.updateDataPauseButton(true);
            this.triggerEvent('onPauseData', {
                timestamp: Date.now(),
                source: 'toolbar_button'
            });
            this.showNotification('数据更新已暂停', 'warning', 2000);
        }
    }
    
    /**
     * 处理清空数据
     */
    handleClearData() {
        console.log('🗑️ 处理清空数据请求');
        
        // 显示确认对话框
        if (confirm('确定要清空所有图表数据吗？此操作不可撤销。')) {
            this.triggerEvent('onClearData', {
                timestamp: Date.now(),
                source: 'toolbar_button'
            });
            
            // 重置数据统计
            this.state.dataCount = 0;
            this.updateDataCount(0);
            this.updateLastUpdateTime('--:--:--');
            
            this.showNotification('图表数据已清空', 'success', 2000);
        }
    }
    
    /**
     * 处理全屏切换
     */
    handleFullscreenToggle() {
        console.log('🖼️ 处理全屏切换请求');
        
        if (this.state.isFullscreen) {
            // 退出全屏
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            }
        } else {
            // 进入全屏
            const element = document.documentElement;
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            }
        }
    }
    
    /**
     * 处理全屏状态变化
     */
    handleFullscreenChange() {
        const isFullscreen = !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement
        );
        
        this.state.isFullscreen = isFullscreen;
        this.updateFullscreenButton(isFullscreen);
        
        if (isFullscreen) {
            this.showNotification('已进入全屏模式', 'info', 2000);
        } else {
            this.showNotification('已退出全屏模式', 'info', 2000);
        }
        
        // 触发全屏事件
        this.triggerEvent('onFullscreen', {
            isFullscreen,
            timestamp: Date.now()
        });
    }
    
    /**
     * 处理键盘快捷键
     */
    handleKeyboardShortcuts(event) {
        // Ctrl+H: 切换布局
        if (event.ctrlKey && event.key === 'h') {
            event.preventDefault();
            this.handleToggleLayout();
        }
        
        // Ctrl+P: 暂停/恢复数据
        if (event.ctrlKey && event.key === 'p') {
            event.preventDefault();
            this.handleDataPauseToggle();
        }
        
        // F11: 全屏切换
        if (event.key === 'F11') {
            event.preventDefault();
            this.handleFullscreenToggle();
        }
        
        // Esc: 关闭通知
        if (event.key === 'Escape') {
            this.clearAllNotifications();
        }
    }
    
    /**
     * 更新连接状态
     */
    updateConnectionStatus(status) {
        this.state.connectionStatus = status;
        
        // 更新连接指示点
        if (this.elements.connectionDot) {
            this.elements.connectionDot.className = `status-dot ${status}`;
        }
        
        // 更新连接文本
        if (this.elements.connectionText) {
            const statusTexts = {
                'disconnected': '未连接',
                'connecting': '连接中...',
                'connected': '已连接'
            };
            this.elements.connectionText.textContent = statusTexts[status] || '未知状态';
        }
        
        // 更新连接按钮
        if (this.elements.connectButton) {
            const button = this.elements.connectButton;
            const icon = button.querySelector('.btn-icon');
            const text = button.querySelector('.btn-text');
            
            if (status === 'connected') {
                button.classList.remove('primary');
                button.classList.add('warning');
                if (icon) icon.textContent = '🔌';
                if (text) text.textContent = '断开';
                button.title = '断开服务器连接';
            } else {
                button.classList.remove('warning');
                button.classList.add('primary');
                if (icon) icon.textContent = '🔗';
                if (text) text.textContent = '连接';
                button.title = '连接到服务器';
            }
            
            // 连接中状态禁用按钮
            button.disabled = (status === 'connecting');
        }
        
        // 根据连接状态启用/禁用其他按钮
        if (this.elements.pauseDataButton) {
            this.elements.pauseDataButton.disabled = (status !== 'connected');
        }
        
        console.log(`🔗 连接状态更新为: ${status}`);
    }
    
    /**
     * 更新数据暂停按钮
     */
    updateDataPauseButton(isPaused) {
        if (!this.elements.pauseDataButton) return;
        
        const button = this.elements.pauseDataButton;
        const icon = button.querySelector('.btn-icon');
        const text = button.querySelector('.btn-text');
        
        if (isPaused) {
            button.classList.remove('secondary');
            button.classList.add('warning');
            if (icon) icon.textContent = '▶️';
            if (text) text.textContent = '恢复';
            button.title = '恢复数据更新';
        } else {
            button.classList.remove('warning');
            button.classList.add('secondary');
            if (icon) icon.textContent = '⏸️';
            if (text) text.textContent = '暂停';
            button.title = '暂停数据更新';
        }
    }
    
    /**
     * 更新全屏按钮
     */
    updateFullscreenButton(isFullscreen) {
        if (!this.elements.fullscreenButton) return;
        
        const button = this.elements.fullscreenButton;
        const icon = button.querySelector('.btn-icon');
        const text = button.querySelector('.btn-text');
        
        if (isFullscreen) {
            if (icon) icon.textContent = '🗗';
            if (text) text.textContent = '退出';
            button.title = '退出全屏模式';
        } else {
            if (icon) icon.textContent = '🖼️';
            if (text) text.textContent = '全屏';
            button.title = '进入全屏模式';
        }
    }
    
    /**
     * 更新数据计数
     */
    updateDataCount(count) {
        this.state.dataCount = count;
        if (this.elements.dataUpdateCount) {
            this.elements.dataUpdateCount.textContent = count.toLocaleString();
        }
    }
    
    /**
     * 更新最后更新时间
     */
    updateLastUpdateTime(timeString) {
        this.state.lastUpdate = timeString;
        if (this.elements.lastUpdateTime) {
            this.elements.lastUpdateTime.textContent = timeString;
        }
    }
    
    /**
     * 更新布局模式显示
     */
    updateLayoutMode(mode) {
        if (this.elements.layoutMode) {
            this.elements.layoutMode.textContent = mode;
        }
    }
    
    /**
     * 数据更新通知
     */
    notifyDataUpdate(data) {
        // 增加数据计数
        this.updateDataCount(this.state.dataCount + 1);
        
        // 更新时间
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        this.updateLastUpdateTime(timeString);
    }
    
    /**
     * 显示通知消息
     */
    showNotification(message, type = 'info', duration = null) {
        if (!this.elements.notificationContainer) return;
        
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.title = '点击关闭';
        
        // 添加到容器
        this.elements.notificationContainer.appendChild(notification);
        
        // 添加到队列
        this.notifications.queue.push(notification);
        
        // 限制显示数量
        this.limitVisibleNotifications();
        
        // 自动移除
        const timeoutDuration = duration || this.notifications.defaultDuration;
        setTimeout(() => {
            this.removeNotification(notification);
        }, timeoutDuration);
        
        console.log(`📢 显示通知: ${message} (${type})`);
    }
    
    /**
     * 移除通知
     */
    removeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                
                // 从队列中移除
                const index = this.notifications.queue.indexOf(notification);
                if (index > -1) {
                    this.notifications.queue.splice(index, 1);
                }
            }, 300);
        }
    }
    
    /**
     * 限制可见通知数量
     */
    limitVisibleNotifications() {
        while (this.notifications.queue.length > this.notifications.maxVisible) {
            const oldestNotification = this.notifications.queue.shift();
            this.removeNotification(oldestNotification);
        }
    }
    
    /**
     * 清空所有通知
     */
    clearAllNotifications() {
        [...this.notifications.queue].forEach(notification => {
            this.removeNotification(notification);
        });
    }
    
    /**
     * 显示错误消息
     */
    showError(message) {
        this.showNotification(message, 'error', 5000);
    }
    
    /**
     * 显示成功消息
     */
    showSuccess(message) {
        this.showNotification(message, 'success', 3000);
    }
    
    /**
     * 显示警告消息
     */
    showWarning(message) {
        this.showNotification(message, 'warning', 4000);
    }
    
    /**
     * 启动状态更新定时器
     */
    startStateUpdateTimer() {
        setInterval(() => {
            // 这里可以添加定期状态更新逻辑
            // 例如更新连接时长、内存使用等
        }, 1000);
    }
    
    /**
     * 获取工具栏状态
     */
    getToolbarStatus() {
        return {
            isInitialized: this.isInitialized,
            connectionStatus: this.state.connectionStatus,
            dataUpdatePaused: this.state.dataUpdatePaused,
            isFullscreen: this.state.isFullscreen,
            dataCount: this.state.dataCount,
            lastUpdate: this.state.lastUpdate,
            notificationCount: this.notifications.queue.length
        };
    }
    
    /**
     * 注册事件回调
     */
    on(eventType, callback) {
        if (this.eventCallbacks[eventType]) {
            this.eventCallbacks[eventType].push(callback);
        } else {
            console.warn('⚠️ 未知的事件类型:', eventType);
        }
    }
    
    /**
     * 移除事件回调
     */
    off(eventType, callback) {
        if (this.eventCallbacks[eventType]) {
            const index = this.eventCallbacks[eventType].indexOf(callback);
            if (index > -1) {
                this.eventCallbacks[eventType].splice(index, 1);
            }
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
     * 销毁工具栏管理器
     */
    destroy() {
        console.log('🧹 销毁 DualGridToolbarManager...');
        
        // 清空所有通知
        this.clearAllNotifications();
        
        // 移除事件监听器
        document.removeEventListener('keydown', this.handleKeyboardShortcuts);
        document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
        
        // 清空事件回调
        for (const eventType in this.eventCallbacks) {
            this.eventCallbacks[eventType] = [];
        }
        
        // 清空DOM引用
        for (const key in this.elements) {
            this.elements[key] = null;
        }
        
        // 重置状态
        this.isInitialized = false;
        
        console.log('✅ DualGridToolbarManager 销毁完成');
    }
}

/**
 * 初始化双Grid工具栏管理器
 */
function initDualGridToolbarManager() {
    try {
        return new DualGridToolbarManager();
    } catch (error) {
        console.error('❌ DualGridToolbarManager 创建失败:', error);
        throw error;
    }
}

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DualGridToolbarManager, initDualGridToolbarManager };
} else if (typeof window !== 'undefined') {
    window.DualGridToolbarManager = DualGridToolbarManager;
    window.initDualGridToolbarManager = initDualGridToolbarManager;
}
/**
 * Socket.IO客户端模块
 * 负责与后端服务器的WebSocket实时通信
 * 
 * 功能特性:
 * - WebSocket连接管理
 * - 断线自动重连机制
 * - 实时数据接收和处理
 * - 连接状态监控
 * - 数据验证和错误处理
 */

class WebSocketManager {
    constructor(serverUrl = 'http://localhost:8000') {
        this.serverUrl = serverUrl;
        this.socket = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 1000; // 初始重连延迟1秒
        this.maxReconnectDelay = 30000; // 最大重连延迟30秒
        this.connectionStartTime = null;
        this.lastDataTime = null;
        this.receivedDataCount = 0;
        this.connectionDuration = 0;
        
        // 事件回调函数
        this.callbacks = {
            onConnect: [],
            onDisconnect: [],
            onData: [],
            onError: [],
            onStatusChange: []
        };
        
        // 连接状态定时器
        this.connectionTimer = null;
        this.statusUpdateInterval = 1000; // 每秒更新一次状态
        
        this.initSocket();
    }
    
    /**
     * 初始化Socket.IO连接
     */
    initSocket() {
        try {
            console.log(`🔌 初始化Socket.IO连接: ${this.serverUrl}`);
            
            this.socket = io(this.serverUrl, {
                autoConnect: false,
                transports: ['websocket', 'polling'],
                timeout: 20000,
                reconnection: false, // 手动控制重连
                forceNew: true
            });
            
            this.bindSocketEvents();
            
        } catch (error) {
            console.error('❌ Socket.IO初始化失败:', error);
            this.triggerCallback('onError', error);
        }
    }
    
    /**
     * 绑定Socket.IO事件
     */
    bindSocketEvents() {
        // 连接成功事件
        this.socket.on('connect', () => {
            console.log('✅ WebSocket连接成功');
            this.isConnected = true;
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            this.connectionStartTime = new Date();
            this.lastDataTime = new Date();
            
            this.startConnectionTimer();
            this.updateConnectionStatus('connected');
            this.triggerCallback('onConnect');
        });
        
        // 连接断开事件
        this.socket.on('disconnect', (reason) => {
            console.log('🔌 WebSocket连接断开:', reason);
            this.isConnected = false;
            this.isConnecting = false;
            
            this.stopConnectionTimer();
            this.updateConnectionStatus('disconnected');
            this.triggerCallback('onDisconnect', reason);
            
            // 自动重连
            if (reason !== 'io client disconnect') {
                this.scheduleReconnect();
            }
        });
        
        // 连接错误事件
        this.socket.on('connect_error', (error) => {
            console.error('❌ WebSocket连接错误:', error);
            this.isConnecting = false;
            
            this.updateConnectionStatus('error');
            this.triggerCallback('onError', error);
            this.scheduleReconnect();
        });
        
        // 实时数据事件
        this.socket.on('realtime_data', (data) => {
            this.handleRealtimeData(data);
        });
        
        // 连接状态事件
        this.socket.on('connection_status', (status) => {
            console.log('📡 服务器状态:', status);
            this.updateServerStatus(status);
        });
        
        // 历史数据响应事件
        this.socket.on('history_response', (response) => {
            console.log('📊 历史数据响应:', response);
            this.handleHistoryResponse(response);
        });
        
        // 通用错误事件
        this.socket.on('error', (error) => {
            console.error('❌ Socket错误:', error);
            this.triggerCallback('onError', error);
        });
    }
    
    /**
     * 连接到服务器
     */
    connect() {
        if (this.isConnected || this.isConnecting) {
            console.log('⚠️ 已连接或正在连接中');
            return;
        }
        
        console.log('🔌 开始连接WebSocket...');
        this.isConnecting = true;
        this.updateConnectionStatus('connecting');
        
        try {
            this.socket.connect();
        } catch (error) {
            console.error('❌ 连接失败:', error);
            this.isConnecting = false;
            this.triggerCallback('onError', error);
        }
    }
    
    /**
     * 断开连接
     */
    disconnect() {
        if (!this.isConnected && !this.isConnecting) {
            console.log('⚠️ 未连接');
            return;
        }
        
        console.log('🔌 断开WebSocket连接...');
        this.stopConnectionTimer();
        
        if (this.socket) {
            this.socket.disconnect();
        }
        
        this.isConnected = false;
        this.isConnecting = false;
        this.updateConnectionStatus('disconnected');
    }
    
    /**
     * 处理实时数据
     */
    handleRealtimeData(data) {
        try {
            // 数据验证
            if (!this.validateRealtimeData(data)) {
                console.warn('⚠️ 接收到无效数据:', data);
                return;
            }
            
            // 更新统计信息
            this.receivedDataCount++;
            this.lastDataTime = new Date();
            
            // 触发数据回调
            this.triggerCallback('onData', data);
            
            // 更新UI统计
            this.updateDataStatistics();
            
            console.debug('📊 接收实时数据:', {
                sequence: data.metadata?.sequence_id,
                timestamp: data.metadata?.timestamp,
                ppie_count: Object.keys(data.ppie_group || {}).length,
                vvie_count: Object.keys(data.vvie_group || {}).length
            });
            
        } catch (error) {
            console.error('❌ 处理实时数据失败:', error);
            this.triggerCallback('onError', error);
        }
    }
    
    /**
     * 验证实时数据格式
     */
    validateRealtimeData(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }
        
        // 检查必要字段
        if (!data.metadata || !data.ppie_group || !data.vvie_group) {
            return false;
        }
        
        // 检查metadata字段
        const metadata = data.metadata;
        if (!metadata.timestamp || !metadata.sequence_id) {
            return false;
        }
        
        // 检查PPIE数据组
        const ppieGroup = data.ppie_group;
        const requiredPpieFields = ['p_data', 'pib_data', 'psd_data', 'peb_data'];
        if (!requiredPpieFields.every(field => Array.isArray(ppieGroup[field]))) {
            return false;
        }
        
        // 检查VVIE数据组
        const vvieGroup = data.vvie_group;
        const requiredVvieFields = ['v_data', 'vib_data', 'vsd_data', 'veb_data'];
        if (!requiredVvieFields.every(field => Array.isArray(vvieGroup[field]))) {
            return false;
        }
        
        return true;
    }
    
    /**
     * 处理历史数据响应
     */
    handleHistoryResponse(response) {
        try {
            if (response.status === 'success') {
                console.log(`📊 历史数据加载成功: ${response.count} 条记录`);
                this.triggerCallback('onData', response.data);
            } else {
                console.error('❌ 历史数据加载失败:', response.message);
                this.triggerCallback('onError', new Error(response.message));
            }
        } catch (error) {
            console.error('❌ 处理历史数据响应失败:', error);
            this.triggerCallback('onError', error);
        }
    }
    
    /**
     * 请求历史数据
     */
    requestHistory(startTime, endTime) {
        if (!this.isConnected) {
            console.warn('⚠️ 未连接，无法请求历史数据');
            return;
        }
        
        console.log('📊 请求历史数据:', { startTime, endTime });
        
        this.socket.emit('request_history', {
            start_time: startTime,
            end_time: endTime
        });
    }
    
    /**
     * 计划重连
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ 达到最大重连次数，停止重连');
            this.updateConnectionStatus('failed');
            return;
        }
        
        this.reconnectAttempts++;
        
        // 指数退避算法
        const delay = Math.min(
            this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
            this.maxReconnectDelay
        );
        
        console.log(`🔄 ${delay/1000}秒后进行第${this.reconnectAttempts}次重连尝试...`);
        this.updateConnectionStatus('reconnecting');
        
        setTimeout(() => {
            if (!this.isConnected) {
                this.connect();
            }
        }, delay);
    }
    
    /**
     * 启动连接计时器
     */
    startConnectionTimer() {
        this.stopConnectionTimer();
        
        this.connectionTimer = setInterval(() => {
            if (this.isConnected && this.connectionStartTime) {
                this.connectionDuration = Date.now() - this.connectionStartTime.getTime();
                this.updateConnectionDuration();
            }
        }, this.statusUpdateInterval);
    }
    
    /**
     * 停止连接计时器
     */
    stopConnectionTimer() {
        if (this.connectionTimer) {
            clearInterval(this.connectionTimer);
            this.connectionTimer = null;
        }
    }
    
    /**
     * 更新连接状态显示
     */
    updateConnectionStatus(status) {
        const statusElement = $('#connection-status');
        const statusText = {
            'connected': '已连接',
            'connecting': '连接中...',
            'disconnected': '未连接',
            'reconnecting': '重连中...',
            'error': '连接错误',
            'failed': '连接失败'
        };
        
        statusElement.text(statusText[status] || status);
        statusElement.removeClass('connected disconnected');
        
        if (status === 'connected') {
            statusElement.addClass('connected');
        } else {
            statusElement.addClass('disconnected');
        }
        
        this.triggerCallback('onStatusChange', status);
    }
    
    /**
     * 更新服务器状态显示
     */
    updateServerStatus(status) {
        if (status.server_time) {
            const serverTime = new Date(status.server_time);
            $('#server-time').text(serverTime.toLocaleTimeString());
        }
        
        if (status.is_trading_time !== undefined) {
            const tradingStatus = $('#trading-status');
            const tradingText = $('#trading-time-text');
            
            if (status.is_trading_time) {
                tradingStatus.removeClass('non-trading').addClass('trading');
                tradingText.text('交易时间');
            } else {
                tradingStatus.removeClass('trading').addClass('non-trading');
                tradingText.text('非交易时间');
            }
        }
    }
    
    /**
     * 更新数据统计显示
     */
    updateDataStatistics() {
        $('#received-count').text(this.receivedDataCount);
        $('#sequence-number').text(this.receivedDataCount);
    }
    
    /**
     * 更新连接时长显示
     */
    updateConnectionDuration() {
        const duration = Math.floor(this.connectionDuration / 1000);
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = duration % 60;
        
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        $('#connection-duration').text(timeString);
    }
    
    /**
     * 添加事件回调
     */
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }
    
    /**
     * 移除事件回调
     */
    off(event, callback) {
        if (this.callbacks[event]) {
            const index = this.callbacks[event].indexOf(callback);
            if (index > -1) {
                this.callbacks[event].splice(index, 1);
            }
        }
    }
    
    /**
     * 触发回调函数
     */
    triggerCallback(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ 回调函数执行失败 [${event}]:`, error);
                }
            });
        }
    }
    
    /**
     * 获取连接状态信息
     */
    getConnectionInfo() {
        return {
            isConnected: this.isConnected,
            isConnecting: this.isConnecting,
            reconnectAttempts: this.reconnectAttempts,
            connectionDuration: this.connectionDuration,
            receivedDataCount: this.receivedDataCount,
            lastDataTime: this.lastDataTime,
            serverUrl: this.serverUrl
        };
    }
    
    /**
     * 获取网络质量信息
     */
    getNetworkQuality() {
        if (!this.isConnected) {
            return { quality: 'disconnected', latency: null };
        }
        
        const now = new Date();
        const timeSinceLastData = this.lastDataTime ? now - this.lastDataTime : null;
        
        let quality = 'good';
        if (timeSinceLastData > 10000) { // 10秒无数据
            quality = 'poor';
        } else if (timeSinceLastData > 5000) { // 5秒无数据
            quality = 'fair';
        }
        
        return {
            quality: quality,
            timeSinceLastData: timeSinceLastData,
            dataRate: this.receivedDataCount / (this.connectionDuration / 1000 || 1)
        };
    }
    
    /**
     * 重置统计信息
     */
    resetStatistics() {
        this.receivedDataCount = 0;
        this.lastDataTime = null;
        this.updateDataStatistics();
        console.log('📊 统计信息已重置');
    }
    
    /**
     * 销毁WebSocket管理器
     */
    destroy() {
        console.log('🔄 销毁WebSocket管理器...');
        
        this.stopConnectionTimer();
        
        if (this.socket) {
            this.socket.disconnect();
            this.socket.removeAllListeners();
            this.socket = null;
        }
        
        this.isConnected = false;
        this.isConnecting = false;
        
        // 清空回调
        for (const event in this.callbacks) {
            this.callbacks[event] = [];
        }
        
        console.log('✅ WebSocket管理器已销毁');
    }
}

// 全局WebSocket管理器实例
window.websocketManager = null;

// WebSocket模块初始化函数
function initWebSocketModule(serverUrl) {
    try {
        window.websocketManager = new WebSocketManager(serverUrl);
        console.log('✅ WebSocket模块初始化完成');
        return window.websocketManager;
    } catch (error) {
        console.error('❌ WebSocket模块初始化失败:', error);
        throw error;
    }
}

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WebSocketManager, initWebSocketModule };
}
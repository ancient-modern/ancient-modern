/**
 * 页面布局管理器 (PageLayoutManager)
 * 负责控制双Grid布局的显示状态和尺寸分配
 * 
 * 核心功能：
 * - 管理上下两个数据视图区域的尺寸分配
 * - 处理显示状态切换的动画效果
 * - 响应工具栏的切换指令
 * - 维护布局状态的持久化
 * 
 * 布局状态：
 * - 'full': 全显示模式 (上部60% + 下部37% + 工具栏3%)
 * - 'upper-only': 上部扩展模式 (上部97% + 工具栏3%)
 */

class PageLayoutManager {
    constructor() {
        this.isInitialized = false;
        this.isTransitioning = false;
        
        // 布局状态管理
        this.layoutState = {
            mode: 'full', // 'full' | 'upper-only'
            upperGridVisible: true,
            lowerGridVisible: true,
            lastToggleTime: null,
            transitionDuration: 300
        };
        
        // DOM元素引用
        this.elements = {
            upperDataView: null,
            lowerDataView: null,
            toggleButton: null,
            layoutModeIndicator: null
        };
        
        // 事件回调存储
        this.eventCallbacks = {
            onLayoutChange: [],
            onTransitionStart: [],
            onTransitionEnd: []
        };
        
        // 布局历史记录
        this.layoutHistory = [];
        this.maxHistorySize = 10;
        
        console.log('🏗️ PageLayoutManager 初始化...');
        this.init();
    }
    
    /**
     * 初始化布局管理器
     */
    async init() {
        try {
            // 获取DOM元素引用
            this.getDOMReferences();
            
            // 恢复上次保存的布局状态
            this.restoreLayoutState();
            
            // 绑定事件监听器
            this.bindEventListeners();
            
            // 应用初始布局
            this.applyLayoutState();
            
            // 验证布局配置
            this.validateLayout();
            
            this.isInitialized = true;
            console.log('✅ PageLayoutManager 初始化完成');
            
            // 触发初始化完成事件
            this.triggerEvent('onLayoutChange', {
                mode: this.layoutState.mode,
                timestamp: Date.now(),
                source: 'initialization'
            });
            
        } catch (error) {
            console.error('❌ PageLayoutManager 初始化失败:', error);
            throw error;
        }
    }
    
    /**
     * 获取DOM元素引用
     */
    getDOMReferences() {
        this.elements.upperDataView = document.getElementById('upperDataView');
        this.elements.lowerDataView = document.getElementById('lowerDataView');
        this.elements.toggleButton = document.getElementById('toggleLayoutBtn');
        this.elements.layoutModeIndicator = document.getElementById('layoutMode');
        
        // 验证必需元素是否存在
        const requiredElements = ['upperDataView', 'lowerDataView', 'toggleButton'];
        for (const elementName of requiredElements) {
            if (!this.elements[elementName]) {
                throw new Error(`必需的DOM元素未找到: ${elementName}`);
            }
        }
        
        console.log('✅ DOM元素引用获取完成');
    }
    
    /**
     * 恢复上次保存的布局状态
     */
    restoreLayoutState() {
        try {
            const savedState = localStorage.getItem('dualGrid_layoutState');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                
                // 验证状态数据的有效性
                if (this.validateLayoutState(parsedState)) {
                    this.layoutState = { ...this.layoutState, ...parsedState };
                    console.log('✅ 布局状态恢复成功:', this.layoutState.mode);
                } else {
                    console.warn('⚠️ 保存的布局状态无效，使用默认状态');
                }
            }
        } catch (error) {
            console.warn('⚠️ 布局状态恢复失败，使用默认状态:', error);
        }
    }
    
    /**
     * 绑定事件监听器
     */
    bindEventListeners() {
        // 切换按钮点击事件
        if (this.elements.toggleButton) {
            this.elements.toggleButton.addEventListener('click', (event) => {
                event.preventDefault();
                this.toggleLayout();
            });
        }
        
        // 键盘快捷键支持
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.key === 'h') {
                event.preventDefault();
                this.toggleLayout();
            }
        });
        
        // 窗口大小变化事件
        window.addEventListener('resize', this.debounce(() => {
            this.handleWindowResize();
        }, 250));
        
        // 监听过渡动画结束事件
        if (this.elements.upperDataView) {
            this.elements.upperDataView.addEventListener('transitionend', (event) => {
                if (event.propertyName === 'height') {
                    this.handleTransitionEnd();
                }
            });
        }
        
        if (this.elements.lowerDataView) {
            this.elements.lowerDataView.addEventListener('transitionend', (event) => {
                if (event.propertyName === 'height' || event.propertyName === 'opacity') {
                    this.handleTransitionEnd();
                }
            });
        }
        
        console.log('✅ 事件监听器绑定完成');
    }
    
    /**
     * 切换布局状态
     */
    toggleLayout() {
        if (this.isTransitioning) {
            console.warn('⚠️ 布局切换进行中，忽略新的切换请求');
            return false;
        }
        
        try {
            const newMode = this.layoutState.mode === 'full' ? 'upper-only' : 'full';
            return this.setLayoutMode(newMode, 'user_toggle');
        } catch (error) {
            console.error('❌ 布局切换失败:', error);
            return false;
        }
    }
    
    /**
     * 设置布局模式
     */
    setLayoutMode(mode, source = 'api') {
        if (!this.validateLayoutMode(mode)) {
            console.error('❌ 无效的布局模式:', mode);
            return false;
        }
        
        if (this.layoutState.mode === mode) {
            console.log('🔄 布局模式未改变:', mode);
            return true;
        }
        
        try {
            this.isTransitioning = true;
            
            // 保存当前状态到历史记录
            this.saveToHistory();
            
            // 更新布局状态
            const previousMode = this.layoutState.mode;
            this.layoutState.mode = mode;
            this.layoutState.upperGridVisible = true;
            this.layoutState.lowerGridVisible = (mode === 'full');
            this.layoutState.lastToggleTime = Date.now();
            
            // 触发切换开始事件
            this.triggerEvent('onTransitionStart', {
                previousMode,
                newMode: mode,
                source,
                timestamp: Date.now()
            });
            
            // 应用新的布局状态
            this.applyLayoutState();
            
            // 更新按钮状态
            this.updateToggleButton();
            
            // 更新状态指示器
            this.updateLayoutModeIndicator();
            
            // 保存状态到本地存储
            this.saveLayoutState();
            
            console.log(`🔄 布局模式切换: ${previousMode} → ${mode}`);
            
            return true;
            
        } catch (error) {
            console.error('❌ 设置布局模式失败:', error);
            this.isTransitioning = false;
            return false;
        }
    }
    
    /**
     * 应用布局状态到DOM元素
     */
    applyLayoutState() {
        const { mode } = this.layoutState;
        
        // 应用上部视图样式
        if (this.elements.upperDataView) {
            if (mode === 'upper-only') {
                this.elements.upperDataView.classList.add('expanded');
            } else {
                this.elements.upperDataView.classList.remove('expanded');
            }
        }
        
        // 应用下部视图样式
        if (this.elements.lowerDataView) {
            if (mode === 'upper-only') {
                this.elements.lowerDataView.classList.add('hidden');
            } else {
                this.elements.lowerDataView.classList.remove('hidden');
            }
        }
        
        // 通知外部组件布局已变化（延迟执行，等待CSS动画）
        setTimeout(() => {
            this.triggerEvent('onLayoutChange', {
                mode: this.layoutState.mode,
                upperVisible: this.layoutState.upperGridVisible,
                lowerVisible: this.layoutState.lowerGridVisible,
                timestamp: Date.now()
            });
        }, 50);
    }
    
    /**
     * 更新切换按钮状态
     */
    updateToggleButton() {
        if (!this.elements.toggleButton) return;
        
        const button = this.elements.toggleButton;
        const icon = button.querySelector('.button-icon');
        const text = button.querySelector('.button-text');
        
        if (this.layoutState.mode === 'upper-only') {
            // 下部隐藏状态
            button.classList.add('hiding');
            if (icon) icon.textContent = '⬆️';
            if (text) text.textContent = '显示下半部分';
            button.title = '显示下半部分数据视图';
        } else {
            // 全显示状态
            button.classList.remove('hiding');
            if (icon) icon.textContent = '⬇️';
            if (text) text.textContent = '隐藏下半部分';
            button.title = '隐藏下半部分数据视图';
        }
    }
    
    /**
     * 更新布局模式指示器
     */
    updateLayoutModeIndicator() {
        if (!this.elements.layoutModeIndicator) return;
        
        const modeText = this.layoutState.mode === 'full' ? '全显示' : '上部扩展';
        this.elements.layoutModeIndicator.textContent = modeText;
    }
    
    /**
     * 处理过渡动画结束
     */
    handleTransitionEnd() {
        if (!this.isTransitioning) return;
        
        this.isTransitioning = false;
        
        // 触发切换完成事件
        this.triggerEvent('onTransitionEnd', {
            mode: this.layoutState.mode,
            timestamp: Date.now()
        });
        
        console.log('✅ 布局切换动画完成');
    }
    
    /**
     * 处理窗口大小变化
     */
    handleWindowResize() {
        if (this.isTransitioning) return;
        
        // 重新验证和应用布局
        this.validateLayout();
        this.applyLayoutState();
        
        // 通知外部组件窗口大小已变化
        this.triggerEvent('onLayoutChange', {
            mode: this.layoutState.mode,
            source: 'window_resize',
            timestamp: Date.now()
        });
    }
    
    /**
     * 验证布局配置
     */
    validateLayout() {
        const container = document.querySelector('.page-container');
        if (!container) {
            console.warn('⚠️ 页面容器未找到');
            return false;
        }
        
        const containerHeight = container.offsetHeight;
        if (containerHeight < 200) {
            console.warn('⚠️ 页面容器高度过小:', containerHeight);
        }
        
        return true;
    }
    
    /**
     * 验证布局状态数据
     */
    validateLayoutState(state) {
        if (!state || typeof state !== 'object') return false;
        if (!['full', 'upper-only'].includes(state.mode)) return false;
        return true;
    }
    
    /**
     * 验证布局模式
     */
    validateLayoutMode(mode) {
        return ['full', 'upper-only'].includes(mode);
    }
    
    /**
     * 保存布局状态到本地存储
     */
    saveLayoutState() {
        try {
            const stateToSave = {
                mode: this.layoutState.mode,
                lastToggleTime: this.layoutState.lastToggleTime
            };
            localStorage.setItem('dualGrid_layoutState', JSON.stringify(stateToSave));
        } catch (error) {
            console.warn('⚠️ 保存布局状态失败:', error);
        }
    }
    
    /**
     * 保存当前状态到历史记录
     */
    saveToHistory() {
        const historyEntry = {
            mode: this.layoutState.mode,
            timestamp: Date.now()
        };
        
        this.layoutHistory.push(historyEntry);
        
        // 限制历史记录大小
        if (this.layoutHistory.length > this.maxHistorySize) {
            this.layoutHistory.shift();
        }
    }
    
    /**
     * 获取布局历史记录
     */
    getLayoutHistory() {
        return [...this.layoutHistory];
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
     * 获取当前布局状态
     */
    getLayoutState() {
        return {
            ...this.layoutState,
            isTransitioning: this.isTransitioning,
            isInitialized: this.isInitialized
        };
    }
    
    /**
     * 获取布局配置信息
     */
    getLayoutInfo() {
        return {
            currentMode: this.layoutState.mode,
            isTransitioning: this.isTransitioning,
            lastToggleTime: this.layoutState.lastToggleTime,
            historyCount: this.layoutHistory.length,
            supportedModes: ['full', 'upper-only']
        };
    }
    
    /**
     * 强制刷新布局
     */
    refreshLayout() {
        console.log('🔄 强制刷新布局...');
        this.applyLayoutState();
        this.updateToggleButton();
        this.updateLayoutModeIndicator();
        
        this.triggerEvent('onLayoutChange', {
            mode: this.layoutState.mode,
            source: 'manual_refresh',
            timestamp: Date.now()
        });
    }
    
    /**
     * 重置布局到默认状态
     */
    resetLayout() {
        console.log('🔄 重置布局到默认状态...');
        return this.setLayoutMode('full', 'reset');
    }
    
    /**
     * 防抖函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * 销毁管理器
     */
    destroy() {
        console.log('🧹 销毁 PageLayoutManager...');
        
        // 移除事件监听器
        if (this.elements.toggleButton) {
            this.elements.toggleButton.removeEventListener('click', this.toggleLayout);
        }
        
        window.removeEventListener('resize', this.handleWindowResize);
        document.removeEventListener('keydown', this.handleKeyDown);
        
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
        this.isTransitioning = false;
        
        console.log('✅ PageLayoutManager 销毁完成');
    }
}

/**
 * 初始化页面布局管理器
 * 供外部模块调用的工厂函数
 */
function initPageLayoutManager() {
    try {
        return new PageLayoutManager();
    } catch (error) {
        console.error('❌ PageLayoutManager 创建失败:', error);
        throw error;
    }
}

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PageLayoutManager, initPageLayoutManager };
} else if (typeof window !== 'undefined') {
    window.PageLayoutManager = PageLayoutManager;
    window.initPageLayoutManager = initPageLayoutManager;
}
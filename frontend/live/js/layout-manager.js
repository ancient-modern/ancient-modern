/**
 * 布局管理器
 * 负责处理视图的显示/隐藏、高度调整等交互功能
 */

class LayoutManager {
    constructor() {
        this.isDragging = false;
        this.dragTarget = null;
        this.startY = 0;
        this.startHeight = 0;
        this.minHeight = 150;
        this.visibleSections = ['kline-section', 'volume-section', 'macd-section', 'kdj-section'];
        this.sectionHeights = {};
        
        this.init();
    }

    /**
     * 初始化布局管理器
     */
    init() {
        this.initPanelToggle();
        this.initIndicatorControls();
        this.initChartResize();
        this.initResponsiveLayout();
        this.calculateInitialLayout();
    }

    /**
     * 初始化侧边栏面板切换功能
     */
    initPanelToggle() {
        $(document).on('click', '.panel-toggle', (e) => {
            const button = $(e.target);
            const targetId = button.data('target');
            const panel = $('#' + targetId);
            
            if (panel.hasClass('collapsed')) {
                this.showPanel(targetId);
                button.text('−');
            } else {
                this.hidePanel(targetId);
                button.text('+');
            }
        });
    }

    /**
     * 初始化指标控制按钮
     */
    initIndicatorControls() {
        $(document).on('click', '.indicator-btn', (e) => {
            const button = $(e.target);
            const targetSection = button.data('target');
            
            if (button.hasClass('active')) {
                this.hideChartSection(targetSection);
                button.removeClass('active');
            } else {
                this.showChartSection(targetSection);
                button.addClass('active');
            }
        });
    }

    /**
     * 初始化图表高度调整功能
     */
    initChartResize() {
        $(document).on('mousedown', '.chart-resize-handle', (e) => {
            this.startDrag(e);
        });

        $(document).on('mousemove', (e) => {
            if (this.isDragging) {
                this.doDrag(e);
            }
        });

        $(document).on('mouseup', () => {
            this.endDrag();
        });

        // 防止拖拽时选中文本
        $(document).on('selectstart', () => {
            return !this.isDragging;
        });
    }

    /**
     * 初始化响应式布局
     */
    initResponsiveLayout() {
        $(window).on('resize', () => {
            this.debounce(() => {
                this.recalculateLayout();
                window.chartComponents.resizeCharts();
            }, 250)();
        });
    }

    /**
     * 显示侧边栏面板
     */
    showPanel(panelId) {
        const panel = $('#' + panelId);
        panel.removeClass('collapsed');
        this.recalculateSidebarLayout();
    }

    /**
     * 隐藏侧边栏面板
     */
    hidePanel(panelId) {
        const panel = $('#' + panelId);
        panel.addClass('collapsed');
        this.recalculateSidebarLayout();
    }

    /**
     * 显示图表区域
     */
    showChartSection(sectionId) {
        const section = $('#' + sectionId);
        section.removeClass('hidden');
        
        if (!this.visibleSections.includes(sectionId)) {
            this.visibleSections.push(sectionId);
        }
        
        this.recalculateLayout();
        
        // 延迟重新渲染图表，确保DOM更新完成
        setTimeout(() => {
            window.chartComponents.resizeCharts();
        }, 100);
    }

    /**
     * 隐藏图表区域
     */
    hideChartSection(sectionId) {
        const section = $('#' + sectionId);
        section.addClass('hidden');
        
        this.visibleSections = this.visibleSections.filter(id => id !== sectionId);
        this.recalculateLayout();
        
        setTimeout(() => {
            window.chartComponents.resizeCharts();
        }, 100);
    }

    /**
     * 开始拖拽
     */
    startDrag(e) {
        e.preventDefault();
        this.isDragging = true;
        this.dragTarget = $(e.target).data('target');
        this.startY = e.clientY;
        
        const targetSection = $('#' + this.dragTarget);
        this.startHeight = targetSection.height();
        
        $('body').addClass('dragging');
        $(e.target).addClass('dragging');
    }

    /**
     * 执行拖拽
     */
    doDrag(e) {
        if (!this.isDragging || !this.dragTarget) return;
        
        const deltaY = e.clientY - this.startY;
        const newHeight = Math.max(this.minHeight, this.startHeight + deltaY);
        
        const targetSection = $('#' + this.dragTarget);
        targetSection.height(newHeight);
        
        // 记录当前高度
        this.sectionHeights[this.dragTarget] = newHeight;
        
        // 重新调整其他区域
        this.adjustOtherSections(this.dragTarget, newHeight);
        
        // 实时重绘图表
        window.chartComponents.resizeCharts();
    }

    /**
     * 结束拖拽
     */
    endDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.dragTarget = null;
        
        $('body').removeClass('dragging');
        $('.chart-resize-handle').removeClass('dragging');
        
        // 最终调整布局
        this.recalculateLayout();
        window.chartComponents.resizeCharts();
    }

    /**
     * 调整其他区域的高度
     */
    adjustOtherSections(excludeId, excludeHeight) {
        const container = $('.charts-container');
        const containerHeight = container.height();
        const visibleSections = this.visibleSections.filter(id => id !== excludeId);
        
        if (visibleSections.length === 0) return;
        
        // 计算剩余高度
        const remainingHeight = containerHeight - excludeHeight - (8 * this.visibleSections.length); // 减去间距
        const heightPerSection = Math.max(this.minHeight, remainingHeight / visibleSections.length);
        
        visibleSections.forEach(sectionId => {
            $('#' + sectionId).height(heightPerSection);
        });
    }

    /**
     * 计算初始布局
     */
    calculateInitialLayout() {
        this.recalculateLayout();
    }

    /**
     * 重新计算布局
     */
    recalculateLayout() {
        const container = $('.charts-container');
        const containerHeight = container.height();
        const visibleCount = this.visibleSections.length;
        
        if (visibleCount === 0) return;
        
        // 为K线图分配更多空间
        const klineRatio = 0.4; // K线图占40%
        const otherRatio = (1 - klineRatio) / Math.max(1, visibleCount - 1); // 其他图表平分剩余空间
        
        const gap = 8; // 区域间距
        const availableHeight = containerHeight - (gap * visibleCount);
        
        this.visibleSections.forEach(sectionId => {
            const section = $('#' + sectionId);
            let height;
            
            if (sectionId === 'kline-section') {
                height = Math.max(this.minHeight, availableHeight * klineRatio);
            } else {
                height = Math.max(this.minHeight, availableHeight * otherRatio);
            }
            
            // 如果之前有手动调整的高度，则使用手动调整的高度
            if (this.sectionHeights[sectionId]) {
                height = this.sectionHeights[sectionId];
            }
            
            section.height(height);
        });
    }

    /**
     * 重新计算侧边栏布局
     */
    recalculateSidebarLayout() {
        const sidebar = $('.sidebar');
        const panels = $('.sidebar-panel');
        const visiblePanels = panels.filter(':not(.collapsed)');
        
        if (visiblePanels.length === 0) return;
        
        const sidebarHeight = sidebar.height();
        const headerHeight = 40; // 面板头部高度
        const totalHeaderHeight = panels.length * headerHeight;
        const availableHeight = sidebarHeight - totalHeaderHeight;
        const heightPerPanel = availableHeight / visiblePanels.length;
        
        panels.each(function() {
            const panel = $(this);
            const content = panel.find('.panel-content');
            
            if (panel.hasClass('collapsed')) {
                content.height(0);
            } else {
                content.height(Math.max(50, heightPerPanel - 16)); // 减去padding
            }
        });
    }

    /**
     * 获取当前布局配置
     */
    getLayoutConfig() {
        return {
            visibleSections: [...this.visibleSections],
            sectionHeights: {...this.sectionHeights},
            panelStates: this.getPanelStates()
        };
    }

    /**
     * 应用布局配置
     */
    applyLayoutConfig(config) {
        if (!config) return;
        
        // 恢复可见区域
        if (config.visibleSections) {
            this.visibleSections = [...config.visibleSections];
            
            $('.chart-section').addClass('hidden');
            $('.indicator-btn').removeClass('active');
            
            config.visibleSections.forEach(sectionId => {
                $('#' + sectionId).removeClass('hidden');
                $(`.indicator-btn[data-target="${sectionId}"]`).addClass('active');
            });
        }
        
        // 恢复高度设置
        if (config.sectionHeights) {
            this.sectionHeights = {...config.sectionHeights};
        }
        
        // 恢复面板状态
        if (config.panelStates) {
            this.applyPanelStates(config.panelStates);
        }
        
        this.recalculateLayout();
        this.recalculateSidebarLayout();
    }

    /**
     * 获取面板状态
     */
    getPanelStates() {
        const states = {};
        $('.sidebar-panel').each(function() {
            const panel = $(this);
            const id = panel.attr('id');
            states[id] = !panel.hasClass('collapsed');
        });
        return states;
    }

    /**
     * 应用面板状态
     */
    applyPanelStates(states) {
        Object.keys(states).forEach(panelId => {
            const panel = $('#' + panelId);
            const button = panel.find('.panel-toggle');
            
            if (states[panelId]) {
                panel.removeClass('collapsed');
                button.text('−');
            } else {
                panel.addClass('collapsed');
                button.text('+');
            }
        });
    }

    /**
     * 保存当前布局到本地存储
     */
    async saveLayout() {
        try {
            const config = this.getLayoutConfig();
            await window.dataStorage.saveSetting('layout_config', JSON.stringify(config));
            console.log('布局配置已保存');
        } catch (error) {
            console.error('保存布局配置失败:', error);
        }
    }

    /**
     * 从本地存储加载布局
     */
    async loadLayout() {
        try {
            const configStr = await window.dataStorage.getSetting('layout_config');
            if (configStr) {
                const config = JSON.parse(configStr);
                this.applyLayoutConfig(config);
                console.log('布局配置已加载');
            }
        } catch (error) {
            console.error('加载布局配置失败:', error);
        }
    }

    /**
     * 重置布局到默认状态
     */
    resetLayout() {
        this.visibleSections = ['kline-section', 'volume-section', 'macd-section', 'kdj-section'];
        this.sectionHeights = {};
        
        $('.chart-section').removeClass('hidden');
        $('.indicator-btn').addClass('active');
        $('.sidebar-panel').removeClass('collapsed');
        $('.panel-toggle').text('−');
        
        this.recalculateLayout();
        this.recalculateSidebarLayout();
        
        setTimeout(() => {
            window.chartComponents.resizeCharts();
        }, 100);
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
     * 节流函数
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 获取可视区域信息
     */
    getViewportInfo() {
        return {
            width: $(window).width(),
            height: $(window).height(),
            containerWidth: $('.container').width(),
            containerHeight: $('.container').height(),
            chartsContainerHeight: $('.charts-container').height(),
            sidebarWidth: $('.sidebar').width()
        };
    }
}

// 创建全局实例
window.layoutManager = new LayoutManager();
/**
 * 依赖库加载检测和回退机制
 * 确保即使CDN不可用时也能正常工作
 */

(function() {
    'use strict';
    
    // 检测依赖库是否加载成功
    function checkDependencies() {
        const dependencies = {
            jQuery: typeof $ !== 'undefined',
            ECharts: typeof echarts !== 'undefined',
            Dexie: typeof Dexie !== 'undefined'
        };
        
        return dependencies;
    }
    
    // 显示加载状态
    function showLoadingStatus(message) {
        const statusElement = document.getElementById('data-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.style.color = '#b3b3b3';
        }
    }
    
    // 显示错误状态
    function showErrorStatus(message) {
        const statusElement = document.getElementById('data-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.style.color = '#ec0000';
        }
    }
    
    // 动态加载本地依赖库
    function loadLocalDependencies() {
        return new Promise((resolve, reject) => {
            showLoadingStatus('正在加载本地依赖库...');
            
            const scripts = [
                'lib/jquery.min.js',
                'lib/echarts.min.js',
                'lib/dexie.js'
            ];
            
            let loadedCount = 0;
            const totalCount = scripts.length;
            
            scripts.forEach(src => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = () => {
                    loadedCount++;
                    console.log(`已加载: ${src}`);
                    
                    if (loadedCount === totalCount) {
                        console.log('所有本地依赖库加载完成');
                        resolve();
                    }
                };
                script.onerror = () => {
                    console.error(`加载失败: ${src}`);
                    reject(new Error(`无法加载依赖库: ${src}`));
                };
                document.head.appendChild(script);
            });
        });
    }
    
    // 检查并处理依赖库
    function handleDependencies() {
        // 等待一段时间让CDN脚本加载
        setTimeout(() => {
            const deps = checkDependencies();
            const allLoaded = Object.values(deps).every(loaded => loaded);
            
            if (allLoaded) {
                console.log('所有依赖库已成功加载:', deps);
                showLoadingStatus('依赖库加载完成');
                
                // 继续初始化应用
                if (typeof window.tradingApp === 'undefined') {
                    // 如果主应用还未初始化，等待其加载
                    const checkApp = setInterval(() => {
                        if (typeof TradingApp !== 'undefined') {
                            clearInterval(checkApp);
                            if (!window.tradingApp) {
                                window.tradingApp = new TradingApp();
                            }
                        }
                    }, 100);
                }
            } else {
                console.warn('部分依赖库未加载:', deps);
                showErrorStatus('正在尝试本地回退...');
                
                // 尝试加载本地依赖库
                loadLocalDependencies()
                    .then(() => {
                        // 重新检查
                        setTimeout(() => {
                            const newDeps = checkDependencies();
                            const newAllLoaded = Object.values(newDeps).every(loaded => loaded);
                            
                            if (newAllLoaded) {
                                console.log('本地依赖库加载成功:', newDeps);
                                showLoadingStatus('本地依赖库加载完成');
                                
                                // 初始化应用
                                if (typeof TradingApp !== 'undefined' && !window.tradingApp) {
                                    window.tradingApp = new TradingApp();
                                }
                            } else {
                                showErrorStatus('依赖库加载失败，请检查网络连接');
                                console.error('依赖库加载失败:', newDeps);
                            }
                        }, 1000);
                    })
                    .catch(error => {
                        showErrorStatus('本地依赖库加载失败');
                        console.error('本地依赖库加载失败:', error);
                    });
            }
        }, 2000); // 等待2秒让CDN脚本加载
    }
    
    // 页面加载完成后检查依赖
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', handleDependencies);
    } else {
        handleDependencies();
    }
    
    // 导出检测函数供调试使用
    window.dependencyChecker = {
        check: checkDependencies,
        loadLocal: loadLocalDependencies
    };
})();
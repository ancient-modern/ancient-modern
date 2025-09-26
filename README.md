# 金融分析系统

## 项目概述
金融数据分析平台，提供历史数据分析、回测和实时交易功能。

## 项目结构
- **backend**: 后端服务
  - analysis: 历史数据分析API
  - backtest: 回测引擎
  - live: 实时交易服务
  - task: 后台任务
  - trade: 交易接口
- **frontend**: 前端界面
  - analysis: 历史数据分析界面
  - backtest: 回测界面
  - live: 实时交易界面

## 技术栈
- 前端: ECharts, Dexie, jQuery, Socket.IO
- 后端: FastAPI, DuckDB, ClickHouse

## 快速开始
1. 安装依赖
```bash
pip install -r backend/requirements.txt
```
2. 启动后端服务
```bash
cd backend/analysis/api
python main.py
```
3. 打开前端页面
```bash
open frontend/index.html
```

## 功能特性
- 历史数据可视化分析
- 策略回测
- 实时交易监控

## 开发指南
1. 配置`.env`文件
2. 确保WebSocket连接可用
3. 各模块独立开发测试

License: APACHE-2.0
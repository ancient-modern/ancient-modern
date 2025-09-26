# 金融分析系统

## 项目概述
金融数据分析平台，提供历史数据分析、回测和实时模拟交易功能。
## 项目使用的主要技术框架
- **FastAPI**: 完成基础http接口,socketio的通信
- **DuckDB**: 速度很快的数据分析数据库,主要特性就是加载数据文件快,启动迅速,通过内存引擎可以处理上百万的数据，主要可以用于实时交易的丁单薄的分析，例如多个虚拟的盈亏账户的买卖交易订单PNL实时计算，动态的加载parquet文件，主要是用于数据清洗的因子数据加载用于量化策略交易员分析数据，同时duckdb还提供很多基础量化需要计算的函数
- **ClickHouse**: 加载大量数据，通过这个特性加载tick级别的数据。128G 24核服务器加载9千只标的tick数据只需10-到20分钟便可以存储，一次提取数据量单只股票可以快速的提取一个人月的TICK数据，在analysis系统中集中体现出来性能的优势
- **ZeroMq**: 主要用于系统的解耦和实时交易服务、模拟回测系统通过与websocket进行实时的通信，更主要是实时性和低延迟性在多个因子计算和合成中多个计算因子系统的协同合作的应用
- **Pandas**: 数据处理利器
- **PyArrow**: 配合clickhouse-connect完成查询海量数据的快速响应
- **Celery**: 充分利用多进程的特性的优秀框架，主要用于量化数据的定时采集与分析。还有就是在基础的量化数据经过初步的计算和多步计算的情况，通过链式计算完成基础的因子数据合成
## 项目结构
- **backend**: 后端服务
  - analysis: 历史因子数据分析
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
- 后端: FastAPI, DuckDB, ClickHouse, ZeroMq, Pandas, PyArrow, Celery, 
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

## 项目说明
1. 开源的项目是基于成熟的全流程量化软件做为基础的架构设计，选择了有中小型量化公司的实际需求做为基础。
2. 结合了开源国外量化系统 zipline、backtrader、国内的rqalpha等框架的优势，提取以上各个系统的优势，完善整个回测系统，例如使用duckdb可以实现backtrader的大量回测数据加载，实现rqalpha组件注册机制，zipline的交易事件机制
3. 可以自有的使用这个开源框架作为基础进行开发，给您带来便利的同时请注明出处

import os
import sys
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

import clickhouse_connect
import duckdb
import sqlglot as engine
from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from pyarrow import parquet

from backend.analysis.api import config
from backend.analysis.api.config import settings

config_path = Path.joinpath(Path(os.path.dirname(__file__)).parent, 'config.yml')
cfg = config.load_yaml(config_path)

# 删除默认的日志记录器
logger.remove()

# 配置自定义日志记录器和日志格式
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
           "<level>{level: <8}</level>| "
           "<cyan>{extra[module]}</cyan> | "
           "<cyan>{extra[class_name]}</cyan> | "
           "{function}:{line} - <level>{message}</level>",
    level=cfg['logger_level']
)


def get_data_directory():
    """
    获取项目根目录下的data文件夹路径
    """
    return Path(__file__).parent.parent / "data"


@asynccontextmanager
async def lifespan(application: FastAPI):
    application.state.duckdb = duckdb.connect(':memory:')
    application.state.duckdb.register('base_stock', parquet.read_table(f'{get_data_directory()}/stock_300.parquet'))
    application.state.clickhouse = clickhouse_connect.get_client(
        host='localhost',
        port=8123,
        username='default',
        password='cc1580',
    )
    yield
    # 应用关闭时清理资源
    application.state.duckdb.close()
    application.state.clickhouse.close()


app = FastAPI(title=settings.API_TITLE, version=settings.API_TITLE, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ds(data, columns):
    source = settings.DATA_DIR.format(
        factor=data['factor'],
        code=data['code'],
        year=data['year'],
        month=data['month'],
        day=data['day']
    )

    return parquet.read_table(source=source).select(columns)


def clickhouse_client(request: Request):
    return request.app.state.clickhouse


def duckdb_client(request: Request):
    return request.app.state.duckdb


@app.get("/api/analysis/v1/data/base-stock")
async def base_stock(dcb=Depends(duckdb_client)):
    data = dcb.query('select name,code,symbol from base_stock').to_arrow_table()
    return data.to_pylist()


@app.post("/api/analysis/v1/factor/query")
async def some_endpoint(data: dict, client=Depends(clickhouse_client)):
    database = data.get('db', '')
    table_name = data.get('tb', '')
    start_time = data.get('start_time', 0)
    end_time = data.get('end_time', 0)
    cs = data.get('cs', '')

    # 验证必需字段
    if not database:
        raise HTTPException(status_code=400, detail="Database name is required")

    if not table_name:
        raise HTTPException(status_code=400, detail="Table name is required")

    if start_time is None or start_time <= 0:
        raise HTTPException(status_code=400, detail="Start time is required")

    if end_time is None or end_time <= 0:
        raise HTTPException(status_code=400, detail="End time is required")

    if cs == '':
        raise HTTPException(status_code=400, detail="Columns must be a non-empty list")

    start_time_dt = datetime.fromtimestamp(start_time).strftime('%Y-%m-%d %H:%M:%S')
    end_time_dt = datetime.fromtimestamp(end_time).strftime('%Y-%m-%d %H:%M:%S')
    tb = table_name.replace('.', '_').upper()
    full_table_name = f"{database}.{tb}"

    columns = ["formatDateTime(created_at, '%Y-%m-%d %H:%i:%S') as created_at", cs.replace('-', '_')]

    query = (engine.
             select(*columns).
             from_(full_table_name).
             where(engine.and_(engine.column('created_at') >= start_time_dt,
                               engine.column('created_at') <= end_time_dt,
                               engine.column('time_period').isin([3])
                               )).order_by(engine.column('created_at')).sql(dialect='clickhouse'))

    result = client.query_arrow(query)
    return {
        'db': database,
        'tb': table_name,
        'cs': cs.replace('_', '-'),
        'start_time': start_time_dt,
        'end_time': end_time_dt,
        'data': {
            'data': result[cs.replace('-', '_')].to_pylist(),
            'created_at': result['created_at'].to_pylist()
        }
    }

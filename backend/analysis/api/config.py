import codecs

import yaml
from pydantic.v1 import BaseSettings


class Settings(BaseSettings):
    API_TITLE: str
    API_VERSION: str
    DATA_DIR: str

    class Config:
        env_file = "backend/analysis/.env"


settings = Settings()

def load_yaml(path):
    with codecs.open(path, encoding='utf-8') as f:
        return yaml.safe_load(f)

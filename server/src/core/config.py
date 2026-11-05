from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings): # функция достает валидируя данные по типам из env файла, можно подключить к sqlalchemy при создании движка через from config import settings settings.DATABASE_URL_psycopg
    DB_HOST: str = 'localhost'
    DB_PORT: int = 5432
    DB_USER: str = 'quickwork'
    DB_PASS: str = ''
    DB_NAME: str = 'quickwork'

    JWT_SECRET_KEY: str = Field(min_length=32)
    JWT_ALGORITHM: Literal['HS256'] = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=15, ge=1)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, ge=1, le=90)
    COOKIE_SECURE: bool = False # True для размещения по HTTPS.
    CORS_ORIGINS: list[str] = ['http://localhost:5173', 'http://127.0.0.1:5173']

    @field_validator('JWT_SECRET_KEY')
    @classmethod
    def validate_secret(cls, value):
        if value.startswith('replace-with-'):
            raise ValueError('Сгенерируйте собственный JWT_SECRET_KEY вместо шаблона')
        return value

    @property
    def DATABASE_URL_asyncpg(self): # Подключение к асинхронной postgres
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASS}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def DATABASE_URL_psycopg(self): # Подключение к синхронной postgres
        return f"postgresql+psycopg://{self.DB_USER}:{self.DB_PASS}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def DATABASE_URL_aiosqlite(self): # Подключение к асинхронной sqlite | добавлена для разработки
            return f"sqlite+aiosqlite:///./{self.DB_NAME}.db"

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()  # pyright: ignore[reportCallIssue]

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings): # функция достает валидируя данные по типам из env файла, можно подключить к sqlalchemy при создании движка через from config import settings settings.DATABASE_URL_psycopg
    DB_HOST: str
    DB_PORT: int
    DB_USER: str
    DB_PASS: str
    DB_NAME: str

    JWT_SECRET_KEY: str # Ключ токена
    JWT_ALGORITHM: str  # Алгоритм шифрования
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30 # Длительность жизни токена

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

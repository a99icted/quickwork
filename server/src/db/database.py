from core.config import settings  # В нём хранится URL подключения к базе данных.
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.asyncio.session import async_session
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

async_engine = create_async_engine(
    url=settings.DATABASE_URL_aiosqlite,
    pool_size=5, # Базовое число постоянно доступных соединений в пуле.
    max_overflow=10 # если базового пула из 5 соединений не хватает. То создается еще 10, по итогу выходит 15 соединений максимум
)

session_factory = async_sessionmaker(async_engine)

class Base(DeclarativeBase): # Базовый класс для всех моделей SQLAlchemy.
    pass

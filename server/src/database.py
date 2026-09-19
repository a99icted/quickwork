from config import settings
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.asyncio.session import async_session
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

async_engine = create_async_engine(
    url=settings.DATABASE_URL_aiosqlite,
    pool_size=5,
    max_overflow=10
)

session_factory = async_sessionmaker(async_engine)

class Base(DeclarativeBase):
    pass

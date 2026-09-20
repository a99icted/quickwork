import models.models  # noqa: F401
from db.database import Base, async_engine


async def init_db(): # Создаем базу данных
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def recreate_db(): # Дропает содержимое базы данных и создает новую
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

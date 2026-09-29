import models.models  # noqa: F401
from db.database import Base, async_engine
from repositories.category import create_category
from repositories.features import create_feature
from schemas.category import CategoryAdd
from schemas.features import FeatureAdd


async def init_db(): # Создаем базу данных
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def recreate_db(): # Дропает содержимое базы данных и создает новую
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

async def add_category():
    await create_category(CategoryAdd(name="Уборка", slug="cleaning"))
    await create_category(CategoryAdd(name="Общепит", slug="eating"))
    await create_category(CategoryAdd(name="Торговый зал", slug="super_shop"))


async def add_feture():
    await create_feature(FeatureAdd(name="Нужена медкнижка"))
    await create_feature(FeatureAdd(name="Работы в неприятных условиях"))
    await create_feature(FeatureAdd(name="Нужен паспорт"))

import models.models  # noqa: F401
from db.database import Base, async_engine
from repositories.category import create_category
from repositories.features import create_feature
from schemas.category import CategoryAdd
from schemas.features import FeatureAdd
from core.exceptions import AlreadyExistsError


async def init_db(): # Создаем базу данных
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def recreate_db(): # Дропает содержимое базы данных и создает новую
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

async def add_category():
    for name, slug in (("Уборка", "cleaning"), ("Общепит", "eating"), ("Торговый зал", "super_shop")):
        try:
            await create_category(CategoryAdd(name=name, slug=slug))
        except AlreadyExistsError:
            pass


async def add_feture():
    for name in ("Нужна медкнижка", "Работы в неприятных условиях", "Нужен паспорт"):
        try:
            await create_feature(FeatureAdd(name=name))
        except AlreadyExistsError:
            pass

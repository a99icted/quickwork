from core.exceptions import AlreadyExistsError, NotFoundError
from db.database import session_factory
from models.models import Feature
from schemas.features import FeatureAdd
from sqlalchemy import select


async def create_feature(data: FeatureAdd):
    async with session_factory() as session:
        category = await session.scalar(select(Feature).where(Feature.name == data.name))

        if category:
            raise AlreadyExistsError("Такая категория уже есть")

        category = Feature(**data.model_dump())

        session.add(category)
        await session.flush()

        return category.id

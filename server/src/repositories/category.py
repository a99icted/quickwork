from core.exceptions import AlreadyExistsError, NotFoundError
from db.database import session_factory
from models.models import Category
from schemas.category import CategoryAdd
from sqlalchemy import select


async def create_category(data: CategoryAdd): # Добавить категорию
    async with session_factory() as session:
        category = await session.scalar(select(Category).where(Category.slug == data.slug))

        if category:
            raise AlreadyExistsError("Такая категория уже есть")

        category = Category(**data.model_dump())

        session.add(category)
        await session.flush()

        return category.id

from db.database import session_factory
from models.models import User, Work, user_works
from sqlalchemy import select


class NotFoundError(Exception):
    pass


class AlreadyExistsError(Exception):
    pass

async def add_user_to_work(user_id: int,work_id: int,) -> None:
    async with session_factory() as session:
        async with session.begin():
            user = await session.get(User, user_id)
            work = await session.get(Work, work_id)

            if user is None:
                raise NotFoundError("Пользователь не найден")

            if work is None:
                raise NotFoundError("Вакансия не найдена")

            exists = await session.scalar(select(user_works.c.user_id).where(user_works.c.user_id == user_id,user_works.c.work_id == work_id,))

            if exists is None:
                await session.execute(user_works.insert().values(user_id=user_id,work_id=work_id,))


async def remove_user_from_work(user_id: int,work_id: int,) -> None:
    async with session_factory() as session:
        async with session.begin():
            await session.execute(user_works.delete().where(user_works.c.user_id == user_id,user_works.c.work_id == work_id,))

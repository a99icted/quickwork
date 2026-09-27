from core.exceptions import NotFoundError, AlreadyExistsError
from db.database import session_factory
from models.models import UserWork, Work
from sqlalchemy import select


async def create_user_work(user_id: int, work_id: int) -> UserWork:
    async with session_factory() as session:
        work = await session.scalar(select(Work).where(Work.id == work_id))
        if work is None:
            raise NotFoundError("Вакансия не найдена")
        user_have_work = await session.scalar(select(UserWork).where(UserWork.user_id == user_id, UserWork.work_id == work_id))
        if user_have_work:
            raise AlreadyExistsError("Вы уже сделали отклик на эту вакансию")
        user_work = UserWork(user_id=user_id, work_id=work_id)
        session.add(user_work)
        await session.commit()
        await session.refresh(user_work)
        return user_work

async def update_status(user_id: int, work_id: int, status: str):
    async with session_factory() as session:
        user_work = await session.get(UserWork, (user_id, work_id))
        if user_work:
            user_work.status = status
            await session.commit()
        else:
            raise NotFoundError("Пользователь не найден")


async def get_user_works(user_id: int):
    async with session_factory() as session:
        query = (
            select(Work)
            .join(UserWork, UserWork.work_id == Work.id)
            .where(UserWork.user_id == user_id)
        )

        result = await session.execute(query)
        return result.scalars().all()


async def get_user_work(user_id: int, work_id: int):
    async with session_factory() as session:
        user_work = await session.get(UserWork, (user_id, work_id))
        if user_work:
            return user_work
        else:
            raise NotFoundError("UserWork not found")

async def remove_user_work(user_id: int, work_id: int):
    async with session_factory() as session:
        user_work = await session.get(UserWork, (user_id, work_id))
        if user_work:
            await session.delete(user_work)
            await session.commit()
        else:
            raise NotFoundError("UserWork not found")

from core.exceptions import AlreadyExistsError, NotFoundError
from db.database import session_factory
from models.models import Company, User, UserWork, Work
from sqlalchemy import select


async def create_user_work(user_id: int, work_id: int) -> UserWork: # Юзер добавляет себе отклик по вакансии
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


async def get_user_works(user_id: int): # Юзер получает свои отклики
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


async def get_responses_company(user_id: int) -> list: # НУЖНО ОБЯЗАТЕЛЬНО ПЕРЕДЕЛАТЬ, ЕСЛИ ОБНОВЛЯТЬ ДАТЫ
    async with session_factory() as session:
        company = await session.scalar(select(Company).where(Company.user_id == user_id))

        if company is None:
            raise NotFoundError("Компания не найдена")

        query = (select(Work, User).join(UserWork, UserWork.work_id == Work.id).join(User, UserWork.user_id == User.id).where(Work.company_id == company.id))
        result = await session.execute(query)

        responses = []

        for work, user in result.all():
                    responses.append({
                        "work": {
                            "id": work.id,
                            "title": work.title,
                            "city": work.city,
                            "salary": work.salary,
                            "time_from": work.time_from,
                            "time_to": work.time_to,
                        },
                        "user": {
                            "id": user.id,
                            "first_name": user.first_name,
                            "last_name": user.last_name,
                        }
                    })

        return responses

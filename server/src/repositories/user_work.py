from core.exceptions import AlreadyExistsError, NotFoundError
from db.database import session_factory
from models.models import Company, User, UserWork, Work
from schemas.user_work import UserWorkUpdate
from repositories.work import serialize_work
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


async def update_status(current_user_id: int, data: UserWorkUpdate) -> UserWork:
    async with session_factory() as session:
        # Проверяем связь заявки с вакансией компании текущего пользователя
        stmt = (
            select(UserWork)
            .join(Work, UserWork.work_id == Work.id)
            .join(Company, Work.company_id == Company.id)
            .where(
                Company.user_id == current_user_id,
                UserWork.work_id == data.work_id,
                UserWork.user_id == data.user_id,
            )
        )
        result = await session.execute(stmt)
        user_work = result.scalar_one_or_none()

        if not user_work:
            raise NotFoundError("Заявка не найдена или у вас нет прав на её изменение")

        user_work.status = data.status
        await session.commit()
        await session.refresh(user_work)

        return user_work


async def get_user_works(user_id: int): # Юзер получает свои отклики
    async with session_factory() as session:
        query = (
            select(Work, UserWork.status, Company.name)
            .join(UserWork, UserWork.work_id == Work.id)
            .join(Company, Work.company_id == Company.id)
            .where(UserWork.user_id == user_id)
        )

        result = await session.execute(query)
        return [
            {
                **serialize_work(work, company_name), "status": response_status,
            }
            for work, response_status, company_name in result.all()
        ]


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

        query = (select(Work, User, UserWork.status).join(UserWork, UserWork.work_id == Work.id).join(User, UserWork.user_id == User.id).where(Work.company_id == company.id))
        result = await session.execute(query)

        responses = []

        for work, user, response_status in result.all():
                    responses.append({
                        "work": {
                            "id": work.id,
                            "title": work.title,
                            "city": work.city,
                            "salary": work.salary,
                            "work_date": work.work_date,
                            "time_from": work.time_from,
                            "time_to": work.time_to,
                            "category_ids": [item.id for item in work.categories] or [work.category_id],
                            "feature_ids": [item.id for item in work.feature_items] or [work.features_id],
                        },
                        "status": response_status,
                        "user": {
                            "id": user.id,
                            "first_name": user.first_name,
                            "last_name": user.last_name,
                        }
                    })

        return responses

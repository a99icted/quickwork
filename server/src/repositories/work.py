from datetime import date
from typing import Any

from core.exceptions import NotFoundError
from db.database import session_factory
from models.models import Company, Work
from schemas.work import WorkCreate, WorkUpdate
from sqlalchemy import func, select


async def create_work(data: WorkCreate, company_id: int) -> int: # Создания вакансии
    async with (session_factory() as session, session.begin()):
            company = await session.get(Company, company_id,)

            if company is None:
                raise NotFoundError("Компания не найдена")

            work_data = data.model_dump()

            work = Work(
                title=work_data["title"],
                description=work_data["description"],
                work_date=work_data["work_date"],
                time_from=work_data["time_from"],
                time_to=work_data["time_to"],
                ends_next_day=work_data["ends_next_day"],
                city=work_data["city"],
                salary=work_data["salary"],
                features_id=work_data["features_id"],
                category_id=work_data["category_id"],
                company_id=company_id,
            )

            session.add(work)
            await session.flush()

            return work.id


async def update_work(vacancy_id: int, company_id: int, data: WorkUpdate,) -> int: # Обновить вакансию
    async with (session_factory() as session, session.begin()):

            result = await session.execute(select(Work).where(Work.id == vacancy_id, Work.company_id == company_id))

            work = result.scalar_one_or_none()

            if work is None:
                raise NotFoundError("Вакансия не найдена")

            # Только поля, которые реально прислали в запросе.
            update_data = data.model_dump(exclude_unset=True, exclude={"vacancy_id"},)

            # title и description не должны стать None.
            if "title" in update_data and update_data["title"] is None:
                raise ValueError("title не может быть пустым")

            if ("description" in update_data and update_data["description"] is None):
                raise ValueError("description не может быть пустым")



            for field, value in update_data.items():
                setattr(work, field, value)

            await session.flush()

            return work.id


async def delete_work(vacancy_id: int, company_id: int) -> int: # Удалить вакансию
    async with (session_factory() as session, session.begin()):
            result = await session.execute(select(Work).where(Work.id == vacancy_id, Work.company_id == company_id))

            work = result.scalar_one_or_none()

            if work is None:
                raise NotFoundError("Вакансия не найдена")

            await session.delete(work)
            return vacancy_id

async def get_works(page: int = 1,per_page: int = 10,city: str | None = None,work_date: date | None = None,) -> list[dict[str, Any]]:
    async with session_factory() as session:
        offset = (page - 1) * per_page

        stmt = select(Work)

        if city:
            stmt = stmt.where(
                func.lower(Work.city) == city.strip().lower()
            )

        if work_date:
            stmt = stmt.where(Work.work_date == work_date)

        stmt = (
            stmt
            .order_by(Work.work_date.asc(), Work.time_from.asc())
            .offset(offset)
            .limit(per_page)
        )

        result = await session.scalars(stmt)
        works = result.all()

        return [
            {
                "id": work.id,
                "title": work.title,
                "salary": work.salary,
                "work_date": work.work_date,
                "time_from": work.time_from,
                "time_to": work.time_to,
                "city": work.city,
            }
            for work in works
        ]


async def get_work(vacancy_id: int) -> dict[str, Any]: # Получить вакансию
    async with session_factory() as session:
        vacancy = await session.scalar(
            select(Work).where(
                Work.id == vacancy_id,
            )
        )

        if vacancy is None:
            raise NotFoundError("Вакансия не найдена")

        company = await session.scalar(
            select(Company).where(
                Company.id == vacancy.company_id,
            )
        )

        if company is None:
            raise NotFoundError("Компания вакансии не найдена")

        return {
            "id": vacancy.id,
            "title": vacancy.title,
            "description": vacancy.description,
            "salary": vacancy.salary,
            "company": company.name,
            "work_date": vacancy.work_date,
            "time_from": vacancy.time_from,
            "time_to": vacancy.time_to,
        }

from typing import Any

from sqlalchemy import select

from db.database import session_factory
from models.models import Company, Work
from schemas.entities import WorkCreate, WorkUpdate


class NotFoundError(Exception):
    pass


class AlreadyExistsError(Exception):
    pass



async def create_work(data: WorkCreate, company_id: int) -> int:
    async with session_factory() as session:
        async with session.begin():
            company = await session.get(Company, company_id,)

            if company is None:
                raise NotFoundError("Компания не найдена")

            work_data = data.model_dump()

            work = Work(
                title=work_data["title"],
                description=work_data["description"],
                city=work_data["city"],
                salary_from=work_data["salary_from"],
                salary_to=work_data["salary_to"],
                company_id=company_id,
            )

            session.add(work)
            await session.flush()

            return work.id


async def update_work(vacancy_id: int, company_id: int, data: WorkUpdate,) -> int:
    async with session_factory() as session:
        async with session.begin():

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


async def delete_work(work_id: int) -> None:
    async with session_factory() as session:
        async with session.begin():
            work = await session.get(Work, work_id)

            if work is None:
                raise NotFoundError("Вакансия не найдена")

            await session.delete(work)


async def get_works(page: int = 1, per_page: int = 5) -> list[dict[str, Any]]:
    async with session_factory() as session:
        offset = (page - 1) * per_page

        result = await session.scalars(select(Work).order_by(Work.id.asc()).offset(offset).limit(per_page))

        works = result.all()
        list_works =  [
                {
                        "id": work.id,
                        "title": work.title,
                        "description": work.description,
                        "city": work.city,
                        "salary_from": work.salary_from,
                        "salary_to": work.salary_to,
                    }
                    for work in works
                ]
        return list_works

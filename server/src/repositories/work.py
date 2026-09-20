from db.database import session_factory
from models.models import Company, Work
from schemas.entities import WorkCreate, WorkUpdate


class NotFoundError(Exception):
    pass


class AlreadyExistsError(Exception):
    pass



async def create_work(data: WorkCreate) -> int:
    async with session_factory() as session:
        async with session.begin():
            company = await session.get(Company, data.company_id,)

            if company is None:
                raise NotFoundError("Компания не найдена")

            work_data = data.model_dump()

            work = Work(
                title=work_data["title"],
                description=work_data["description"],
                city=work_data["city"],
                salary_from=work_data["salary_from"],
                salary_to=work_data["salary_to"],
                company_id=work_data["company_id"],
            )

            session.add(work)
            await session.flush()

            return work.id


async def update_work(work_id: int,data: WorkUpdate,) -> int:
    async with session_factory() as session:
        async with session.begin():
            work = await session.get(Work, work_id)

            if work is None:
                raise NotFoundError("Вакансия не найдена")

            # Только поля, которые реально прислали в запросе.
            update_data = data.model_dump(exclude_unset=True)

            # title и description не должны стать None.
            if "title" in update_data and update_data["title"] is None:
                raise ValueError("title не может быть пустым")

            if ("description" in update_data and update_data["description"] is None):
                raise ValueError("description не может быть пустым")


            if "company_id" in update_data:
                company = await session.get(Company,update_data["company_id"],)

                if company is None:
                    raise NotFoundError("Новая компания не найдена")


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

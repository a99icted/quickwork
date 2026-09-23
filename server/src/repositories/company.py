from sqlalchemy.sql.functions import user

from core.exceptions import AlreadyExistsError, NotFoundError
from db.database import session_factory
from models.models import Company
from schemas.entities import CompanyCreate, CompanyUpdate
from sqlalchemy import select


async def create_company(data: CompanyCreate, user_id) -> int:
    async with (session_factory() as session, session.begin()):
            company = await session.scalar(select(Company).where(Company.user_id == user_id,))

            if company:
                raise AlreadyExistsError("У вас уже есть компания")

            existing_company = await session.scalar(select(Company).where(Company.name == data.name))

            if existing_company is not None:
                raise AlreadyExistsError("Компания с таким названием уже существует")


            company = Company(**data.model_dump(), user_id=user_id)

            session.add(company)
            await session.flush()

            return company.id

async def get_company_id_by_user_id(user_id: int,) -> int | None:
    async with session_factory() as session:
        return await session.scalar(
            select(Company.id).where(
                Company.user_id == user_id,
            )
        )


async def delete_company(user_id: int) -> int:
    async with (session_factory() as session, session.begin()):
            company = await session.scalar(select(Company).where(Company.user_id == user_id,))

            if company is None:
                raise NotFoundError("Компания не найдена")

            await session.delete(company)
            return company.id


async def update_company(data: CompanyUpdate,user_id: int,) -> int:
    async with (session_factory() as session, session.begin()):
            company = await session.scalar(select(Company).where(Company.user_id == user_id,))

            if company is None:
                raise NotFoundError("У пользователя нет компании")

            company_id = company.id
            update_data = data.model_dump(exclude_unset=True,)

            if not update_data:
                raise ValueError("Нет данных для обновления")

            if "name" in update_data and update_data["name"] is None:
                    raise ValueError("Название не может быть пустым")

            company_with_same_name = await session.scalar(select(Company).where(Company.name == update_data["name"],Company.id != company_id,))

            if company_with_same_name is not None:
                    raise AlreadyExistsError("Компания с таким названием уже существует")

            if ("description" in update_data and update_data["description"] is None):
                raise ValueError("Описание не может быть пустым")

            for field, value in update_data.items():
                setattr(company, field, value)

            await session.flush()

            return company.id

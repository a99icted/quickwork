from core.exceptions import AlreadyExistsError, NotFoundError
from db.database import session_factory
from models.models import Company
from schemas.entities import CompanyCreate
from sqlalchemy import select


async def create_company(data: CompanyCreate) -> int:
    async with session_factory() as session:
        async with session.begin():
            existing_company = await session.scalar(select(Company).where(Company.name == data.name))

            if existing_company is not None:
                raise AlreadyExistsError("Компания с таким названием уже существует")

            company = Company(**data.model_dump())

            session.add(company)
            await session.flush()

            return company.id


async def delete_company(company_id: int) -> None:
    async with session_factory() as session:
        async with session.begin():
            company = await session.get(Company, company_id)

            if company is None:
                raise NotFoundError("Компания не найдена")

            await session.delete(company)

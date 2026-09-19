from database import session_factory
from models import Company, User, Work, user_works
from schemas.entities import CompanyCreate, UserCreate, WorkCreate, WorkUpdate
from security import hash_password, verify_password
from sqlalchemy import select


class NotFoundError(Exception):
    pass


class AlreadyExistsError(Exception):
    pass

async def authenticate_user(username: str,password: str,) -> User | None:
    async with session_factory() as session:
        user = await session.scalar(select(User).where(User.username == username))

        if user is None:
            return None

        is_password_correct = verify_password(plain_password=password,hashed_password=user.hashed_password,)

        if not is_password_correct:
            return None

        return user


async def create_user(data: UserCreate) -> int:
    async with session_factory() as session:
        async with session.begin():
            existing_user = await session.scalar(
                select(User).where(
                    User.username == data.username
                )
            )

            if existing_user is not None:
                raise ValueError(
                    "Пользователь с таким username уже существует"
                )

            user = User(
                username=data.username,
                hashed_password=hash_password(data.password),
                first_name=data.first_name,
                last_name=data.last_name,
                age=data.age,
            )

            session.add(user)
            await session.flush()

            return user.id


async def delete_user(user_id: int) -> None:
    async with session_factory() as session:
        async with session.begin():
            user = await session.get(User, user_id)

            if user is None:
                raise NotFoundError("Пользователь не найден")

            await session.delete(user)


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

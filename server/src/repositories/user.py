from core.exceptions import AlreadyExistsError, NotFoundError
from core.security import hash_password
from db.database import session_factory
from models.models import User
from schemas.entities import UserCreate
from sqlalchemy import select


async def create_user(data: UserCreate) -> int: # Создание юзера
    async with (session_factory() as session, session.begin()):
            existing_user = await session.scalar(
                select(User).where(
                    User.username == data.username
                )
            )

            if existing_user is not None:
                raise AlreadyExistsError(
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


async def delete_user(user_id: int) -> None: # Удаление юзера по id
    async with (session_factory() as session, session.begin()):
            user = await session.get(User, user_id)

            if user is None:
                raise NotFoundError("Пользователь не найден")

            await session.delete(user)


async def get_user_by_id(user_id: int) -> User | None: # Получение юзера по id
    async with session_factory() as session:
        user = await session.scalar(select(User).where(User.id == user_id))

        return user

from core.exceptions import AlreadyExistsError, NotFoundError, ValueError
from core.security import hash_password
from db.database import session_factory
from models.models import User
from schemas.user import UserCreate, UserUpdate
from sqlalchemy import select


async def create_user(data: UserCreate) -> int: # Регистрация пользователя
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


async def update_user(user_id: int, data: UserUpdate):
    async with (session_factory() as session, session.begin()):
        result = await session.execute(select(User).where(User.id == user_id))

        user = result.scalar_one_or_none()

        if user is None:
            raise NotFoundError("Пользователь не найден")

        update_data = data.model_dump(exclude_unset=True)

        if "first_name" in update_data and update_data["first_name"] is None:
            raise ValueError("first_name не должен быть пустым")

        if "last_name" in update_data and update_data["last_name"] is None:
            raise ValueError("last_name не должен быть пустым")

        if "age" in update_data and update_data["age"] is None:
            raise ValueError("age не должен быть пустым")

        for field, value in update_data.items():
            setattr(user, field, value)

        await session.flush()

        return user.id

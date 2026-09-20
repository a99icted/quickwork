from core.security import verify_password
from db.database import session_factory
from models.models import User
from sqlalchemy import select


class NotFoundError(Exception):
    pass


class AlreadyExistsError(Exception):
    pass

async def authenticate_user(username: str,password: str,) -> User | None: # аунтификация пользователя, хеш пароля из базы данных сравнивается с полученным хеш паролем
    async with session_factory() as session:
        user = await session.scalar(select(User).where(User.username == username))

        if user is None:
            return None

        is_password_correct = verify_password(plain_password=password,hashed_password=user.hashed_password,)

        if not is_password_correct:
            return None

        return user

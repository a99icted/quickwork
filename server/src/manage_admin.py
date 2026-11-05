"""Grant/revoke an administrator role from the server console, never via registration."""
import argparse
import asyncio

from sqlalchemy import select

from db.database import session_factory
from repositories.core import init_db
from models.models import Role, User


async def main():
    parser = argparse.ArgumentParser(description='Назначить администратора существующему аккаунту')
    parser.add_argument('username', help='Логин зарегистрированного пользователя')
    parser.add_argument('--revoke', action='store_true', help='Снять права администратора')
    args = parser.parse_args()
    await init_db()
    async with session_factory() as session, session.begin():
        user = await session.scalar(select(User).where(User.username == args.username))
        if user is None:
            parser.error('Пользователь не найден. Сначала зарегистрируйте аккаунт.')
        user.role = Role.WORKER if args.revoke else Role.ADMIN
        print(f'{user.username}: {user.role.value}')


if __name__ == '__main__':
    asyncio.run(main())

import asyncio

from repositories.core import init_db, recreate_db


async def main():
    await recreate_db()


if __name__ == "__main__":
    asyncio.run(main())

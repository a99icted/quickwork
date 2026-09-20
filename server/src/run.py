import asyncio

from repositories.core import init_db, recreate_db  # noqa: F401


async def main():
    await init_db()


if __name__ == "__main__":
    asyncio.run(main())

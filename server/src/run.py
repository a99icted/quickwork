import asyncio

from repositories.core import init_db, add_category, add_feture


async def main():
    await init_db()
    await add_category()
    await add_feture()


if __name__ == "__main__":
    asyncio.run(main())

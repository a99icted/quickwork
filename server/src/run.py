import asyncio

from repositories.core import init_db, recreate_db, add_category, add_feture  # noqa: F401


async def main():
    await add_feture()


if __name__ == "__main__":
    asyncio.run(main())

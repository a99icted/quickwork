from api.auth import router as auth_router
from fastapi import FastAPI

app = FastAPI(title="Quick Jobs API")

app.include_router(auth_router)


@app.get("/")
async def main():
    return "Hello world"

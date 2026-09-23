from pathlib import Path

from api.auth import router as auth_router
from api.company import router as company_router
from api.vacancies import router as work_router
from fastapi import FastAPI, HTTPException, status
from fastapi.staticfiles import StaticFiles
from repositories.work import NotFoundError, get_work, get_works  # Временно

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(title="Quick Jobs API")

app.include_router(auth_router)
app.include_router(company_router)
app.include_router(work_router)


@app.get("/vacancies") # Временно
async def get_vacancies(page: int = 1):
    return await get_works(page=page)


@app.get("/vacancies/{vacancy_id}")
async def get_vacancy(vacancy_id: int):
    try:
        result = await get_work(vacancy_id)
    except NotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error

    return result


app.mount( # Fronted добавлен тестово
    "/",
    StaticFiles(
        directory=FRONTEND_DIR,
        html=True,
    ),
    name="frontend",
)

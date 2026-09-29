from pathlib import Path

from api.auth import router as auth_router
from api.company import router as company_router
from api.user_to_work import router as user_work_router
from api.vacancies import router as work_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR / "frontend" / "dist"

app = FastAPI(title="Quick Jobs API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



app.include_router(auth_router)
app.include_router(company_router)
app.include_router(work_router)
app.include_router(user_work_router)



if FRONTEND_DIR.exists():
    app.mount(
        "/",
        StaticFiles(
            directory=FRONTEND_DIR,
            html=True,
        ),
        name="frontend",
    )

from pathlib import Path
from contextlib import asynccontextmanager

from api.auth import router as auth_router
from api.admin import router as admin_router
from api.company import router as company_router
from api.user import router as user_router
from api.user_to_work import router as user_work_router
from api.vacancies import router as work_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from core.config import settings
from repositories.core import init_db

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent.parent / "frontend" / "dist"

@asynccontextmanager
async def lifespan(app):
    await init_db()
    yield


app = FastAPI(title="Quick Jobs API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



app.include_router(auth_router)
app.include_router(company_router)
app.include_router(work_router)
app.include_router(user_work_router)
app.include_router(user_router)
app.include_router(admin_router)

# The browser uses /api; keep existing API URLs compatible with other clients.
for router in (auth_router, company_router, work_router, user_work_router, user_router, admin_router):
    app.include_router(router, prefix="/api", include_in_schema=False)


class SPAStaticFiles(StaticFiles):
    async def get_response(self, path, scope):
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as error:
            first_segment = path.replace("\\", "/").strip("/").split("/", 1)[0]
            if error.status_code != 404 or Path(path).suffix or first_segment == "api":
                raise
            return await super().get_response("index.html", scope)


if FRONTEND_DIR.exists():
    app.mount(
        "/",
        SPAStaticFiles(
            directory=FRONTEND_DIR,
            html=True,
        ),
        name="frontend",
    )

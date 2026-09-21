from api.auth import router as auth_router
from api.company import router as company_router
from api.vacancies import router as work_router
from fastapi import FastAPI

app = FastAPI(title="Quick Jobs API")

app.include_router(auth_router)
app.include_router(work_router)
app.include_router(company_router)

@app.get("/")
async def main():
    return "Hello world"

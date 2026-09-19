from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    password: str = Field(min_length=8, max_length=128)
    username: str = Field(min_length=3, max_length=25)
    first_name: str = Field(min_length=1, max_length=25)
    last_name: str = Field(min_length=1, max_length=25)
    age: int = Field(ge=16, le=100)


class CompanyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=500)


class WorkCreate(BaseModel):
    company_id: int

    title: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=500)

    city: str | None = Field(default=None, max_length=100)
    salary_from: int | None = Field(default=None, ge=0)
    salary_to: int | None = Field(default=None, ge=0)


class WorkUpdate(BaseModel):
    # Все поля необязательны: можно обновить только одно из них.
    title: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=500)

    city: str | None = Field(default=None, max_length=100)
    salary_from: int | None = Field(default=None, ge=0)
    salary_to: int | None = Field(default=None, ge=0)

    company_id: int | None = None

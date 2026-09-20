from pydantic import BaseModel, Field


class UserCreate(BaseModel): # Валидация данных при регистрации пользователя
    password: str = Field(min_length=8, max_length=128)
    username: str = Field(min_length=3, max_length=25)
    first_name: str = Field(min_length=1, max_length=25)
    last_name: str = Field(min_length=1, max_length=25)
    age: int = Field(ge=16, le=100)


class CompanyCreate(BaseModel): # Валидация данных при регистрации компании, компания создает с пользовательского аккаунта
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=500)


class WorkCreate(BaseModel): # Валидация данных при создании вакансии
    company_id: int

    title: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=500)

    city: str | None = Field(default=None, max_length=100)
    salary_from: int | None = Field(default=None, ge=0)
    salary_to: int | None = Field(default=None, ge=0)


class WorkUpdate(BaseModel): # Валидация данных при изменении вакансии, можно обновить от 1
    title: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=500)

    city: str | None = Field(default=None, max_length=100)
    salary_from: int | None = Field(default=None, ge=0)
    salary_to: int | None = Field(default=None, ge=0)

    company_id: int | None = None

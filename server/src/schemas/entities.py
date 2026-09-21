from typing import Literal

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

class CompanyCreateResponse(BaseModel):
    company_id: int
    message: str

class WorkCreate(BaseModel): # Валидация данных при создании вакансии
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

class WorkCreateResponse(BaseModel):

    vacancy_id: int
    message: str


class UserRegisterResponse(BaseModel): # Данные, которые возвращаются после регистрации

    user_id: int
    message: str


class UserLogin(BaseModel): # Модель валидации данных для входа
    username: str = Field(min_length=3, max_length=25)
    password: str = Field(min_length=8, max_length=128)

class TokenResponse(BaseModel): # jwt токен
    access_token: str

    token_type: Literal["bearer"] = "bearer"


class CurrentUserResponse(BaseModel): # Данные пользователя после аунтификации и получения токена

    id: int
    username: str
    first_name: str | None
    last_name: str | None
    age: int | None

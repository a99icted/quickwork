from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class CompanyCreate(BaseModel): # Валидация данных при регистрации компании, компания создает с пользовательского аккаунта
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=500)

class CompanyUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=500)

class CompanyUpdateResponse(BaseModel):
    company_id: int
    message: str

class CompanyCreateResponse(BaseModel):
    company_id: int
    message: str

class CompanyDeleteResponse(BaseModel):
    company_id: int
    message: str


class WorkCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=500)

    time_from: datetime
    time_to: datetime

    city: str | None = Field(default=None, max_length=100)
    salary: int | None = Field(default=None, ge=0)

    features_id: int = Field(ge=1)
    category_id: int = Field(ge=1)

    # смена не может заканчиваться раньше, чем началась
    @model_validator(mode='after')
    def check_time_logic(self) -> 'WorkCreate':
        if self.time_from >= self.time_to:
            raise ValueError('Время окончания смены должно быть позже времени начала')
        return self


class WorkUpdate(BaseModel):
    # vacancy_id: int

    title: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, min_length=1, max_length=500)

    time_from: datetime | None = None
    time_to: datetime | None = None

    city: str | None = Field(default=None, max_length=100)
    salary: int | None = Field(default=None, ge=0)

    features_id: int | None = Field(default=None, ge=1)
    category_id: int | None = Field(default=None, ge=1)


class DeleteWork(BaseModel): # Удаление вакансии
    vacancy_id: int

class DeleteWorkResponse(BaseModel): # Ответ после успешного удаления
    vacancy_id: int
    message: str

class WorkUpdateResponse(BaseModel): # Ответ после успешного обновления
    vacancy_id: int
    message: str

class WorkCreateResponse(BaseModel): # Ответ после создания вакансии
    vacancy_id: int
    message: str


class UserCreate(BaseModel): # Валидация данных при регистрации пользователя
    password: str = Field(min_length=8, max_length=128)
    username: str = Field(min_length=3, max_length=25)
    first_name: str = Field(min_length=1, max_length=25)
    last_name: str = Field(min_length=1, max_length=25)
    age: int = Field(ge=16, le=100)

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

class UserRegisterResponse(BaseModel): # Данные, которые возвращаются после регистрации
    user_id: int
    message: str

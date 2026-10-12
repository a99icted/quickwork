from typing import Literal

from models.models import Role
from pydantic import BaseModel, ConfigDict, Field


class UserCreate(BaseModel): # Валидация данных при регистрации пользователя
    model_config = ConfigDict(from_attributes=True)

    password: str = Field(min_length=8, max_length=128)
    username: str = Field(min_length=3, max_length=25)
    first_name: str = Field(min_length=1, max_length=25)
    last_name: str = Field(min_length=1, max_length=25)
    age: int = Field(ge=16, le=100)
    role: Role = Field(default=Role.WORKER)

class UserUpdate(BaseModel):
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

class UserUpdateResponse(BaseModel):
    user_id: int
    message: str

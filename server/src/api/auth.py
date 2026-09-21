from api.dependencies import get_current_user
from core.exceptions import AlreadyExistsError
from core.security import create_access_token
from fastapi import APIRouter, Depends, HTTPException, status
from models.models import User
from repositories.user import create_user
from schemas.entities import (
    CurrentUserResponse,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserRegisterResponse,
)
from services.auth import authenticate_user

router = APIRouter(prefix="/auth",tags=["Auth"])

@router.post("/register", # Ручка
    response_model=UserRegisterResponse, # Модель, которая формирует ответ
    status_code=status.HTTP_201_CREATED,) # Статус ответа в случае успеха
async def register(data: UserCreate) -> UserRegisterResponse: # Возвращает данные согласно форме UserRegisterResponse

    try:
        user_id = await create_user(data) # Создание пользователя

    except AlreadyExistsError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Не удалось создать пользователя") from error

    return UserRegisterResponse(user_id=user_id, message="Пользователь успешно зарегистрирован")


@router.post("/login", response_model=TokenResponse) # При аунтификации пользователя создаем для него JWT токен, необходимый для поддержания аунтификации
async def login(data: UserLogin) -> TokenResponse:
        user = await authenticate_user(username=data.username, password=data.password,) # Проверка валидности пароля и логина

        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный логин или пароль")

        access_token = create_access_token(user_id=user.id,) # Создание токена доступа в случае успешного логина

        return TokenResponse(
                access_token=access_token,
            )

@router.get("/me", response_model=CurrentUserResponse)
async def get_me(user: User = Depends(get_current_user),) -> CurrentUserResponse:

    return CurrentUserResponse(
            id=user.id,
            username= user.username,
            first_name= user.first_name,
            last_name= user.last_name,
            age= user.age,
    )

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT,)
async def logout(_: User=Depends(get_current_user)) -> None: # Пока не имеет смысла, логаут обычно происходит через фронтенд
    # Можно сделать серверное хранилище не истекших, но logout логинов
    return None

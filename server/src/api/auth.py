from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse

from core.config import settings
from core.security import create_access_token
from repositories.user import AlreadyExistsError, create_user
from schemas.user import TokenResponse, UserCreate, UserLogin, UserRegisterResponse
from services.auth import authenticate_user
from services.refresh import create_refresh_session, revoke_refresh_session, rotate_refresh_session

COOKIE_NAME = 'qw_refresh'


def check_origin(request: Request):
    # SameSite also protects cookies; explicitly reject foreign browser origins.
    origin = request.headers.get('origin')
    allowed = {*settings.CORS_ORIGINS, str(request.base_url).rstrip('/')}
    if origin and origin not in allowed:
        raise HTTPException(status_code=403, detail='Недопустимый источник запроса')
    if request.headers.get('sec-fetch-site') == 'cross-site' and not origin:
        raise HTTPException(status_code=403, detail='Недопустимый источник запроса')


router = APIRouter(prefix='/auth', tags=['Auth'], dependencies=[Depends(check_origin)])


def set_refresh_cookie(response: Response, token: str, max_age: int):
    response.set_cookie(COOKIE_NAME, token, max_age=max_age, httponly=True,
                        secure=settings.COOKIE_SECURE, samesite='lax', path='/')
    response.headers['Cache-Control'] = 'no-store'


def clear_refresh_cookie(response: Response):
    response.delete_cookie(COOKIE_NAME, path='/', httponly=True,
                           secure=settings.COOKIE_SECURE, samesite='lax')
    response.headers['Cache-Control'] = 'no-store'


def token_response(user_id: int) -> TokenResponse:
    return TokenResponse(access_token=create_access_token(user_id),
                         expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)


@router.post('/register', response_model=UserRegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate) -> UserRegisterResponse:
    try:
        user_id = await create_user(data)
    except AlreadyExistsError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    return UserRegisterResponse(user_id=user_id, message='Пользователь успешно зарегистрирован')


@router.post('/login', response_model=TokenResponse)
async def login(data: UserLogin, request: Request, response: Response) -> TokenResponse:
    user = await authenticate_user(username=data.username, password=data.password)
    if user is None:
        raise HTTPException(status_code=401, detail='Неверный логин или пароль')
    previous = request.cookies.get(COOKIE_NAME)
    if previous:
        await revoke_refresh_session(previous)
    token = await create_refresh_session(user.id)
    set_refresh_cookie(response, token, settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400)
    return token_response(user.id)


@router.post('/refresh', response_model=TokenResponse)
async def refresh(request: Request, response: Response):
    token = request.cookies.get(COOKIE_NAME)
    result = await rotate_refresh_session(token) if token else None
    if result is None:
        rejected = JSONResponse({'detail': 'Сессия истекла. Войдите снова.'}, status_code=401)
        clear_refresh_cookie(rejected)
        return rejected
    user_id, replacement, expires_at = result
    remaining = max(0, int((expires_at - datetime.now(timezone.utc).replace(tzinfo=None)).total_seconds()))
    set_refresh_cookie(response, replacement, remaining)
    return token_response(user_id)


@router.post('/logout', status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request, response: Response) -> None:
    # Works even when the access token has already expired.
    token = request.cookies.get(COOKIE_NAME)
    if token:
        await revoke_refresh_session(token)
    clear_refresh_cookie(response)

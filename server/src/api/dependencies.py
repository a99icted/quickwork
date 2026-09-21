from typing import Annotated

from core.security import get_user_id_from_access_token
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from models.models import User
from repositories.user import get_user_by_id

bearer_scheme = HTTPBearer(auto_error=False)

AuthCredentials = Annotated[
    HTTPAuthorizationCredentials | None,
    Depends(bearer_scheme),
]

async def get_current_user(credentials: AuthCredentials,) -> User:
    auth_headers = {"WWW-Authenticate": "Bearer"}
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Токен авторизации не передан", headers=auth_headers,)

    try:
        user_id = get_user_id_from_access_token(credentials.credentials,) # Получаем id юзера из токена

    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Недействительный или просроченный токен", headers=auth_headers,) from error

    user = await get_user_by_id(user_id=user_id,) # Полчаем пользователя по id, необходимо для проверки, что пользователь действительно сущесвует

    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Недействительный или просроченный токен", headers=auth_headers,)

    return user

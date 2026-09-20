from core.security import get_user_id_from_access_token
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from repositories.user import get_user_by_id

bearer_scheme = HTTPBearer(auto_error=False)

async def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),):
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Токен авторизации не передан", headers={"WWW-Authenticate": "Bearer"},)

    try:
        user_id = get_user_id_from_access_token(credentials.credentials,)

    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail=str(error),
                    headers={
                        "WWW-Authenticate": "Bearer",
                    },
                ) from error

    user = await get_user_by_id(user_id=user_id,)

    if user is None:
        raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Пользователь не найден",
                )
    return user

from api.dependencies import get_current_user
from fastapi import APIRouter, Depends, HTTPException, status
from models.models import User
from repositories.user import NotFoundError, ValueError, update_user
from schemas.user import CurrentUserResponse, UserUpdate, UserUpdateResponse

router = APIRouter(prefix="/user", tags=["User"])

@router.get("/me", response_model=CurrentUserResponse,status_code=status.HTTP_200_OK,) # Получение информации о пользователе
async def get_me(user: User = Depends(get_current_user),) -> CurrentUserResponse:

    return CurrentUserResponse(
            id=user.id,
            username= user.username,
            first_name= user.first_name,
            last_name= user.last_name,
            age= user.age,
    )


@router.patch("/update", response_model=UserUpdateResponse,status_code=status.HTTP_200_OK,)
async def user_update(data: UserUpdate, user: User = Depends(get_current_user)):

    try:
        user_id = await update_user(user_id=user.id, data=data)

    except NotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error

    return(UserUpdateResponse(user_id=user_id, message="Данные успешно обновлены!"))

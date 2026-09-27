from api.dependencies import get_current_user
from fastapi import APIRouter, Depends, HTTPException, status
from models.models import User, UserWork
from repositories.user_work import NotFoundError, AlreadyExistsError , create_user_work, get_user_works
from schemas.user_work import UserWorkResponse, WorkResponse

# добавление вакансии пользователем
# удаление вакансии пользователем
# обновление статуса вакансии компанией

router = APIRouter(prefix="/uwe", tags=["User_To_Work",])


@router.post("/add_work", response_model=UserWorkResponse)
async def add_work_to_user(work_id: int, current_user: User = Depends(get_current_user),) -> UserWorkResponse:

    try:
        response = await create_user_work(user_id=current_user.id, work_id=work_id)
    except NotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except AlreadyExistsError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    return UserWorkResponse(user_id=response.user_id, work_id=response.work_id, status=response.status)


@router.get("/getworks", response_model=list[WorkResponse])
async def get_works(current_user: User = Depends(get_current_user)):

    works = await get_user_works(user_id=current_user.id)

    return works

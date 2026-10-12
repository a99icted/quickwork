from api.dependencies import get_current_user
from fastapi import APIRouter, Depends, HTTPException, status
from models.models import User
from repositories.user_work import (
    AlreadyExistsError,
    NotFoundError,
    create_user_work,
    get_responses_company,
    get_user_works,
    update_status
)
from schemas.user_work import ResponseItem, UserWorkResponse, WorkResponse,UserWorkUpdateResponse, UserWorkUpdate

# обновление статуса вакансии компанией

router = APIRouter(prefix="/uwe", tags=["User_To_Work",])


@router.post("/add_work", response_model=UserWorkResponse) # Откликнуться на вакансию
async def add_work_to_user(work_id: int, current_user: User = Depends(get_current_user),) -> UserWorkResponse:

    try:
        response = await create_user_work(user_id=current_user.id, work_id=work_id)
    except NotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except AlreadyExistsError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    return UserWorkResponse(user_id=response.user_id, work_id=response.work_id, status=response.status)


@router.get("/getworks", response_model=list[WorkResponse]) # Получить отклики | для пользователя
async def get_works(current_user: User = Depends(get_current_user)):

    works = await get_user_works(user_id=current_user.id)

    return works


@router.get("/get_response", response_model=list[ResponseItem], status_code=status.HTTP_200_OK) # Получить отклики | для компании
async def get_responses(current_user: User = Depends(get_current_user)) -> list[ResponseItem]:
    try:
        reponses = await get_responses_company(user_id=current_user.id)
    except NotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error

    return reponses

@router.patch("/status_update", response_model=UserWorkUpdateResponse)
async def status_update(data: UserWorkUpdate,current_user: User = Depends(get_current_user),):
    try:
        response = await update_status(current_user_id=current_user.id, data=data)
    except NotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=str(error),) from error

    return response

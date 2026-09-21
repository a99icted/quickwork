from api.dependencies import get_current_user
from core.exceptions import AlreadyExistsError, NotFoundError
from fastapi import APIRouter, Depends, HTTPException, status
from models.models import User
from repositories.company import get_company_id_by_user_id
from repositories.work import create_work, delete_work, update_work
from schemas.entities import WorkCreate, WorkCreateResponse

router = APIRouter(prefix="/work",tags=["Work"])


@router.post("/create",response_model=WorkCreateResponse,status_code=status.HTTP_201_CREATED,)
async def create_vacancy(data: WorkCreate,current_user: User = Depends(get_current_user),) -> WorkCreateResponse:
    company_id = await get_company_id_by_user_id(user_id=current_user.id,)

    if company_id is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Сначала зарегистрируйте компанию",)

    try:
        vacancy_id = await create_work(
            data=data,
            company_id=company_id,
        )

    except AlreadyExistsError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="Такая вакансия уже существует",) from error

    except NotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Компания не найдена",) from error

    return WorkCreateResponse(vacancy_id=vacancy_id,message="Вакансия успешно создана",)

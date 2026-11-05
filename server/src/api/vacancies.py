from datetime import date

from api.dependencies import get_current_user
from fastapi import APIRouter, Depends, HTTPException, Query, status
from models.models import User
from repositories.company import get_company_id_by_user_id
from repositories.work import (
    NotFoundError,
    create_work,
    delete_work,
    get_work,
    get_works,
    get_work_options,
    update_work,
)
from schemas.work import (
    DeleteWorkResponse,
    WorkCreate,
    WorkCreateResponse,
    WorkFilters,
    WorkFiltersResponse,
    WorkUpdate,
    WorkUpdateResponse,
)
from sqlalchemy.exc import IntegrityError

router = APIRouter(prefix="/work",tags=["Work"])


@router.post("/create",response_model=WorkCreateResponse,status_code=status.HTTP_201_CREATED,) # Создать вакансии
async def create_vacancy(data: WorkCreate,current_user: User = Depends(get_current_user),) -> WorkCreateResponse:
    company_id = await get_company_id_by_user_id(user_id=current_user.id,)

    if company_id is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Сначала зарегистрируйте компанию",)

    try:
        vacancy_id = await create_work(
            data=data,
            company_id=company_id,
        )

    except NotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Компания не найдена",) from error

    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except IntegrityError as error:
        raise HTTPException(status_code=409, detail="Справочники изменились. Обновите страницу.") from error

    return WorkCreateResponse(vacancy_id=vacancy_id,message="Вакансия успешно создана",)


@router.patch("/update/{vacancy_id}",response_model=WorkUpdateResponse,status_code=status.HTTP_200_OK,) # Обновить вакансию
async def update_vacancy(data: WorkUpdate, vacancy_id: int, current_user: User = Depends(get_current_user),) -> WorkUpdateResponse:
    company_id = await get_company_id_by_user_id(user_id=current_user.id,)

    if company_id is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Сначала зарегистрируйте компанию",)

    try:
        vacancy_id = await update_work(
            vacancy_id=vacancy_id,
            company_id=company_id,
            data=data,
        )

    except NotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        ) from error

    except IntegrityError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Не удалось обновить вакансию",
        ) from error

    return WorkUpdateResponse(vacancy_id=vacancy_id, message="Вакансия обновлена")


@router.delete("/delete/{vacancy_id}", response_model=DeleteWorkResponse, status_code=status.HTTP_200_OK) # Удалить вакансию
async def remove_vacancy(vacancy_id: int, current_user: User = Depends(get_current_user),) -> DeleteWorkResponse:
    company_id = await get_company_id_by_user_id(user_id=current_user.id,)

    if company_id is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Сначала зарегистрируйте компанию",)

    try:
        vacancy_id = await delete_work(vacancy_id=vacancy_id, company_id=company_id)

    except NotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=str(error),) from error

    return DeleteWorkResponse(vacancy_id=vacancy_id, message="Вакансия удалена")

@router.get("/", response_model=list[WorkFiltersResponse],)
async def get_vacancies(filters: WorkFilters = Depends(),):
    return await get_works(
        city=filters.city,
        work_date=filters.work_date,
        page=filters.page,
        per_page=filters.per_page,
    )


@router.get("/options")
async def vacancy_options():
    return await get_work_options()


@router.get("/mine", response_model=list[WorkFiltersResponse])
async def own_vacancies(page: int = Query(default=1, ge=1), per_page: int = Query(default=100, ge=1, le=100), current_user: User = Depends(get_current_user)):
    company_id = await get_company_id_by_user_id(current_user.id)
    if company_id is None:
        return []
    return await get_works(company_id=company_id, page=page, per_page=per_page)


@router.get("/{vacancy_id}")
async def get_vacancy(vacancy_id: int):
    try:
        result = await get_work(vacancy_id)
    except NotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error

    return result

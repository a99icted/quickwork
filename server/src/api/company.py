from api.dependencies import get_current_user
from fastapi import APIRouter, Depends, HTTPException, status
from models.models import Company, User
from repositories.company import (
    AlreadyExistsError,
    NotFoundError,
    create_company,
    delete_company,
    get_all_companies,
    get_company_by_id,
    update_company,
)
from schemas.company import (
    CompanyCreate,
    CompanyCreateResponse,
    CompanyDeleteResponse,
    CompanyResponse,
    CompanyUpdate,
    CompanyUpdateResponse,
)

router = APIRouter(prefix="/company", tags=["Company"])



@router.post("/create", response_model=CompanyCreateResponse, status_code=status.HTTP_201_CREATED) # Создать компанию
async def company_create(data: CompanyCreate, current_user: User = Depends(get_current_user),) -> CompanyCreateResponse:
    try:
        company_id = await create_company(data, current_user.id)

    except AlreadyExistsError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error

    return CompanyCreateResponse(company_id=company_id, message="Компания успешно создана")


@router.patch("/update", response_model=CompanyUpdateResponse, status_code=status.HTTP_200_OK) # Обновить данные компании
async def company_update(data: CompanyUpdate, current_user: User = Depends(get_current_user),) -> CompanyUpdateResponse:

    try:
        company_id = await update_company(data=data, user_id=current_user.id,)

    except NotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=str(error),) from error
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error
    except AlreadyExistsError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail=str(error),) from error

    return CompanyUpdateResponse(company_id=company_id, message="Профиль компании обновлен")


@router.delete("/delete", response_model=CompanyDeleteResponse, status_code=status.HTTP_200_OK)
async def comapany_delete(current_user: User = Depends(get_current_user),) -> CompanyDeleteResponse:
    try:
        company_id = await delete_company(current_user.id)

    except NotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error),) from error

    return CompanyDeleteResponse(company_id=company_id, message="Компания успешно удалена")

@router.get('/companies', response_model=list[CompanyResponse], status_code=status.HTTP_200_OK) # Получить список компаний
async def get_companies() -> list[CompanyResponse]:
    try:
        companies = await get_all_companies()
    except NotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    return companies


@router.get('/company/{company_id}', response_model=CompanyResponse, status_code=status.HTTP_200_OK) # Получить профиль компании по id
async def get_company(company_id: int) -> Company:
    try:
        company = await get_company_by_id(company_id=company_id)
    except NotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error

    return company

# получение всех вакансий компании
# получение всех откликов по всем вакансиям
# получение всех откликов по определенной вакансии
# получение списка всех вакансий

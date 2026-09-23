from api.dependencies import get_current_user
from fastapi import APIRouter, Depends, HTTPException, status
from models.models import User
from repositories.company import (
    AlreadyExistsError,
    NotFoundError,
    create_company,
    delete_company,
    update_company,
)
from schemas.entities import (
    CompanyCreate,
    CompanyCreateResponse,
    CompanyDeleteResponse,
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

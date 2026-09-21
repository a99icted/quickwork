from api.dependencies import get_current_user
from fastapi import APIRouter, Depends, HTTPException, status
from models.models import User
from repositories.company import AlreadyExistsError, create_company
from schemas.entities import CompanyCreate, CompanyCreateResponse

router = APIRouter(prefix="/company", tags=["Company"])

@router.post("/create", response_model=CompanyCreateResponse, status_code=status.HTTP_201_CREATED)
async def company_create(data: CompanyCreate, current_user: User = Depends(get_current_user),) -> CompanyCreateResponse:
    try:
        user_id = current_user.id
        company_id = await create_company(data, user_id)

    except AlreadyExistsError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Не удалось создать компанию") from error

    return CompanyCreateResponse(company_id=company_id, message="Компания успешно создана")

from pydantic import BaseModel, Field


class CompanyCreate(BaseModel): # Валидация данных при регистрации компании, компания создает с пользовательского аккаунта
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=500)

class CompanyUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=500)

class CompanyUpdateResponse(BaseModel):
    company_id: int
    message: str

class CompanyCreateResponse(BaseModel):
    company_id: int
    message: str

class CompanyDeleteResponse(BaseModel):
    company_id: int
    message: str

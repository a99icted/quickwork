from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class WorkCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=500)

    time_from: datetime
    time_to: datetime

    city: str | None = Field(default=None, max_length=100)
    salary: int | None = Field(default=None, ge=0)

    features_id: int = Field(ge=1)
    category_id: int = Field(ge=1)

    # смена не может заканчиваться раньше, чем началась
    @model_validator(mode='after')
    def check_time_logic(self) -> 'WorkCreate':
        if self.time_from >= self.time_to:
            raise ValueError('Время окончания смены должно быть позже времени начала')
        return self


class WorkUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, min_length=1, max_length=500)

    time_from: datetime | None = None
    time_to: datetime | None = None

    city: str | None = Field(default=None, max_length=100)
    salary: int | None = Field(default=None, ge=0)

    features_id: int | None = Field(default=None, ge=1)
    category_id: int | None = Field(default=None, ge=1)


class DeleteWork(BaseModel): # Удаление вакансии - уже не нужно
    vacancy_id: int

class DeleteWorkResponse(BaseModel): # Ответ после успешного удаления
    vacancy_id: int
    message: str

class WorkUpdateResponse(BaseModel): # Ответ после успешного обновления
    vacancy_id: int
    message: str

class WorkCreateResponse(BaseModel): # Ответ после создания вакансии
    vacancy_id: int
    message: str

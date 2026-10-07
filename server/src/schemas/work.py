from datetime import date, time

from pydantic import BaseModel, Field, model_validator


class WorkCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=500)

    work_date: date
    time_from: time
    time_to: time

    ends_next_day: bool = False

    city: str | None = Field(default=None, max_length=100)
    salary: int | None = Field(default=None, ge=0)

    features_id: int = Field(ge=1)
    category_id: int = Field(ge=1)

    # смена не может заканчиваться раньше, чем началась
    @model_validator(mode='after')
    def check_time_logic(self) -> 'WorkCreate':
        if not self.ends_next_day and self.time_to <= self.time_from:
            raise ValueError(
                            "Время окончания должно быть позже времени начала. "
                            "Для ночной смены укажи ends_next_day=True."
                        )
        return self


class WorkUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, min_length=1, max_length=500)

    work_date: date | None = None
    time_from: time | None = None
    time_to: time | None = None
    ends_next_day: bool | None = None

    city: str | None = Field(default=None, max_length=100)
    salary: int | None = Field(default=None, ge=0)

    features_id: int | None = Field(default=None, ge=1)
    category_id: int | None = Field(default=None, ge=1)

    @model_validator(mode="after")
    def check_time_logic(self) -> "WorkUpdate":
        # Валидируем время, только если клиент прислал обе границы.
        if self.time_from is None or self.time_to is None:
            return self

        # Если ends_next_day не прислали — считаем, что смена в те же сутки.
        is_night_shift = self.ends_next_day is True

        if not is_night_shift and self.time_to <= self.time_from:
            raise ValueError(
                "Время окончания должно быть позже времени начала. "
                "Для ночной смены передай ends_next_day=true."
            )

        return self


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

class WorkFilters(BaseModel):
    city: str | None = Field(
        default="Novi-sad",
        min_length=1,
        max_length=100,
    )
    work_date: date | None = None

    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=10, ge=1, le=100)

class WorkFiltersResponse(BaseModel):
        id: int
        title: str
        salary: int | None

        work_date: date
        time_from: time
        time_to: time

        city: str | None
        company_name: str | None

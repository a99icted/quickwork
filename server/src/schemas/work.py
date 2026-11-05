from datetime import date, time

from typing import Annotated

from pydantic import BaseModel, Field, model_validator


Selection = list[Annotated[int, Field(strict=True, ge=1)]]


class WorkSelections(BaseModel):
    category_ids: Selection | None = Field(default=None, min_length=1)
    feature_ids: Selection | None = Field(default=None, min_length=1)
    # Compatibility for existing clients: a scalar is a one-item selection.
    category_id: int | None = Field(default=None, ge=1)
    features_id: int | None = Field(default=None, ge=1)

    @model_validator(mode='before')
    @classmethod
    def normalize_selections(cls, values):
        if not isinstance(values, dict):
            return values
        values = dict(values)
        for plural, scalar in [('category_ids', 'category_id'), ('feature_ids', 'features_id')]:
            if scalar in values:
                if values[scalar] is None:
                    raise ValueError(f'{scalar} не может быть пустым')
                if plural in values and values[plural] != [values[scalar]]:
                    raise ValueError(f'Используйте только {plural} либо {scalar}')
                values.setdefault(plural, [values[scalar]])
            if plural in values:
                if values[plural] is None:
                    raise ValueError(f'{plural}: выберите хотя бы один пункт')
                if isinstance(values[plural], list) and len(values[plural]) != len(set(str(item) for item in values[plural])):
                    raise ValueError(f'{plural}: повторяющиеся значения недопустимы')
        return values


class WorkCreate(WorkSelections):
    title: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=500)

    work_date: date
    time_from: time
    time_to: time

    ends_next_day: bool = False

    city: str | None = Field(default=None, max_length=100)
    salary: int | None = Field(default=None, ge=0)

    @model_validator(mode='after')
    def require_selections(self):
        if not self.category_ids or not self.feature_ids:
            raise ValueError('Выберите хотя бы одну категорию и одну особенность работы')
        return self

    # смена не может заканчиваться раньше, чем началась
    @model_validator(mode='after')
    def check_time_logic(self) -> 'WorkCreate':
        if not self.ends_next_day and self.time_to <= self.time_from:
            raise ValueError(
                            "Время окончания должно быть позже времени начала. "
                            "Для ночной смены укажи ends_next_day=True."
                        )
        return self


class WorkUpdate(WorkSelections):
    title: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, min_length=1, max_length=500)

    work_date: date | None = None
    time_from: time | None = None
    time_to: time | None = None
    ends_next_day: bool | None = None

    city: str | None = Field(default=None, max_length=100)
    salary: int | None = Field(default=None, ge=0)



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
        default=None,
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
        company_id: int
        description: str
        category_id: int
        features_id: int
        category_ids: list[int]
        feature_ids: list[int]
        ends_next_day: bool

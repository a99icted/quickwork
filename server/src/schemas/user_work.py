from datetime import date, time

from models.models import Status
from pydantic import BaseModel, ConfigDict, Field


class UserWorkUpdate(BaseModel):
    user_id: int
    work_id: int
    status: Status = Field(default=Status.PENDING)

class UserWorkUpdateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    work_id: int
    status: Status

class UserWorkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    work_id: int
    status: Status

class UserWorkAdd(BaseModel):
    work_id: int
    user_id: int

class WorkResponse(BaseModel):
    id: int
    title: str
    description: str

    work_date: date
    time_from: time
    time_to: time
    ends_next_day: bool
    status: Status
    company_name: str | None = None
    company_id: int

    city: str | None
    salary: int | None

    features_id: int
    category_id: int
    category_ids: list[int]
    feature_ids: list[int]

class WorkInfo(BaseModel):
    category_ids: list[int]
    feature_ids: list[int]
    id: int
    title: str
    city: str | None
    salary: int | None
    work_date: date
    time_from: time
    time_to: time

class UserShortInfo(BaseModel):
    id: int
    first_name: str
    last_name: str

class ResponseItem(BaseModel):
    work: WorkInfo
    user: UserShortInfo
    status: Status

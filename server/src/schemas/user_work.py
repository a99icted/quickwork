from datetime import datetime

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

    time_from: datetime
    time_to: datetime

    city: str | None
    salary: int | None

    features_id: int
    category_id: int

class WorkInfo(BaseModel):
    id: int
    title: str
    city: str
    salary: int
    time_from: datetime
    time_to: datetime

class UserShortInfo(BaseModel):
    id: int
    first_name: str
    last_name: str

class ResponseItem(BaseModel):
    work: WorkInfo
    user: UserShortInfo

from datetime import datetime
from typing import Literal

from models.models import Status
from pydantic import BaseModel, Field


class UserWorkAdd(BaseModel):
    work_id: int
    user_id: int

class UserWorkUpdate(BaseModel):
    user_id: int
    work_id: int
    status: Literal[Status.PENDING, Status.APPROVED, Status.REJECTED] = Field(default=Status.PENDING)

class UserWorkResponse(BaseModel):
    user_id: int
    work_id: int
    status: Literal[Status.PENDING, Status.APPROVED, Status.REJECTED] = Field(default=Status.PENDING)

class UserWorkUpdateResponse(BaseModel):
    user_id: int
    work_id: int
    message: str

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

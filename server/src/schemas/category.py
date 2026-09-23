from pydantic import BaseModel, Field


class CategoryAdd(BaseModel):

    name: str = Field(min_length=3, max_length=250)
    slug: str = Field(min_length=3, max_length=250)

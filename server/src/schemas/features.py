from pydantic import BaseModel, Field


class FeatureAdd(BaseModel):

    name: str = Field(min_length=3, max_length=250)

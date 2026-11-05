from pydantic import BaseModel, ConfigDict, Field, field_validator


class CatalogEntry(BaseModel):
    model_config = ConfigDict(extra='forbid')
    name: str = Field(min_length=1, max_length=250)
    slug: str | None = Field(default=None, min_length=1, max_length=250, pattern=r'^[a-z0-9][a-z0-9_-]*$')

    @field_validator('name')
    @classmethod
    def clean_name(cls, value):
        value = ' '.join(value.split())
        if not value:
            raise ValueError('Название не может быть пустым')
        return value

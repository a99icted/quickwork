from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.exc import IntegrityError

from api.dependencies import get_current_admin
from repositories.catalogs import CatalogConflict, catalog_snapshot, delete_entry, save_entry
from schemas.admin import CatalogEntry

router = APIRouter(prefix='/admin', tags=['Admin'], dependencies=[Depends(get_current_admin)])
CatalogKind = Literal['cities', 'categories', 'features']


@router.get('/catalogs')
async def get_catalogs():
    return await catalog_snapshot()


async def save(kind, data, item_id=None):
    try:
        return await save_entry(kind, data, item_id)
    except LookupError as error:
        raise HTTPException(404, str(error)) from error
    except (CatalogConflict, IntegrityError) as error:
        raise HTTPException(409, str(error) if isinstance(error, CatalogConflict) else 'Такая запись уже существует') from error
    except ValueError as error:
        raise HTTPException(422, str(error)) from error


@router.post('/{kind}', status_code=201)
async def create_catalog_entry(kind: CatalogKind, data: CatalogEntry):
    return await save(kind, data)


@router.patch('/{kind}/{item_id}')
async def update_catalog_entry(kind: CatalogKind, item_id: int, data: CatalogEntry):
    return await save(kind, data, item_id)


@router.delete('/{kind}/{item_id}', status_code=204)
async def remove_catalog_entry(kind: CatalogKind, item_id: int):
    try:
        await delete_entry(kind, item_id)
    except LookupError as error:
        raise HTTPException(404, str(error)) from error
    except (CatalogConflict, IntegrityError) as error:
        raise HTTPException(409, str(error) if isinstance(error, CatalogConflict) else 'Запись используется в вакансиях') from error
    return Response(status_code=204)

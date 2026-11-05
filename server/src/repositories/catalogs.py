from uuid import uuid4

from sqlalchemy import func, or_, select

from db.database import session_factory
from core.normalization import normalize_name
from models.models import Category, City, Company, Feature, User, Work, WorkCategory, WorkFeature

MODELS = {'cities': City, 'categories': Category, 'features': Feature}


class CatalogConflict(ValueError):
    pass


async def usage_count(session, kind, item):
    if kind == 'cities':
        names = (await session.scalars(select(Work.city).where(Work.city.is_not(None)))).all()
        return sum(normalize_name(name) == item.name_key for name in names)
    link, field, legacy = (WorkCategory, WorkCategory.category_id, Work.category_id) if kind == 'categories' else (WorkFeature, WorkFeature.feature_id, Work.features_id)
    return await session.scalar(select(func.count()).select_from(Work).where(or_(
        legacy == item.id, Work.id.in_(select(link.work_id).where(field == item.id)),
    )))


async def catalog_snapshot():
    async with session_factory() as session:
        result = {}
        for kind, model in MODELS.items():
            items = (await session.scalars(select(model).order_by(model.id))).all()
            result[kind] = [dict(id=item.id, name=item.name, usage_count=await usage_count(session, kind, item),
                                 **({'slug': item.slug} if kind == 'categories' else {})) for item in items]
        result['stats'] = {}
        for name, model in [('users', User), ('companies', Company), ('works', Work)]:
            result['stats'][name] = await session.scalar(select(func.count()).select_from(model))
        return result


async def save_entry(kind, data, item_id=None):
    model = MODELS[kind]
    async with session_factory() as session, session.begin():
        item = await session.get(model, item_id) if item_id is not None else None
        if item_id is not None and item is None:
            raise LookupError('Запись не найдена')
        if kind == 'cities' and len(data.name) > 100:
            raise ValueError('Название города должно содержать не более 100 символов')
        if kind != 'categories' and data.slug is not None:
            raise ValueError('Код доступен только для категорий')
        key = normalize_name(data.name)
        entries = (await session.scalars(select(model))).all()
        if any(entry.id != item_id and normalize_name(entry.name) == key for entry in entries):
            raise CatalogConflict('Запись с таким названием уже существует')
        if kind == 'categories':
            slug = data.slug or (item.slug if item else 'category-' + uuid4().hex[:12])
            if any(entry.id != item_id and entry.slug == slug for entry in entries):
                raise CatalogConflict('Категория с таким кодом уже существует')
        if item is None:
            item = model(name=data.name)
            session.add(item)
        elif kind == 'cities':
            works = (await session.scalars(select(Work).where(Work.city.is_not(None)))).all()
            for work in works:
                if normalize_name(work.city) == item.name_key:
                    work.city = data.name
        item.name = data.name
        if kind == 'cities':
            item.name_key = key
        elif kind == 'categories':
            item.slug = slug
        await session.flush()
        return {'id': item.id, 'name': item.name, **({'slug': item.slug} if kind == 'categories' else {})}


async def delete_entry(kind, item_id):
    async with session_factory() as session, session.begin():
        item = await session.get(MODELS[kind], item_id)
        if item is None:
            raise LookupError('Запись не найдена')
        if await usage_count(session, kind, item):
            raise CatalogConflict('Запись используется в вакансиях. Сначала измените эти вакансии.')
        await session.delete(item)

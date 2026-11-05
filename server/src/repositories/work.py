from datetime import date
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import joinedload

from core.exceptions import NotFoundError
from db.database import session_factory
from core.normalization import normalize_name
from models.models import Category, City, Company, Feature, Work
from schemas.work import WorkCreate, WorkUpdate


def serialize_work(work, company_name=None):
    return {
        'id': work.id, 'title': work.title, 'description': work.description,
        'salary': work.salary, 'work_date': work.work_date,
        'time_from': work.time_from, 'time_to': work.time_to,
        'ends_next_day': work.ends_next_day, 'city': work.city,
        'company_id': work.company_id, 'company_name': company_name,
        'category_id': work.category_id, 'features_id': work.features_id,
        'category_ids': [item.id for item in work.categories] or [work.category_id],
        'feature_ids': [item.id for item in work.feature_items] or [work.features_id],
    }


async def selection_items(session, model, ids, label):
    if not ids:
        raise ValueError(f'Выберите хотя бы одну {label}')
    found = {item.id: item for item in (await session.scalars(select(model).where(model.id.in_(ids)))).all()}
    if len(found) != len(ids):
        raise ValueError(f'Не найдены выбранные значения: {label}. Обновите справочники.')
    return [found[item_id] for item_id in ids]


async def canonical_city(session, name):
    if not name or not name.strip():
        raise ValueError('Выберите город из справочника')
    city = await session.scalar(select(City).where(City.name_key == normalize_name(name)))
    if city is None:
        raise ValueError('Город не найден в справочнике. Обратитесь к администратору.')
    return city.name


async def create_work(data: WorkCreate, company_id: int) -> int:
    async with session_factory() as session, session.begin():
        if await session.get(Company, company_id) is None:
            raise NotFoundError('Компания не найдена')
        categories = await selection_items(session, Category, data.category_ids, 'категорию')
        features = await selection_items(session, Feature, data.feature_ids, 'особенность работы')
        values = data.model_dump(exclude={'category_ids', 'feature_ids', 'category_id', 'features_id'})
        values['city'] = await canonical_city(session, data.city)
        work = Work(**values, company_id=company_id, category_id=categories[0].id, features_id=features[0].id,
                    categories=categories, feature_items=features)
        session.add(work)
        await session.flush()
        return work.id


async def update_work(vacancy_id: int, company_id: int, data: WorkUpdate) -> int:
    async with session_factory() as session, session.begin():
        work = await session.scalar(select(Work).where(Work.id == vacancy_id, Work.company_id == company_id))
        if work is None:
            raise NotFoundError('Вакансия не найдена')
        values = data.model_dump(exclude_unset=True, exclude={'category_ids', 'feature_ids', 'category_id', 'features_id'})
        for key in ('title', 'description', 'work_date', 'time_from', 'time_to', 'ends_next_day'):
            if key in values and values[key] is None:
                raise ValueError(f'{key} не может быть пустым')
        if 'city' in values:
            values['city'] = await canonical_city(session, values['city'])
        start, end = values.get('time_from', work.time_from), values.get('time_to', work.time_to)
        if not values.get('ends_next_day', work.ends_next_day) and end <= start:
            raise ValueError('Время окончания должно быть позже начала. Для ночной смены укажите переход на следующий день.')
        if data.category_ids is not None:
            work.categories = await selection_items(session, Category, data.category_ids, 'категорию')
            work.category_id = data.category_ids[0]
        if data.feature_ids is not None:
            work.feature_items = await selection_items(session, Feature, data.feature_ids, 'особенность работы')
            work.features_id = data.feature_ids[0]
        for field, value in values.items():
            setattr(work, field, value)
        await session.flush()
        return work.id


async def delete_work(vacancy_id: int, company_id: int) -> int:
    async with session_factory() as session, session.begin():
        work = await session.scalar(select(Work).where(Work.id == vacancy_id, Work.company_id == company_id))
        if work is None:
            raise NotFoundError('Вакансия не найдена')
        await session.delete(work)
        return vacancy_id


async def get_works(page: int = 1, per_page: int = 10, city: str | None = None, work_date: date | None = None, company_id: int | None = None) -> list[dict[str, Any]]:
    async with session_factory() as session:
        stmt = select(Work).options(joinedload(Work.company))
        if company_id is not None:
            stmt = stmt.where(Work.company_id == company_id)
        if city:
            stmt = stmt.where(func.lower(Work.city) == city.strip().lower())
        if work_date:
            stmt = stmt.where(Work.work_date == work_date)
        works = (await session.scalars(stmt.order_by(Work.work_date, Work.time_from, Work.id).offset((page - 1) * per_page).limit(per_page))).all()
        return [serialize_work(work, work.company.name if work.company else None) for work in works]


async def get_work(vacancy_id: int) -> dict[str, Any]:
    async with session_factory() as session:
        work = await session.scalar(select(Work).where(Work.id == vacancy_id).options(joinedload(Work.company)))
        if work is None:
            raise NotFoundError('Вакансия не найдена')
        result = serialize_work(work, work.company.name if work.company else None)
        result['company'] = result['company_name']
        return result


async def get_work_options() -> dict:
    async with session_factory() as session:
        categories = (await session.scalars(select(Category).order_by(Category.id))).all()
        features = (await session.scalars(select(Feature).order_by(Feature.id))).all()
        cities = (await session.scalars(select(City).order_by(City.name))).all()
        return {
            'categories': [{'id': item.id, 'name': item.name, 'slug': item.slug} for item in categories],
            'features': [{'id': item.id, 'name': item.name} for item in features],
            'cities': [item.name for item in cities],
        }

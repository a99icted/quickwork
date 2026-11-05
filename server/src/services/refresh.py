"""Opaque refresh tokens: only SHA-256 hashes are stored in the database."""
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from secrets import token_urlsafe
from uuid import uuid4

from sqlalchemy import select, update

from core.config import settings
from db.database import session_factory
from models.models import RefreshSession, User


def token_hash(token: str) -> str:
    return sha256(token.encode()).hexdigest()


def new_session(user_id, family_id, expires_at):
    token = token_urlsafe(48)
    return token, RefreshSession(user_id=user_id, family_id=family_id,
                                 token_hash=token_hash(token), expires_at=expires_at)


async def create_refresh_session(user_id: int) -> str:
    # SQLite stores UTC timestamps without timezone information.
    expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    token, record = new_session(user_id, uuid4().hex, expires_at)
    async with session_factory() as session, session.begin():
        session.add(record)
    return token


async def rotate_refresh_session(token: str) -> tuple[int, str, datetime] | None:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    async with session_factory() as session, session.begin():
        # Claim the token atomically: parallel refresh requests cannot both succeed.
        record = (await session.execute(
            update(RefreshSession).where(
                RefreshSession.token_hash == token_hash(token),
                RefreshSession.revoked.is_(False), RefreshSession.expires_at > now,
            ).values(revoked=True).returning(
                RefreshSession.user_id, RefreshSession.family_id, RefreshSession.expires_at,
            )
        )).first()
        if record is None:
            # Reusing a consumed token invalidates its whole login session.
            family = await session.scalar(select(RefreshSession.family_id).where(
                RefreshSession.token_hash == token_hash(token)))
            if family:
                await session.execute(update(RefreshSession).where(
                    RefreshSession.family_id == family).values(revoked=True))
            return None
        if await session.get(User, record.user_id) is None:
            return None
        replacement, next_record = new_session(record.user_id, record.family_id, record.expires_at)
        session.add(next_record)
        return record.user_id, replacement, record.expires_at


async def revoke_refresh_session(token: str) -> None:
    async with session_factory() as session, session.begin():
        family = await session.scalar(select(RefreshSession.family_id).where(
            RefreshSession.token_hash == token_hash(token)))
        if family:
            await session.execute(update(RefreshSession).where(
                RefreshSession.family_id == family).values(revoked=True))

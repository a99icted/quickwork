from datetime import datetime, timedelta, timezone

import jwt
from core.config import settings
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str: # Хеширует пароль
    return password_hash.hash(password)


def verify_password(plain_password: str,hashed_password: str,) -> bool: # Проверяет хеш пароля
    return password_hash.verify(plain_password,hashed_password,)

def create_access_token(user_id: int) -> str: # Создаёт JWT access token для пользователя.

    now = datetime.now(timezone.utc) # Текущее время в UTC.

    expires_at = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES) # Время, когда токен перестанет быть действительным.

    payload = { # Данные, которые будут записаны внутрь JWT.
        "sub": str(user_id),
        "type": "access",
        "iat": now,
        "exp": expires_at
    }

    access_token = jwt.encode( # Подписываем payload секретным ключом и возвращаем готовую строку JWT.
            payload,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM,
        )

    return access_token


def get_user_id_from_access_token(token: str) -> int: # Проверяем токен на валидность
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM],) # Декодируем токен, чтобы получить зишифрованный в нем user_id и типа токена

    except ExpiredSignatureError:
        raise ValueError("Срок действия токена истек")

    except InvalidTokenError:
        raise ValueError("Невалидный токен")

    # Не позволяем использовать refresh token вместо access token
    if payload.get("type") != "access":
        raise ValueError("Передан неверный тип токена")

    user_id = payload.get("sub")

    if user_id is None:
        raise ValueError(
                    "Некорректные данные токена"
                )

    try:
        return int(user_id)

    except ValueError:
        raise ValueError(
                    "ID пользователя в токене имеет неверный формат"
                )

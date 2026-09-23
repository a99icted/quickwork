from core.exceptions import NotFoundError
from db.database import session_factory
from models.models import User, Work
from sqlalchemy import select

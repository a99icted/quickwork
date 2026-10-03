import enum
from datetime import date, datetime, time

from db.database import Base
from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, String, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Role(str, enum.Enum):
    WORKER = 'worker'
    EMPLOYER = 'employer'
    ADMIN = 'admin'

class Status(str, enum.Enum):
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'


class UserWork(Base):
    __tablename__ = 'user_works'

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"),nullable=False,index=True)
    work_id: Mapped[int] = mapped_column(ForeignKey("works.id", ondelete="CASCADE"),nullable=False,index=True)
    status: Mapped[Status] = mapped_column(Enum(Status), default=Status.PENDING)

    user: Mapped["User"] = relationship(back_populates="applications")
    work: Mapped["Work"] = relationship(back_populates="applications")


class User(Base): # Пользователь
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True)
    hashed_password: Mapped[str] = mapped_column(String(255),nullable=False,)
    username: Mapped[str] = mapped_column(String(25), unique=True, index=True)

    first_name: Mapped[str] = mapped_column(String(25))
    last_name: Mapped[str] = mapped_column(String(25))
    age: Mapped[int] = mapped_column(Integer,nullable=False,)
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.WORKER, nullable=False)
    applications: Mapped[list["UserWork"]] = relationship(back_populates='user')
    company: Mapped["Company"] = relationship(back_populates='user', cascade="all, delete-orphan", uselist=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

class Company(Base): # Компания
    __tablename__ = 'companies'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)

    description: Mapped[str] = mapped_column(String(500))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # Одна компания много вакансий
    works: Mapped[list["Work"]] = relationship(back_populates='company',cascade="all, delete-orphan")
    user: Mapped["User"] = relationship(back_populates='company', single_parent=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

class Work(Base): # Вакансия
    __tablename__ = 'works'

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(100), index=True)
    description: Mapped[str] = mapped_column(String(500))

    work_date: Mapped[date] = mapped_column(Date, nullable=False) # День на который расчитана вакансия
    time_to: Mapped[time] = mapped_column(Time, nullable=False) # Конечное время работы
    time_from: Mapped[time] = mapped_column(Time, nullable=False) # Начальное время работы
    ends_next_day: Mapped[bool] = mapped_column(Boolean,default=False,nullable=False) # Если смена переходит через полночь

    city: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    salary: Mapped[int | None] = mapped_column(nullable=True)


    features_id: Mapped[int] = mapped_column(ForeignKey('features.id', ondelete="RESTRICT"))
    features: Mapped["Feature"]  = relationship(back_populates='works')

    category_id: Mapped[int] = mapped_column(ForeignKey('categories.id', ondelete="RESTRICT"), nullable=False)
    category: Mapped["Category"] = relationship(back_populates='works')

    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, )
    company: Mapped["Company"] = relationship(back_populates="works",)

    applications: Mapped[list["UserWork"]] = relationship(back_populates='work')

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

class Category(Base): # Категории услуг
    __tablename__ = 'categories'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(250))
    slug: Mapped[str] = mapped_column(String(250), index=True, unique=True)

    works: Mapped[list["Work"]] = relationship(back_populates='category')


class Feature(Base): # Особенности - необходимость документов
    __tablename__ = 'features'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(250))

    works: Mapped[list["Work"]] = relationship(back_populates='features')

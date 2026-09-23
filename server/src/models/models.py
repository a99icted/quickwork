from datetime import datetime
import enum
from db.database import Base
from sqlalchemy import DateTime, ForeignKey, Integer, String, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship


class UserWork(Base):
    __tablename__ = 'user_works'

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"),nullable=False,index=True)
    work_id: Mapped[int] = mapped_column(ForeignKey("works.id", ondelete="CASCADE"),nullable=False,index=True)
    status_id: Mapped[int] = mapped_column(ForeignKey("statuses.id", ondelete="RESTRICT"),nullable=False,index=True)

    user: Mapped["User"] = relationship(back_populates="applications")
    work: Mapped["Work"] = relationship(back_populates="applications")
    status: Mapped["Status"] = relationship(back_populates="applications")


class Role(str, enum.Enum):
    WORKER = 'worker'
    EMPLOYER = 'employer'
    ADMIN = 'admin'


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

class Company(Base): # Компания
    __tablename__ = 'companies'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)

    description: Mapped[str] = mapped_column(String(500))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # Одна компания много вакансий
    works: Mapped[list["Work"]] = relationship(back_populates='company',cascade="all, delete-orphan")
    user: Mapped["User"] = relationship(back_populates='company', single_parent=True)

class Work(Base): # Вакансия
    __tablename__ = 'works'

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(100), index=True)
    description: Mapped[str] = mapped_column(String(500))

    time_from: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    time_to: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    city: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    salary: Mapped[int | None] = mapped_column(nullable=True)


    features_id: Mapped[int] = mapped_column(ForeignKey('features.id', ondelete="RESTRICT"))
    features: Mapped["Feature"]  = relationship(back_populates='works')

    category_id: Mapped[int] = mapped_column(ForeignKey('categories.id', ondelete="RESTRICT"), nullable=False)
    category: Mapped["Category"] = relationship(back_populates='works')

    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, )
    company: Mapped["Company"] = relationship(back_populates="works",)

    applications: Mapped[list["UserWork"]] = relationship(back_populates='work')


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



class Status(Base): # Статус, который присваивается вакансии, когда юзер откликается на неё (Не просмотрено, Работадатель вас ожидает)
    __tablename__ = 'statuses'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(250))
    color: Mapped[str] = mapped_column(String(7), default="#f3f5fa")

    applications: Mapped[list["UserWork"]] = relationship(back_populates="status")

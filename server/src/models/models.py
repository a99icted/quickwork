from db.database import Base
from sqlalchemy import Column, ForeignKey, Integer, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

user_works = Table(
    "user_works",
    Base.metadata,

    Column(
        "user_id",
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True
    ),
    Column(
        "work_id",
        ForeignKey("works.id", ondelete="CASCADE"), primary_key=True
    )
)


class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True)
    hashed_password: Mapped[str] = mapped_column(String(255),nullable=False,)
    username: Mapped[str] = mapped_column(String(25), unique=True, index=True)

    first_name: Mapped[str] = mapped_column(String(25))
    last_name: Mapped[str] = mapped_column(String(25))
    age: Mapped[int] = mapped_column(Integer,nullable=False,)

    works: Mapped[list["Work"]] = relationship(secondary=user_works,back_populates='users')


class Company(Base):
    __tablename__ = 'companies'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)

    description: Mapped[str] = mapped_column(String(500))
    # Одна компания много вакансий
    works: Mapped[list["Work"]] = relationship(back_populates='company',cascade="all, delete-orphan")


class Work(Base):
    __tablename__ = 'works'

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(100), index=True)
    description: Mapped[str] = mapped_column(String(500))
    city: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    salary_from: Mapped[int | None] = mapped_column(nullable=True)
    salary_to: Mapped[int | None] = mapped_column(nullable=True)

    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, )

    company: Mapped[Company] = relationship(back_populates="works",)
    users: Mapped[list["User"]] = relationship(secondary=user_works,back_populates='works',)

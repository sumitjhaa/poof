import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text
from datetime import datetime, timezone


DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)


class Base(DeclarativeBase):
    pass


class Secret(Base):
    __tablename__ = "secrets"

    id = Column(String(36), primary_key=True)
    encrypted_data = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime(timezone=True), nullable=False)
    max_views = Column(Integer, default=1)
    views_count = Column(Integer, default=0)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    password_hash = Column(String(128), nullable=True)
    password_salt = Column(String(32), nullable=True)


engine = None
async_session = None


async def init_db():
    global engine, async_session
    if not DATABASE_URL:
        print("No DATABASE_URL set, using in-memory storage")
        return False

    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print(f"Connected to PostgreSQL")
    return True


async def get_session():
    if async_session is None:
        return None
    return async_session()

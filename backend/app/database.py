"""数据库连接配置。"""
import os
from pathlib import Path

from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker


_default_db = str(Path(__file__).resolve().parents[1] / "genshin.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{_default_db}")

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
)


@event.listens_for(engine.sync_engine, "connect")
def enable_sqlite_foreign_keys(dbapi_connection, connection_record):
    """为 SQLite 打开外键约束。"""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_db():
    """提供数据库会话。"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

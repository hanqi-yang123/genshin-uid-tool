"""FastAPI 应用入口。"""

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from sqlalchemy import text

from .crud import ensure_default_admin
from .database import Base, AsyncSessionLocal, engine
from .resources import load_all as load_resources
from .routers import admin, uid


def get_allowed_origins() -> list[str]:
    raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
    if raw_origins.strip() == "*":
        return ["*"]
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def migrate_schema():
    """迁移：将 CharacterWeaponIndex.副属性名称 移到 Dict_Weapon，删除旧列。"""
    async with engine.begin() as conn:
        result = await conn.execute(text("PRAGMA table_info(CharacterWeaponIndex)"))
        col_names = {row[1] for row in result.fetchall()}
        if "副属性名称" in col_names:
            await conn.execute(text("ALTER TABLE CharacterWeaponIndex DROP COLUMN 副属性名称"))

        result = await conn.execute(text("PRAGMA table_info(BaseIndex)"))
        base_cols = {row[1] for row in result.fetchall()}
        if "nameCardId" not in base_cols:
            await conn.execute(text("ALTER TABLE BaseIndex ADD COLUMN nameCardId INTEGER"))

        result = await conn.execute(text("PRAGMA table_info(CharacterReliquery)"))
        relic_cols = {row[1] for row in result.fetchall()}
        if "itemId" not in relic_cols:
            await conn.execute(text("ALTER TABLE CharacterReliquery ADD COLUMN itemId VARCHAR"))


async def seed_data():
    async with AsyncSessionLocal() as session:
        await ensure_default_admin(session)


app = FastAPI(
    title="原神 UID 工具",
    description="用于获取和展示原神玩家展柜数据的工具",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(uid.router)
app.include_router(admin.router)

frontend_dist = Path(__file__).resolve().parents[2] / "frontend" / "dist"
frontend_assets = frontend_dist / "assets"
frontend_index = frontend_dist / "index.html"

if frontend_assets.exists():
    app.mount("/assets", StaticFiles(directory=frontend_assets), name="assets")


@app.on_event("startup")
async def startup_event():
    await init_db()
    await migrate_schema()
    await seed_data()
    load_resources()


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    requested_path = frontend_dist / full_path
    if full_path and requested_path.is_file():
        return FileResponse(requested_path)
    if frontend_index.exists():
        return FileResponse(frontend_index)
    return {"message": "Frontend build not found. Run `npm run build` in the frontend folder first."}

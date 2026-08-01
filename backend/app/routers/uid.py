"""UID 相关接口。"""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..crawler import fetch_genshin_user_data
from ..crud import (
    ensure_default_admin,
    get_character_options,
    get_global_character_stats,
    get_global_player_stats,
    get_player_analysis,
    get_player_by_uid,
    get_player_history,
    grant_admin,
    is_admin,
    save_or_update_player,
)
from ..database import get_db
from ..schemas import BaseResponse, GrantAdminRequest, UIDRequest

router = APIRouter(prefix="/api", tags=["uid"])

cache: dict[str, tuple[datetime, dict]] = {}


async def _require_session(db: AsyncSession, viewer_uid: str) -> bool:
    await ensure_default_admin(db)
    return await is_admin(db, viewer_uid)


def _assert_uid(uid: str) -> None:
    if not uid.isdigit() or len(uid) != 9:
        raise HTTPException(status_code=400, detail="UID 格式错误，请输入 9 位数字")


def _assert_can_access(viewer_uid: str, target_uid: str, viewer_is_admin: bool) -> None:
    if not viewer_is_admin and viewer_uid != target_uid:
        raise HTTPException(status_code=403, detail="普通用户只能查看自己的 UID 数据")


async def _fetch_and_save(uid: str, db: AsyncSession) -> dict:
    raw_data = await fetch_genshin_user_data(uid)
    saved_data = await save_or_update_player(db, raw_data)
    cache[uid] = (datetime.now(), saved_data)
    return saved_data


@router.get("/session/{uid}", response_model=BaseResponse)
async def get_session(uid: str, db: AsyncSession = Depends(get_db)):
    _assert_uid(uid)
    viewer_is_admin = await _require_session(db, uid)
    return BaseResponse(success=True, message="身份识别成功", data={"uid": uid, "is_admin": viewer_is_admin})


@router.post("/fetch-uid", response_model=BaseResponse)
async def fetch_uid(request: UIDRequest, db: AsyncSession = Depends(get_db)):
    _assert_uid(request.uid)
    viewer_uid = request.viewer_uid or request.uid
    _assert_uid(viewer_uid)
    viewer_is_admin = await _require_session(db, viewer_uid)
    _assert_can_access(viewer_uid, request.uid, viewer_is_admin)

    current_time = datetime.now()
    if request.uid in cache:
        cache_time, cache_data = cache[request.uid]
        if current_time - cache_time < timedelta(minutes=5):
            return BaseResponse(success=True, message="命中 5 分钟内缓存", data=cache_data)

    try:
        saved_data = await _fetch_and_save(request.uid, db)
        return BaseResponse(success=True, message="抓取并保存成功", data=saved_data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/refresh/{uid}", response_model=BaseResponse)
async def refresh_uid(
    uid: str,
    viewer_uid: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    _assert_uid(uid)
    _assert_uid(viewer_uid)
    viewer_is_admin = await _require_session(db, viewer_uid)
    _assert_can_access(viewer_uid, uid, viewer_is_admin)

    try:
        saved_data = await _fetch_and_save(uid, db)
        return BaseResponse(success=True, message="刷新成功", data=saved_data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/player/{uid}", response_model=BaseResponse)
async def get_player(
    uid: str,
    viewer_uid: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    _assert_uid(uid)
    _assert_uid(viewer_uid)
    viewer_is_admin = await _require_session(db, viewer_uid)
    _assert_can_access(viewer_uid, uid, viewer_is_admin)

    player_data = await get_player_by_uid(db, uid)
    if player_data is None:
        raise HTTPException(status_code=404, detail="本地没有该 UID 的缓存数据，请先执行查询")
    return BaseResponse(success=True, message="读取本地缓存成功", data=player_data)


@router.get("/history", response_model=BaseResponse)
async def get_history(
    viewer_uid: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    _assert_uid(viewer_uid)
    viewer_is_admin = await _require_session(db, viewer_uid)
    history = await get_player_history(db, viewer_uid, viewer_is_admin)
    return BaseResponse(success=True, message="读取历史记录成功", data=history)


@router.get("/analysis/{uid}", response_model=BaseResponse)
async def get_analysis(
    uid: str,
    viewer_uid: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    _assert_uid(uid)
    _assert_uid(viewer_uid)
    viewer_is_admin = await _require_session(db, viewer_uid)
    _assert_can_access(viewer_uid, uid, viewer_is_admin)

    player_data = await get_player_by_uid(db, uid)
    if player_data is None:
        raise HTTPException(status_code=404, detail="本地没有该 UID 的缓存数据，请先执行查询")

    analysis = await get_player_analysis(db, uid)
    return BaseResponse(success=True, message="读取分析数据成功", data=analysis)


@router.post("/admin/grant-admin", response_model=BaseResponse)
async def add_admin(request: GrantAdminRequest, db: AsyncSession = Depends(get_db)):
    _assert_uid(request.viewer_uid)
    _assert_uid(request.target_uid)
    viewer_is_admin = await _require_session(db, request.viewer_uid)
    if not viewer_is_admin:
        raise HTTPException(status_code=403, detail="只有管理员可以授予管理员权限")
    created = await grant_admin(db, request.target_uid)
    return BaseResponse(success=True, message="授予管理员权限成功", data=created)


@router.get("/admin/player-stats", response_model=BaseResponse)
async def get_admin_player_stats(
    viewer_uid: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    _assert_uid(viewer_uid)
    viewer_is_admin = await _require_session(db, viewer_uid)
    if not viewer_is_admin:
        raise HTTPException(status_code=403, detail="只有管理员可以查看全玩家统计")
    stats = await get_global_player_stats(db)
    return BaseResponse(success=True, message="读取全玩家统计成功", data=stats)


@router.get("/admin/character-options", response_model=BaseResponse)
async def get_admin_character_options(
    viewer_uid: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    _assert_uid(viewer_uid)
    viewer_is_admin = await _require_session(db, viewer_uid)
    if not viewer_is_admin:
        raise HTTPException(status_code=403, detail="只有管理员可以查看角色列表")
    options = await get_character_options(db)
    return BaseResponse(success=True, message="读取角色列表成功", data=options)


@router.get("/admin/character-stats/{character_id}", response_model=BaseResponse)
async def get_admin_character_stats(
    character_id: str,
    viewer_uid: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    _assert_uid(viewer_uid)
    viewer_is_admin = await _require_session(db, viewer_uid)
    if not viewer_is_admin:
        raise HTTPException(status_code=403, detail="只有管理员可以查看全角色统计")
    stats = await get_global_character_stats(db, character_id)
    return BaseResponse(success=True, message="读取全角色统计成功", data=stats)

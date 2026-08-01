"""管理员 CRUD API。"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..crud import (
    delete_character,
    delete_player_all,
    delete_relic,
    delete_weapon,
    get_dict_characters,
    get_dict_weapons,
    get_prop_names,
    get_relic_set_names,
    get_weapon_substat_names,
    is_admin,
    save_character_full,
    save_relic,
    save_weapon,
)
from ..database import get_db
from ..schemas import (
    BaseResponse,
    CharacterDeleteRequest,
    CharacterEditRequest,
    DeletePlayerRequest,
    RelicDeleteRequest,
    RelicEditRequest,
    WeaponDeleteRequest,
    WeaponEditRequest,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


async def _require_admin(viewer_uid: str, db: AsyncSession) -> None:
    if not await is_admin(db, viewer_uid):
        raise HTTPException(status_code=403, detail="只有管理员可以执行此操作")


def _assert_uid(uid: str) -> None:
    if not uid.isdigit() or len(uid) != 9:
        raise HTTPException(status_code=400, detail="UID 格式错误")


# ── 删除玩家全部数据 ──


@router.post("/delete-player", response_model=BaseResponse)
async def delete_player(request: DeletePlayerRequest, db: AsyncSession = Depends(get_db)):
    _assert_uid(request.target_uid)
    _assert_uid(request.viewer_uid)
    await _require_admin(request.viewer_uid, db)
    await delete_player_all(db, request.target_uid)
    await db.commit()
    return BaseResponse(success=True, message=f"UID {request.target_uid} 所有数据已删除")


# ── 角色 CRUD ──


@router.post("/character", response_model=BaseResponse)
async def create_character(request: CharacterEditRequest, db: AsyncSession = Depends(get_db)):
    await _require_admin(request.viewer_uid, db)
    attrs = {
        "最大生命值": request.最大生命值,
        "当前攻击力": request.当前攻击力,
        "当前防御力": request.当前防御力,
        "暴击率": request.暴击率,
        "暴击伤害": request.暴击伤害,
        "元素精通": request.元素精通,
        "元素充能效率": request.元素充能效率,
    }
    await save_character_full(
        db, request.uid, request.角色ID, request.等级,
        request.突破等级, request.好感等级, request.命座数, attrs,
        request.viewer_uid,
    )
    await db.commit()
    return BaseResponse(success=True, message="角色保存成功")


@router.delete("/character", response_model=BaseResponse)
async def remove_character(request: CharacterDeleteRequest, db: AsyncSession = Depends(get_db)):
    await _require_admin(request.viewer_uid, db)
    await delete_character(db, request.uid, request.角色ID, request.viewer_uid)
    await db.commit()
    return BaseResponse(success=True, message="角色已删除")


# ── 武器 CRUD ──


@router.post("/weapon", response_model=BaseResponse)
async def create_weapon(request: WeaponEditRequest, db: AsyncSession = Depends(get_db)):
    await _require_admin(request.viewer_uid, db)
    # weapon_id 为空时尝试用名称生成
    weapon_id = request.武器ID.strip() or f"ADMIN_{request.角色ID}_{request.副属性名称}"
    await save_weapon(
        db, request.uid, request.角色ID, weapon_id, request.武器ID or weapon_id,
        request.等级, request.突破等级, request.精炼等级, request.稀有度,
        request.基础攻击力值, request.副属性名称, request.副属性数值,
        request.viewer_uid,
    )
    await db.commit()
    return BaseResponse(success=True, message="武器保存成功")


@router.delete("/weapon", response_model=BaseResponse)
async def remove_weapon(request: WeaponDeleteRequest, db: AsyncSession = Depends(get_db)):
    await _require_admin(request.viewer_uid, db)
    await delete_weapon(db, request.uid, request.角色ID, request.viewer_uid)
    await db.commit()
    return BaseResponse(success=True, message="武器已删除")


# ── 圣遗物 CRUD ──


@router.post("/relic", response_model=BaseResponse)
async def create_relic(request: RelicEditRequest, db: AsyncSession = Depends(get_db)):
    await _require_admin(request.viewer_uid, db)
    sub_stats = []
    for i in range(1, 5):
        name = getattr(request, f"副属性{i}名称", "")
        value = getattr(request, f"副属性{i}数值", 0)
        sub_stats.append({"属性名称": name, "属性数值": value})
    await save_relic(
        db, request.uid, request.角色ID, request.部位,
        request.套装名称, request.主属性名称, request.主属性数值,
        sub_stats, request.viewer_uid,
        item_id=request.itemId,
    )
    await db.commit()
    return BaseResponse(success=True, message="圣遗物保存成功")


@router.delete("/relic", response_model=BaseResponse)
async def remove_relic(request: RelicDeleteRequest, db: AsyncSession = Depends(get_db)):
    await _require_admin(request.viewer_uid, db)
    await delete_relic(db, request.uid, request.角色ID, request.部位, request.viewer_uid)
    await db.commit()
    return BaseResponse(success=True, message="圣遗物已删除")


# ── 字典查询 ──


@router.get("/dict/characters", response_model=BaseResponse)
async def dict_characters(viewer_uid: str, db: AsyncSession = Depends(get_db)):
    _assert_uid(viewer_uid)
    await _require_admin(viewer_uid, db)
    data = await get_dict_characters(db)
    return BaseResponse(success=True, data=data)


@router.get("/dict/weapons", response_model=BaseResponse)
async def dict_weapons(viewer_uid: str, db: AsyncSession = Depends(get_db)):
    _assert_uid(viewer_uid)
    await _require_admin(viewer_uid, db)
    data = await get_dict_weapons(db)
    return BaseResponse(success=True, data=data)


@router.get("/dict/relic-sets", response_model=BaseResponse)
async def dict_relic_sets(viewer_uid: str, db: AsyncSession = Depends(get_db)):
    _assert_uid(viewer_uid)
    await _require_admin(viewer_uid, db)
    data = await get_relic_set_names(db)
    return BaseResponse(success=True, data=data)


@router.get("/dict/prop-names", response_model=BaseResponse)
async def dict_prop_names(viewer_uid: str, db: AsyncSession = Depends(get_db)):
    _assert_uid(viewer_uid)
    await _require_admin(viewer_uid, db)
    data = await get_prop_names(db)
    return BaseResponse(success=True, data=data)


@router.get("/dict/weapon-substats", response_model=BaseResponse)
async def dict_weapon_substats(viewer_uid: str, db: AsyncSession = Depends(get_db)):
    _assert_uid(viewer_uid)
    await _require_admin(viewer_uid, db)
    data = await get_weapon_substat_names(db)
    return BaseResponse(success=True, data=data)

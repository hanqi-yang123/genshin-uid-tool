"""数据库 CRUD 与统计分析。"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import delete, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from .models import (
    AbyssIndex,
    BaseIndex,
    CharacterAttributeIndex,
    CharacterBaseIndex,
    CharacterReliquery,
    CharacterWeaponIndex,
    Controller,
    DictCharacter,
    DictWeapon,
    OperationLog,
    ReliquerySubStat,
)
from .resources import enrich_player_data


DEFAULT_ADMIN_UID = "512981911"


def _now() -> datetime:
    return datetime.now()


def _update_model(instance: Any, payload: Dict[str, Any], extra: Optional[Dict[str, Any]] = None) -> None:
    for key, value in payload.items():
        setattr(instance, key, value)
    if extra:
        for key, value in extra.items():
            setattr(instance, key, value)


async def _get_one_by_keys(db: AsyncSession, model: Any, filters: List[Any]):
    result = await db.execute(select(model).where(*filters))
    return result.scalars().first()


async def ensure_default_admin(db: AsyncSession) -> None:
    exists = await _get_one_by_keys(db, Controller, [Controller.UID == DEFAULT_ADMIN_UID])
    if exists is None:
        db.add(Controller(UID=DEFAULT_ADMIN_UID))
        await db.commit()


async def is_admin(db: AsyncSession, uid: str) -> bool:
    controller = await _get_one_by_keys(db, Controller, [Controller.UID == uid])
    return controller is not None


async def grant_admin(db: AsyncSession, target_uid: str) -> Dict[str, Any]:
    controller = await _get_one_by_keys(db, Controller, [Controller.UID == target_uid])
    if controller is None:
        controller = Controller(UID=target_uid)
        db.add(controller)
        await db.commit()
        await db.refresh(controller)
    return {"UID": controller.UID, "created_at": controller.created_at}


def _build_weapon_id(weapon_data: Dict[str, Any]) -> str:
    weapon_id = weapon_data.get("武器ID")
    if weapon_id is not None and str(weapon_id).strip():
        return str(weapon_id)
    return str(weapon_data.get("名称", "UNKNOWN_WEAPON"))


async def save_or_update_player(db: AsyncSession, player_data: Dict[str, Any]) -> Dict[str, Any]:
    current_time = _now()
    uid = player_data["base"]["UID"]

    base_payload = dict(player_data["base"])
    abyss_payload = dict(player_data["abyss"])
    characters_payload = list(player_data["characters"])

    base_instance = await _get_one_by_keys(db, BaseIndex, [BaseIndex.UID == uid])
    if base_instance is None:
        db.add(BaseIndex(**base_payload, last_updated=current_time))
    else:
        _update_model(base_instance, base_payload, {"last_updated": current_time})

    abyss_instance = await _get_one_by_keys(db, AbyssIndex, [AbyssIndex.UID == uid])
    if abyss_instance is None:
        db.add(AbyssIndex(**abyss_payload, last_updated=current_time))
    else:
        _update_model(abyss_instance, abyss_payload, {"last_updated": current_time})

    for character in characters_payload:
        base_data = dict(character["base"])
        attr_data = dict(character["attributes"])
        weapon_data = dict(character["weapon"])
        relics_data = list(character["relics"])

        char_uid = base_data["UID"]
        char_id = base_data["角色ID"]
        char_name = base_data.pop("角色名称")
        char_star = base_data.pop("星级", None)

        dict_character = await _get_one_by_keys(db, DictCharacter, [DictCharacter.角色ID == char_id])
        if dict_character is None:
            db.add(DictCharacter(角色ID=char_id, 角色名称=char_name, 星级=char_star))
        else:
            dict_character.角色名称 = char_name
            if char_star is not None:
                dict_character.星级 = char_star

        char_base = await _get_one_by_keys(
            db,
            CharacterBaseIndex,
            [CharacterBaseIndex.UID == char_uid, CharacterBaseIndex.角色ID == char_id],
        )
        if char_base is None:
            db.add(CharacterBaseIndex(**base_data, last_updated=current_time))
        else:
            _update_model(char_base, base_data, {"last_updated": current_time})

        char_attr = await _get_one_by_keys(
            db,
            CharacterAttributeIndex,
            [CharacterAttributeIndex.UID == char_uid, CharacterAttributeIndex.角色ID == char_id],
        )
        if char_attr is None:
            db.add(CharacterAttributeIndex(**attr_data, last_updated=current_time))
        else:
            _update_model(char_attr, attr_data, {"last_updated": current_time})

        weapon_name = weapon_data.pop("名称", "")
        weapon_rarity = weapon_data.pop("稀有度", 0)
        weapon_substat_name = weapon_data.pop("副属性名称", "")
        weapon_id = _build_weapon_id(weapon_data | {"名称": weapon_name})
        weapon_data["武器ID"] = weapon_id

        dict_weapon = await _get_one_by_keys(db, DictWeapon, [DictWeapon.武器ID == weapon_id])
        if dict_weapon is None:
            db.add(DictWeapon(武器ID=weapon_id, 名称=weapon_name, 稀有度=weapon_rarity, 副属性名称=weapon_substat_name))
        else:
            dict_weapon.名称 = weapon_name
            dict_weapon.稀有度 = weapon_rarity
            dict_weapon.副属性名称 = weapon_substat_name

        char_weapon = await _get_one_by_keys(
            db,
            CharacterWeaponIndex,
            [CharacterWeaponIndex.UID == char_uid, CharacterWeaponIndex.角色ID == char_id],
        )
        if char_weapon is None:
            db.add(CharacterWeaponIndex(**weapon_data, last_updated=current_time))
        else:
            _update_model(char_weapon, weapon_data, {"last_updated": current_time})

        await db.execute(
            delete(ReliquerySubStat).where(
                ReliquerySubStat.UID == char_uid,
                ReliquerySubStat.角色ID == char_id,
            )
        )
        await db.execute(
            delete(CharacterReliquery).where(
                CharacterReliquery.UID == char_uid,
                CharacterReliquery.角色ID == char_id,
            )
        )

        for relic in relics_data:
            db.add(
                CharacterReliquery(
                    UID=relic["UID"],
                    角色ID=relic["角色ID"],
                    部位=relic["部位"],
                    套装名称=relic["套装名称"],
                    主属性名称=relic["主属性名称"],
                    主属性数值=relic["主属性数值"],
                    itemId=relic.get("itemId"),
                    last_updated=current_time,
                )
            )

            for index in range(1, 5):
                name = relic.get(f"副属性{index}名称", "")
                value = relic.get(f"副属性{index}数值", 0)
                if not name:
                    continue
                db.add(
                    ReliquerySubStat(
                        UID=relic["UID"],
                        角色ID=relic["角色ID"],
                        部位=relic["部位"],
                        词条序号=index,
                        属性名称=name,
                        属性数值=value,
                        last_updated=current_time,
                    )
                )

    await db.commit()
    return await get_player_by_uid(db, uid)


async def get_player_by_uid(db: AsyncSession, uid: str) -> Optional[Dict[str, Any]]:
    base_result = await db.execute(select(BaseIndex).where(BaseIndex.UID == uid))
    base_data = base_result.scalars().first()
    if base_data is None:
        return None

    abyss_result = await db.execute(select(AbyssIndex).where(AbyssIndex.UID == uid))
    abyss_data = abyss_result.scalars().first()

    character_result = await db.execute(
        select(CharacterBaseIndex, DictCharacter)
        .join(DictCharacter, DictCharacter.角色ID == CharacterBaseIndex.角色ID)
        .where(CharacterBaseIndex.UID == uid)
        .order_by(CharacterBaseIndex.等级.desc(), CharacterBaseIndex.命座数.desc(), CharacterBaseIndex.角色ID.asc())
    )
    character_rows = character_result.all()

    characters: List[Dict[str, Any]] = []
    for char_base, dict_character in character_rows:
        char_attr = (
            await db.execute(
                select(CharacterAttributeIndex).where(
                    CharacterAttributeIndex.UID == uid,
                    CharacterAttributeIndex.角色ID == char_base.角色ID,
                )
            )
        ).scalars().first()

        weapon_row = (
            await db.execute(
                select(CharacterWeaponIndex, DictWeapon)
                .join(DictWeapon, DictWeapon.武器ID == CharacterWeaponIndex.武器ID, isouter=True)
                .where(
                    CharacterWeaponIndex.UID == uid,
                    CharacterWeaponIndex.角色ID == char_base.角色ID,
                )
            )
        ).first()
        char_weapon = weapon_row[0] if weapon_row else None
        dict_weapon = weapon_row[1] if weapon_row else None

        relic_mains = (
            await db.execute(
                select(CharacterReliquery).where(
                    CharacterReliquery.UID == uid,
                    CharacterReliquery.角色ID == char_base.角色ID,
                )
            )
        ).scalars().all()

        relics: List[Dict[str, Any]] = []
        for relic_main in relic_mains:
            sub_stats = (
                await db.execute(
                    select(ReliquerySubStat)
                    .where(
                        ReliquerySubStat.UID == uid,
                        ReliquerySubStat.角色ID == char_base.角色ID,
                        ReliquerySubStat.部位 == relic_main.部位,
                    )
                    .order_by(ReliquerySubStat.词条序号.asc())
                )
            ).scalars().all()

            relic_payload: Dict[str, Any] = {
                "UID": relic_main.UID,
                "角色ID": relic_main.角色ID,
                "部位": relic_main.部位,
                "套装名称": relic_main.套装名称,
                "主属性名称": relic_main.主属性名称,
                "主属性数值": relic_main.主属性数值,
                "itemId": relic_main.itemId or "",
                "副属性1名称": "",
                "副属性2名称": "",
                "副属性3名称": "",
                "副属性4名称": "",
                "副属性1数值": 0,
                "副属性2数值": 0,
                "副属性3数值": 0,
                "副属性4数值": 0,
                "last_updated": relic_main.last_updated,
            }
            for sub in sub_stats:
                relic_payload[f"副属性{sub.词条序号}名称"] = sub.属性名称
                relic_payload[f"副属性{sub.词条序号}数值"] = sub.属性数值
            relics.append(relic_payload)

        characters.append(
            {
                "base": {
                    "UID": char_base.UID,
                    "角色ID": char_base.角色ID,
                    "角色名称": dict_character.角色名称,
                    "等级": char_base.等级,
                    "突破等级": char_base.突破等级,
                    "好感等级": char_base.好感等级,
                    "命座数": char_base.命座数,
                    "last_updated": char_base.last_updated,
                },
                "attributes": {
                    "UID": uid,
                    "角色ID": char_base.角色ID,
                    "最大生命值": char_attr.最大生命值 if char_attr else 0,
                    "当前攻击力": char_attr.当前攻击力 if char_attr else 0,
                    "当前防御力": char_attr.当前防御力 if char_attr else 0,
                    "暴击率": char_attr.暴击率 if char_attr else 0,
                    "暴击伤害": char_attr.暴击伤害 if char_attr else 0,
                    "元素精通": char_attr.元素精通 if char_attr else 0,
                    "元素充能效率": char_attr.元素充能效率 if char_attr else 0,
                    "last_updated": char_attr.last_updated if char_attr else None,
                },
                "weapon": {
                    "UID": uid,
                    "角色ID": char_base.角色ID,
                    "武器ID": char_weapon.武器ID if char_weapon else "",
                    "名称": dict_weapon.名称 if dict_weapon else "",
                    "等级": char_weapon.等级 if char_weapon else 0,
                    "突破等级": char_weapon.突破等级 if char_weapon else 0,
                    "精炼等级": char_weapon.精炼等级 if char_weapon else 0,
                    "稀有度": dict_weapon.稀有度 if dict_weapon else 0,
                    "基础攻击力值": char_weapon.基础攻击力值 if char_weapon else 0,
                    "副属性名称": dict_weapon.副属性名称 if dict_weapon else "",
                    "副属性数值": char_weapon.副属性数值 if char_weapon else 0,
                    "last_updated": char_weapon.last_updated if char_weapon else None,
                },
                "relics": relics,
            }
        )

    return enrich_player_data({
        "base": {
            "UID": base_data.UID,
            "昵称": base_data.昵称,
            "等级": base_data.等级,
            "签名": base_data.签名,
            "世界等级": base_data.世界等级,
            "成就数量": base_data.成就数量,
            "满好感角色数量": base_data.满好感角色数量,
            "nameCardId": base_data.nameCardId or 0,
            "last_updated": base_data.last_updated,
        },
        "abyss": {
            "UID": uid,
            "最深层数": abyss_data.最深层数 if abyss_data else 0,
            "最深房间": abyss_data.最深房间 if abyss_data else 0,
            "获取渊星数": abyss_data.获取渊星数 if abyss_data else 0,
            "幕数": abyss_data.幕数 if abyss_data else 0,
            "星章数": abyss_data.星章数 if abyss_data else 0,
            "危战层数": abyss_data.危战层数 if abyss_data else 0,
            "秒数": abyss_data.秒数 if abyss_data else 0,
            "last_updated": abyss_data.last_updated if abyss_data else None,
        },
        "characters": characters,
    })


async def get_player_history(db: AsyncSession, viewer_uid: str, viewer_is_admin: bool) -> List[Dict[str, Any]]:
    query = select(BaseIndex)
    if not viewer_is_admin:
        query = query.where(BaseIndex.UID == viewer_uid)
    result = await db.execute(query.order_by(BaseIndex.last_updated.desc(), BaseIndex.UID.desc()))
    rows = result.scalars().all()
    return [
        {
            "UID": row.UID,
            "昵称": row.昵称,
            "等级": row.等级,
            "last_updated": row.last_updated,
        }
        for row in rows
    ]


def _build_relic_combo(relic_names: List[str]) -> Optional[str]:
    valid_names = [name for name in relic_names if name and name != "未知套装"]
    if len(valid_names) != 5:
        return None
    counts: Dict[str, int] = {}
    for name in valid_names:
        counts[name] = counts.get(name, 0) + 1
    sorted_counts = sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    # 4 件套：4 个或 5 个同一套装 → "4千岩牢固"
    if sorted_counts[0][1] >= 4:
        return f"4{sorted_counts[0][0]}"
    # 2+2 配装 → "2千岩牢固+2冰风迷途的勇士"
    if sorted_counts[0][1] == 2 and len(sorted_counts) >= 2 and sorted_counts[1][1] == 2:
        return f"2{sorted_counts[0][0]}+2{sorted_counts[1][0]}"
    # 3+2、3+1+1 等非常规配装不统计
    return None


async def get_player_analysis(db: AsyncSession, uid: str) -> Dict[str, Any]:
    summary_row = (
        await db.execute(
            text(
                """
                SELECT
                    COUNT(*) AS 角色数量,
                    COALESCE(AVG(等级), 0) AS 平均等级,
                    COALESCE(AVG(命座数), 0) AS 平均命座数
                FROM CharacterBaseIndex
                WHERE UID = :uid
                """
            ),
            {"uid": uid},
        )
    ).mappings().first()

    updated_at = (await db.execute(select(BaseIndex.last_updated).where(BaseIndex.UID == uid))).scalar_one_or_none()

    level_rows = (
        await db.execute(
            text(
                """
                SELECT 等级 AS 等级, COUNT(*) AS 数量
                FROM CharacterBaseIndex
                WHERE UID = :uid
                GROUP BY 等级
                ORDER BY 等级
                """
            ),
            {"uid": uid},
        )
    ).mappings().all()

    constellation_rows = (
        await db.execute(
            text(
                """
                SELECT 命座数 AS 命座, COUNT(*) AS 数量
                FROM CharacterBaseIndex
                WHERE UID = :uid
                GROUP BY 命座数
                ORDER BY 命座数
                """
            ),
            {"uid": uid},
        )
    ).mappings().all()

    weapon_rows = (
        await db.execute(
            text(
                """
                SELECT dw.稀有度 AS 稀有度, COUNT(*) AS 数量
                FROM CharacterWeaponIndex cwi
                LEFT JOIN Dict_Weapon dw ON dw.武器ID = cwi.武器ID
                WHERE cwi.UID = :uid
                GROUP BY dw.稀有度
                ORDER BY dw.稀有度 DESC
                """
            ),
            {"uid": uid},
        )
    ).mappings().all()

    relic_rows = (
        await db.execute(
            text(
                """
                SELECT 套装名称 AS 套装名称, COUNT(*) AS 数量
                FROM CharacterReliquery
                WHERE UID = :uid AND 套装名称 IS NOT NULL AND 套装名称 != ''
                GROUP BY 套装名称
                ORDER BY 数量 DESC, 套装名称 ASC
                LIMIT 5
                """
            ),
            {"uid": uid},
        )
    ).mappings().all()

    return {
        "summary": {
            "角色数量": int(summary_row["角色数量"]) if summary_row else 0,
            "平均等级": round(float(summary_row["平均等级"]), 1) if summary_row else 0,
            "平均命座数": round(float(summary_row["平均命座数"]), 1) if summary_row else 0,
            "最近更新时间": updated_at,
        },
        "角色等级分布": [dict(row) for row in level_rows],
        "命座分布": [dict(row) for row in constellation_rows],
        "武器稀有度统计": [dict(row) for row in weapon_rows],
        "圣遗物套装统计": [dict(row) for row in relic_rows],
    }


async def get_global_player_stats(db: AsyncSession) -> Dict[str, Any]:
    rows = (
        await db.execute(
            text(
                """
                SELECT
                    CASE
                        WHEN 最深层数 <= 8 THEN '8及以下'
                        WHEN 最深层数 = 9 THEN '9'
                        WHEN 最深层数 = 10 THEN '10'
                        WHEN 最深层数 = 11 THEN '11'
                        ELSE '12'
                    END AS 桶,
                    COUNT(*) AS 数量
                FROM AbyssIndex
                GROUP BY 桶
                """
            )
        )
    ).mappings().all()
    floor_order = ["8及以下", "9", "10", "11", "12"]
    floor_map = {row["桶"]: row["数量"] for row in rows}

    badge_rows = (
        await db.execute(
            text(
                """
                SELECT 星章数 AS 值, COUNT(*) AS 数量
                FROM AbyssIndex
                GROUP BY 星章数
                """
            )
        )
    ).mappings().all()
    badge_map = {int(row["值"] or 0): row["数量"] for row in badge_rows}

    stygian_rows = (
        await db.execute(
            text(
                """
                SELECT 危战层数 AS 值, COUNT(*) AS 数量
                FROM AbyssIndex
                GROUP BY 危战层数
                """
            )
        )
    ).mappings().all()
    stygian_map = {int(row["值"] or 0): row["数量"] for row in stygian_rows}

    return {
        "最深层数分布": [{"标签": label, "数量": int(floor_map.get(label, 0))} for label in floor_order],
        "星章数分布": [{"标签": str(i), "数量": int(badge_map.get(i, 0))} for i in range(13)],
        "危战层数分布": [{"标签": str(i), "数量": int(stygian_map.get(i, 0))} for i in range(7)],
    }


async def get_character_options(db: AsyncSession) -> List[Dict[str, Any]]:
    rows = (
        await db.execute(
            select(DictCharacter.角色ID, DictCharacter.角色名称).order_by(DictCharacter.角色名称.asc())
        )
    ).all()
    return [{"角色ID": row[0], "角色名称": row[1]} for row in rows]


async def get_global_character_stats(db: AsyncSession, character_id: str) -> Dict[str, Any]:
    total_players = (
        await db.execute(select(func.count()).select_from(BaseIndex))
    ).scalar_one()
    owner_count = (
        await db.execute(
            select(func.count())
            .select_from(CharacterBaseIndex)
            .where(CharacterBaseIndex.角色ID == character_id)
        )
    ).scalar_one()

    avg_level = (
        await db.execute(
            select(func.avg(CharacterBaseIndex.等级)).where(CharacterBaseIndex.角色ID == character_id)
        )
    ).scalar_one()

    char_name = (
        await db.execute(select(DictCharacter.角色名称).where(DictCharacter.角色ID == character_id))
    ).scalar_one_or_none() or character_id

    constellation_rows = (
        await db.execute(
            text(
                """
                SELECT 命座数 AS 命座, COUNT(*) AS 数量
                FROM CharacterBaseIndex
                WHERE 角色ID = :character_id
                GROUP BY 命座数
                ORDER BY 命座数
                """
            ),
            {"character_id": character_id},
        )
    ).mappings().all()
    constellation_map = {int(row["命座"]): int(row["数量"]) for row in constellation_rows}

    weapon_rows = (
        await db.execute(
            text(
                """
                SELECT dw.名称 AS 名称, COUNT(*) AS 数量
                FROM CharacterWeaponIndex cwi
                LEFT JOIN Dict_Weapon dw ON dw.武器ID = cwi.武器ID
                WHERE cwi.角色ID = :character_id
                GROUP BY dw.名称
                ORDER BY 数量 DESC, dw.名称 ASC
                LIMIT 3
                """
            ),
            {"character_id": character_id},
        )
    ).mappings().all()

    relic_rows = (
        await db.execute(
            select(CharacterReliquery.UID, CharacterReliquery.套装名称)
            .where(CharacterReliquery.角色ID == character_id)
            .order_by(CharacterReliquery.UID.asc())
        )
    ).all()
    relic_by_uid: Dict[str, List[str]] = {}
    for uid, set_name in relic_rows:
        relic_by_uid.setdefault(uid, []).append(set_name)

    combo_counts: Dict[str, int] = {}
    for set_names in relic_by_uid.values():
        combo = _build_relic_combo(set_names)
        if combo:
            combo_counts[combo] = combo_counts.get(combo, 0) + 1
    combo_top3 = sorted(combo_counts.items(), key=lambda item: (-item[1], item[0]))[:3]

    return {
        "角色ID": character_id,
        "角色名称": char_name,
        "持有率": round((owner_count / total_players) * 100, 2) if total_players else 0,
        "平均等级": round(float(avg_level or 0), 1),
        "命座分布": [{"标签": str(i), "数量": constellation_map.get(i, 0)} for i in range(7)],
        "武器使用Top3": [{"标签": row["名称"] or "未知武器", "数量": int(row["数量"])} for row in weapon_rows],
        "圣遗物配装Top3": [{"标签": label, "数量": count} for label, count in combo_top3],
    }


# ── admin CRUD ──


async def log_operation(
    db: AsyncSession,
    admin_uid: str,
    action: str,
    target_uid: Optional[str] = None,
    detail: Optional[str] = None,
) -> None:
    db.add(OperationLog(admin_uid=admin_uid, action=action, target_uid=target_uid, detail=detail))


async def delete_player_all(db: AsyncSession, target_uid: str) -> None:
    """删除指定 UID 的所有数据（级联自动清理关联表）。"""
    await db.execute(delete(BaseIndex).where(BaseIndex.UID == target_uid))


async def save_character_full(
    db: AsyncSession,
    uid: str,
    character_id: str,
    level: int,
    突破等级: int,
    好感等级: int,
    命座数: int,
    attrs: Dict[str, float],
    viewer_uid: str,
) -> None:
    current_time = _now()

    char_base = await _get_one_by_keys(
        db, CharacterBaseIndex,
        [CharacterBaseIndex.UID == uid, CharacterBaseIndex.角色ID == character_id],
    )
    base_data = {"UID": uid, "角色ID": character_id, "等级": level, "突破等级": 突破等级,
                 "好感等级": 好感等级, "命座数": 命座数}
    if char_base is None:
        db.add(CharacterBaseIndex(**base_data, last_updated=current_time))
    else:
        _update_model(char_base, base_data, {"last_updated": current_time})

    char_attr = await _get_one_by_keys(
        db, CharacterAttributeIndex,
        [CharacterAttributeIndex.UID == uid, CharacterAttributeIndex.角色ID == character_id],
    )
    attr_data = {"UID": uid, "角色ID": character_id, **attrs}
    if char_attr is None:
        db.add(CharacterAttributeIndex(**attr_data, last_updated=current_time))
    else:
        _update_model(char_attr, attr_data, {"last_updated": current_time})

    await log_operation(db, viewer_uid, "SAVE_CHARACTER", uid,
                        f"角色ID={character_id} 等级={level} 命座={命座数}")


async def delete_character(db: AsyncSession, uid: str, character_id: str, viewer_uid: str) -> None:
    current_time = _now()
    await db.execute(
        delete(CharacterWeaponIndex).where(
            CharacterWeaponIndex.UID == uid, CharacterWeaponIndex.角色ID == character_id,
        )
    )
    await db.execute(
        delete(ReliquerySubStat).where(
            ReliquerySubStat.UID == uid, ReliquerySubStat.角色ID == character_id,
        )
    )
    await db.execute(
        delete(CharacterReliquery).where(
            CharacterReliquery.UID == uid, CharacterReliquery.角色ID == character_id,
        )
    )
    await db.execute(
        delete(CharacterAttributeIndex).where(
            CharacterAttributeIndex.UID == uid, CharacterAttributeIndex.角色ID == character_id,
        )
    )
    result = await db.execute(
        delete(CharacterBaseIndex).where(
            CharacterBaseIndex.UID == uid, CharacterBaseIndex.角色ID == character_id,
        ).returning(CharacterBaseIndex.角色ID)
    )
    if result.rowcount:
        await log_operation(db, viewer_uid, "DELETE_CHARACTER", uid, f"角色ID={character_id}")


async def save_weapon(
    db: AsyncSession,
    uid: str,
    character_id: str,
    weapon_id: str,
    weapon_name: str,
    等级: int,
    突破等级: int,
    精炼等级: int,
    稀有度: int,
    基础攻击力值: float,
    副属性名称: str,
    副属性数值: float,
    viewer_uid: str,
) -> None:
    current_time = _now()

    # upsert Dict_Weapon
    dict_weapon = await _get_one_by_keys(db, DictWeapon, [DictWeapon.武器ID == weapon_id])
    if dict_weapon is None:
        db.add(DictWeapon(武器ID=weapon_id, 名称=weapon_name, 稀有度=稀有度, 副属性名称=副属性名称))
    else:
        dict_weapon.名称 = weapon_name
        dict_weapon.稀有度 = 稀有度
        dict_weapon.副属性名称 = 副属性名称

    # upsert CharacterWeaponIndex
    char_weapon = await _get_one_by_keys(
        db, CharacterWeaponIndex,
        [CharacterWeaponIndex.UID == uid, CharacterWeaponIndex.角色ID == character_id],
    )
    wp_data = {"UID": uid, "角色ID": character_id, "武器ID": weapon_id,
               "等级": 等级, "突破等级": 突破等级, "精炼等级": 精炼等级,
               "基础攻击力值": 基础攻击力值, "副属性数值": 副属性数值}
    if char_weapon is None:
        db.add(CharacterWeaponIndex(**wp_data, last_updated=current_time))
    else:
        _update_model(char_weapon, wp_data, {"last_updated": current_time})

    await log_operation(db, viewer_uid, "SAVE_WEAPON", uid,
                        f"角色ID={character_id} 武器={weapon_name}")


async def delete_weapon(db: AsyncSession, uid: str, character_id: str, viewer_uid: str) -> None:
    result = await db.execute(
        delete(CharacterWeaponIndex).where(
            CharacterWeaponIndex.UID == uid, CharacterWeaponIndex.角色ID == character_id,
        ).returning(CharacterWeaponIndex.角色ID)
    )
    if result.rowcount:
        await log_operation(db, viewer_uid, "DELETE_WEAPON", uid, f"角色ID={character_id}")


async def save_relic(
    db: AsyncSession,
    uid: str,
    character_id: str,
    部位: str,
    套装名称: str,
    主属性名称: str,
    主属性数值: float,
    sub_stats: List[Dict[str, Any]],
    viewer_uid: str,
    item_id: str = "",
) -> None:
    current_time = _now()

    # upsert main relic
    relic = await _get_one_by_keys(
        db, CharacterReliquery,
        [CharacterReliquery.UID == uid, CharacterReliquery.角色ID == character_id,
         CharacterReliquery.部位 == 部位],
    )
    relic_data = {"UID": uid, "角色ID": character_id, "部位": 部位,
                  "套装名称": 套装名称, "主属性名称": 主属性名称, "主属性数值": 主属性数值,
                  "itemId": item_id or None}
    if relic is None:
        db.add(CharacterReliquery(**relic_data, last_updated=current_time))
    else:
        _update_model(relic, relic_data, {"last_updated": current_time})

    # replace sub stats
    await db.execute(
        delete(ReliquerySubStat).where(
            ReliquerySubStat.UID == uid, ReliquerySubStat.角色ID == character_id,
            ReliquerySubStat.部位 == 部位,
        )
    )
    for idx, sub in enumerate(sub_stats, start=1):
        name = sub.get("属性名称", "")
        value = sub.get("属性数值", 0)
        if not name:
            continue
        db.add(ReliquerySubStat(
            UID=uid, 角色ID=character_id, 部位=部位,
            词条序号=idx, 属性名称=name, 属性数值=value,
            last_updated=current_time,
        ))

    await log_operation(db, viewer_uid, "SAVE_RELIC", uid,
                        f"角色ID={character_id} 部位={部位}")


async def delete_relic(db: AsyncSession, uid: str, character_id: str, 部位: str, viewer_uid: str) -> None:
    await db.execute(
        delete(ReliquerySubStat).where(
            ReliquerySubStat.UID == uid, ReliquerySubStat.角色ID == character_id,
            ReliquerySubStat.部位 == 部位,
        )
    )
    result = await db.execute(
        delete(CharacterReliquery).where(
            CharacterReliquery.UID == uid, CharacterReliquery.角色ID == character_id,
            CharacterReliquery.部位 == 部位,
        ).returning(CharacterReliquery.部位)
    )
    if result.rowcount:
        await log_operation(db, viewer_uid, "DELETE_RELIC", uid,
                            f"角色ID={character_id} 部位={部位}")


# ── admin dictionary helpers ──


async def get_dict_characters(db: AsyncSession) -> List[Dict[str, Any]]:
    rows = (await db.execute(select(DictCharacter).order_by(DictCharacter.角色名称.asc()))).scalars().all()
    return [{"角色ID": r.角色ID, "角色名称": r.角色名称, "星级": r.星级} for r in rows]


async def get_dict_weapons(db: AsyncSession) -> List[Dict[str, Any]]:
    rows = (await db.execute(select(DictWeapon).order_by(DictWeapon.名称.asc()))).scalars().all()
    return [{"武器ID": r.武器ID, "名称": r.名称, "稀有度": r.稀有度, "副属性名称": r.副属性名称 or ""} for r in rows]


async def get_relic_set_names(db: AsyncSession) -> List[str]:
    rows = (await db.execute(
        select(CharacterReliquery.套装名称).distinct().where(
            CharacterReliquery.套装名称.isnot(None), CharacterReliquery.套装名称 != ""
        ).order_by(CharacterReliquery.套装名称.asc())
    )).all()
    return [row[0] for row in rows]


async def get_prop_names(db: AsyncSession) -> List[str]:
    """从 ReliquerySubStat 和 CharacterReliquery 收集所有已知属性名称。"""
    sub_rows = (await db.execute(
        select(ReliquerySubStat.属性名称).distinct().where(
            ReliquerySubStat.属性名称.isnot(None), ReliquerySubStat.属性名称 != ""
        )
    )).all()
    main_rows = (await db.execute(
        select(CharacterReliquery.主属性名称).distinct().where(
            CharacterReliquery.主属性名称.isnot(None), CharacterReliquery.主属性名称 != ""
        )
    )).all()
    merged: set[str] = set()
    for (r,) in sub_rows:
        merged.add(r)
    for (r,) in main_rows:
        merged.add(r)
    return sorted(merged)


async def get_weapon_substat_names(db: AsyncSession) -> List[str]:
    rows = (await db.execute(
        select(DictWeapon.副属性名称).distinct().where(
            DictWeapon.副属性名称.isnot(None), DictWeapon.副属性名称 != ""
        )
    )).all()
    return sorted({row[0] for row in rows})

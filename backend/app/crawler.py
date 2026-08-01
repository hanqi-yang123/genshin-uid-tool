"""Enka 数据抓取与清洗。"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Tuple

import aiohttp


APPEND_PROP_CN_MAP = {
    "FIGHT_PROP_BASE_ATTACK": "基础攻击力",
    "FIGHT_PROP_HP": "生命值",
    "FIGHT_PROP_ATTACK": "攻击力",
    "FIGHT_PROP_DEFENSE": "防御力",
    "FIGHT_PROP_HP_PERCENT": "生命值百分比",
    "FIGHT_PROP_ATTACK_PERCENT": "攻击力百分比",
    "FIGHT_PROP_DEFENSE_PERCENT": "防御力百分比",
    "FIGHT_PROP_CRITICAL": "暴击率",
    "FIGHT_PROP_CRITICAL_HURT": "暴击伤害",
    "FIGHT_PROP_CHARGE_EFFICIENCY": "元素充能效率",
    "FIGHT_PROP_HEAL_ADD": "治疗加成",
    "FIGHT_PROP_ELEMENT_MASTERY": "元素精通",
    "FIGHT_PROP_PHYSICAL_ADD_HURT": "物理伤害加成",
    "FIGHT_PROP_FIRE_ADD_HURT": "火元素伤害加成",
    "FIGHT_PROP_ELEC_ADD_HURT": "雷元素伤害加成",
    "FIGHT_PROP_WATER_ADD_HURT": "水元素伤害加成",
    "FIGHT_PROP_WIND_ADD_HURT": "风元素伤害加成",
    "FIGHT_PROP_ICE_ADD_HURT": "冰元素伤害加成",
    "FIGHT_PROP_ROCK_ADD_HURT": "岩元素伤害加成",
    "FIGHT_PROP_GRASS_ADD_HURT": "草元素伤害加成",
}

EQUIP_TYPE_MAP = {
    "EQUIP_BRACER": "生之花",
    "EQUIP_NECKLACE": "死之羽",
    "EQUIP_SHOES": "时之沙",
    "EQUIP_RING": "空之杯",
    "EQUIP_DRESS": "理之冠",
}

QUALITY_TO_STAR = {
    "QUALITY_PURPLE": 4,
    "QUALITY_ORANGE": 5,
}


def get_prop_value(prop_map: Dict[Any, Any], key: int, default: Any = 0) -> Any:
    """兼容 Enka 返回的字符串/整数键。"""
    if key in prop_map:
        return prop_map.get(key, default)
    return prop_map.get(str(key), default)


def round_one(value: Any) -> float:
    try:
        return round(float(value), 1)
    except (TypeError, ValueError):
        return 0.0


def percent_value(value: Any) -> float:
    try:
        return round(float(value) * 100, 1)
    except (TypeError, ValueError):
        return 0.0


def get_avatar_prop_int(prop_map: Dict[str, Any], key: str, default: int = 0) -> int:
    prop = prop_map.get(key, {})
    if not isinstance(prop, dict):
        return default
    raw = prop.get("ival", prop.get("val", default))
    try:
        return int(raw)
    except (TypeError, ValueError):
        return default


async def fetch_user_data(uid: str) -> dict:
    """从 Enka Network API 获取用户数据。"""
    url = f"https://enka.network/api/uid/{uid}"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status != 200:
                raise Exception(f"获取数据失败: {response.status}")
            return await response.json()


def _resource_root() -> Path:
    return Path(__file__).resolve().parents[2] / "resources"


def _read_json_if_exists(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def _extract_locale_map(payload: Dict[str, Any], locale: str) -> Dict[str, Any]:
    value = payload.get(locale, {})
    return value if isinstance(value, dict) else {}


def load_localization_data() -> Tuple[Dict[str, Any], Dict[str, Any], Dict[str, Any], Dict[str, Any]]:
    """加载本地化数据。"""
    resource_root = _resource_root()

    text_map_path = resource_root / "TextMapCHS.json"
    characters_path = resource_root / "avatars.json"
    zh_cn_path = resource_root / "zh-cn.json"
    locs_path = resource_root / "locs.json"
    id_name_path = resource_root / "id_name.json"

    text_map = _read_json_if_exists(text_map_path)
    zh_cn_map = _extract_locale_map(_read_json_if_exists(zh_cn_path), "zh-cn")
    locs_payload = _read_json_if_exists(locs_path)
    loc_zh_map = _extract_locale_map(locs_payload, "zh-cn")
    for k, v in loc_zh_map.items():
        if k not in zh_cn_map:
            zh_cn_map[k] = v
    characters_data = _read_json_if_exists(characters_path)
    id_name_map = _read_json_if_exists(id_name_path)
    return text_map, zh_cn_map, {}, characters_data, id_name_map


def get_zh_name(hash_value: Any, text_map: Dict[str, str], zh_cn_map: Dict[str, str], id_name_map: Dict[str, str] | None = None) -> str:
    """从哈希值获取中文名称。"""
    if isinstance(hash_value, str) and hash_value in APPEND_PROP_CN_MAP:
        return APPEND_PROP_CN_MAP[hash_value]

    hash_str = str(hash_value)
    if hash_str in text_map:
        return text_map[hash_str]

    prefix = hash_str[:5]
    if prefix:
        for key, value in zh_cn_map.items():
            if isinstance(key, str) and key.startswith(prefix):
                return value

    if hash_str in zh_cn_map:
        return zh_cn_map[hash_str]

    if id_name_map and hash_str in id_name_map:
        return id_name_map[hash_str]

    return hash_str


def is_unresolved_name(value: Any) -> bool:
    if value is None:
        return True
    text = str(value).strip()
    return text == "" or text.isdigit() or text.lower() == "none"


def get_display_name(
    hash_value: Any,
    text_map: Dict[str, str],
    zh_cn_map: Dict[str, str],
    fallback: str,
    id_name_map: Dict[str, str] | None = None,
    en_map: Dict[str, str] | None = None,
) -> str:
    resolved = get_zh_name(hash_value, text_map, zh_cn_map, id_name_map)
    if is_unresolved_name(resolved) and en_map:
        resolved = en_map.get(str(hash_value), resolved)
    if is_unresolved_name(resolved):
        return fallback
    return resolved


def humanize_asset_name(raw_name: str, default: str) -> str:
    text = str(raw_name or "").strip()
    if not text:
        return default
    for prefix in ("UI_EquipIcon_", "UI_RelicIcon_", "Eff_UI_RelicIcon_"):
        if text.startswith(prefix):
            text = text[len(prefix):]
            break
    text = text.replace("_", " ").strip()
    return text or default


def get_character_star(char_info: Dict[str, Any]) -> int | None:
    quality_type = char_info.get("QualityType")
    return QUALITY_TO_STAR.get(quality_type)


def process_avatar_data(
    avatar_data: dict,
    text_map: dict,
    zh_cn_map: dict,
    en_map: dict,
    characters_data: dict,
    id_name_map: dict,
) -> dict:
    """处理角色数据。"""
    processed: Dict[str, Any] = {}
    avatar_id = str(avatar_data.get("avatarId"))
    char_info = characters_data.get(avatar_id, {}) if isinstance(characters_data, dict) else {}

    name_hash = char_info.get("NameTextMapHash")
    if name_hash is not None:
        resolved_name = get_zh_name(name_hash, text_map, zh_cn_map, id_name_map)
    else:
        resolved_name = avatar_id
    if resolved_name == str(name_hash) or resolved_name == avatar_id:
        resolved_name = id_name_map.get(avatar_id, f"角色ID: {avatar_id}")
    processed["角色名称"] = resolved_name
    processed["星级"] = get_character_star(char_info)

    avatar_prop_map = avatar_data.get("propMap", {})
    processed["等级"] = get_avatar_prop_int(avatar_prop_map, "4001", 0)
    processed["突破等级"] = get_avatar_prop_int(avatar_prop_map, "1002", 0)
    processed["好感等级"] = avatar_data.get("fetterInfo", {}).get("expLevel", 0)
    processed["命座数"] = len(avatar_data.get("talentIdList", []) or [])

    fight_prop_map = avatar_data.get("fightPropMap", {})
    processed["最大生命值"] = round_one(get_prop_value(fight_prop_map, 2000, 0))
    processed["当前攻击力"] = round_one(get_prop_value(fight_prop_map, 2001, 0))
    processed["当前防御力"] = round_one(get_prop_value(fight_prop_map, 2002, 0))
    processed["暴击率"] = percent_value(get_prop_value(fight_prop_map, 20, 0))
    processed["暴击伤害"] = percent_value(get_prop_value(fight_prop_map, 22, 0))
    processed["元素精通"] = round_one(get_prop_value(fight_prop_map, 28, 0))
    processed["元素充能效率"] = percent_value(get_prop_value(fight_prop_map, 23, 0))

    weapon = {
        "武器ID": "",
        "名称": "",
        "等级": 0,
        "突破等级": 0,
        "精炼等级": 0,
        "稀有度": 0,
        "基础攻击力值": 0.0,
        "副属性名称": "",
        "副属性数值": 0.0,
    }
    relics = []

    for equip in avatar_data.get("equipList", []):
        flat = equip.get("flat", {})
        item_type = flat.get("itemType")

        if item_type == "ITEM_WEAPON":
            weapon_data = equip.get("weapon", {})
            weapon["武器ID"] = str(equip.get("itemId") or flat.get("id") or flat.get("nameTextMapHash") or "")
            weapon["名称"] = get_display_name(
                flat.get("nameTextMapHash", 0),
                text_map,
                zh_cn_map,
                humanize_asset_name(flat.get("icon", ""), "未知武器"),
                en_map=en_map,
            )
            weapon["等级"] = int(weapon_data.get("level", equip.get("level", 0)) or 0)
            weapon["突破等级"] = int(weapon_data.get("promoteLevel", equip.get("promoteLevel", 0)) or 0)
            affix_map = weapon_data.get("affixMap", {}) or equip.get("affixMap", {})
            weapon["精炼等级"] = max(affix_map.values()) + 1 if affix_map else 0
            weapon["稀有度"] = int(flat.get("rankLevel", 0) or 0)

            for stat in flat.get("weaponStats", []):
                append_prop_id = stat.get("appendPropId", "")
                stat_value = stat.get("statValue", 0)
                if append_prop_id == "FIGHT_PROP_BASE_ATTACK":
                    weapon["基础攻击力值"] = round_one(stat_value)
                elif append_prop_id:
                    weapon["副属性名称"] = get_zh_name(append_prop_id, text_map, zh_cn_map)
                    weapon["副属性数值"] = round_one(stat_value)

        if item_type == "ITEM_RELIQUARY":
            reliquary_mainstat = flat.get("reliquaryMainstat", {})
            reliquary_substats = flat.get("reliquarySubstats", [])
            relic = {
                "itemId": str(equip.get("itemId") or flat.get("id") or ""),
                "部位": EQUIP_TYPE_MAP.get(flat.get("equipType", ""), flat.get("equipType", "")),
                "套装名称": get_display_name(
                    flat.get("setNameTextMapHash", 0),
                    text_map,
                    zh_cn_map,
                    "未知套装",
                    en_map=en_map,
                ),
                "主属性名称": get_zh_name(reliquary_mainstat.get("mainPropId", 0), text_map, zh_cn_map),
                "主属性数值": round_one(reliquary_mainstat.get("statValue", 0)),
                "副属性1名称": "",
                "副属性2名称": "",
                "副属性3名称": "",
                "副属性4名称": "",
                "副属性1数值": 0,
                "副属性2数值": 0,
                "副属性3数值": 0,
                "副属性4数值": 0,
            }
            for index, sub_stat in enumerate(reliquary_substats[:4], start=1):
                relic[f"副属性{index}名称"] = get_zh_name(sub_stat.get("appendPropId", 0), text_map, zh_cn_map)
                relic[f"副属性{index}数值"] = round_one(sub_stat.get("statValue", 0))
            relics.append(relic)

    processed["武器"] = weapon
    processed["圣遗物"] = relics
    return processed


async def fetch_genshin_user_data(uid: str) -> dict:
    """抓取并整理用户完整数据。"""
    text_map, zh_cn_map, en_map, characters_data, id_name_map = load_localization_data()
    user_data = await fetch_user_data(uid)

    result = {
        "base": {
            "UID": uid,
            "昵称": user_data.get("playerInfo", {}).get("nickname", ""),
            "等级": user_data.get("playerInfo", {}).get("level", 0),
            "签名": user_data.get("playerInfo", {}).get("signature", ""),
            "世界等级": user_data.get("playerInfo", {}).get("worldLevel", 0),
            "成就数量": user_data.get("playerInfo", {}).get("finishAchievementNum", 0),
            "满好感角色数量": user_data.get("playerInfo", {}).get("fetterCount", 0),
            "nameCardId": user_data.get("playerInfo", {}).get("nameCardId", 0),
        },
        "abyss": {
            "UID": uid,
            "最深层数": user_data.get("playerInfo", {}).get("towerFloorIndex", 0),
            "最深房间": user_data.get("playerInfo", {}).get("towerLevelIndex", 0),
            "获取渊星数": user_data.get("playerInfo", {}).get("towerStarIndex", 0),
            "幕数": user_data.get("playerInfo", {}).get("theaterActIndex", 0),
            "星章数": user_data.get("playerInfo", {}).get("theaterStarIndex", 0),
            "危战层数": user_data.get("playerInfo", {}).get("stygianIndex", 0),
            "秒数": user_data.get("playerInfo", {}).get("stygianSeconds", 0),
        },
        "characters": [],
    }

    for avatar in user_data.get("avatarInfoList", []):
        processed_avatar = process_avatar_data(avatar, text_map, zh_cn_map, en_map, characters_data, id_name_map)
        character_id = str(avatar.get("avatarId"))

        character_data = {
            "base": {
                "UID": uid,
                "角色ID": character_id,
                "角色名称": processed_avatar.get("角色名称"),
                "星级": processed_avatar.get("星级"),
                "等级": processed_avatar.get("等级"),
                "突破等级": processed_avatar.get("突破等级"),
                "好感等级": processed_avatar.get("好感等级"),
                "命座数": processed_avatar.get("命座数", 0),
            },
            "attributes": {
                "UID": uid,
                "角色ID": character_id,
                "最大生命值": processed_avatar.get("最大生命值"),
                "当前攻击力": processed_avatar.get("当前攻击力"),
                "当前防御力": processed_avatar.get("当前防御力"),
                "暴击率": processed_avatar.get("暴击率"),
                "暴击伤害": processed_avatar.get("暴击伤害"),
                "元素精通": processed_avatar.get("元素精通"),
                "元素充能效率": processed_avatar.get("元素充能效率"),
            },
            "weapon": {
                "UID": uid,
                "角色ID": character_id,
                "武器ID": processed_avatar.get("武器", {}).get("武器ID"),
                "名称": processed_avatar.get("武器", {}).get("名称"),
                "等级": processed_avatar.get("武器", {}).get("等级"),
                "突破等级": processed_avatar.get("武器", {}).get("突破等级"),
                "精炼等级": processed_avatar.get("武器", {}).get("精炼等级"),
                "稀有度": processed_avatar.get("武器", {}).get("稀有度"),
                "基础攻击力值": processed_avatar.get("武器", {}).get("基础攻击力值"),
                "副属性名称": processed_avatar.get("武器", {}).get("副属性名称"),
                "副属性数值": processed_avatar.get("武器", {}).get("副属性数值"),
            },
            "relics": [],
        }

        for relic in processed_avatar.get("圣遗物", []):
            character_data["relics"].append(
                {
                    "UID": uid,
                    "角色ID": character_id,
                    "itemId": relic.get("itemId"),
                    "部位": relic.get("部位"),
                    "套装名称": relic.get("套装名称"),
                    "主属性名称": relic.get("主属性名称"),
                    "主属性数值": relic.get("主属性数值"),
                    "副属性1名称": relic.get("副属性1名称"),
                    "副属性2名称": relic.get("副属性2名称"),
                    "副属性3名称": relic.get("副属性3名称"),
                    "副属性4名称": relic.get("副属性4名称"),
                    "副属性1数值": relic.get("副属性1数值"),
                    "副属性2数值": relic.get("副属性2数值"),
                    "副属性3数值": relic.get("副属性3数值"),
                    "副属性4数值": relic.get("副属性4数值"),
                }
            )

        result["characters"].append(character_data)

    return result

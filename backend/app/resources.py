"""加载资源文件并提供图标查找功能。"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

ENKA_CDN = "https://enka.network"

_resource_root: Optional[Path] = None
_avatars: Dict[str, Any] = {}
_weapons: Dict[str, Any] = {}
_relics: Dict[str, Any] = {}
_namecards: Dict[str, Any] = {}


def _get_resource_root() -> Path:
    global _resource_root
    if _resource_root is None:
        _resource_root = Path(__file__).resolve().parents[2] / "resources"
    return _resource_root


def _load_json(filename: str) -> Dict[str, Any]:
    path = _get_resource_root() / filename
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def load_all() -> None:
    global _avatars, _weapons, _relics, _namecards
    _avatars = _load_json("avatars.json")
    _weapons = _load_json("weapons.json")
    _relics = _load_json("relics.json")
    _namecards = _load_json("namecards.json")


def get_avatar_icon(avatar_id: str) -> str:
    """获取角色头像图标 URL。"""
    info = _avatars.get(avatar_id, {})
    side_icon = info.get("SideIconName", "")
    if side_icon:
        icon = side_icon.replace("_Side", "")
        return f"{ENKA_CDN}{icon}"
    return ""


def get_constellation_icons(avatar_id: str) -> List[str]:
    """获取命之座图标 URL 列表（6个）。"""
    info = _avatars.get(avatar_id, {})
    consts = info.get("Consts", [])
    return [f"{ENKA_CDN}{path}" for path in consts] if consts else []


def get_weapon_icon(weapon_id: str) -> str:
    """获取武器图标 URL。"""
    info = _weapons.get(weapon_id, {})
    icon = info.get("Icon", "")
    return f"{ENKA_CDN}{icon}" if icon else ""


def get_relic_icon(item_id: str) -> str:
    """获取圣遗物图标 URL。"""
    items = _relics.get("Items", {})
    info = items.get(item_id, {})
    icon = info.get("Icon", "")
    return f"{ENKA_CDN}{icon}" if icon else ""


def get_namecard_icon(namecard_id: int) -> str:
    """获取名片图标 URL。"""
    info = _namecards.get(str(namecard_id), {})
    icon = info.get("Icon", "")
    return f"{ENKA_CDN}{icon}" if icon else ""


def enrich_player_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """为玩家数据添加图标信息。"""
    namecard_id = data.get("base", {}).get("nameCardId", 0)
    if namecard_id:
        data["base"]["名片图标"] = get_namecard_icon(namecard_id)

    for character in data.get("characters", []):
        char_id = character.get("base", {}).get("角色ID", "")
        if char_id:
            character["base"]["角色头像"] = get_avatar_icon(char_id)
            character["base"]["命之座图标"] = get_constellation_icons(char_id)

        weapon_id = character.get("weapon", {}).get("武器ID", "")
        if weapon_id:
            character["weapon"]["图标"] = get_weapon_icon(weapon_id)

        for relic in character.get("relics", []):
            item_id = relic.get("itemId", "")
            if item_id:
                relic["图标"] = get_relic_icon(item_id)

    return data

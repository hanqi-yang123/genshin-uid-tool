"""Pydantic 模型。"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_serializer


class UIDRequest(BaseModel):
    uid: str = Field(..., pattern=r"^\d{9}$")
    viewer_uid: Optional[str] = Field(default=None, pattern=r"^\d{9}$")


class GrantAdminRequest(BaseModel):
    viewer_uid: str = Field(..., pattern=r"^\d{9}$")
    target_uid: str = Field(..., pattern=r"^\d{9}$")


class BaseResponse(BaseModel):
    success: bool
    message: str = ""
    data: Optional[Any] = None


class _TimeSerializerModel(BaseModel):
    @field_serializer("last_updated", "最近更新时间", "created_at", when_used="json-unless-none", check_fields=False)
    def serialize_datetime(self, value: Optional[datetime]):
        if value is None:
            return None
        return value.strftime("%Y-%m-%d %H:%M")


class SessionInfoModel(BaseModel):
    uid: str
    is_admin: bool


class BaseIndexModel(_TimeSerializerModel):
    UID: str
    昵称: str
    等级: int
    签名: str
    世界等级: int
    成就数量: int
    满好感角色数量: int
    last_updated: Optional[datetime] = None


class AbyssIndexModel(_TimeSerializerModel):
    UID: str
    最深层数: int
    最深房间: int
    获取渊星数: int
    幕数: int
    星章数: int
    危战层数: int
    秒数: int
    last_updated: Optional[datetime] = None


class CharacterBaseIndexModel(_TimeSerializerModel):
    UID: str
    角色ID: str
    角色名称: str
    等级: int
    突破等级: int
    好感等级: int
    命座数: int
    last_updated: Optional[datetime] = None


class CharacterAttributeIndexModel(_TimeSerializerModel):
    UID: str
    角色ID: str
    最大生命值: float
    当前攻击力: float
    当前防御力: float
    暴击率: float
    暴击伤害: float
    元素精通: float
    元素充能效率: float
    last_updated: Optional[datetime] = None


class CharacterReliqueryIndexModel(_TimeSerializerModel):
    UID: str
    角色ID: str
    部位: str
    套装名称: str
    主属性名称: str
    副属性1名称: str
    副属性2名称: str
    副属性3名称: str
    副属性4名称: str
    主属性数值: float
    副属性1数值: float
    副属性2数值: float
    副属性3数值: float
    副属性4数值: float
    last_updated: Optional[datetime] = None


class CharacterWeaponIndexModel(_TimeSerializerModel):
    UID: str
    角色ID: str
    名称: str
    等级: int
    突破等级: int
    精炼等级: int
    稀有度: int
    基础攻击力值: float
    副属性名称: str
    副属性数值: float
    last_updated: Optional[datetime] = None


class CharacterDataModel(BaseModel):
    base: CharacterBaseIndexModel
    attributes: CharacterAttributeIndexModel
    weapon: CharacterWeaponIndexModel
    relics: List[CharacterReliqueryIndexModel]


class PlayerDataModel(BaseModel):
    base: BaseIndexModel
    abyss: AbyssIndexModel
    characters: List[CharacterDataModel]


class HistoryItemModel(_TimeSerializerModel):
    UID: str
    昵称: str
    等级: int
    last_updated: Optional[datetime] = None


class AnalysisSummaryModel(_TimeSerializerModel):
    角色数量: int
    平均等级: float
    平均命座数: float
    最近更新时间: Optional[datetime] = None


class AnalysisResultModel(BaseModel):
    summary: AnalysisSummaryModel
    角色等级分布: List[Dict[str, Any]]
    命座分布: List[Dict[str, Any]]
    武器稀有度统计: List[Dict[str, Any]]
    圣遗物套装统计: List[Dict[str, Any]]


class GlobalPlayerStatsModel(BaseModel):
    最深层数分布: List[Dict[str, Any]]
    星章数分布: List[Dict[str, Any]]
    危战层数分布: List[Dict[str, Any]]


class CharacterOptionModel(BaseModel):
    角色ID: str
    角色名称: str


class GlobalCharacterStatsModel(BaseModel):
    角色ID: str
    角色名称: str
    持有率: float
    平均等级: float
    命座分布: List[Dict[str, Any]]
    武器使用Top3: List[Dict[str, Any]]
    圣遗物配装Top3: List[Dict[str, Any]]


# ── admin CRUD request models ──

class AdminOpRequest(BaseModel):
    viewer_uid: str = Field(..., pattern=r"^\d{9}$")


class CharacterEditRequest(AdminOpRequest):
    uid: str = Field(..., pattern=r"^\d{9}$")
    角色ID: str
    等级: int = Field(default=1, ge=1, le=90)
    突破等级: int = Field(default=0, ge=0, le=6)
    好感等级: int = Field(default=0, ge=0, le=10)
    命座数: int = Field(default=0, ge=0, le=6)
    最大生命值: float = 0
    当前攻击力: float = 0
    当前防御力: float = 0
    暴击率: float = 0
    暴击伤害: float = 0
    元素精通: float = 0
    元素充能效率: float = 0


class CharacterDeleteRequest(AdminOpRequest):
    uid: str = Field(..., pattern=r"^\d{9}$")
    角色ID: str


class WeaponEditRequest(AdminOpRequest):
    uid: str = Field(..., pattern=r"^\d{9}$")
    角色ID: str
    武器ID: str = ""
    等级: int = Field(default=1, ge=0, le=90)
    突破等级: int = Field(default=0, ge=0, le=6)
    精炼等级: int = Field(default=1, ge=1, le=5)
    稀有度: int = Field(default=3, ge=3, le=5)
    基础攻击力值: float = 0
    副属性名称: str = ""
    副属性数值: float = 0


class WeaponDeleteRequest(AdminOpRequest):
    uid: str = Field(..., pattern=r"^\d{9}$")
    角色ID: str


class RelicEditRequest(AdminOpRequest):
    uid: str = Field(..., pattern=r"^\d{9}$")
    角色ID: str
    部位: str
    套装名称: str = ""
    主属性名称: str = ""
    主属性数值: float = 0
    itemId: str = ""
    副属性1名称: str = ""
    副属性2名称: str = ""
    副属性3名称: str = ""
    副属性4名称: str = ""
    副属性1数值: float = 0
    副属性2数值: float = 0
    副属性3数值: float = 0
    副属性4数值: float = 0


class RelicDeleteRequest(AdminOpRequest):
    uid: str = Field(..., pattern=r"^\d{9}$")
    角色ID: str
    部位: str


class DeletePlayerRequest(AdminOpRequest):
    target_uid: str = Field(..., pattern=r"^\d{9}$")

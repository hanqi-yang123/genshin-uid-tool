export interface BaseResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface SessionInfo {
  uid: string;
  is_admin: boolean;
}

export interface BaseIndex {
  UID: string;
  昵称: string;
  等级: number;
  签名: string;
  世界等级: number;
  成就数量: number;
  满好感角色数量: number;
  nameCardId?: number;
  名片图标?: string;
  last_updated?: string | null;
}

export interface AbyssIndex {
  UID: string;
  最深层数: number;
  最深房间: number;
  获取渊星数: number;
  幕数: number;
  星章数: number;
  危战层数: number;
  秒数: number;
  last_updated?: string | null;
}

export interface CharacterBaseIndex {
  UID: string;
  角色ID: string;
  角色名称: string;
  等级: number;
  突破等级: number;
  好感等级: number;
  命座数: number;
  角色头像?: string;
  命之座图标?: string[];
  last_updated?: string | null;
}

export interface CharacterAttributeIndex {
  UID: string;
  角色ID: string;
  最大生命值: number;
  当前攻击力: number;
  当前防御力: number;
  暴击率: number;
  暴击伤害: number;
  元素精通: number;
  元素充能效率: number;
  last_updated?: string | null;
}

export interface CharacterReliqueryIndex {
  UID: string;
  角色ID: string;
  部位: string;
  套装名称: string;
  主属性名称: string;
  副属性1名称: string;
  副属性2名称: string;
  副属性3名称: string;
  副属性4名称: string;
  主属性数值: number;
  副属性1数值: number;
  副属性2数值: number;
  副属性3数值: number;
  副属性4数值: number;
  itemId?: string;
  图标?: string;
  last_updated?: string | null;
}

export interface CharacterWeaponIndex {
  UID: string;
  角色ID: string;
  武器ID: string;
  名称: string;
  等级: number;
  突破等级: number;
  精炼等级: number;
  稀有度: number;
  基础攻击力值: number;
  副属性名称: string;
  副属性数值: number;
  图标?: string;
  last_updated?: string | null;
}

export interface CharacterData {
  base: CharacterBaseIndex;
  attributes: CharacterAttributeIndex;
  weapon: CharacterWeaponIndex;
  relics: CharacterReliqueryIndex[];
}

export interface PlayerData {
  base: BaseIndex;
  abyss: AbyssIndex;
  characters: CharacterData[];
}

export interface HistoryItem {
  UID: string;
  昵称: string;
  等级: number;
  last_updated?: string | null;
}

export interface AnalysisSummary {
  角色数量: number;
  平均等级: number;
  平均命座数: number;
  最近更新时间?: string | null;
}

export interface DistributionItem {
  标签?: string;
  等级?: number;
  命座?: number;
  稀有度?: number;
  套装名称?: string;
  数量: number;
}

export interface AnalysisData {
  summary: AnalysisSummary;
  角色等级分布: DistributionItem[];
  命座分布: DistributionItem[];
  武器稀有度统计: DistributionItem[];
  圣遗物套装统计: DistributionItem[];
}

export interface GlobalPlayerStats {
  最深层数分布: DistributionItem[];
  星章数分布: DistributionItem[];
  危战层数分布: DistributionItem[];
}

export interface CharacterOption {
  角色ID: string;
  角色名称: string;
}

export interface GlobalCharacterStats {
  角色ID: string;
  角色名称: string;
  持有率: number;
  平均等级: number;
  命座分布: DistributionItem[];
  武器使用Top3: DistributionItem[];
  圣遗物配装Top3: DistributionItem[];
}

// ── admin CRUD types ──

export interface DictCharacterFull {
  角色ID: string;
  角色名称: string;
  星级?: number | null;
}

export interface DictWeaponFull {
  武器ID: string;
  名称: string;
  稀有度: number;
  副属性名称: string;
}

export interface CharacterEditData {
  角色ID: string;
  等级: number;
  突破等级: number;
  好感等级: number;
  命座数: number;
  最大生命值: number;
  当前攻击力: number;
  当前防御力: number;
  暴击率: number;
  暴击伤害: number;
  元素精通: number;
  元素充能效率: number;
}

export interface WeaponEditData {
  武器ID: string;
  武器名称: string;
  等级: number;
  突破等级: number;
  精炼等级: number;
  稀有度: number;
  基础攻击力值: number;
  副属性名称: string;
  副属性数值: number;
}

export interface RelicEditData {
  部位: string;
  套装名称: string;
  主属性名称: string;
  主属性数值: number;
  副属性1名称: string;
  副属性2名称: string;
  副属性3名称: string;
  副属性4名称: string;
  副属性1数值: number;
  副属性2数值: number;
  副属性3数值: number;
  副属性4数值: number;
}

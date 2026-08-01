"""数据库模型定义。"""

from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    ForeignKeyConstraint,
    Integer,
    PrimaryKeyConstraint,
    String,
)
from sqlalchemy.orm import relationship

from .database import Base


class Controller(Base):
    """管理员 UID 控制表。"""

    __tablename__ = "CONTROLER"

    UID = Column(String, primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class BaseIndex(Base):
    __tablename__ = "BaseIndex"

    UID = Column(String, primary_key=True, index=True)
    昵称 = Column(String)
    等级 = Column(Integer)
    签名 = Column(String)
    世界等级 = Column(Integer)
    成就数量 = Column(Integer)
    满好感角色数量 = Column(Integer)
    nameCardId = Column(Integer, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow, nullable=False)


class AbyssIndex(Base):
    __tablename__ = "AbyssIndex"

    UID = Column(String, ForeignKey("BaseIndex.UID", ondelete="CASCADE"), primary_key=True, index=True)
    最深层数 = Column(Integer)
    最深房间 = Column(Integer)
    获取渊星数 = Column(Integer)
    幕数 = Column(Integer)
    星章数 = Column(Integer)
    危战层数 = Column(Integer)
    秒数 = Column(Integer)
    last_updated = Column(DateTime, default=datetime.utcnow, nullable=False)


class DictCharacter(Base):
    __tablename__ = "Dict_Character"

    角色ID = Column(String, primary_key=True)
    角色名称 = Column(String, nullable=False)
    星级 = Column(Integer, nullable=True)


class DictWeapon(Base):
    __tablename__ = "Dict_Weapon"

    武器ID = Column(String, primary_key=True)
    名称 = Column(String, nullable=False)
    稀有度 = Column(Integer, nullable=True)
    副属性名称 = Column(String, nullable=True)


class CharacterBaseIndex(Base):
    __tablename__ = "CharacterBaseIndex"

    UID = Column(String)
    角色ID = Column(String, ForeignKey("Dict_Character.角色ID"))
    等级 = Column(Integer)
    突破等级 = Column(Integer)
    好感等级 = Column(Integer)
    命座数 = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint("UID", "角色ID"),
        ForeignKeyConstraint(["UID"], ["BaseIndex.UID"], ondelete="CASCADE"),
    )

    角色字典 = relationship("DictCharacter")


class CharacterAttributeIndex(Base):
    __tablename__ = "CharacterAttributeIndex"

    UID = Column(String)
    角色ID = Column(String)
    最大生命值 = Column(Float)
    当前攻击力 = Column(Float)
    当前防御力 = Column(Float)
    暴击率 = Column(Float)
    暴击伤害 = Column(Float)
    元素精通 = Column(Float)
    元素充能效率 = Column(Float)
    last_updated = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint("UID", "角色ID"),
        ForeignKeyConstraint(
            ["UID", "角色ID"],
            ["CharacterBaseIndex.UID", "CharacterBaseIndex.角色ID"],
            ondelete="CASCADE",
        ),
    )


class CharacterWeaponIndex(Base):
    __tablename__ = "CharacterWeaponIndex"

    UID = Column(String)
    角色ID = Column(String)
    武器ID = Column(String, ForeignKey("Dict_Weapon.武器ID"))
    等级 = Column(Integer)
    突破等级 = Column(Integer)
    精炼等级 = Column(Integer)
    基础攻击力值 = Column(Float)
    副属性数值 = Column(Float)
    last_updated = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint("UID", "角色ID"),
        ForeignKeyConstraint(
            ["UID", "角色ID"],
            ["CharacterBaseIndex.UID", "CharacterBaseIndex.角色ID"],
            ondelete="CASCADE",
        ),
    )

    武器字典 = relationship("DictWeapon")


class CharacterReliquery(Base):
    __tablename__ = "CharacterReliquery"

    UID = Column(String)
    角色ID = Column(String)
    部位 = Column(String)
    套装名称 = Column(String)
    主属性名称 = Column(String)
    主属性数值 = Column(Float)
    itemId = Column(String, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint("UID", "角色ID", "部位"),
        ForeignKeyConstraint(
            ["UID", "角色ID"],
            ["CharacterBaseIndex.UID", "CharacterBaseIndex.角色ID"],
            ondelete="CASCADE",
        ),
    )


class OperationLog(Base):
    """操作日志表。"""

    __tablename__ = "OperationLog"

    id = Column(Integer, primary_key=True, autoincrement=True)
    admin_uid = Column(String, nullable=False)
    action = Column(String, nullable=False)
    target_uid = Column(String, nullable=True)
    detail = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class ReliquerySubStat(Base):
    __tablename__ = "ReliquerySubStat"

    UID = Column(String)
    角色ID = Column(String)
    部位 = Column(String)
    词条序号 = Column(Integer)
    属性名称 = Column(String)
    属性数值 = Column(Float)
    last_updated = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint("UID", "角色ID", "部位", "词条序号"),
        ForeignKeyConstraint(
            ["UID", "角色ID", "部位"],
            ["CharacterReliquery.UID", "CharacterReliquery.角色ID", "CharacterReliquery.部位"],
            ondelete="CASCADE",
        ),
    )

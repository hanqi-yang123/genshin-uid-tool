import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Gem, Shield, Stars, Sword, Trash2, Edit3, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import DataTable from './DataTable';
import RelicEditModal from './RelicEditModal';
import WeaponEditModal from './WeaponEditModal';
import { adminDeleteCharacter, adminDeleteRelic, adminDeleteWeapon } from '../lib/api';
import { CharacterData, CharacterReliqueryIndex } from '../types';

interface CharacterDetailProps {
  character: CharacterData;
  viewerUid: string;
  targetUid: string;
  isAdmin: boolean;
  onCharacterChanged: () => void;
}

const RELIC_SLOTS = ['生之花', '死之羽', '时之沙', '空之杯', '理之冠'];

const renderRelicSubStats = (relic: CharacterReliqueryIndex) => {
  const subStats = [
    { name: relic.副属性1名称, value: relic.副属性1数值 },
    { name: relic.副属性2名称, value: relic.副属性2数值 },
    { name: relic.副属性3名称, value: relic.副属性3数值 },
    { name: relic.副属性4名称, value: relic.副属性4数值 },
  ].filter((item) => item.name);

  if (subStats.length === 0) {
    return <p className="text-xs text-slate-500">暂无副属性数据</p>;
  }

  return (
    <div className="space-y-2">
      {subStats.map((item, index) => (
        <div
          key={`${item.name}-${index}`}
          className="flex items-center justify-between rounded-xl bg-white/75 px-3 py-2 text-xs text-slate-600 shadow-sm"
        >
          <span>{item.name}</span>
          <span className="font-semibold text-slate-800">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

const CharacterDetail: React.FC<CharacterDetailProps> = ({ character, viewerUid, targetUid, isAdmin, onCharacterChanged }) => {
  const [expanded, setExpanded] = useState(false);
  const [showWeaponModal, setShowWeaponModal] = useState(false);
  const [showRelicModal, setShowRelicModal] = useState<string | null>(null); // slot name
  const relicCount = useMemo(() => character.relics.length, [character.relics.length]);

  const hasWeapon = character.weapon.名称 && character.weapon.名称 !== '未知武器';

  const handleDeleteChar = async () => {
    if (!confirm(`确定删除角色「${character.base.角色名称}」？此操作不可撤销。`)) return;
    try {
      const res = await adminDeleteCharacter(viewerUid, targetUid, character.base.角色ID);
      if (res.success) {
        toast.success('角色已删除');
        onCharacterChanged();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleDeleteWeapon = async () => {
    if (!confirm('确定删除该角色的武器？')) return;
    try {
      const res = await adminDeleteWeapon(viewerUid, targetUid, character.base.角色ID);
      if (res.success) {
        toast.success('武器已删除');
        onCharacterChanged();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleDeleteRelic = async (slot: string) => {
    if (!confirm(`确定删除「${slot}」圣遗物？`)) return;
    try {
      const res = await adminDeleteRelic(viewerUid, targetUid, character.base.角色ID, slot);
      if (res.success) {
        toast.success('圣遗物已删除');
        onCharacterChanged();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  // which relic slots are free?
  const usedSlots = new Set(character.relics.map(r => r.部位));
  const freeSlots = RELIC_SLOTS.filter(s => !usedSlots.has(s));

  return (
    <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-blue-100/50 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full bg-gradient-to-r from-blue-50/95 via-white to-amber-50/70 p-5 text-left transition-all duration-300 hover:from-blue-100/95 hover:to-amber-100/60 md:p-6"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            {/* 角色头像 */}
            {character.base.角色头像 && (
              <div className="flex-shrink-0">
                <img
                  src={character.base.角色头像}
                  alt={character.base.角色名称}
                  className="h-16 w-16 rounded-2xl border-2 border-blue-200 bg-blue-100 object-cover shadow-lg md:h-20 md:w-20"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xl font-extrabold text-slate-900">{character.base.角色名称}</span>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  角色 ID {character.base.角色ID}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                <span className="rounded-full bg-blue-100/80 px-3 py-1">等级 {character.base.等级}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">突破 {character.base.突破等级}</span>
                <span className="rounded-full bg-emerald-100/80 px-3 py-1">好感 {character.base.好感等级}</span>
                <span className="rounded-full bg-violet-100/80 px-3 py-1">命座 {character.base.命座数}</span>
                <span className="rounded-full bg-amber-100/80 px-3 py-1">圣遗物 {relicCount} 件</span>
              </div>
              {/* 命之座 */}
              {character.base.命之座图标 && character.base.命之座图标.length > 0 && (
                <div className="flex items-center gap-1">
                  {character.base.命之座图标.map((icon, i) => (
                    <img
                      key={i}
                      src={icon}
                      alt={`命座${i + 1}`}
                      className={`h-6 w-6 transition-all duration-300 ${
                        i < (character.base.命座数 || 0) ? 'opacity-100 brightness-100' : 'opacity-20 brightness-0'
                      }`}
                      title={`命座 ${i + 1}`}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            {isAdmin && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleDeleteChar(); }}
                className="rounded-full bg-red-500 p-2 text-white hover:bg-red-600"
                title="删除角色"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <div className="flex items-center gap-3 rounded-full bg-blue-950 px-4 py-2 text-sm font-semibold text-white">
              <span>{expanded ? '收起详情' : '展开详情'}</span>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="space-y-6 border-t border-blue-100/80 bg-gradient-to-b from-white to-blue-50/35 p-5 transition-all duration-300 md:p-6">
          {/* ── 属性面板 ── */}
          <div className="rounded-3xl border border-blue-100/80 bg-white/95 p-5 shadow-xl shadow-blue-100/40">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-3 text-lg font-bold text-blue-900">
                <Shield className="h-5 w-5 text-amber-500" />
                属性面板
              </h3>
            </div>
            <DataTable
              title="属性"
              columns={['最大生命值', '当前攻击力', '当前防御力', '暴击率', '暴击伤害', '元素精通', '元素充能效率']}
              data={[character.attributes as unknown as Record<string, unknown>]}
            />
          </div>

          {/* ── 武器信息 ── */}
          <div className="rounded-3xl border border-blue-100/80 bg-white/95 p-5 shadow-xl shadow-blue-100/40">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-3 text-lg font-bold text-blue-900">
                {character.weapon.图标 ? (
                  <img src={character.weapon.图标} alt="" className="h-6 w-6 object-contain" />
                ) : (
                  <Sword className="h-5 w-5 text-amber-500" />
                )}
                武器信息
              </h3>
              {isAdmin && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowWeaponModal(true)}
                    className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                    {hasWeapon ? <><Edit3 className="h-3 w-3" /> 修改</> : <><Plus className="h-3 w-3" /> 添加武器</>}
                  </button>
                  {hasWeapon && (
                    <button type="button" onClick={handleDeleteWeapon}
                      className="inline-flex items-center gap-1 rounded-xl bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600">
                      <Trash2 className="h-3 w-3" /> 删除
                    </button>
                  )}
                </div>
              )}
            </div>
            <DataTable
              title="武器"
              columns={['名称', '等级', '突破等级', '精炼等级', '稀有度', '基础攻击力值', '副属性名称', '副属性数值']}
              data={[character.weapon as unknown as Record<string, unknown>]}
            />
          </div>

          {/* ── 圣遗物配置 ── */}
          <div className="rounded-3xl border border-blue-100/80 bg-white/95 p-5 shadow-xl shadow-blue-100/40">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-3 text-lg font-bold text-blue-900">
                <Gem className="h-5 w-5 text-amber-500" />
                圣遗物配置
              </h3>
              {isAdmin && freeSlots.length > 0 && (
                <button type="button" onClick={() => setShowRelicModal(freeSlots[0])}
                  className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                  <Plus className="h-3 w-3" /> 添加圣遗物
                </button>
              )}
            </div>
            {character.relics.length === 0 ? (
              <div className="rounded-2xl border border-blue-100/80 bg-blue-50/70 p-6 text-center text-slate-500">
                暂无圣遗物数据
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {character.relics.map((relic, index) => (
                  <div
                    key={`${relic.部位}-${index}`}
                    className="relative rounded-2xl border border-blue-100/80 bg-gradient-to-br from-blue-50/90 via-white to-amber-50/65 p-4 shadow-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {isAdmin && (
                      <div className="absolute right-2 top-2 flex gap-1">
                        <button type="button" onClick={() => setShowRelicModal(relic.部位)}
                          className="rounded-lg bg-blue-500 p-1 text-white hover:bg-blue-600" title="修改">
                          <Edit3 className="h-3 w-3" />
                        </button>
                        <button type="button" onClick={() => handleDeleteRelic(relic.部位)}
                          className="rounded-lg bg-red-500 p-1 text-white hover:bg-red-600" title="删除">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {relic.图标 && (
                          <img src={relic.图标} alt="" className="h-8 w-8 rounded-lg object-contain" />
                        )}
                        <span className="rounded-lg bg-blue-950 px-3 py-1 text-sm font-semibold text-white">
                          {relic.部位}
                        </span>
                      </div>
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        {relic.套装名称 || '未知套装'}
                      </span>
                    </div>

                    <div className="mb-4 rounded-2xl bg-white/80 p-4 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">主属性</p>
                      <div className="mt-2 flex items-end justify-between gap-4">
                        <span className="text-sm font-medium text-slate-700">{relic.主属性名称 || '-'}</span>
                        <span className="text-lg font-bold text-slate-900">{relic.主属性数值 ?? '-'}</span>
                      </div>
                    </div>

                    {renderRelicSubStats(relic)}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-blue-100/80 bg-white/95 p-5 shadow-xl shadow-blue-100/40">
            <h3 className="mb-4 flex items-center gap-3 text-lg font-bold text-blue-900">
              <Stars className="h-5 w-5 text-amber-500" />
              更新时间
            </h3>
            <p className="text-sm text-slate-600">{character.base.last_updated || '暂无记录'}</p>
          </div>
        </div>
      )}

      {/* modals */}
      {showWeaponModal && (
        <WeaponEditModal
          viewerUid={viewerUid}
          uid={targetUid}
          角色ID={character.base.角色ID}
          initial={hasWeapon ? {
            武器ID: character.weapon.武器ID || character.base.角色ID,
            名称: character.weapon.名称,
            等级: character.weapon.等级,
            突破等级: character.weapon.突破等级,
            精炼等级: character.weapon.精炼等级,
            稀有度: character.weapon.稀有度,
            基础攻击力值: character.weapon.基础攻击力值,
            副属性名称: character.weapon.副属性名称,
            副属性数值: character.weapon.副属性数值,
          } : null}
          onClose={() => setShowWeaponModal(false)}
          onSaved={() => { setShowWeaponModal(false); onCharacterChanged(); }}
        />
      )}
      {showRelicModal && (
        <RelicEditModal
          viewerUid={viewerUid}
          uid={targetUid}
          角色ID={character.base.角色ID}
          initial={(() => {
            const existing = character.relics.find(r => r.部位 === showRelicModal);
            return existing ? {
              部位: existing.部位,
              套装名称: existing.套装名称,
              主属性名称: existing.主属性名称,
              主属性数值: existing.主属性数值,
              副属性1名称: existing.副属性1名称,
              副属性2名称: existing.副属性2名称,
              副属性3名称: existing.副属性3名称,
              副属性4名称: existing.副属性4名称,
              副属性1数值: existing.副属性1数值,
              副属性2数值: existing.副属性2数值,
              副属性3数值: existing.副属性3数值,
              副属性4数值: existing.副属性4数值,
            } : null;
          })()}
          onClose={() => setShowRelicModal(null)}
          onSaved={() => { setShowRelicModal(null); onCharacterChanged(); }}
        />
      )}
    </div>
  );
};

export default CharacterDetail;

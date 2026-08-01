import React from 'react';
import { CharacterOption, GlobalCharacterStats } from '../types';
import { renderBarRows } from './AnalysisPanel';

interface AdminCharacterStatsPanelProps {
  options: CharacterOption[];
  selectedCharacterId: string;
  onSelectCharacter: (characterId: string) => void;
  stats: GlobalCharacterStats | null;
  loading: boolean;
}

const AdminCharacterStatsPanel: React.FC<AdminCharacterStatsPanelProps> = ({
  options,
  selectedCharacterId,
  onSelectCharacter,
  stats,
  loading,
}) => {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-200/50">
        <label className="mb-3 block text-sm font-semibold text-slate-700">选择角色</label>
        <select
          value={selectedCharacterId}
          onChange={(event) => onSelectCharacter(event.target.value)}
          className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200/70"
        >
          <option value="">请选择角色</option>
          {options.map((option) => (
            <option key={option.角色ID} value={option.角色ID}>
              {option.角色名称}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="rounded-3xl border border-white/70 bg-white/80 p-8 text-center text-slate-500 shadow-xl">
          正在读取全角色统计...
        </div>
      )}

      {!loading && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-200/50">
              <p className="text-sm font-semibold text-blue-800">角色名称</p>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">{stats.角色名称}</p>
            </div>
            <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-200/50">
              <p className="text-sm font-semibold text-blue-800">持有率</p>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">{stats.持有率}%</p>
            </div>
            <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-200/50">
              <p className="text-sm font-semibold text-blue-800">平均等级</p>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">{stats.平均等级}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-200/50">
              <h3 className="mb-4 text-lg font-bold text-slate-900">命座分布</h3>
              {renderBarRows(
                stats.命座分布.map((item) => ({ label: `${item.标签} 命`, value: item.数量 })),
                'bg-gradient-to-r from-violet-500 to-fuchsia-400',
                '暂无命座数据',
              )}
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-200/50">
              <h3 className="mb-4 text-lg font-bold text-slate-900">武器使用 Top 3</h3>
              {renderBarRows(
                stats.武器使用Top3.map((item) => ({ label: item.标签 || '', value: item.数量 })),
                'bg-gradient-to-r from-blue-500 to-cyan-400',
                '暂无武器数据',
              )}
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-200/50">
              <h3 className="mb-4 text-lg font-bold text-slate-900">圣遗物配装 Top 3</h3>
              {renderBarRows(
                stats.圣遗物配装Top3.map((item) => ({ label: item.标签 || '', value: item.数量 })),
                'bg-gradient-to-r from-emerald-500 to-teal-400',
                '暂无配装数据',
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCharacterStatsPanel;

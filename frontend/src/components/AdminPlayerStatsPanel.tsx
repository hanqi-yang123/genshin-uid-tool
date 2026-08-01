import React from 'react';
import { GlobalPlayerStats } from '../types';
import { renderBarRows } from './AnalysisPanel';

interface AdminPlayerStatsPanelProps {
  stats: GlobalPlayerStats | null;
  loading: boolean;
}

const AdminPlayerStatsPanel: React.FC<AdminPlayerStatsPanelProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="rounded-3xl border border-white/70 bg-white/80 p-8 text-center text-slate-500 shadow-xl">
        正在读取全玩家统计...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-3xl border border-white/70 bg-white/80 p-8 text-center text-slate-500 shadow-xl">
        暂无全玩家统计数据。
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-200/50">
        <h3 className="mb-4 text-lg font-bold text-slate-900">最深层数分布</h3>
        {renderBarRows(
          stats.最深层数分布.map((item) => ({ label: item.标签 || '', value: item.数量 })),
          'bg-gradient-to-r from-blue-500 to-cyan-400',
          '暂无最深层数数据',
        )}
      </div>

      <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-200/50">
        <h3 className="mb-4 text-lg font-bold text-slate-900">星章数分布</h3>
        {renderBarRows(
          stats.星章数分布.map((item) => ({ label: item.标签 || '', value: item.数量 })),
          'bg-gradient-to-r from-violet-500 to-fuchsia-400',
          '暂无星章数数据',
        )}
      </div>

      <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-200/50">
        <h3 className="mb-4 text-lg font-bold text-slate-900">危战层数分布</h3>
        {renderBarRows(
          stats.危战层数分布.map((item) => ({ label: item.标签 || '', value: item.数量 })),
          'bg-gradient-to-r from-amber-500 to-orange-400',
          '暂无危战层数数据',
        )}
      </div>
    </div>
  );
};

export default AdminPlayerStatsPanel;

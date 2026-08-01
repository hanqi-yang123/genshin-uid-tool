import React from 'react';
import { AnalysisData } from '../types';

interface AnalysisPanelProps {
  uid?: string;
  analysis: AnalysisData | null;
  loading: boolean;
}

export const renderBarRows = (
  rows: { label: string; value: number }[],
  colorClass: string,
  emptyText: string,
) => {
  if (!rows.length) {
    return <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">{emptyText}</div>;
  }

  const maxValue = Math.max(...rows.map((row) => row.value), 1);

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="space-y-1">
          <div className="flex items-center justify-between text-sm font-medium text-slate-700">
            <span>{row.label}</span>
            <span>{row.value}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${(row.value / maxValue) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ uid, analysis, loading }) => {
  if (!uid) {
    return (
      <div className="rounded-3xl border border-white/70 bg-white/80 p-8 text-center text-slate-500 shadow-xl">
        先查询或加载一个 UID，才能查看该玩家的数据分析结果。
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/70 bg-white/80 p-8 text-center text-slate-500 shadow-xl">
        正在计算分析数据...
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="rounded-3xl border border-white/70 bg-white/80 p-8 text-center text-slate-500 shadow-xl">
        当前 UID 还没有分析数据。
      </div>
    );
  }

  const summaryCards = [
    { label: '角色数量', value: analysis.summary.角色数量 },
    { label: '平均等级', value: analysis.summary.平均等级 },
    { label: '平均命座数', value: analysis.summary.平均命座数 },
    { label: '最近更新时间', value: analysis.summary.最近更新时间 || '暂无记录' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <div
            key={item.label}
            className="rounded-3xl border border-white/70 bg-gradient-to-br from-white via-blue-50/70 to-amber-50/40 p-5 shadow-xl shadow-slate-200/50"
          >
            <p className="text-sm font-semibold text-blue-800">{item.label}</p>
            <p className="mt-3 break-all text-2xl font-extrabold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-200/50">
          <h3 className="mb-4 text-lg font-bold text-slate-900">角色等级分布</h3>
          {renderBarRows(
            analysis.角色等级分布.map((item) => ({
              label: `等级 ${item.等级}`,
              value: item.数量,
            })),
            'bg-gradient-to-r from-blue-500 to-cyan-400',
            '暂无等级分布数据',
          )}
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-200/50">
          <h3 className="mb-4 text-lg font-bold text-slate-900">命座分布统计</h3>
          {renderBarRows(
            analysis.命座分布.map((item) => ({
              label: `${item.命座} 命`,
              value: item.数量,
            })),
            'bg-gradient-to-r from-violet-500 to-fuchsia-400',
            '暂无命座分布数据',
          )}
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-200/50">
          <h3 className="mb-4 text-lg font-bold text-slate-900">武器稀有度统计</h3>
          {renderBarRows(
            analysis.武器稀有度统计.map((item) => ({
              label: `${item.稀有度} 星武器`,
              value: item.数量,
            })),
            'bg-gradient-to-r from-amber-500 to-orange-400',
            '暂无武器稀有度数据',
          )}
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-200/50">
          <h3 className="mb-4 text-lg font-bold text-slate-900">圣遗物套装 Top 5</h3>
          {renderBarRows(
            analysis.圣遗物套装统计.map((item) => ({
              label: item.套装名称 || '未知套装',
              value: item.数量,
            })),
            'bg-gradient-to-r from-emerald-500 to-teal-400',
            '暂无圣遗物套装数据',
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;

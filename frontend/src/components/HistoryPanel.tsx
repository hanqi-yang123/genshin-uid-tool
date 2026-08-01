import React from 'react';
import { Clock3, RefreshCw, Trash2, User } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistoryPanelProps {
  history: HistoryItem[];
  loading: boolean;
  activeUid?: string;
  isAdmin: boolean;
  onLoad: (uid: string) => void;
  onRefresh: (uid: string) => void;
  onDelete?: (uid: string) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  loading,
  activeUid,
  isAdmin,
  onLoad,
  onRefresh,
  onDelete,
}) => {
  if (!history.length) {
    return (
      <div className="rounded-3xl border border-white/70 bg-white/80 p-8 text-center text-slate-500 shadow-xl">
        暂无历史记录。先在"查询数据"页抓取一个 UID，历史列表会自动出现。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item) => (
        <div
          key={item.UID}
          className={`rounded-3xl border bg-white/90 p-5 shadow-xl transition-all ${
            activeUid === item.UID ? 'border-blue-400 shadow-blue-100/60' : 'border-white/70 shadow-slate-200/50'
          }`}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <button type="button" onClick={() => onLoad(item.UID)} className="flex flex-1 items-start gap-4 text-left">
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                <User className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-lg font-bold text-slate-900">{item.昵称 || '未知玩家'}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    UID {item.UID}
                  </span>
                </div>
                <p className="text-sm text-slate-600">等级 {item.等级}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock3 className="h-4 w-4" />
                  最后更新时间：{item.last_updated || '暂无记录'}
                </div>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onRefresh(item.UID)}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </button>
              {isAdmin && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(item.UID)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  删除
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryPanel;

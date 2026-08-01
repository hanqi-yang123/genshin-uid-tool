import React, { useState } from 'react';
import { Loader2, Search, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { fetchUIDData } from '../lib/api';
import { PlayerData } from '../types';

interface UIDInputProps {
  viewerUid: string;
  defaultUid?: string;
  onDataFetched: (data: PlayerData) => void;
}

const UIDInput: React.FC<UIDInputProps> = ({ viewerUid, defaultUid, onDataFetched }) => {
  const [uid, setUid] = useState(defaultUid ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!/^\d{9}$/.test(uid)) {
      const message = '请输入 9 位数字的原神 UID';
      setError(message);
      setSuccess(false);
      toast.error(message);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetchUIDData(uid, viewerUid);
      if (response.success && response.data) {
        toast.success('查询成功，数据已写入本地数据库');
        onDataFetched(response.data);
        setSuccess(true);
        return;
      }

      const message = response.message || '未返回有效数据';
      setError(message);
      setSuccess(false);
      toast.error(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取数据失败';
      setError(message);
      setSuccess(false);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-2xl shadow-blue-100/50 backdrop-blur-xl md:p-6"
      >
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-800">
          <Sparkles className="h-4 w-4 text-amber-500" />
          输入 UID 后抓取最新展柜信息，并同步保存到本地 SQLite
        </div>

        <div className="flex flex-col gap-4 lg:flex-row">
          <input
            type="text"
            inputMode="numeric"
            value={uid}
            onChange={(event) => setUid(event.target.value.replace(/\D/g, '').slice(0, 9))}
            placeholder="请输入原神 UID，例如 123456789"
            disabled={loading}
            className="flex-1 rounded-2xl border-2 border-blue-100 bg-white/95 px-6 py-4 text-lg text-slate-800 shadow-inner outline-none transition-all duration-300 placeholder:text-slate-400 focus:-translate-y-0.5 focus:border-blue-500 focus:ring-4 focus:ring-blue-200/70 disabled:cursor-not-allowed disabled:opacity-70"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-w-[168px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1e40af] via-[#2563eb] to-[#3b82f6] px-8 py-4 text-base font-semibold text-white shadow-xl shadow-blue-300/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-300/50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                查询中...
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                开始查询
              </>
            )}
          </button>
        </div>

        {loading && (
          <div className="mt-5 space-y-3">
            <div className="h-3 overflow-hidden rounded-full bg-blue-100 shadow-inner">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-amber-400" />
            </div>
            <p className="text-sm font-medium text-blue-700">正在抓取并持久化数据...</p>
          </div>
        )}

        {success && !loading && !error && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm font-medium text-emerald-700">
            查询成功，页面与本地数据库都已更新。
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default UIDInput;

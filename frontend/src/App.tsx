import React, { useEffect, useState } from 'react';
import { BarChart3, History, Search, Shield, Users } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import AdminCharacterStatsPanel from './components/AdminCharacterStatsPanel';
import AdminPlayerStatsPanel from './components/AdminPlayerStatsPanel';
import AnalysisPanel from './components/AnalysisPanel';
import HistoryPanel from './components/HistoryPanel';
import {
  adminDeletePlayer,
  fetchUIDData,
  getAnalysis,
  getCharacterOptions,
  getGlobalCharacterStats,
  getGlobalPlayerStats,
  getHistory,
  getPlayerData,
  getSessionInfo,
  refreshUIDData,
} from './lib/api';
import Home from './pages/Home';
import {
  AnalysisData,
  CharacterOption,
  GlobalCharacterStats,
  GlobalPlayerStats,
  HistoryItem,
  PlayerData,
} from './types';

type TabKey = 'query' | 'history' | 'analysis' | 'admin-player-stats' | 'admin-character-stats';

const STORAGE_KEY = 'genshin_uid';

const App: React.FC = () => {
  /* ── identity ── */
  const [viewerUid, setViewerUid] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [identified, setIdentified] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  /* ── tabs ── */
  const [activeTab, setActiveTab] = useState<TabKey>('query');

  /* ── player data ── */
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  /* ── admin: global player stats ── */
  const [globalPlayerStats, setGlobalPlayerStats] = useState<GlobalPlayerStats | null>(null);
  const [globalPlayerStatsLoading, setGlobalPlayerStatsLoading] = useState(false);

  /* ── admin: global character stats ── */
  const [characterOptions, setCharacterOptions] = useState<CharacterOption[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState('');
  const [globalCharacterStats, setGlobalCharacterStats] = useState<GlobalCharacterStats | null>(null);
  const [globalCharacterStatsLoading, setGlobalCharacterStatsLoading] = useState(false);

  const currentUid = playerData?.base.UID;

  const tabs: { key: TabKey; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { key: 'query', label: '查询数据', icon: Search },
    { key: 'history', label: '历史记录', icon: History },
    { key: 'analysis', label: '数据分析', icon: BarChart3 },
    ...(isAdmin
      ? [
          { key: 'admin-player-stats' as TabKey, label: '全玩家统计', icon: Users },
          { key: 'admin-character-stats' as TabKey, label: '全角色统计', icon: Shield },
        ]
      : []),
  ];

  /* ── auto-identify on mount ── */
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && /^\d{9}$/.test(stored)) {
      identify(stored);
    }
  }, []);

  const identify = async (uid: string) => {
    try {
      const res = await getSessionInfo(uid);
      if (res.success && res.data) {
        setViewerUid(res.data.uid);
        setIsAdmin(res.data.is_admin);
        setIdentified(true);
        localStorage.setItem(STORAGE_KEY, uid);
      }
    } catch {
      toast.error('身份识别失败，请重新输入 UID');
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{9}$/.test(loginInput)) {
      toast.error('请输入 9 位数字的 UID');
      return;
    }
    await identify(loginInput);
  };

  /* ── auto-load data on identify ── */
  useEffect(() => {
    if (!identified) return;
    (async () => {
      setHistoryLoading(true);
      try {
        const [hRes, dRes] = await Promise.all([
          getHistory(viewerUid),
          getPlayerData(viewerUid, viewerUid),
        ]);
        if (hRes.success && hRes.data) setHistory(hRes.data);
        if (dRes.success && dRes.data) setPlayerData(dRes.data);
      } catch {
        // first visit, no cached data yet
      } finally {
        setHistoryLoading(false);
      }
    })();
  }, [identified, viewerUid]);

  /* ── reactive analysis ── */
  useEffect(() => {
    if (!currentUid) { setAnalysis(null); return; }
    (async () => {
      setAnalysisLoading(true);
      try {
        const res = await getAnalysis(currentUid, viewerUid);
        if (res.success && res.data) setAnalysis(res.data);
      } catch { setAnalysis(null); } finally {
        setAnalysisLoading(false);
      }
    })();
  }, [currentUid, viewerUid]);

  /* ── admin tab loaders ── */
  useEffect(() => {
    if (activeTab !== 'admin-player-stats' || !isAdmin) return;
    (async () => {
      setGlobalPlayerStatsLoading(true);
      try {
        const res = await getGlobalPlayerStats(viewerUid);
        if (res.success && res.data) setGlobalPlayerStats(res.data);
      } catch { toast.error('读取全玩家统计失败'); } finally {
        setGlobalPlayerStatsLoading(false);
      }
    })();
  }, [activeTab, isAdmin, viewerUid]);

  useEffect(() => {
    if (activeTab !== 'admin-character-stats' || !isAdmin) return;
    (async () => {
      try {
        const res = await getCharacterOptions(viewerUid);
        if (res.success && res.data) setCharacterOptions(res.data);
      } catch { toast.error('读取角色列表失败'); }
    })();
  }, [activeTab, isAdmin, viewerUid]);

  useEffect(() => {
    if (!selectedCharacterId) { setGlobalCharacterStats(null); return; }
    (async () => {
      setGlobalCharacterStatsLoading(true);
      try {
        const res = await getGlobalCharacterStats(viewerUid, selectedCharacterId);
        if (res.success && res.data) setGlobalCharacterStats(res.data);
      } catch { setGlobalCharacterStats(null); toast.error('读取全角色统计失败'); } finally {
        setGlobalCharacterStatsLoading(false);
      }
    })();
  }, [selectedCharacterId, viewerUid]);

  /* ── refresh data (从 Enka 重新拉取) ── */
  const handleRefreshData = async () => {
    try {
      const res = await fetchUIDData(viewerUid, viewerUid);
      if (res.success && res.data) {
        setPlayerData(res.data);
        // reload history
        const hRes = await getHistory(viewerUid);
        if (hRes.success && hRes.data) setHistory(hRes.data);
        toast.success('数据已从 Enka 更新');
      }
    } catch (err) {
      throw err; // let Home catch it
    }
  };

  /* ── history load/refresh/delete ── */
  const handleHistoryLoad = async (uid: string) => {
    try {
      const res = await getPlayerData(uid, viewerUid);
      if (res.success && res.data) {
        setPlayerData(res.data);
        setActiveTab('query');
        toast.success(`已从本地缓存加载 UID ${uid}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '加载失败');
    }
  };

  const handleHistoryRefresh = async (uid: string) => {
    setHistoryLoading(true);
    try {
      const res = await refreshUIDData(uid, viewerUid);
      if (res.success && res.data) {
        setPlayerData(res.data);
        const hRes = await getHistory(viewerUid);
        if (hRes.success && hRes.data) setHistory(hRes.data);
        if (activeTab === 'analysis') {
          const aRes = await getAnalysis(uid, viewerUid);
          if (aRes.success && aRes.data) setAnalysis(aRes.data);
        }
        toast.success(`UID ${uid} 已刷新`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '刷新失败');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleHistoryDelete = async (uid: string) => {
    if (!confirm(`确定删除 UID ${uid} 的所有数据？此操作不可撤销。`)) return;
    try {
      const res = await adminDeletePlayer(viewerUid, uid);
      if (res.success) {
        toast.success(`UID ${uid} 已删除`);
        if (currentUid === uid) setPlayerData(null);
        setHistory(prev => prev.filter(h => h.UID !== uid));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  /* ── after data fetch (from UIDInput) ── */
  const handleDataFetched = async (data: PlayerData) => {
    setPlayerData(data);
    try {
      const hRes = await getHistory(viewerUid);
      if (hRes.success && hRes.data) setHistory(hRes.data);
    } catch { /* silent */ }
  };

  /* ── reload current player from backend (after admin edit) ── */
  const handleReloadPlayer = async () => {
    if (!currentUid) return;
    const res = await getPlayerData(currentUid, viewerUid);
    if (res.success && res.data) setPlayerData(res.data);
  };

  /* ── render: login screen (only if no stored UID) ── */
  if (!identified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_36%),linear-gradient(180deg,_#f8fbff_0%,_#eef5ff_48%,_#fdfbf6_100%)]">
        <Toaster position="top-right" richColors />
        <div className="mx-4 w-full max-w-md">
          <div className="rounded-3xl border border-white/70 bg-white/90 p-8 shadow-2xl shadow-slate-200/60">
            <h1 className="mb-2 text-center text-2xl font-extrabold text-slate-900">
              原神 UID 展柜查询工具
            </h1>
            <p className="mb-6 text-center text-sm text-slate-500">请输入你的 UID 以识别身份</p>
            <form onSubmit={handleIdentify} className="space-y-4">
              <input
                type="text" inputMode="numeric"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value.replace(/\D/g, '').slice(0, 9))}
                placeholder="请输入 9 位 UID"
                className="w-full rounded-2xl border-2 border-blue-100 bg-white/95 px-6 py-4 text-lg text-slate-800 shadow-inner outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-200/70"
              />
              <button type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-[#1e40af] via-[#2563eb] to-[#3b82f6] px-8 py-4 text-base font-semibold text-white shadow-xl shadow-blue-300/40 transition-all hover:-translate-y-0.5"
              >
                进入工具
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  /* ── main app ── */
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_36%),linear-gradient(180deg,_#f8fbff_0%,_#eef5ff_48%,_#fdfbf6_100%)]">
      <Toaster position="top-right" richColors />
      <div className="relative min-h-screen px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-6xl space-y-7 md:space-y-8">
          {/* header */}
          <header className="overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-r from-[#0c1f3f] via-[#1e40af] to-[#173b7a] text-white shadow-2xl shadow-blue-900/25">
            <div className="flex flex-col gap-4 px-6 py-7 md:px-10 md:py-9">
              <div className="flex items-center gap-3 text-blue-100">
                <div className="rounded-2xl bg-white/10 p-3 shadow-xl shadow-blue-950/20 backdrop-blur-md">
                  <BarChart3 className="h-7 w-7 text-amber-300" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-blue-100/80">Genshin Showcase</p>
                  <h1 className="text-3xl font-extrabold md:text-4xl">原神 UID 展柜查询工具</h1>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm leading-7 text-blue-100/85 md:text-base md:leading-8">
                  当前用户：{playerData?.base.昵称 || viewerUid}
                  <span className="ml-2 text-blue-200">(UID: {viewerUid})</span>
                  {isAdmin ? <span className="ml-2 rounded-full bg-amber-400/20 px-2 py-0.5 text-xs text-amber-300">管理员</span> : null}
                </p>
                <button
                  type="button"
                  onClick={() => { setIdentified(false); localStorage.removeItem(STORAGE_KEY); }}
                  className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-md hover:bg-white/20"
                >
                  切换用户
                </button>
              </div>
            </div>
          </header>

          <main className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-2xl shadow-slate-200/60 backdrop-blur-xl md:p-8">
            {/* tab bar */}
            <div className="mb-8 flex flex-wrap gap-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all ${
                      active
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200/70'
                        : 'bg-white/90 text-slate-700 shadow-md hover:bg-blue-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* panels */}
            {activeTab === 'query' && (
              <Home
                viewerUid={viewerUid}
                isAdmin={isAdmin}
                playerData={playerData}
                onDataFetched={handleDataFetched}
                onRefreshData={handleRefreshData}
                onReloadPlayer={handleReloadPlayer}
              />
            )}
            {activeTab === 'history' && (
              <HistoryPanel
                history={history}
                loading={historyLoading}
                activeUid={currentUid}
                isAdmin={isAdmin}
                onLoad={handleHistoryLoad}
                onRefresh={handleHistoryRefresh}
                onDelete={isAdmin ? handleHistoryDelete : undefined}
              />
            )}
            {activeTab === 'analysis' && (
              <AnalysisPanel uid={currentUid} analysis={analysis} loading={analysisLoading} />
            )}
            {activeTab === 'admin-player-stats' && (
              <AdminPlayerStatsPanel stats={globalPlayerStats} loading={globalPlayerStatsLoading} />
            )}
            {activeTab === 'admin-character-stats' && (
              <AdminCharacterStatsPanel
                options={characterOptions}
                selectedCharacterId={selectedCharacterId}
                onSelectCharacter={setSelectedCharacterId}
                stats={globalCharacterStats}
                loading={globalCharacterStatsLoading}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;

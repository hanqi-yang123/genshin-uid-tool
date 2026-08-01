import React, { useState } from 'react';
import { Award, Compass, Crown, Plus, RefreshCw, ScrollText, Sparkles, Swords, User, Users } from 'lucide-react';
import { toast } from 'sonner';
import CharacterDetail from '../components/CharacterDetail';
import CharacterEditModal from '../components/CharacterEditModal';
import UIDInput from '../components/UIDInput';
import { PlayerData } from '../types';

interface HomeProps {
  viewerUid: string;
  isAdmin: boolean;
  playerData: PlayerData | null;
  onDataFetched: (data: PlayerData) => void;
  onRefreshData?: () => Promise<void>;
  onReloadPlayer?: () => Promise<void>;
}

const Home: React.FC<HomeProps> = ({ viewerUid, isAdmin, playerData, onDataFetched, onRefreshData, onReloadPlayer }) => {
  const [showAddChar, setShowAddChar] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const baseCards = playerData
    ? [
        { label: 'UID', value: playerData.base.UID, icon: User },
        { label: '昵称', value: playerData.base.昵称, icon: Sparkles },
        { label: '等级', value: playerData.base.等级, icon: Crown },
        { label: '世界等级', value: playerData.base.世界等级, icon: Compass },
        { label: '成就数量', value: playerData.base.成就数量, icon: Award },
        { label: '满好感角色数量', value: playerData.base.满好感角色数量, icon: Users },
      ]
    : [];

  const abyssCards = playerData
    ? [
        ['最深层数', playerData.abyss.最深层数],
        ['最深房间', playerData.abyss.最深房间],
        ['获取渊星数', playerData.abyss.获取渊星数],
        ['幕数', playerData.abyss.幕数],
        ['星章数', playerData.abyss.星章数],
        ['危战层数', playerData.abyss.危战层数],
        ['秒数', playerData.abyss.秒数],
      ]
    : [];

  const handleRefresh = async () => {
    if (!onRefreshData) return;
    setRefreshing(true);
    try {
      await onRefreshData();
      toast.success('数据已更新');
    } catch {
      // error handled in parent
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-9 md:space-y-10">
      <section>
        <div className="mb-5 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">UID 查询</p>
          <h2 className="mt-2 text-2xl font-extrabold text-slate-900 md:text-3xl">查询并保存你的角色展柜</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base md:leading-8">
            {isAdmin
              ? '管理员可以查询任意 UID，并查看全局统计。'
              : '普通用户只能查询自己的 UID，历史记录与分析也仅显示自己的内容。'}
          </p>
        </div>

        {/* 刷新按钮 */}
        {onRefreshData && playerData && (
          <div className="mb-5 flex justify-center">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-3 text-base font-semibold text-white shadow-xl shadow-blue-300/40 transition-all hover:-translate-y-0.5 hover:shadow-2xl disabled:opacity-60"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? '更新中...' : '更新数据'}
            </button>
          </div>
        )}

        <UIDInput viewerUid={viewerUid} defaultUid={!isAdmin ? viewerUid : undefined} onDataFetched={onDataFetched} />
      </section>

      {playerData && (
        <div className="space-y-9 md:space-y-10">
          <section
            className="relative overflow-hidden rounded-3xl"
            style={playerData.base.名片图标 ? {
              backgroundImage: `url(${playerData.base.名片图标})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : {}}
          >
            {/* 背景遮罩 */}
            {playerData.base.名片图标 && (
              <div className="absolute inset-0 bg-white/75 backdrop-blur-sm" />
            )}
            <div className="relative p-6 md:p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                  <ScrollText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">基础信息</h3>
                  <p className="text-sm text-slate-500">展示当前 UID 的公开资料与本地缓存更新时间。</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {baseCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="rounded-3xl border border-white/70 bg-gradient-to-br from-white via-blue-50/70 to-amber-50/40 p-5 shadow-xl shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                    >
                      <div className="mb-4 flex items-center gap-3 text-sm font-semibold text-blue-800">
                        <div className="rounded-2xl bg-blue-100/80 p-2 text-blue-700">
                          <Icon className="h-4 w-4" />
                        </div>
                        {item.label}
                      </div>
                      <p className="break-all text-2xl font-extrabold text-slate-900">{item.value || '-'}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-3xl border border-amber-100 bg-gradient-to-r from-amber-50/90 to-white p-5 shadow-lg shadow-amber-100/40">
                <p className="mb-2 text-sm font-semibold text-amber-700">个性签名</p>
                <p className="text-slate-700">{playerData.base.签名 || '这个玩家还没有公开签名。'}</p>
                <p className="mt-3 text-xs text-slate-500">最近更新时间：{playerData.base.last_updated || '暂无记录'}</p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-blue-300/20 bg-gradient-to-br from-[#10294c] via-[#1e40af] to-[#1d4ed8] p-6 text-white shadow-2xl shadow-blue-900/25 md:p-7">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3 text-amber-300 backdrop-blur-md">
                <Swords className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold">深渊数据</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {abyssCards.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-xl shadow-blue-950/10 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-blue-100/80">{label}</p>
                  <p className="mt-3 text-3xl font-extrabold text-amber-300 md:text-4xl">{value ?? '-'}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">角色列表</h3>
                  <p className="text-sm text-slate-500">点击任意角色卡片即可展开属性、武器与圣遗物详情。</p>
                </div>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAddChar(true)}
                  className="inline-flex items-center gap-1 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4" /> 添加角色
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {playerData.characters.map((character) => (
                <CharacterDetail
                  key={character.base.角色ID}
                  character={character}
                  viewerUid={viewerUid}
                  targetUid={playerData.base.UID}
                  isAdmin={isAdmin}
                  onCharacterChanged={() => onReloadPlayer?.()}
                />
              ))}
            </div>
          </section>
        </div>
      )}

      {showAddChar && (
        <CharacterEditModal
          viewerUid={viewerUid}
          uid={playerData?.base.UID || viewerUid}
          initial={null}
          onClose={() => setShowAddChar(false)}
          onSaved={() => {
            setShowAddChar(false);
            onReloadPlayer?.();
          }}
        />
      )}
    </div>
  );
};

export default Home;

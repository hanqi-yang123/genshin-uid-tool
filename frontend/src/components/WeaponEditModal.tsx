import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminGetDictWeapons, adminGetDictWeaponSubstats, adminSaveWeapon } from '../lib/api';
import { DictWeaponFull } from '../types';

interface WeaponEditModalProps {
  viewerUid: string;
  uid: string;
  角色ID: string;
  initial?: {
    武器ID: string;
    名称: string;
    等级: number;
    突破等级: number;
    精炼等级: number;
    稀有度: number;
    基础攻击力值: number;
    副属性名称: string;
    副属性数值: number;
  } | null;
  onClose: () => void;
  onSaved: () => void;
}

const BREAKTHROUGH_OPTIONS = [0, 1, 2, 3, 4, 5, 6];
const REFINE_OPTIONS = [1, 2, 3, 4, 5];

const WeaponEditModal: React.FC<WeaponEditModalProps> = ({ viewerUid, uid, 角色ID, initial, onClose, onSaved }) => {
  const [weapons, setWeapons] = useState<DictWeaponFull[]>([]);
  const [substatOptions, setSubstatOptions] = useState<string[]>([]);
  const [武器ID, set武器ID] = useState(initial?.武器ID ?? '');
  const [武器名称, set武器名称] = useState(initial?.名称 ?? '');
  const [等级, set等级] = useState(initial?.等级 ?? 1);
  const [突破等级, set突破等级] = useState(initial?.突破等级 ?? 0);
  const [精炼等级, set精炼等级] = useState(initial?.精炼等级 ?? 1);
  const [稀有度, set稀有度] = useState(initial?.稀有度 ?? 3);
  const [基础攻击力值, set基础攻击力值] = useState(initial?.基础攻击力值 ?? 0);
  const [副属性名称, set副属性名称] = useState(initial?.副属性名称 ?? '');
  const [副属性数值, set副属性数值] = useState(initial?.副属性数值 ?? 0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      adminGetDictWeapons(viewerUid),
      adminGetDictWeaponSubstats(viewerUid),
    ]).then(([wRes, sRes]) => {
      if (wRes.success && wRes.data) setWeapons(wRes.data);
      if (sRes.success && sRes.data) setSubstatOptions(sRes.data);
    }).catch(() => toast.error('读取武器数据失败'));
  }, [viewerUid]);

  const handleWeaponSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    set武器ID(id);
    const wp = weapons.find(w => w.武器ID === id);
    if (wp) {
      set武器名称(wp.名称);
      set稀有度(wp.稀有度);
      set副属性名称(wp.副属性名称);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!武器ID) { toast.error('请选择武器'); return; }
    setSaving(true);
    try {
      const res = await adminSaveWeapon({
        viewer_uid: viewerUid, uid, 角色ID, 武器ID, 武器名称,
        等级, 突破等级, 精炼等级, 稀有度, 基础攻击力值, 副属性名称, 副属性数值,
      });
      if (res.success) {
        toast.success(initial ? '武器已更新' : '武器已添加');
        onSaved();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-white/70 bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="mb-6 text-xl font-bold text-slate-900">{initial ? '修改武器' : '添加武器'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-semibold text-slate-700">武器名称</label>
              <select value={武器ID} onChange={handleWeaponSelect}
                className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200/70">
                <option value="">请选择</option>
                {weapons.map(w => (
                  <option key={w.武器ID} value={w.武器ID}>{w.名称} ({w.稀有度}★)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">等级</label>
              <input type="number" min={1} max={90} value={等级} onChange={e => set等级(Number(e.target.value))}
                className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200/70" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">突破等级</label>
              <select value={突破等级} onChange={e => set突破等级(Number(e.target.value))}
                className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200/70">
                {BREAKTHROUGH_OPTIONS.map(i => (<option key={i} value={i}>{i}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">精炼等级</label>
              <select value={精炼等级} onChange={e => set精炼等级(Number(e.target.value))}
                className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200/70">
                {REFINE_OPTIONS.map(i => (<option key={i} value={i}>{i}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">稀有度</label>
              <select value={稀有度} onChange={e => set稀有度(Number(e.target.value))}
                className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200/70">
                {[3, 4, 5].map(i => (<option key={i} value={i}>{i}★</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">基础攻击力值</label>
              <input type="number" step="0.1" value={基础攻击力值} onChange={e => set基础攻击力值(Number(e.target.value))}
                className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200/70" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">副属性名称</label>
              <select value={副属性名称} onChange={e => set副属性名称(e.target.value)}
                className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200/70">
                <option value="">无</option>
                {substatOptions.map(s => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">副属性数值</label>
              <input type="number" step="0.1" value={副属性数值} onChange={e => set副属性数值(Number(e.target.value))}
                className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200/70" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose}
              className="rounded-xl bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">取消</button>
            <button type="submit" disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WeaponEditModal;

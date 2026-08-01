import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminGetDictCharacters, adminSaveCharacter } from '../lib/api';
import { DictCharacterFull } from '../types';

interface CharacterEditModalProps {
  viewerUid: string;
  uid: string;
  /** 传入现有数据表示编辑模式，否则为添加模式 */
  initial?: {
    角色ID: string;
    等级: number;
    突破等级: number;
    好感等级: number;
    命座数: number;
    最大生命值: number;
    当前攻击力: number;
    当前防御力: number;
    暴击率: number;
    暴击伤害: number;
    元素精通: number;
    元素充能效率: number;
  } | null;
  onClose: () => void;
  onSaved: () => void;
}

const SLOT_OPTIONS = [0, 1, 2, 3, 4, 5, 6];

const CharacterEditModal: React.FC<CharacterEditModalProps> = ({ viewerUid, uid, initial, onClose, onSaved }) => {
  const [charOptions, setCharOptions] = useState<DictCharacterFull[]>([]);
  const [角色ID, set角色ID] = useState(initial?.角色ID ?? '');
  const [等级, set等级] = useState(initial?.等级 ?? 1);
  const [突破等级, set突破等级] = useState(initial?.突破等级 ?? 0);
  const [好感等级, set好感等级] = useState(initial?.好感等级 ?? 0);
  const [命座数, set命座数] = useState(initial?.命座数 ?? 0);
  const [最大生命值, set最大生命值] = useState(initial?.最大生命值 ?? 0);
  const [当前攻击力, set当前攻击力] = useState(initial?.当前攻击力 ?? 0);
  const [当前防御力, set当前防御力] = useState(initial?.当前防御力 ?? 0);
  const [暴击率, set暴击率] = useState(initial?.暴击率 ?? 0);
  const [暴击伤害, set暴击伤害] = useState(initial?.暴击伤害 ?? 0);
  const [元素精通, set元素精通] = useState(initial?.元素精通 ?? 0);
  const [元素充能效率, set元素充能效率] = useState(initial?.元素充能效率 ?? 0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminGetDictCharacters(viewerUid).then(res => {
      if (res.success && res.data) setCharOptions(res.data);
    }).catch(() => toast.error('读取角色列表失败'));
  }, [viewerUid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!角色ID) { toast.error('请选择角色'); return; }
    setSaving(true);
    try {
      const res = await adminSaveCharacter({
        viewer_uid: viewerUid, uid,
        角色ID, 等级, 突破等级, 好感等级, 命座数,
        最大生命值, 当前攻击力, 当前防御力, 暴击率, 暴击伤害, 元素精通, 元素充能效率,
      });
      if (res.success) {
        toast.success(initial ? '角色已更新' : '角色已添加');
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
      <div className="mx-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/70 bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="mb-6 text-xl font-bold text-slate-900">{initial ? '修改角色' : '添加角色'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">角色名称</label>
              <select value={角色ID} onChange={e => set角色ID(e.target.value)}
                className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200/70">
                <option value="">请选择</option>
                {charOptions.map(c => (
                  <option key={c.角色ID} value={c.角色ID}>{c.角色名称} ({c.角色ID})</option>
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
                {SLOT_OPTIONS.map(i => (<option key={i} value={i}>{i}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">好感等级</label>
              <select value={好感等级} onChange={e => set好感等级(Number(e.target.value))}
                className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200/70">
                {Array.from({ length: 11 }, (_, i) => (<option key={i} value={i}>{i}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">命座数</label>
              <select value={命座数} onChange={e => set命座数(Number(e.target.value))}
                className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200/70">
                {Array.from({ length: 7 }, (_, i) => (<option key={i} value={i}>{i}</option>))}
              </select>
            </div>
          </div>

          <div className="border-t border-blue-100 pt-4">
            <h3 className="mb-3 text-sm font-bold text-slate-800">属性面板</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                ['最大生命值', 最大生命值, set最大生命值],
                ['当前攻击力', 当前攻击力, set当前攻击力],
                ['当前防御力', 当前防御力, set当前防御力],
                ['暴击率', 暴击率, set暴击率],
                ['暴击伤害', 暴击伤害, set暴击伤害],
                ['元素精通', 元素精通, set元素精通],
                ['元素充能效率', 元素充能效率, set元素充能效率],
              ].map(([label, val, setter]) => (
                <div key={label as string}>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">{label as string}</label>
                  <input type="number" step="0.1" value={val as number}
                    onChange={e => (setter as React.Dispatch<React.SetStateAction<number>>)(Number(e.target.value))}
                    className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200/70" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose}
              className="rounded-xl bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
              取消
            </button>
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

export default CharacterEditModal;

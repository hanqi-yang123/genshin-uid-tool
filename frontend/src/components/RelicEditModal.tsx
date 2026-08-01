import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminGetDictRelicSets, adminGetDictPropNames, adminSaveRelic } from '../lib/api';

interface RelicEditModalProps {
  viewerUid: string;
  uid: string;
  角色ID: string;
  initial?: {
    部位: string;
    套装名称: string;
    主属性名称: string;
    主属性数值: number;
    副属性1名称: string;
    副属性2名称: string;
    副属性3名称: string;
    副属性4名称: string;
    副属性1数值: number;
    副属性2数值: number;
    副属性3数值: number;
    副属性4数值: number;
  } | null;
  onClose: () => void;
  onSaved: () => void;
}

const SLOT_OPTIONS = ['生之花', '死之羽', '时之沙', '空之杯', '理之冠'];

const RelicEditModal: React.FC<RelicEditModalProps> = ({ viewerUid, uid, 角色ID, initial, onClose, onSaved }) => {
  const [setOptions, setSetOptions] = useState<string[]>([]);
  const [propOptions, setPropOptions] = useState<string[]>([]);
  const [部位, set部位] = useState(initial?.部位 ?? SLOT_OPTIONS[0]);
  const [套装名称, set套装名称] = useState(initial?.套装名称 ?? '');
  const [主属性名称, set主属性名称] = useState(initial?.主属性名称 ?? '');
  const [主属性数值, set主属性数值] = useState(initial?.主属性数值 ?? 0);
  const [副属性, set副调配] = useState<{ name: string; value: number }[]>(
    [1, 2, 3, 4].map(i => ({
      name: (initial as Record<string, unknown>)?.[`副属性${i}名称`] as string ?? '',
      value: (initial as Record<string, unknown>)?.[`副属性${i}数值`] as number ?? 0,
    }))
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      adminGetDictRelicSets(viewerUid),
      adminGetDictPropNames(viewerUid),
    ]).then(([rRes, pRes]) => {
      if (rRes.success && rRes.data) setSetOptions(rRes.data);
      if (pRes.success && pRes.data) setPropOptions(pRes.data);
    }).catch(() => toast.error('读取圣遗物数据失败'));
  }, [viewerUid]);

  const updateSub = (idx: number, field: 'name' | 'value', val: string | number) => {
    set副调配(prev => prev.map((item, i) =>
      i === idx ? { ...item, [field === 'name' ? 'name' : 'value']: val as never } : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!套装名称) { toast.error('请选择套装'); return; }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        viewer_uid: viewerUid, uid, 角色ID, 部位, 套装名称,
        主属性名称, 主属性数值,
      };
      副属性.forEach((sub, i) => {
        body[`副属性${i + 1}名称`] = sub.name;
        body[`副属性${i + 1}数值`] = sub.value;
      });
      const res = await adminSaveRelic(body);
      if (res.success) {
        toast.success(initial ? '圣遗物已更新' : '圣遗物已添加');
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
        <h2 className="mb-6 text-xl font-bold text-slate-900">{initial ? '修改圣遗物' : '添加圣遗物'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">部位</label>
              <select value={部位} onChange={e => set部位(e.target.value)}
                className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200/70">
                {SLOT_OPTIONS.map(s => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">套装名称</label>
              <select value={套装名称} onChange={e => set套装名称(e.target.value)}
                className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200/70">
                <option value="">请选择</option>
                {setOptions.map(s => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">主属性名称</label>
              <select value={主属性名称} onChange={e => set主属性名称(e.target.value)}
                className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200/70">
                <option value="">请选择</option>
                {propOptions.map(p => (<option key={p} value={p}>{p}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">主属性数值</label>
              <input type="number" step="0.1" value={主属性数值} onChange={e => set主属性数值(Number(e.target.value))}
                className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200/70" />
            </div>
          </div>

          <div className="border-t border-blue-100 pt-4">
            <h3 className="mb-3 text-sm font-bold text-slate-800">副词条</h3>
            {副属性.map((sub, idx) => (
              <div key={idx} className="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">副属性{idx + 1}名称</label>
                  <select value={sub.name} onChange={e => updateSub(idx, 'name', e.target.value)}
                    className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200/70">
                    <option value="">无</option>
                    {propOptions.map(p => (<option key={p} value={p}>{p}</option>))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">副属性{idx + 1}数值</label>
                  <input type="number" step="0.1" value={sub.value}
                    onChange={e => updateSub(idx, 'value', Number(e.target.value))}
                    className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200/70" />
                </div>
              </div>
            ))}
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

export default RelicEditModal;

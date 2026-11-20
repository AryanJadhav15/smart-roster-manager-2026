import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Clock,
  Save,
  Loader2,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../api';

const CALENDAR_OPTIONS = [
  { value: '365_DAYS', label: '365 Days (No Days Off)' },
  { value: 'PUBLIC_HOLIDAYS_OFF', label: 'Public Holidays Off' },
  { value: 'SUNDAYS_OFF', label: 'Sundays Off' },
  { value: 'SUNDAYS_AND_HOLIDAYS_OFF', label: 'Sundays & Public Holidays Off' },
];

export default function BrandsProcessesTab({
  brands = [],
  processes = [],
  brandProcesses = [],
  pods = [],
  onRefresh,
}) {
  const { showToast } = useToast();

  // Brand modal state
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [brandName, setBrandName] = useState('');
  const [brandDesc, setBrandDesc] = useState('');
  const [brandPodId, setBrandPodId] = useState('');
  const [isBrandSaving, setIsBrandSaving] = useState(false);

  // Process modal state
  const [procModalOpen, setProcModalOpen] = useState(false);
  const [editingProc, setEditingProc] = useState(null);
  const [procName, setProcName] = useState('');
  const [isProcSaving, setIsProcSaving] = useState(false);

  // Brand_Process Rule modal state
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleBrandId, setRuleBrandId] = useState('');
  const [ruleProcessId, setRuleProcessId] = useState('');
  const [ruleMinStaff, setRuleMinStaff] = useState(1);
  const [ruleCalendar, setRuleCalendar] = useState('SUNDAYS_OFF');
  const [isRuleSaving, setIsRuleSaving] = useState(false);

  // Brand handlers
  const openAddBrand = () => {
    setEditingBrand(null);
    setBrandName('');
    setBrandDesc('');
    setBrandPodId(pods[0]?.id || '');
    setBrandModalOpen(true);
  };

  const openEditBrand = (brand) => {
    setEditingBrand(brand);
    setBrandName(brand.name);
    setBrandDesc(brand.description || '');
    setBrandPodId(brand.pod_id);
    setBrandModalOpen(true);
  };

  const handleSaveBrand = async (e) => {
    e.preventDefault();
    if (!brandName.trim() || !brandPodId) {
      showToast('Brand name and Pod are required.', 'warning');
      return;
    }
    setIsBrandSaving(true);
    try {
      if (editingBrand) {
        await api.updateBrand(editingBrand.id, {
          name: brandName.trim(),
          description: brandDesc.trim() || null,
          pod_id: Number(brandPodId),
        });
        showToast('Brand updated successfully.', 'success');
      } else {
        await api.createBrand({
          name: brandName.trim(),
          description: brandDesc.trim() || null,
          pod_id: Number(brandPodId),
        });
        showToast('Brand created successfully.', 'success');
      }
      setBrandModalOpen(false);
      onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to save brand', 'error');
    } finally {
      setIsBrandSaving(false);
    }
  };

  const handleDeleteBrand = async (brand) => {
    if (!window.confirm(`Delete brand ${brand.name}?`)) return;
    try {
      await api.deleteBrand(brand.id);
      showToast(`Brand '${brand.name}' deleted.`, 'success');
      onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to delete brand', 'error');
    }
  };

  // Process handlers
  const openAddProc = () => {
    setEditingProc(null);
    setProcName('');
    setProcModalOpen(true);
  };

  const openEditProc = (proc) => {
    setEditingProc(proc);
    setProcName(proc.name);
    setProcModalOpen(true);
  };

  const handleSaveProc = async (e) => {
    e.preventDefault();
    if (!procName.trim()) {
      showToast('Process name is required.', 'warning');
      return;
    }
    setIsProcSaving(true);
    try {
      if (editingProc) {
        await api.updateProcess(editingProc.id, { name: procName.trim() });
        showToast('Process updated successfully.', 'success');
      } else {
        await api.createProcess({ name: procName.trim() });
        showToast('Process created successfully.', 'success');
      }
      setProcModalOpen(false);
      onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to save process', 'error');
    } finally {
      setIsProcSaving(false);
    }
  };

  const handleDeleteProc = async (proc) => {
    if (!window.confirm(`Delete process ${proc.name}?`)) return;
    try {
      await api.deleteProcess(proc.id);
      showToast(`Process '${proc.name}' deleted.`, 'success');
      onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to delete process', 'error');
    }
  };

  // Brand_Process Rule handlers
  const openAddRule = () => {
    setEditingRule(null);
    setRuleBrandId(brands[0]?.id || '');
    setRuleProcessId(processes[0]?.id || '');
    setRuleMinStaff(1);
    setRuleCalendar('SUNDAYS_OFF');
    setRuleModalOpen(true);
  };

  const openEditRule = (rule) => {
    setEditingRule(rule);
    setRuleBrandId(rule.brand_id);
    setRuleProcessId(rule.process_id);
    setRuleMinStaff(rule.minimum_staff);
    setRuleCalendar(rule.operating_calendar);
    setRuleModalOpen(true);
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    setIsRuleSaving(true);
    try {
      if (editingRule) {
        const id = editingRule.brand_process_id || editingRule.id;
        await api.updateBrandProcess(id, {
          minimum_staff: Number(ruleMinStaff),
          operating_calendar: ruleCalendar,
        });
        showToast('Brand-Process rule updated successfully.', 'success');
      } else {
        await api.createBrandProcess({
          brand_id: Number(ruleBrandId),
          process_id: Number(ruleProcessId),
          minimum_staff: Number(ruleMinStaff),
          operating_calendar: ruleCalendar,
        });
        showToast('Brand-Process rule created successfully.', 'success');
      }
      setRuleModalOpen(false);
      onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to save rule', 'error');
    } finally {
      setIsRuleSaving(false);
    }
  };

  const handleDeleteRule = async (rule) => {
    const id = rule.brand_process_id || rule.id;
    if (!window.confirm(`Delete rule for ${rule.brand_name} - ${rule.process_name}?`)) return;
    try {
      await api.deleteBrandProcess(id);
      showToast('Brand-Process rule removed.', 'success');
      onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to delete rule', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Brand-Process Rules Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              Brand-Process Operating Rules
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Minimum daily staffing requirements and calendar off-day constraints per service.
            </p>
          </div>
          <button
            onClick={openAddRule}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Rule</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="p-3">Brand</th>
                <th className="p-3">Process</th>
                <th className="p-3">Minimum Staff Required</th>
                <th className="p-3">Operating Calendar</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {brandProcesses.map((bp) => (
                <tr key={bp.brand_process_id || bp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{bp.brand_name}</td>
                  <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{bp.process_name}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-500/30">
                      {bp.minimum_staff} Staff
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      {bp.operating_calendar}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditRule(bp)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Rule"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(bp)}
                        className="p-1 rounded text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2-Column Split: Brands & Processes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Brands Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">Brands ({brands.length})</h3>
            <button
              onClick={openAddBrand}
              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-md text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Brand</span>
            </button>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="p-2.5">Name</th>
                <th className="p-2.5">Assigned Pod</th>
                <th className="p-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {brands.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">{b.name}</td>
                  <td className="p-2.5 font-medium text-slate-600 dark:text-slate-400">
                    {b.pod_name || `Pod ${b.pod_id}`}
                  </td>
                  <td className="p-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditBrand(b)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBrand(b)}
                        className="p-1 rounded text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Processes Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              Operational Processes ({processes.length})
            </h3>
            <button
              onClick={openAddProc}
              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-md text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Process</span>
            </button>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="p-2.5">ID</th>
                <th className="p-2.5">Process Name</th>
                <th className="p-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {processes.map((pr) => (
                <tr key={pr.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="p-2.5 text-slate-400 dark:text-slate-500 font-semibold">#{pr.id}</td>
                  <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">{pr.name}</td>
                  <td className="p-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditProc(pr)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProc(pr)}
                        className="p-1 rounded text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Brand Modal */}
      {brandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {editingBrand ? 'Edit Brand' : 'Add Brand'}
              </h4>
              <button onClick={() => setBrandModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
              </button>
            </div>
            <form onSubmit={handleSaveBrand} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Brand Name</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. AeroWear"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Assigned Pod</label>
                <select
                  value={brandPodId}
                  onChange={(e) => setBrandPodId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {pods.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Description (Optional)</label>
                <textarea
                  value={brandDesc}
                  onChange={(e) => setBrandDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setBrandModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBrandSaving}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {isBrandSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Brand</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Process Modal */}
      {procModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {editingProc ? 'Edit Process' : 'Add Process'}
              </h4>
              <button onClick={() => setProcModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
              </button>
            </div>
            <form onSubmit={handleSaveProc} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Process Name</label>
                <input
                  type="text"
                  value={procName}
                  onChange={(e) => setProcName(e.target.value)}
                  placeholder="e.g. Tier-2 Escalations"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setProcModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcSaving}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {isProcSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Process</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brand_Process Rule Modal */}
      {ruleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {editingRule ? 'Edit Operating Rule' : 'Add Brand-Process Rule'}
              </h4>
              <button onClick={() => setRuleModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
              </button>
            </div>
            <form onSubmit={handleSaveRule} className="space-y-3">
              {!editingRule ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Brand</label>
                    <select
                      value={ruleBrandId}
                      onChange={(e) => setRuleBrandId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                    >
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Process</label>
                    <select
                      value={ruleProcessId}
                      onChange={(e) => setRuleProcessId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                    >
                      {processes.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-bold">
                  {editingRule.brand_name} — {editingRule.process_name}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Minimum Staff Required per Active Day
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={ruleMinStaff}
                  onChange={(e) => setRuleMinStaff(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Operating Calendar
                </label>
                <select
                  value={ruleCalendar}
                  onChange={(e) => setRuleCalendar(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                >
                  {CALENDAR_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRuleModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRuleSaving}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {isRuleSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Rule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

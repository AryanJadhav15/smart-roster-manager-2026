import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  X,
  Search,
  Save,
  Loader2,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../api';

export default function AllocationsTab({
  allocations = [],
  employees = [],
  brandProcesses = [],
  onRefresh,
}) {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedBpId, setSelectedBpId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const openAddModal = () => {
    setSelectedEmpId(employees[0]?.id || '');
    setSelectedBpId(brandProcesses[0]?.brand_process_id || brandProcesses[0]?.id || '');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedEmpId || !selectedBpId) {
      showToast('Select an employee and a Brand-Process.', 'warning');
      return;
    }
    setIsSaving(true);
    try {
      await api.createAllocation({
        employee_id: Number(selectedEmpId),
        brand_process_id: Number(selectedBpId),
      });
      showToast('Permanent allocation created successfully.', 'success');
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to assign permanent allocation', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (alloc) => {
    if (
      !window.confirm(
        `Remove permanent allocation for ${alloc.employee_name} on ${alloc.brand_name} - ${alloc.process_name}?`
      )
    )
      return;

    try {
      await api.deleteAllocation(alloc.id);
      showToast('Permanent allocation removed.', 'success');
      onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to remove allocation', 'error');
    }
  };

  const filteredAllocations = allocations.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.employee_name?.toLowerCase().includes(q) ||
      a.brand_name?.toLowerCase().includes(q) ||
      a.process_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Header & Controls */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              Permanent Staff Allocations ({allocations.length})
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Direct mapping of agents to brand services determining daily baseline coverage.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search allocations..."
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Process</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="p-3">ID</th>
                <th className="p-3">Employee</th>
                <th className="p-3">Brand</th>
                <th className="p-3">Process</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAllocations.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 text-slate-400 dark:text-slate-500 font-semibold">#{a.id}</td>
                  <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{a.employee_name}</td>
                  <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{a.brand_name}</td>
                  <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      {a.process_name}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDelete(a)}
                      className="p-1.5 rounded text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Remove Permanent Allocation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAllocations.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs italic">
                    No permanent allocations found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Allocation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Add Permanent Staff Allocation
              </h4>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Select Employee
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.pod_name || `Pod ${e.pod_id}`})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Select Brand-Process
                </label>
                <select
                  value={selectedBpId}
                  onChange={(e) => setSelectedBpId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {brandProcesses.map((bp) => (
                    <option
                      key={bp.brand_process_id || bp.id}
                      value={bp.brand_process_id || bp.id}
                    >
                      {bp.brand_name} — {bp.process_name} (Min: {bp.minimum_staff})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Confirm Allocation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

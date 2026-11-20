import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  X,
  Search,
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Header & Controls */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Permanent Staff Allocations ({allocations.length})
            </h3>
            <p className="text-xs text-slate-500">
              Direct mapping of agents to brand services determining daily baseline coverage.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search allocations..."
                className="bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Permanent Process</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3">ID</th>
                <th className="p-3">Employee</th>
                <th className="p-3">Brand</th>
                <th className="p-3">Process</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAllocations.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3 text-slate-400 font-semibold">#{a.id}</td>
                  <td className="p-3">
                    <span className="font-bold text-slate-900">{a.employee_name}</span>
                  </td>
                  <td className="p-3 font-semibold text-slate-800">{a.brand_name}</td>
                  <td className="p-3 font-medium text-slate-700">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {a.process_name}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDelete(a)}
                      className="p-1.5 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      title="Remove Permanent Allocation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAllocations.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 text-xs italic">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-slate-900 text-sm">
                Add Permanent Staff Allocation
              </h4>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Employee
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.pod_name || `Pod ${e.pod_id}`})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Brand-Process
                </label>
                <select
                  value={selectedBpId}
                  onChange={(e) => setSelectedBpId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  {isSaving ? 'Assigning...' : 'Confirm Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

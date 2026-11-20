import React, { useState } from 'react';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Loader2,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../api';

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export default function PodsEmployeesTab({
  pods = [],
  employees = [],
  onRefresh,
}) {
  const { showToast } = useToast();

  // Pod modal state
  const [podModalOpen, setPodModalOpen] = useState(false);
  const [editingPod, setEditingPod] = useState(null);
  const [podName, setPodName] = useState('');
  const [podLeadId, setPodLeadId] = useState('');
  const [isPodSaving, setIsPodSaving] = useState(false);

  // Employee modal state
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empPodId, setEmpPodId] = useState('');
  const [empIsManager, setEmpIsManager] = useState(false);
  const [empPrefOff, setEmpPrefOff] = useState('Sunday');
  const [isEmpSaving, setIsEmpSaving] = useState(false);

  // Pod handlers
  const openAddPod = () => {
    setEditingPod(null);
    setPodName('');
    setPodLeadId('');
    setPodModalOpen(true);
  };

  const openEditPod = (pod) => {
    setEditingPod(pod);
    setPodName(pod.name || '');
    setPodLeadId(pod.pod_lead_id || '');
    setPodModalOpen(true);
  };

  const handleSavePod = async (e) => {
    e.preventDefault();
    if (!podName.trim()) {
      showToast('Pod name is required', 'warning');
      return;
    }
    setIsPodSaving(true);
    try {
      if (editingPod) {
        await api.updatePod(editingPod.id, {
          name: podName.trim(),
          pod_lead_id: podLeadId ? Number(podLeadId) : null,
        });
        showToast('Pod updated successfully.', 'success');
      } else {
        await api.createPod({
          name: podName.trim(),
          pod_lead_id: podLeadId ? Number(podLeadId) : null,
        });
        showToast('Pod created successfully.', 'success');
      }
      setPodModalOpen(false);
      onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to save pod', 'error');
    } finally {
      setIsPodSaving(false);
    }
  };

  const handleDeletePod = async (pod) => {
    if (!window.confirm(`Are you sure you want to delete ${pod.name}?`)) return;
    try {
      await api.deletePod(pod.id);
      showToast(`Pod '${pod.name}' deleted.`, 'success');
      onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to delete pod', 'error');
    }
  };

  // Employee handlers
  const openAddEmp = () => {
    setEditingEmp(null);
    setEmpName('');
    setEmpEmail('');
    setEmpPhone('');
    setEmpPodId(pods[0]?.id || '');
    setEmpIsManager(false);
    setEmpPrefOff('Sunday');
    setEmpModalOpen(true);
  };

  const openEditEmp = (emp) => {
    setEditingEmp(emp);
    setEmpName(emp.name);
    setEmpEmail(emp.email);
    setEmpPhone(emp.phone);
    setEmpPodId(emp.pod_id);
    setEmpIsManager(Boolean(emp.is_manager));
    setEmpPrefOff(emp.preferred_weekly_off || 'Sunday');
    setEmpModalOpen(true);
  };

  const handleSaveEmp = async (e) => {
    e.preventDefault();
    if (!empName.trim() || !empEmail.trim() || !empPhone.trim() || !empPodId) {
      showToast('Name, email, phone, and pod are required.', 'warning');
      return;
    }

    setIsEmpSaving(true);
    try {
      const payload = {
        name: empName.trim(),
        email: empEmail.trim(),
        phone: empPhone.trim(),
        pod_id: Number(empPodId),
        is_manager: Boolean(empIsManager),
        preferred_weekly_off: empPrefOff,
      };

      if (editingEmp) {
        await api.updateEmployee(editingEmp.id, payload);
        showToast('Employee updated successfully.', 'success');
      } else {
        await api.createEmployee(payload);
        showToast('Employee created successfully.', 'success');
      }
      setEmpModalOpen(false);
      onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to save employee', 'error');
    } finally {
      setIsEmpSaving(false);
    }
  };

  const handleDeleteEmp = async (emp) => {
    if (!window.confirm(`Are you sure you want to delete ${emp.name}?`)) return;
    try {
      await api.deleteEmployee(emp.id);
      showToast(`Employee '${emp.name}' deleted.`, 'success');
      onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to delete employee', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Pods Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">Operational Pods</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Cross-trained agent pods led by designated Pod Leads.
            </p>
          </div>
          <button
            onClick={openAddPod}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Pod</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="p-3">ID</th>
                <th className="p-3">Pod Name</th>
                <th className="p-3">Designated Pod Lead</th>
                <th className="p-3">Staff Count</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pods.map((pod) => {
                const count = employees.filter((e) => e.pod_id === pod.id).length;
                return (
                  <tr key={pod.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-semibold text-slate-400 dark:text-slate-500">#{pod.id}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{pod.name}</td>
                    <td className="p-3">
                      {pod.pod_lead_name ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/15 px-2 py-0.5 rounded border border-indigo-200/60 dark:border-indigo-500/30">
                          <Shield className="w-3 h-3" />
                          {pod.pod_lead_name}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{count} staff</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditPod(pod)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Pod"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePod(pod)}
                          className="p-1 rounded text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete Pod"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Employees Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">Employees Directory</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Staff members, lead status, pod assignments, and preferred weekly offs.
            </p>
          </div>
          <button
            onClick={openAddEmp}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Employee</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="p-3">ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Pod</th>
                <th className="p-3">Role</th>
                <th className="p-3">Preferred Off</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-semibold text-slate-400 dark:text-slate-500">#{emp.id}</td>
                  <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{emp.name}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">
                    <div>{emp.email}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">{emp.phone}</div>
                  </td>
                  <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                    {emp.pod_name || `Pod ${emp.pod_id}`}
                  </td>
                  <td className="p-3">
                    {emp.is_manager ? (
                      <span className="inline-flex items-center gap-1 font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/15 px-2 py-0.5 rounded border border-indigo-200/60 dark:border-indigo-500/30">
                        <Shield className="w-3 h-3" />
                        Pod Lead
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Agent</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {emp.preferred_weekly_off || 'Sunday'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditEmp(emp)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Employee"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEmp(emp)}
                        className="p-1 rounded text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Employee"
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

      {/* Pod Modal */}
      {podModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {editingPod ? 'Edit Pod' : 'Add New Pod'}
              </h4>
              <button
                onClick={() => setPodModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSavePod} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Pod Name
                </label>
                <input
                  type="text"
                  value={podName}
                  onChange={(e) => setPodName(e.target.value)}
                  placeholder="e.g. Pod Delta"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Pod Lead (Optional)
                </label>
                <select
                  value={podLeadId}
                  onChange={(e) => setPodLeadId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">None / Unassigned</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.pod_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPodModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPodSaving}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-2xs disabled:opacity-50"
                >
                  {isPodSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Pod</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Modal */}
      {empModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {editingEmp ? 'Edit Employee' : 'Add New Employee'}
              </h4>
              <button
                onClick={() => setEmpModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEmp} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    placeholder="john@ops.com"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    placeholder="9800000099"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Pod Assignment
                  </label>
                  <select
                    value={empPodId}
                    onChange={(e) => setEmpPodId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {pods.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Preferred Weekly Off
                  </label>
                  <select
                    value={empPrefOff}
                    onChange={(e) => setEmpPrefOff(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={empIsManager}
                    onChange={(e) => setEmpIsManager(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Designate as Pod Lead (Manager)
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEmpModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEmpSaving}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-2xs disabled:opacity-50"
                >
                  {isEmpSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Employee</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

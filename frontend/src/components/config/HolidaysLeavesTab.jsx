import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  X,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../api';

const LEAVE_TYPES = ['PLANNED_LEAVE', 'COMP_OFF', 'SICK_LEAVE'];
const LEAVE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

export default function HolidaysLeavesTab({
  holidays = [],
  leaves = [],
  employees = [],
  onRefresh,
}) {
  const { showToast } = useToast();

  // Holiday modal state
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [holidayDesc, setHolidayDesc] = useState('');
  const [holidayStartDate, setHolidayStartDate] = useState('');
  const [holidayEndDate, setHolidayEndDate] = useState('');
  const [isHolidaySaving, setIsHolidaySaving] = useState(false);

  // Leave modal state
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveEmpId, setLeaveEmpId] = useState('');
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveType, setLeaveType] = useState('PLANNED_LEAVE');
  const [leaveStatus, setLeaveStatus] = useState('APPROVED');
  const [isLeaveSaving, setIsLeaveSaving] = useState(false);

  // Holiday handlers
  const openAddHoliday = () => {
    setHolidayDesc('');
    setHolidayStartDate('2026-11-01');
    setHolidayEndDate('2026-11-01');
    setHolidayModalOpen(true);
  };

  const handleSaveHoliday = async (e) => {
    e.preventDefault();
    if (!holidayDesc.trim() || !holidayStartDate || !holidayEndDate) {
      showToast('Description, start date, and end date are required.', 'warning');
      return;
    }
    setIsHolidaySaving(true);
    try {
      await api.createHoliday({
        description: holidayDesc.trim(),
        start_date: holidayStartDate,
        end_date: holidayEndDate,
      });
      showToast('Public holiday created successfully.', 'success');
      setHolidayModalOpen(false);
      onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to create holiday', 'error');
    } finally {
      setIsHolidaySaving(false);
    }
  };

  const handleDeleteHoliday = async (holiday) => {
    if (!window.confirm(`Delete holiday '${holiday.description}'?`)) return;
    try {
      await api.deleteHoliday(holiday.id);
      showToast('Public holiday deleted.', 'success');
      onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to delete holiday', 'error');
    }
  };

  // Leave handlers
  const openAddLeave = () => {
    setLeaveEmpId(employees[0]?.id || '');
    setLeaveStartDate('2026-11-05');
    setLeaveEndDate('2026-11-06');
    setLeaveType('PLANNED_LEAVE');
    setLeaveStatus('APPROVED');
    setLeaveModalOpen(true);
  };

  const handleSaveLeave = async (e) => {
    e.preventDefault();
    if (!leaveEmpId || !leaveStartDate || !leaveEndDate) {
      showToast('Employee and dates are required.', 'warning');
      return;
    }
    setIsLeaveSaving(true);
    try {
      await api.createLeave({
        employee_id: Number(leaveEmpId),
        start_date: leaveStartDate,
        end_date: leaveEndDate,
        type: leaveType,
        status: leaveStatus,
      });
      showToast('Employee leave created successfully.', 'success');
      setLeaveModalOpen(false);
      onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to submit leave', 'error');
    } finally {
      setIsLeaveSaving(false);
    }
  };

  const handleUpdateLeaveStatus = async (leaveId, newStatus) => {
    try {
      await api.updateLeave(leaveId, { status: newStatus });
      showToast(`Leave status updated to ${newStatus}.`, 'success');
      onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to update leave status', 'error');
    }
  };

  const handleDeleteLeave = async (leave) => {
    if (!window.confirm(`Delete leave for ${leave.employee_name}?`)) return;
    try {
      await api.deleteLeave(leave.id);
      showToast('Leave record removed.', 'success');
      onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to delete leave', 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Helpful banner regarding Regenerate Roster */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3 shadow-2xs">
        <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-900 leading-relaxed">
          <strong className="font-extrabold block mb-0.5">
            Operational Note for Roster Regeneration:
          </strong>
          Approved leaves and public holidays are automatically taken into account when calculating monthly shifts and weekly off assignments. After approving, creating, or editing leaves here, switch to the <strong>Roster Workspace</strong> and click <strong>"Regenerate Roster"</strong> to apply these changes to the active monthly grid.
        </div>
      </div>

      {/* 1. Public Holidays Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Company Public Holidays ({holidays.length})
            </h3>
            <p className="text-xs text-slate-500">
              Gazetted and regional holidays observed by operations.
            </p>
          </div>
          <button
            onClick={openAddHoliday}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Public Holiday</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3">ID</th>
                <th className="p-3">Holiday Description</th>
                <th className="p-3">Start Date</th>
                <th className="p-3">End Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {holidays.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3 text-slate-400 font-semibold">#{h.id}</td>
                  <td className="p-3 font-bold text-slate-900">{h.description}</td>
                  <td className="p-3 font-semibold text-slate-700">{h.start_date}</td>
                  <td className="p-3 font-semibold text-slate-700">{h.end_date}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDeleteHoliday(h)}
                      className="p-1.5 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      title="Delete Holiday"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Employee Leaves Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Employee Leave Requests & Records ({leaves.length})
            </h3>
            <p className="text-xs text-slate-500">
              Planned leaves, comp offs, and sick leaves with auto-calculated duration.
            </p>
          </div>
          <button
            onClick={openAddLeave}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Leave Request</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3">Employee</th>
                <th className="p-3">Leave Type</th>
                <th className="p-3">Start Date</th>
                <th className="p-3">End Date</th>
                <th className="p-3">Total Days (DB)</th>
                <th className="p-3">Approval Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaves.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{l.employee_name}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      {l.type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-slate-700">{l.start_date}</td>
                  <td className="p-3 font-semibold text-slate-700">{l.end_date}</td>
                  <td className="p-3">
                    <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {l.total_days} {l.total_days === 1 ? 'day' : 'days'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider ${
                        l.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : l.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {l.status !== 'APPROVED' && (
                        <button
                          onClick={() => handleUpdateLeaveStatus(l.id, 'APPROVED')}
                          className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold border border-emerald-200 flex items-center gap-1"
                          title="Approve Leave"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                      )}
                      {l.status !== 'REJECTED' && (
                        <button
                          onClick={() => handleUpdateLeaveStatus(l.id, 'REJECTED')}
                          className="px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] font-bold border border-rose-200 flex items-center gap-1"
                          title="Reject Leave"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteLeave(l)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors ml-1"
                        title="Delete Leave Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Holiday Modal */}
      {holidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-slate-900 text-sm">Add Public Holiday</h4>
              <button onClick={() => setHolidayModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSaveHoliday} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={holidayDesc}
                  onChange={(e) => setHolidayDesc(e.target.value)}
                  placeholder="e.g. Diwali"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={holidayStartDate}
                    onChange={(e) => setHolidayStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={holidayEndDate}
                    onChange={(e) => setHolidayEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setHolidayModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isHolidaySaving}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  {isHolidaySaving ? 'Saving...' : 'Save Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Modal */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-slate-900 text-sm">Add Employee Leave</h4>
              <button onClick={() => setLeaveModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSaveLeave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Employee
                </label>
                <select
                  value={leaveEmpId}
                  onChange={(e) => setLeaveEmpId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.pod_name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Leave Type</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                  >
                    {LEAVE_TYPES.map((t) => (
                      <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={leaveStatus}
                    onChange={(e) => setLeaveStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                  >
                    {LEAVE_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setLeaveModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLeaveSaving}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  {isLeaveSaving ? 'Saving...' : 'Submit Leave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

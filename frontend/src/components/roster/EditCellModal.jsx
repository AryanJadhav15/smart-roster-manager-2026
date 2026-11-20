import React, { useState } from 'react';
import {
  X,
  Save,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../api';

const STATUS_OPTIONS = [
  { value: 'WORKING', label: 'Working (W)' },
  { value: 'WEEKLY_OFF', label: 'Weekly Off (WO)' },
  { value: 'PUBLIC_HOLIDAY', label: 'Public Holiday (PH)' },
  { value: 'PLANNED_LEAVE', label: 'Planned Leave (PL)' },
  { value: 'COMP_OFF', label: 'Comp Off (CO)' },
  { value: 'SICK_LEAVE', label: 'Sick Leave (SL)' },
];

export default function EditCellModal({
  isOpen,
  onClose,
  employee,
  cell,
  date,
  brandProcesses = [],
  onEntryUpdated,
}) {
  const { showToast } = useToast();

  const [status, setStatus] = useState(cell?.status || 'WORKING');
  const [notes, setNotes] = useState(cell?.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  // Temp cover assignment state
  const [selectedBpId, setSelectedBpId] = useState('');
  const [coverNotes, setCoverNotes] = useState('');
  const [isAddingCover, setIsAddingCover] = useState(false);
  const [isDeletingCoverId, setIsDeletingCoverId] = useState(null);

  React.useEffect(() => {
    if (cell) {
      setStatus(cell.status || 'WORKING');
      setNotes(cell.notes || '');
      setSelectedBpId(brandProcesses[0]?.brand_process_id || brandProcesses[0]?.id || '');
      setCoverNotes('');
    }
  }, [cell, brandProcesses]);

  if (!isOpen || !cell || !employee) return null;

  // Handle saving status & notes
  const handleSaveEntry = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.updateRosterEntry(cell.id, {
        status,
        notes: notes.trim() || null,
        is_manual_override: true,
      });
      showToast('Shift status updated and roster re-validated.', 'success');
      onEntryUpdated(res);
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to update entry', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle adding temporary cover
  const handleAddCover = async (e) => {
    e.preventDefault();
    if (!selectedBpId) {
      showToast('Please select a Brand-Process for coverage.', 'warning');
      return;
    }

    setIsAddingCover(true);
    try {
      const res = await api.assignTempCover({
        roster_entry_id: cell.id,
        brand_process_id: Number(selectedBpId),
        notes: coverNotes.trim() || 'Assigned via cell editor',
      });
      showToast('Temporary cover assigned and roster re-validated.', 'success');
      onEntryUpdated(res);
      setCoverNotes('');
    } catch (err) {
      showToast(err.message || 'Failed to assign temporary cover', 'error');
    } finally {
      setIsAddingCover(false);
    }
  };

  // Handle removing temporary cover
  const handleDeleteCover = async (coverId) => {
    setIsDeletingCoverId(coverId);
    try {
      const res = await api.removeTempCover(coverId);
      showToast('Temporary cover removed and roster re-validated.', 'success');
      onEntryUpdated(res);
    } catch (err) {
      showToast(err.message || 'Failed to remove cover', 'error');
    } finally {
      setIsDeletingCoverId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white">
                Edit Roster Entry
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                {date}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {employee.name} ({employee.pod_name || `Pod ${employee.pod_id}`})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Form 1: Status & Notes */}
          <form onSubmit={handleSaveEntry} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Shift Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Override Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for schedule adjustment..."
                rows={2}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-2xs transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save Status</span>
              </button>
            </div>
          </form>

          {/* Section 2: Temporary Covers */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3.5">
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Temporary Cover Assignment
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Assign this employee to cover a process for another brand on this date.
              </p>
            </div>

            {/* List Existing Covers */}
            {cell.temp_covers && cell.temp_covers.length > 0 ? (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Active Covers on this Cell:
                </span>
                {cell.temp_covers.map((cov) => (
                  <div
                    key={cov.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 text-xs"
                  >
                    <div>
                      <div className="font-bold text-purple-900 dark:text-purple-300">
                        {cov.brand_name} • {cov.process_name}
                      </div>
                      {cov.notes && (
                        <div className="text-[11px] text-purple-700 dark:text-purple-400 italic">
                          "{cov.notes}"
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCover(cov.id)}
                      disabled={isDeletingCoverId === cov.id}
                      className="p-1 rounded text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors"
                      title="Remove Temporary Cover"
                    >
                      {isDeletingCoverId === cov.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Assign New Cover Form */}
            {status === 'WORKING' ? (
              <form
                onSubmit={handleAddCover}
                className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 space-y-2.5"
              >
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Assign Additional Brand-Process Cover</span>
                </div>

                <div>
                  <select
                    value={selectedBpId}
                    onChange={(e) => setSelectedBpId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {brandProcesses.map((bp) => (
                      <option
                        key={bp.brand_process_id || bp.id}
                        value={bp.brand_process_id || bp.id}
                      >
                        {bp.brand_name} — {bp.process_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <input
                    type="text"
                    value={coverNotes}
                    onChange={(e) => setCoverNotes(e.target.value)}
                    placeholder="Cover reason/notes (optional)..."
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAddingCover}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-purple-700 dark:bg-purple-600 hover:bg-purple-800 dark:hover:bg-purple-700 text-white rounded-md text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isAddingCover ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Assign Temporary Cover</span>
                </button>
              </form>
            ) : (
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <span>
                  Employee must have <strong>WORKING</strong> status to provide temporary coverage for other processes.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

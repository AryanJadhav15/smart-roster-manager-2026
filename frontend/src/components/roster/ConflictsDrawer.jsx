import React, { useState, useMemo } from 'react';
import {
  X,
  AlertOctagon,
  AlertTriangle,
  GitFork,
  Search,
  CheckCircle2,
  UserPlus,
  Loader2,
  Calendar,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../api';

export default function ConflictsDrawer({
  isOpen,
  onClose,
  conflicts = [],
  summary,
  onConflictResolved,
  initialTab = 'ALL',
}) {
  const { showToast } = useToast();
  const [filterTab, setFilterTab] = useState(initialTab); // 'ALL' | 'CRITICAL' | 'WARNINGS' | 'CASCADES'
  const [searchQuery, setSearchQuery] = useState('');
  const [assigningId, setAssigningId] = useState(null);

  React.useEffect(() => {
    if (initialTab) {
      setFilterTab(initialTab);
    }
  }, [initialTab]);

  // Filter and search conflicts
  const filteredConflicts = useMemo(() => {
    return conflicts.filter((c) => {
      // Tab filter
      if (filterTab === 'CRITICAL' && c.severity !== 'CRITICAL') return false;
      if (filterTab === 'WARNINGS' && c.severity !== 'WARNING') return false;
      if (filterTab === 'CASCADES' && c.type !== 'MULTI_BRAND_CASCADE') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const brandMatch = c.brandName?.toLowerCase().includes(q);
        const processMatch = c.processName?.toLowerCase().includes(q);
        const empMatch = c.employeeName?.toLowerCase().includes(q);
        const dateMatch = c.date?.toLowerCase().includes(q);
        const msgMatch = c.message?.toLowerCase().includes(q);
        const absentMatch = c.absentEmployees?.some((a) =>
          a.name?.toLowerCase().includes(q)
        );
        return brandMatch || processMatch || empMatch || dateMatch || msgMatch || absentMatch;
      }

      return true;
    });
  }, [conflicts, filterTab, searchQuery]);

  // Handle 1-Click Backup Cover Assignment
  const handleAssignBackup = async (conflict, backup) => {
    const backupEmpId = backup.employeeId || backup.id;
    const actionKey = `${conflict.date}_${conflict.brandProcessId}_${backupEmpId}`;
    setAssigningId(actionKey);

    try {
      const res = await api.assignTempCover({
        employee_id: backupEmpId,
        date: conflict.date,
        brand_process_id: conflict.brandProcessId,
        notes: `Assigned via conflict resolver to cover ${conflict.brandName} - ${conflict.processName}`,
      });

      showToast(
        `Assigned ${backup.name} as cover for ${conflict.brandName} on ${conflict.date}!`,
        'success'
      );
      onConflictResolved(res);
    } catch (err) {
      showToast(err.message || 'Failed to assign backup cover', 'error');
    } finally {
      setAssigningId(null);
    }
  };

  if (!isOpen) return null;

  const criticalCount = summary?.criticalCount ?? 0;
  const warningCount = summary?.warningCount ?? 0;
  const cascadeCount = summary?.cascadeCount ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight text-white">
                Roster Conflicts & Coverage Gaps
              </h2>
              <p className="text-xs text-slate-400">
                Live constraint violations & 1-click backup resolvers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills & Search */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all shrink-0 ${
                filterTab === 'ALL'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              All ({conflicts.length})
            </button>

            <button
              onClick={() => setFilterTab('CRITICAL')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all shrink-0 ${
                filterTab === 'CRITICAL'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50'
              }`}
            >
              <AlertOctagon className="w-3 h-3" />
              <span>Critical ({criticalCount})</span>
            </button>

            <button
              onClick={() => setFilterTab('WARNINGS')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all shrink-0 ${
                filterTab === 'WARNINGS'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Warnings ({warningCount})</span>
            </button>

            <button
              onClick={() => setFilterTab('CASCADES')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all shrink-0 ${
                filterTab === 'CASCADES'
                  ? 'bg-purple-700 dark:bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50'
              }`}
            >
              <GitFork className="w-3 h-3" />
              <span>Cascades ({cascadeCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by Brand, Process, Agent, or Date (YYYY-MM-DD)..."
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Conflicts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950">
          {filteredConflicts.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                No matching conflicts found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {searchQuery
                  ? 'Try adjusting your search criteria.'
                  : 'All constraints are satisfied for this category.'}
              </p>
            </div>
          ) : (
            filteredConflicts.map((c, idx) => {
              const isCritical = c.severity === 'CRITICAL';
              const isCoverageConflict =
                c.type === 'UNSTAFFED_PROCESS' || c.type === 'UNDERSTAFFED_PROCESS';

              return (
                <div
                  key={idx}
                  className={`bg-white dark:bg-slate-900 rounded-lg border p-3.5 space-y-2.5 transition-all shadow-2xs ${
                    isCritical
                      ? 'border-rose-200 dark:border-rose-900/40'
                      : 'border-amber-200 dark:border-amber-900/40'
                  }`}
                >
                  {/* Top Badge Line */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isCritical
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                            : 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                        }`}
                      >
                        {c.severity}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {c.type}
                      </span>
                      {c.date && (
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {c.date} {c.dayName ? `(${c.dayName})` : ''}
                        </span>
                      )}
                    </div>

                    {isCoverageConflict && (
                      <div className="px-1.5 py-0.2 rounded bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-[11px] font-bold shrink-0">
                        {c.activeStaff} / {c.requiredStaff} Staff
                      </div>
                    )}
                  </div>

                  {/* Core Message */}
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                    {c.message}
                  </p>

                  {/* Absent employees details */}
                  {c.absentEmployees && c.absentEmployees.length > 0 && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-md border border-slate-200 dark:border-slate-700/80">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Absent Permanent Staff:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {c.absentEmployees.map((a, aIdx) => (
                          <span
                            key={aIdx}
                            className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                          >
                            {a.name} ({a.status})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 1-Click Backup Recommendations */}
                  {isCoverageConflict && c.suggestedBackups && c.suggestedBackups.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Recommended Same-Pod Backups:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {c.suggestedBackups.map((backup) => {
                          const backupEmpId = backup.employeeId || backup.id;
                          const actionKey = `${c.date}_${c.brandProcessId}_${backupEmpId}`;
                          const isActing = assigningId === actionKey;

                          return (
                            <button
                              key={backupEmpId}
                              onClick={() => handleAssignBackup(c, backup)}
                              disabled={isActing}
                              className="flex items-center gap-1.5 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-md text-xs font-semibold shadow-2xs transition-all disabled:opacity-50"
                              title={`Current Process Load: ${backup.currentProcessLoad} processes. ${
                                backup.isManager ? 'Pod Lead' : 'Agent'
                              }`}
                            >
                              {isActing ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <UserPlus className="w-3 h-3" />
                              )}
                              <span>Assign {backup.name}</span>
                              {backup.isManager && (
                                <span className="text-[9px] bg-emerald-800 dark:bg-emerald-900 px-1 rounded font-bold">
                                  Lead
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredConflicts.length}</strong> of{' '}
            <strong className="text-slate-800 dark:text-slate-200">{conflicts.length}</strong> conflicts
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}

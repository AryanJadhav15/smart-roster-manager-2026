import React from 'react';
import {
  Shield,
  Mail,
  Phone,
  Calendar,
  AlertTriangle,
  Clock,
} from 'lucide-react';

const STATUS_CONFIG = {
  WORKING: {
    code: 'W',
    label: 'Working',
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 dark:hover:bg-emerald-500/25',
  },
  WEEKLY_OFF: {
    code: 'WO',
    label: 'Weekly Off',
    bg: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/60 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/60 dark:hover:bg-slate-800',
  },
  PUBLIC_HOLIDAY: {
    code: 'PH',
    label: 'Public Holiday',
    bg: 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30 dark:hover:bg-sky-500/25',
  },
  PLANNED_LEAVE: {
    code: 'PL',
    label: 'Planned Leave',
    bg: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 dark:hover:bg-amber-500/25',
  },
  COMP_OFF: {
    code: 'CO',
    label: 'Comp Off',
    bg: 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30 dark:hover:bg-teal-500/25',
  },
  SICK_LEAVE: {
    code: 'SL',
    label: 'Sick Leave',
    bg: 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30 dark:hover:bg-rose-500/25',
  },
};

export default function EmployeeDetailView({
  employee,
  dates = [],
  conflicts = [],
  onCellClick,
}) {
  if (!employee) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        No employee selected.
      </div>
    );
  }

  // Calculate monthly counters
  let workingDays = 0;
  let weeklyOffDays = 0;
  let holidayDays = 0;
  let leaveDays = 0;
  let tempCoversAssigned = 0;

  dates.forEach((dateStr) => {
    const cell = employee.schedule?.[dateStr];
    if (!cell) return;
    if (cell.status === 'WORKING') workingDays += 1;
    else if (cell.status === 'WEEKLY_OFF') weeklyOffDays += 1;
    else if (cell.status === 'PUBLIC_HOLIDAY') holidayDays += 1;
    else if (['PLANNED_LEAVE', 'COMP_OFF', 'SICK_LEAVE'].includes(cell.status))
      leaveDays += 1;

    if (cell.temp_covers && cell.temp_covers.length > 0) {
      tempCoversAssigned += cell.temp_covers.length;
    }
  });

  // Filter conflicts involving this employee
  const empConflicts = conflicts.filter(
    (c) =>
      c.employeeId === employee.id ||
      c.absentEmployees?.some((a) => a.employeeId === employee.id)
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-[1400px] mx-auto w-full space-y-5">
      {/* Top Section: Profile Card + Monthly Summary Counters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-base">
              {employee.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  {employee.name}
                </h2>
                {employee.is_manager ? (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                    <Shield className="w-2.5 h-2.5" />
                    Lead
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {employee.pod_name || `Pod ${employee.pod_id}`}
              </p>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span className="truncate">{employee.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>{employee.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>
                Pref Off:{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {employee.preferred_weekly_off || 'Sunday'}
                </strong>
              </span>
            </div>
          </div>

          {/* Assigned Brand-Processes */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
              Permanent Allocations
            </span>
            <div className="flex flex-wrap gap-1">
              {employee.allocations?.map((a, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  {a.brand_name} • {a.process_name}
                </span>
              ))}
              {(!employee.allocations || employee.allocations.length === 0) && (
                <span className="text-xs text-slate-400 italic">
                  No permanent brand processes allocated.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Counters */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 flex flex-col justify-between shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Working Days</span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {workingDays}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Scheduled shifts</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 flex flex-col justify-between shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Weekly Offs</span>
            <div className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">
              {weeklyOffDays}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Days off</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 flex flex-col justify-between shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Public Holidays</span>
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">
              {holidayDays}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Company holidays</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 flex flex-col justify-between shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Leaves Taken</span>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {leaveDays}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Planned / Comp / Sick</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 flex flex-col justify-between shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Temporary Covers</span>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
              {tempCoversAssigned}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Cover shifts provided</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 flex flex-col justify-between shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Related Conflicts</span>
            <div
              className={`text-2xl font-bold mt-1 ${
                empConflicts.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              {empConflicts.length}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Violations / Warnings</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              Monthly Schedule Calendar (Click date to edit)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
            Click any cell to change status or assign cover
          </span>
        </div>

        {/* 7-column Calendar Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-1">
          {dates.map((dateStr) => {
            const parts = dateStr.split('-');
            const dayNum = Number(parts[2]);
            const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, dayNum));
            const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()];
            const isSunday = d.getUTCDay() === 0;

            const cell = employee.schedule?.[dateStr];
            const status = cell?.status || 'WEEKLY_OFF';
            const config = STATUS_CONFIG[status] || STATUS_CONFIG.WEEKLY_OFF;
            const hasCovers = cell?.temp_covers && cell.temp_covers.length > 0;
            const isManual = cell?.is_manual_override;

            return (
              <div
                key={dateStr}
                onClick={() => cell && onCellClick(employee, cell, dateStr)}
                className={`p-2.5 rounded-lg border cursor-pointer select-none transition-all hover:scale-[1.02] shadow-2xs relative ${
                  config.bg
                } ${isSunday ? 'ring-1 ring-rose-200/50 dark:ring-rose-800/40' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{dayNum}</span>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
                    {dayName}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-extrabold">{config.code}</span>
                  <span className="text-[10px] font-medium truncate max-w-[80px]">
                    {config.label}
                  </span>
                </div>

                {isManual && (
                  <span className="inline-block mt-1 text-[9px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/20 px-1 py-0.2 rounded">
                    Manual
                  </span>
                )}

                {hasCovers && (
                  <div className="mt-1 text-[9px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-500/20 px-1 py-0.2 rounded truncate">
                    +Cov ({cell.temp_covers.length})
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Conflicts Involving this Employee */}
      {empConflicts.length > 0 && (
        <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/40 p-4 sm:p-5 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <h3 className="text-xs sm:text-sm font-bold">
              Active Conflicts Involving {employee.name} ({empConflicts.length})
            </h3>
          </div>
          <div className="space-y-1.5">
            {empConflicts.map((c, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50 text-xs text-slate-700 dark:text-slate-300 shadow-2xs flex items-start gap-2.5"
              >
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase shrink-0 ${
                    c.severity === 'CRITICAL'
                      ? 'bg-rose-600 text-white'
                      : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  {c.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{c.message}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Date: <strong className="text-slate-700 dark:text-slate-300">{c.date}</strong> • Type:{' '}
                    <code>{c.type}</code>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

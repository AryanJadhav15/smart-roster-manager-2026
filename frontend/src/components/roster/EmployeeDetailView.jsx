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
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100',
  },
  WEEKLY_OFF: {
    code: 'WO',
    label: 'Weekly Off',
    bg: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200',
  },
  PUBLIC_HOLIDAY: {
    code: 'PH',
    label: 'Public Holiday',
    bg: 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100',
  },
  PLANNED_LEAVE: {
    code: 'PL',
    label: 'Planned Leave',
    bg: 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100',
  },
  COMP_OFF: {
    code: 'CO',
    label: 'Comp Off',
    bg: 'bg-teal-50 text-teal-800 border-teal-300 hover:bg-teal-100',
  },
  SICK_LEAVE: {
    code: 'SL',
    label: 'Sick Leave',
    bg: 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100',
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
      <div className="p-8 text-center text-slate-500 text-sm">
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
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-[1500px] mx-auto w-full space-y-6">
      {/* Top Section: Profile Card + Monthly Summary Counters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-black text-lg">
              {employee.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 truncate">
                  {employee.name}
                </h2>
                {employee.is_manager ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    <Shield className="w-3 h-3" />
                    Pod Lead
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {employee.pod_name || `Pod ${employee.pod_id}`}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">{employee.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{employee.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Preferred Weekly Off:{' '}
                <strong className="text-slate-800">
                  {employee.preferred_weekly_off || 'Sunday'}
                </strong>
              </span>
            </div>
          </div>

          {/* Assigned Brand-Processes */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Permanent Allocations
            </span>
            <div className="flex flex-wrap gap-1.5">
              {employee.allocations?.map((a, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200"
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
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500">Working Days</span>
            <div className="text-2xl font-black text-emerald-600 mt-2">
              {workingDays}
            </div>
            <span className="text-[11px] text-slate-400 mt-1">Scheduled shifts</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500">Weekly Offs</span>
            <div className="text-2xl font-black text-slate-700 mt-2">
              {weeklyOffDays}
            </div>
            <span className="text-[11px] text-slate-400 mt-1">Days off</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500">Public Holidays</span>
            <div className="text-2xl font-black text-blue-600 mt-2">
              {holidayDays}
            </div>
            <span className="text-[11px] text-slate-400 mt-1">Company holidays</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500">Leaves Taken</span>
            <div className="text-2xl font-black text-amber-600 mt-2">
              {leaveDays}
            </div>
            <span className="text-[11px] text-slate-400 mt-1">
              Planned / Comp / Sick
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500">Temporary Covers</span>
            <div className="text-2xl font-black text-purple-600 mt-2">
              {tempCoversAssigned}
            </div>
            <span className="text-[11px] text-slate-400 mt-1">
              Cover shifts provided
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500">Related Conflicts</span>
            <div
              className={`text-2xl font-black mt-2 ${
                empConflicts.length > 0 ? 'text-rose-600' : 'text-slate-400'
              }`}
            >
              {empConflicts.length}
            </div>
            <span className="text-[11px] text-slate-400 mt-1">
              Violations / Warnings
            </span>
          </div>
        </div>
      </div>

      {/* Middle Section: Clean Monthly Calendar Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Monthly Schedule Calendar (Click date to edit)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Click any cell to change status or assign cover
          </span>
        </div>

        {/* 7-column Calendar Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2">
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
                } ${isSunday ? 'ring-1 ring-rose-200' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black">{dayNum}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-500">
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
                  <span className="inline-block mt-1 text-[9px] font-bold text-indigo-700 bg-indigo-100 px-1 py-0.2 rounded">
                    Manual
                  </span>
                )}

                {hasCovers && (
                  <div className="mt-1 text-[9px] font-extrabold text-purple-700 bg-purple-100 px-1 py-0.2 rounded truncate">
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
        <div className="bg-rose-50/60 rounded-xl border border-rose-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h3 className="text-sm font-bold">
              Active Conflicts Involving {employee.name} ({empConflicts.length})
            </h3>
          </div>
          <div className="space-y-2">
            {empConflicts.map((c, idx) => (
              <div
                key={idx}
                className="bg-white p-3 rounded-lg border border-rose-200 text-xs text-slate-700 shadow-2xs flex items-start gap-2.5"
              >
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0 ${
                    c.severity === 'CRITICAL'
                      ? 'bg-rose-600 text-white'
                      : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  {c.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{c.message}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Date: <strong className="text-slate-700">{c.date}</strong> • Type:{' '}
                    <code className="text-slate-800">{c.type}</code>
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

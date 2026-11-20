import React from 'react';
import { Shield } from 'lucide-react';

const STATUS_CONFIG = {
  WORKING: {
    code: 'W',
    label: 'Working',
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 dark:hover:bg-emerald-500/25',
  },
  WEEKLY_OFF: {
    code: 'WO',
    label: 'Weekly Off',
    bg: 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/60 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/60 dark:hover:bg-slate-800',
  },
  PUBLIC_HOLIDAY: {
    code: 'PH',
    label: 'Public Holiday',
    bg: 'bg-sky-50 text-sky-800 border-sky-200/80 hover:bg-sky-100 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30 dark:hover:bg-sky-500/25',
  },
  PLANNED_LEAVE: {
    code: 'PL',
    label: 'Planned Leave',
    bg: 'bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 dark:hover:bg-amber-500/25',
  },
  COMP_OFF: {
    code: 'CO',
    label: 'Comp Off',
    bg: 'bg-teal-50 text-teal-800 border-teal-200/80 hover:bg-teal-100 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30 dark:hover:bg-teal-500/25',
  },
  SICK_LEAVE: {
    code: 'SL',
    label: 'Sick Leave',
    bg: 'bg-rose-50 text-rose-800 border-rose-200/80 hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30 dark:hover:bg-rose-500/25',
  },
};

export default function RosterGrid({
  dates = [],
  employees = [],
  onCellClick,
  publicHolidays = [],
  groupByPod = false,
}) {
  const getDayInfo = (dateStr) => {
    const parts = dateStr.split('-');
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    const d = new Date(Date.UTC(year, month, day));
    const dayOfWeek = d.getUTCDay();
    const isSunday = dayOfWeek === 0;

    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek];
    const isHoliday = publicHolidays.some(
      (h) => dateStr >= h.start_date && dateStr <= h.end_date
    );

    return { day, dayName, isSunday, isHoliday };
  };

  // Group by Pod if needed
  const groupedEmployees = React.useMemo(() => {
    if (!groupByPod) {
      return [{ podName: null, emps: employees }];
    }

    const map = new Map();
    employees.forEach((emp) => {
      const pod = emp.pod_name || `Pod ${emp.pod_id}`;
      if (!map.has(pod)) map.set(pod, []);
      map.get(pod).push(emp);
    });

    return Array.from(map.entries()).map(([podName, emps]) => ({
      podName,
      emps,
    }));
  }, [employees, groupByPod]);

  return (
    <div className="flex-1 w-full overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950">
      <div className="flex-1 overflow-auto relative">
        <table className="w-full border-separate border-spacing-0 text-left">
          {/* Sticky Header Row */}
          <thead className="sticky top-0 z-20 shadow-xs">
            <tr>
              {/* Sticky Left Column Header */}
              <th className="sticky left-0 z-30 bg-slate-50 dark:bg-slate-900 min-w-[240px] max-w-[270px] p-3 text-xs font-bold text-slate-700 dark:text-slate-300 border-b border-r border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span>Employee / Allocations</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                    {employees.length} Staff
                  </span>
                </div>
              </th>

              {/* 30-Day Headers */}
              {dates.map((dateStr) => {
                const { day, dayName, isSunday, isHoliday } = getDayInfo(dateStr);
                return (
                  <th
                    key={dateStr}
                    className={`min-w-[46px] w-[46px] p-1.5 text-center border-b border-r border-slate-200 dark:border-slate-800 transition-colors select-none ${
                      isSunday
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300'
                        : isHoliday
                        ? 'bg-sky-50/50 dark:bg-sky-950/20 text-sky-800 dark:text-sky-300'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-[11px] leading-tight font-extrabold">{day}</div>
                    <div
                      className={`text-[9px] uppercase tracking-wider font-semibold ${
                        isSunday
                          ? 'text-rose-600 dark:text-rose-400'
                          : isHoliday
                          ? 'text-sky-600 dark:text-sky-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {dayName}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-xs">
            {groupedEmployees.map((group, groupIdx) => (
              <React.Fragment key={group.podName || groupIdx}>
                {/* Pod Section Header if grouping */}
                {group.podName && (
                  <tr>
                    <td
                      colSpan={dates.length + 1}
                      className="sticky left-0 bg-slate-100/95 dark:bg-slate-800/90 backdrop-blur-sm px-3.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 border-y border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                        <span>{group.podName}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          ({group.emps.length} members)
                        </span>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Employees in Group */}
                {group.emps.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Sticky Left Employee Header */}
                    <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-850 min-w-[240px] max-w-[270px] p-2.5 border-r border-b border-slate-200 dark:border-slate-800 shadow-[1px_0_2px_rgba(0,0,0,0.02)]">
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                              {emp.name}
                            </span>
                            {emp.is_manager ? (
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-500/30"
                                title="Pod Lead"
                              >
                                <Shield className="w-2.5 h-2.5" />
                                Lead
                              </span>
                            ) : null}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            Pref Off: <span className="font-semibold">{emp.preferred_weekly_off || 'Sunday'}</span>
                          </div>
                          {/* Allocations Tag Cloud - max 2 tags + +N */}
                          <div className="flex items-center gap-1 mt-1">
                            {emp.allocations?.slice(0, 2).map((alloc, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60 truncate max-w-[105px]"
                                title={`${alloc.brand_name} - ${alloc.process_name}`}
                              >
                                {alloc.brand_name.split(' ')[0]} • {alloc.process_name.split(' ')[0]}
                              </span>
                            ))}
                            {(emp.allocations?.length || 0) > 2 && (
                              <span
                                className="px-1 py-0.2 rounded text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 cursor-default"
                                title={emp.allocations.slice(2).map(a => `${a.brand_name} (${a.process_name})`).join(', ')}
                              >
                                +{(emp.allocations?.length || 0) - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Schedule Date Cells */}
                    {dates.map((dateStr) => {
                      const { isSunday, isHoliday } = getDayInfo(dateStr);
                      const cell = emp.schedule?.[dateStr];
                      const status = cell?.status || 'WEEKLY_OFF';
                      const config = STATUS_CONFIG[status] || STATUS_CONFIG.WEEKLY_OFF;
                      const hasCovers = cell?.temp_covers && cell.temp_covers.length > 0;
                      const isManual = cell?.is_manual_override;

                      return (
                        <td
                          key={dateStr}
                          onClick={() => cell && onCellClick(emp, cell, dateStr)}
                          className={`min-w-[46px] w-[46px] p-1 text-center border-r border-b border-slate-200 dark:border-slate-800 cursor-pointer select-none relative transition-colors ${
                            isSunday
                              ? 'bg-rose-50/20 dark:bg-rose-950/10'
                              : isHoliday
                              ? 'bg-sky-50/20 dark:bg-sky-950/10'
                              : ''
                          }`}
                        >
                          <div
                            className={`w-full h-8 flex flex-col items-center justify-center rounded border text-[11px] font-bold transition-all relative ${config.bg}`}
                            title={`${emp.name} on ${dateStr}: ${config.label}${
                              cell?.notes ? ` | Notes: ${cell.notes}` : ''
                            }${
                              hasCovers
                                ? ` | Temp Cover: ${cell.temp_covers.map((c) => `${c.brand_name}-${c.process_name}`).join(', ')}`
                                : ''
                            }`}
                          >
                            <span>{config.code}</span>

                            {/* Manual Override Pin Badge */}
                            {isManual && (
                              <span
                                className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 ring-1 ring-white dark:ring-slate-900"
                                title="Manual Override"
                              />
                            )}

                            {/* Temp Cover Indicator */}
                            {hasCovers && (
                              <span
                                className="absolute -bottom-1 inset-x-0 mx-auto w-max px-1 py-0 bg-purple-700 dark:bg-purple-600 text-white rounded text-[8px] font-black uppercase leading-tight shadow-2xs"
                                title={`Covering: ${cell.temp_covers.map((c) => `${c.brand_name} (${c.process_name})`).join(', ')}`}
                              >
                                +Cov
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend Footer */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-slate-700 dark:text-slate-300">Legend:</span>
          {Object.entries(STATUS_CONFIG).map(([key, item]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${item.bg}`}
              >
                {item.code}
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
            <span>Manual Override</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="px-1 py-0.2 bg-purple-700 dark:bg-purple-600 text-white rounded text-[9px] font-bold">
              +Cov
            </span>
            <span>Temp Cover</span>
          </div>
        </div>
      </div>
    </div>
  );
}

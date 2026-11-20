import React from 'react';
import { Activity, Minus } from 'lucide-react';

export default function HealthMatrix({
  dates = [],
  brandProcesses = [],
  employees = [],
  tempCovers = [],
  publicHolidays = [],
}) {
  const isOperatingOnDate = (calendar, dateStr) => {
    const parts = dateStr.split('-');
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    const d = new Date(Date.UTC(year, month, day));
    const isSunday = d.getUTCDay() === 0;

    const isHoliday = publicHolidays.some(
      (h) => dateStr >= h.start_date && dateStr <= h.end_date
    );

    if (calendar === '365_DAYS') return true;
    if (calendar === 'SUNDAYS_OFF') return !isSunday;
    if (calendar === 'PUBLIC_HOLIDAYS_OFF') return !isHoliday;
    if (calendar === 'SUNDAYS_AND_HOLIDAYS_OFF') return !isSunday && !isHoliday;
    return true;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Daily Coverage Health Matrix
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-sm bg-emerald-500" /> Fully Staffed
          </span>
          <span className="flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-400">
            <span className="w-2 h-2 rounded-sm bg-rose-500" /> Coverage Gap
          </span>
          <span className="flex items-center gap-1 font-semibold text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-sm bg-slate-300 dark:bg-slate-700" /> Closed
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <th className="sticky left-0 z-20 bg-slate-100 dark:bg-slate-800 min-w-[240px] max-w-[270px] p-2.5 border-r border-b border-slate-200 dark:border-slate-700">
                Process / Rule / Min Staff
              </th>
              {dates.map((dateStr) => {
                const day = Number(dateStr.split('-')[2]);
                return (
                  <th
                    key={dateStr}
                    className="min-w-[46px] w-[46px] p-1 text-center border-r border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-extrabold"
                  >
                    {day}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {brandProcesses.map((bp) => {
              // Find permanent employees for this brand-process
              const assignedEmpIds = employees
                .filter((emp) =>
                  emp.allocations?.some(
                    (a) => a.brand_process_id === bp.brand_process_id || a.brand_process_id === bp.id
                  )
                )
                .map((e) => e.id);

              return (
                <tr key={bp.brand_process_id || bp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  {/* Sticky Rule Info */}
                  <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 min-w-[240px] max-w-[270px] p-2 border-r border-b border-slate-200 dark:border-slate-800 shadow-[1px_0_2px_rgba(0,0,0,0.02)]">
                    <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                      {bp.process_name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-500/30">
                        Min: {bp.minimum_staff}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate" title={bp.operating_calendar}>
                        {bp.operating_calendar.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </td>

                  {/* Daily Health Cells */}
                  {dates.map((dateStr) => {
                    const isOpen = isOperatingOnDate(bp.operating_calendar, dateStr);

                    if (!isOpen) {
                      return (
                        <td
                          key={dateStr}
                          className="min-w-[46px] w-[46px] p-1 text-center border-r border-b border-slate-100 dark:border-slate-800/60 bg-slate-100/50 dark:bg-slate-800/30"
                          title="Closed per Operating Calendar"
                        >
                          <div className="w-full h-7 flex items-center justify-center text-slate-400 dark:text-slate-600 font-medium">
                            <Minus className="w-3.5 h-3.5" />
                          </div>
                        </td>
                      );
                    }

                    // Count active permanent working employees
                    let activeCount = 0;
                    assignedEmpIds.forEach((empId) => {
                      const emp = employees.find((e) => e.id === empId);
                      const entry = emp?.schedule?.[dateStr];
                      if (entry && entry.status === 'WORKING') {
                        activeCount += 1;
                      }
                    });

                    // Add active temporary covers on this brand-process on this date
                    const bpId = bp.brand_process_id || bp.id;
                    const dailyCovers = tempCovers.filter(
                      (tc) =>
                        tc.brand_process_id === bpId &&
                        tc.date === dateStr
                    );
                    activeCount += dailyCovers.length;

                    const isCovered = activeCount >= bp.minimum_staff;

                    return (
                      <td
                        key={dateStr}
                        className={`min-w-[46px] w-[46px] p-1 text-center border-r border-b border-slate-100 dark:border-slate-800/60 ${
                          isCovered
                            ? 'bg-emerald-50/20 dark:bg-emerald-950/10'
                            : 'bg-rose-50/30 dark:bg-rose-950/20'
                        }`}
                        title={`${bp.process_name} on ${dateStr}: ${activeCount}/${bp.minimum_staff} staff active ${
                          isCovered ? '(Covered)' : '(GAP!)'
                        }`}
                      >
                        <div
                          className={`w-full h-7 rounded flex items-center justify-center font-bold text-[10px] border shadow-2xs ${
                            isCovered
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30'
                          }`}
                        >
                          {activeCount}/{bp.minimum_staff}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

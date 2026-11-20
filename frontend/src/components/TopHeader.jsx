import React from 'react';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Loader2,
  Lock,
  Unlock,
  RotateCw,
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SECTION_TITLES = {
  company: 'Company-Wide Roster',
  pod: 'Pod-Wise Roster',
  brand: 'Brand-Wise Roster',
  process: 'Process-Wise Roster',
  employee: 'Employee-Wise Roster',
  'pods-employees': 'Pods & Employees',
  'brands-processes': 'Brands, Processes & Rules',
  allocations: 'Permanent Allocations',
  'holidays-leaves': 'Holidays & Leaves',
};

export default function TopHeader({
  activeSection,
  onOpenMobileMenu,
  // Roster View Context Filters
  pods = [],
  selectedPodId,
  onPodChange,
  brands = [],
  selectedBrandId,
  onBrandChange,
  processes = [],
  selectedProcessId,
  onProcessChange,
  employees = [],
  selectedEmployeeId,
  onEmployeeChange,
  // Date & Generation Controls
  year,
  month,
  onMonthChange,
  onGenerateRoster,
  isGenerating,
  // Status Controls
  rosterStatus,
  isPublishable,
  onToggleStatus,
  isStatusUpdating,
  // Conflicts Controls
  onToggleConflictsDrawer,
  criticalConflictsCount = 0,
  warningConflictsCount = 0,
  // Configuration Controls
  onRefreshConfig,
  isLoadingConfig,
}) {
  const isRosterView = ['company', 'pod', 'brand', 'process', 'employee'].includes(activeSection);
  const isPublished = rosterStatus === 'PUBLISHED';

  const handlePrevMonth = () => {
    if (month === 1) {
      onMonthChange(year - 1, 12);
    } else {
      onMonthChange(year, month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      onMonthChange(year + 1, 1);
    } else {
      onMonthChange(year, month + 1);
    }
  };

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-20 shrink-0">
      {/* Left: Hamburger (mobile) + Section Title + Contextual Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
          {SECTION_TITLES[activeSection] || 'Roster'}
        </h1>

        {/* Contextual Filter Dropdown on Roster Views */}
        {activeSection === 'pod' && pods.length > 0 && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
            <select
              value={selectedPodId || ''}
              onChange={(e) => onPodChange(Number(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {pods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {activeSection === 'brand' && brands.length > 0 && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
            <select
              value={selectedBrandId || ''}
              onChange={(e) => onBrandChange(Number(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[200px] truncate"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.pod_name || `Pod ${b.pod_id}`})
                </option>
              ))}
            </select>
          </div>
        )}

        {activeSection === 'process' && processes.length > 0 && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
            <select
              value={selectedProcessId || ''}
              onChange={(e) => onProcessChange(Number(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {processes.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {activeSection === 'employee' && employees.length > 0 && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
            <select
              value={selectedEmployeeId || ''}
              onChange={(e) => onEmployeeChange(Number(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[220px] truncate"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} {emp.is_manager ? '(Lead)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Actions and Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {isRosterView ? (
          <>
            {/* Compact Month / Year Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/80 p-0.5">
              <button
                onClick={handlePrevMonth}
                className="p-1 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-xs font-bold text-slate-800 dark:text-slate-200 select-none whitespace-nowrap">
                {MONTH_NAMES[month - 1].slice(0, 3)} {year}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Reset if not on Nov 2026 */}
            {(year !== 2026 || month !== 11) && (
              <button
                onClick={() => onMonthChange(2026, 11)}
                className="hidden xl:inline-block text-[11px] px-2 py-1 font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 rounded-md transition-colors"
              >
                Reset to Nov 2026
              </button>
            )}

            {/* Subtle Status Badge & Toggle Button */}
            <div className="hidden sm:flex items-center gap-1.5 pl-1">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${
                  isPublished
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
                }`}
              >
                {rosterStatus || 'DRAFT'}
              </span>

              <button
                onClick={onToggleStatus}
                disabled={isStatusUpdating}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all border disabled:opacity-50 ${
                  isPublished
                    ? 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    : isPublishable
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                }`}
                title={
                  !isPublished && !isPublishable
                    ? 'Resolve all critical conflicts to publish.'
                    : ''
                }
              >
                {isStatusUpdating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isPublished ? (
                  <>
                    <Unlock className="w-3 h-3" />
                    <span className="hidden md:inline">Reopen</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3" />
                    <span className="hidden md:inline">Publish</span>
                  </>
                )}
              </button>
            </div>

            {/* Generate Button */}
            <button
              onClick={onGenerateRoster}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white text-xs font-semibold rounded-md shadow-2xs transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {isGenerating ? 'Generating...' : 'Generate'}
              </span>
            </button>

            {/* Conflicts Drawer Button */}
            <button
              onClick={onToggleConflictsDrawer}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-md transition-all"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Conflicts</span>
              {criticalConflictsCount > 0 ? (
                <span className="px-1.5 py-0.2 bg-rose-600 dark:bg-rose-500 text-white text-[10px] font-black rounded-full leading-tight">
                  {criticalConflictsCount}
                </span>
              ) : warningConflictsCount > 0 ? (
                <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full leading-tight">
                  {warningConflictsCount}
                </span>
              ) : (
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-full leading-tight">
                  0
                </span>
              )}
            </button>
          </>
        ) : (
          /* Configuration Views Right Control: Refresh */
          <button
            onClick={onRefreshConfig}
            disabled={isLoadingConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoadingConfig ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        )}
      </div>
    </header>
  );
}

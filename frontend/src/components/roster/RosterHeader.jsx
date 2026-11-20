import React from 'react';
import {
  Calendar,
  Building,
  Users2,
  Tag,
  Briefcase,
  User,
  Sparkles,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function RosterHeader({
  year,
  month,
  onMonthChange,
  activeView,
  onViewChange,
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
  onGenerateRoster,
  isGenerating,
  onToggleConflictsDrawer,
  criticalConflictsCount = 0,
  warningConflictsCount = 0,
}) {
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
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 space-y-3">
      {/* Top line: Month Selector + Generator Action + Conflict Drawer button */}
      <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Month & Year Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200/90 p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-md hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1 font-bold text-slate-800 text-sm">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>
                {MONTH_NAMES[month - 1]} {year}
              </span>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-md hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick preset for November 2026 */}
          {(year !== 2026 || month !== 11) && (
            <button
              onClick={() => onMonthChange(2026, 11)}
              className="text-xs px-2.5 py-1.5 font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors"
            >
              Reset to Nov 2026
            </button>
          )}
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-2.5">
          {/* Generate / Regenerate Roster CTA */}
          <button
            onClick={onGenerateRoster}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Roster...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Regenerate Roster</span>
              </>
            )}
          </button>

          {/* Conflicts Drawer Toggle */}
          <button
            onClick={onToggleConflictsDrawer}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Conflicts</span>
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[11px] font-black rounded-full">
                {criticalConflictsCount}
              </span>
              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[11px] font-black rounded-full">
                {warningConflictsCount}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Bottom line: View Tabs + Context-dependent Filter */}
      <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
        {/* 5 View Switcher Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => onViewChange('company')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeView === 'company'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Company-Wide</span>
          </button>

          <button
            onClick={() => onViewChange('pod')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeView === 'pod'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users2 className="w-3.5 h-3.5" />
            <span>Pod-Wise</span>
          </button>

          <button
            onClick={() => onViewChange('brand')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeView === 'brand'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Brand-Wise</span>
          </button>

          <button
            onClick={() => onViewChange('process')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeView === 'process'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Process-Wise</span>
          </button>

          <button
            onClick={() => onViewChange('employee')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeView === 'employee'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Employee-Wise</span>
          </button>
        </div>

        {/* Dynamic Context Selector */}
        <div className="flex items-center gap-2">
          {activeView === 'pod' && (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <span className="text-slate-500">Selected Pod:</span>
              <select
                value={selectedPodId || ''}
                onChange={(e) => onPodChange(Number(e.target.value))}
                className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {pods.map((pod) => (
                  <option key={pod.id} value={pod.id}>
                    {pod.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeView === 'brand' && (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <span className="text-slate-500">Selected Brand:</span>
              <select
                value={selectedBrandId || ''}
                onChange={(e) => onBrandChange(Number(e.target.value))}
                className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name} ({brand.pod_name || `Pod ${brand.pod_id}`})
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeView === 'process' && (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <span className="text-slate-500">Selected Process:</span>
              <select
                value={selectedProcessId || ''}
                onChange={(e) => onProcessChange(Number(e.target.value))}
                className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {processes.map((proc) => (
                  <option key={proc.id} value={proc.id}>
                    {proc.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeView === 'employee' && (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <span className="text-slate-500">Selected Employee:</span>
              <select
                value={selectedEmployeeId || ''}
                onChange={(e) => onEmployeeChange(Number(e.target.value))}
                className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} {emp.is_manager ? '(Lead)' : ''} — {emp.pod_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

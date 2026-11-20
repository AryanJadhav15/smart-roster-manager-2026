import React from 'react';
import {
  Users,
  AlertOctagon,
  AlertTriangle,
  GitFork,
  CheckCircle2,
} from 'lucide-react';

export default function KPIStrip({
  summary,
  staffCount = 0,
  isPublishable,
  onOpenConflictsDrawer,
}) {
  const criticalCount = summary?.criticalCount ?? 0;
  const warningCount = summary?.warningCount ?? 0;
  const cascadeCount = summary?.cascadeCount ?? 0;

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2 select-none">
      <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
        {/* Metric Badges Strip */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
          {/* Staff Count */}
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">{staffCount}</span>
            <span>Staff in View</span>
          </div>

          <span className="hidden sm:inline-block text-slate-300 dark:text-slate-700">•</span>

          {/* Critical Gaps */}
          <button
            onClick={() => onOpenConflictsDrawer && onOpenConflictsDrawer('CRITICAL')}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-colors ${
              criticalCount > 0
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            <AlertOctagon
              className={`w-3.5 h-3.5 ${
                criticalCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'
              }`}
            />
            <span className="font-bold">{criticalCount}</span>
            <span>Critical Gaps</span>
          </button>

          <span className="hidden sm:inline-block text-slate-300 dark:text-slate-700">•</span>

          {/* Soft Warnings */}
          <button
            onClick={() => onOpenConflictsDrawer && onOpenConflictsDrawer('WARNINGS')}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-colors ${
              warningCount > 0
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:text-amber-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            <AlertTriangle
              className={`w-3.5 h-3.5 ${
                warningCount > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'
              }`}
            />
            <span className="font-bold">{warningCount}</span>
            <span>Soft Warnings</span>
          </button>

          <span className="hidden sm:inline-block text-slate-300 dark:text-slate-700">•</span>

          {/* Multi-Brand Cascades */}
          <button
            onClick={() => onOpenConflictsDrawer && onOpenConflictsDrawer('CASCADES')}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-colors ${
              cascadeCount > 0
                ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 dark:text-purple-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            <GitFork
              className={`w-3.5 h-3.5 ${
                cascadeCount > 0 ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'
              }`}
            />
            <span className="font-bold">{cascadeCount}</span>
            <span>Multi-Brand Cascades</span>
          </button>
        </div>

        {/* Right: Low-profile Readiness Status */}
        <div className="flex items-center gap-1.5 text-xs">
          {isPublishable ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ready to Publish</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500 font-medium">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
              <span>{criticalCount} critical blocker{criticalCount === 1 ? '' : 's'}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

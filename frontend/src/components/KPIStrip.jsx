import React from 'react';
import {
  Users,
  AlertOctagon,
  AlertTriangle,
  GitFork,
  CheckCircle2,
  Lock,
  Unlock,
  Loader2,
} from 'lucide-react';

export default function KPIStrip({
  rosterStatus,
  isPublishable,
  summary,
  staffCount = 0,
  onToggleStatus,
  isStatusUpdating,
  onOpenConflictsDrawer,
}) {
  const criticalCount = summary?.criticalCount ?? 0;
  const warningCount = summary?.warningCount ?? 0;
  const cascadeCount = summary?.cascadeCount ?? 0;

  const isPublished = rosterStatus === 'PUBLISHED';

  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3">
      <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* KPI Counter Cards */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Total Staff */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <Users className="w-4 h-4 text-slate-600" />
            <div>
              <span className="text-xs text-slate-500 font-medium block leading-none">
                Staff in View
              </span>
              <span className="text-sm font-bold text-slate-800 leading-none">
                {staffCount}
              </span>
            </div>
          </div>

          {/* Critical Conflicts */}
          <button
            onClick={onOpenConflictsDrawer}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-all text-left ${
              criticalCount > 0
                ? 'bg-rose-50 border-rose-200 hover:border-rose-300 hover:bg-rose-100/70'
                : 'bg-emerald-50 border-emerald-200'
            }`}
          >
            <AlertOctagon
              className={`w-4 h-4 ${criticalCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}
            />
            <div>
              <span
                className={`text-xs font-semibold block leading-none ${
                  criticalCount > 0 ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                Critical Conflicts
              </span>
              <span
                className={`text-sm font-black leading-none ${
                  criticalCount > 0 ? 'text-rose-800' : 'text-emerald-800'
                }`}
              >
                {criticalCount}
              </span>
            </div>
          </button>

          {/* Soft Warnings */}
          <button
            onClick={onOpenConflictsDrawer}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-all text-left ${
              warningCount > 0
                ? 'bg-amber-50 border-amber-200 hover:border-amber-300 hover:bg-amber-100/70'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <AlertTriangle
              className={`w-4 h-4 ${warningCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}
            />
            <div>
              <span
                className={`text-xs font-semibold block leading-none ${
                  warningCount > 0 ? 'text-amber-700' : 'text-slate-500'
                }`}
              >
                Soft Warnings
              </span>
              <span
                className={`text-sm font-bold leading-none ${
                  warningCount > 0 ? 'text-amber-900' : 'text-slate-700'
                }`}
              >
                {warningCount}
              </span>
            </div>
          </button>

          {/* Multi-Brand Cascades */}
          <button
            onClick={onOpenConflictsDrawer}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-all text-left ${
              cascadeCount > 0
                ? 'bg-purple-50 border-purple-200 hover:border-purple-300 hover:bg-purple-100/70'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <GitFork
              className={`w-4 h-4 ${cascadeCount > 0 ? 'text-purple-600' : 'text-slate-400'}`}
            />
            <div>
              <span
                className={`text-xs font-semibold block leading-none ${
                  cascadeCount > 0 ? 'text-purple-700' : 'text-slate-500'
                }`}
              >
                Multi-Brand Cascades
              </span>
              <span
                className={`text-sm font-black leading-none ${
                  cascadeCount > 0 ? 'text-purple-900' : 'text-slate-700'
                }`}
              >
                {cascadeCount}
              </span>
            </div>
          </button>
        </div>

        {/* Publish Readiness Indicator + Publish / Reopen Action */}
        <div className="flex items-center gap-3">
          {/* Readiness Pill */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              isPublishable
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-rose-50 text-rose-700 border-rose-300'
            }`}
          >
            {isPublishable ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Publish Ready (0 Hard Conflicts)</span>
              </>
            ) : (
              <>
                <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                <span>Blocked: {criticalCount} Unresolved</span>
              </>
            )}
          </div>

          {/* Roster Status Pill */}
          <div
            className={`px-2.5 py-1 rounded-md text-xs font-extrabold uppercase tracking-wide border ${
              isPublished
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-amber-100 text-amber-900 border-amber-300'
            }`}
          >
            {rosterStatus || 'DRAFT'}
          </div>

          {/* Publish / Reopen Button */}
          <button
            onClick={onToggleStatus}
            disabled={isStatusUpdating}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50 ${
              isPublished
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                : isPublishable
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'
            }`}
            title={
              !isPublished && !isPublishable
                ? 'Resolve all CRITICAL conflicts to publish this roster.'
                : ''
            }
          >
            {isStatusUpdating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isPublished ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>Reopen Roster</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Publish Roster</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

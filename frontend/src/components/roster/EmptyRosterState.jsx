import React from 'react';
import { CalendarRange, Sparkles, Loader2 } from 'lucide-react';

export default function EmptyRosterState({
  year,
  month,
  onGenerate,
  isGenerating,
}) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
          <CalendarRange className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            No Roster Generated for {monthNames[month - 1]} {year}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            The monthly schedule has not been generated yet. Run the automated scheduling engine to calculate shifts, weekly offs, and operating calendar constraints.
          </p>
        </div>

        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-2xs transition-all disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Roster...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Roster for {monthNames[month - 1]} {year}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

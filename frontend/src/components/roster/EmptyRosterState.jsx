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
    <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
      <div className="max-w-md w-full text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
          <CalendarRange className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            No Roster Generated for {monthNames[month - 1]} {year}
          </h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            The monthly schedule has not been generated yet. Run the automated scheduling engine to calculate shifts, weekly offs, and operating calendar constraints.
          </p>
        </div>

        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50"
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

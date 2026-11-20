import React from 'react';
import { CalendarRange, Sliders } from 'lucide-react';

export default function Navbar({ activeWorkspace, setActiveWorkspace }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 select-none">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & System identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
            <CalendarRange className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                SmartRoster
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                Operations
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              CX Operations Agency • Monthly Roster Planner & Validator
            </p>
          </div>
        </div>

        {/* Workspace Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80">
          <button
            onClick={() => setActiveWorkspace('roster')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all ${
              activeWorkspace === 'roster'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarRange className="w-4 h-4 text-indigo-600" />
            <span>Roster Workspace</span>
          </button>

          <button
            onClick={() => setActiveWorkspace('config')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all ${
              activeWorkspace === 'config'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4 text-slate-700" />
            <span>Configuration & Rules</span>
          </button>
        </div>

        {/* Status indicator */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-slate-500 border-l border-slate-200 pl-4">
          <div className="flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Connected to API (5001)</span>
          </div>
        </div>
      </div>
    </header>
  );
}

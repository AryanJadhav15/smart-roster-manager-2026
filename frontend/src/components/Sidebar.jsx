import React from 'react';
import {
  LayoutGrid,
  Users2,
  Tag,
  Briefcase,
  User,
  Users,
  SlidersHorizontal,
  Link2,
  CalendarDays,
  Sun,
  Moon,
  X,
  CalendarRange,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ROSTER_VIEWS = [
  { id: 'company', label: 'Company-Wide', icon: LayoutGrid },
  { id: 'pod', label: 'Pod-Wise', icon: Users2 },
  { id: 'brand', label: 'Brand-Wise', icon: Tag },
  { id: 'process', label: 'Process-Wise', icon: Briefcase },
  { id: 'employee', label: 'Employee-Wise', icon: User },
];

const CONFIG_VIEWS = [
  { id: 'pods-employees', label: 'Pods & Employees', icon: Users },
  { id: 'brands-processes', label: 'Brands & Rules', icon: SlidersHorizontal },
  { id: 'allocations', label: 'Allocations', icon: Link2 },
  { id: 'holidays-leaves', label: 'Holidays & Leaves', icon: CalendarDays },
];

export default function Sidebar({
  activeSection,
  onSelectSection,
  isMobileOpen,
  onCloseMobile,
}) {
  const { theme, toggleTheme } = useTheme();

  const handleNavClick = (id) => {
    onSelectSection(id);
    if (onCloseMobile) onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 select-none">
      {/* 1. App Brand Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-xs">
            <CalendarRange className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100">
              Smart Roster
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Navigation Items (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Group 1: Roster Views */}
        <div>
          <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Roster Views
          </div>
          <div className="space-y-0.5">
            {ROSTER_VIEWS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800/90 text-indigo-700 dark:text-indigo-400 font-semibold shadow-2xs dark:shadow-none'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Group 2: Configuration */}
        <div>
          <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Configuration
          </div>
          <div className="space-y-0.5">
            {CONFIG_VIEWS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800/90 text-indigo-700 dark:text-indigo-400 font-semibold shadow-2xs dark:shadow-none'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Sidebar Footer: Dark / Light Mode Toggle */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <button
          onClick={toggleTheme}
          type="button"
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors border border-slate-200/80 dark:border-slate-800"
        >
          <div className="flex items-center gap-2.5">
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Toggle
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden md:flex flex-col w-56 lg:w-60 shrink-0 h-screen sticky top-0 z-30">
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}

import React, { useState } from 'react';
import {
  Users,
  Briefcase,
  Link2,
  Calendar,
  RotateCw,
} from 'lucide-react';
import PodsEmployeesTab from './PodsEmployeesTab';
import BrandsProcessesTab from './BrandsProcessesTab';
import AllocationsTab from './AllocationsTab';
import HolidaysLeavesTab from './HolidaysLeavesTab';

export default function ConfigWorkspace({
  configData,
  onRefreshConfig,
  isLoading,
}) {
  const [activeTab, setActiveTab] = useState('pods-employees');

  const {
    pods = [],
    employees = [],
    processes = [],
    brands = [],
    brandProcesses = [],
    allocations = [],
    holidays = [],
    leaves = [],
  } = configData || {};

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-0 overflow-y-auto">
      {/* Subheader / Tabs Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 sticky top-16 z-20 shadow-2xs">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('pods-employees')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'pods-employees'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Pods & Employees ({employees.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('brands-processes')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'brands-processes'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Brands, Processes & Rules ({brandProcesses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('allocations')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'allocations'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Permanent Allocations ({allocations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('holidays-leaves')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'holidays-leaves'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Holidays & Leaves ({holidays.length + leaves.length})</span>
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefreshConfig}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Config</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="max-w-[1720px] mx-auto w-full p-4 sm:p-6 lg:p-8">
        {activeTab === 'pods-employees' && (
          <PodsEmployeesTab
            pods={pods}
            employees={employees}
            onRefresh={onRefreshConfig}
          />
        )}

        {activeTab === 'brands-processes' && (
          <BrandsProcessesTab
            brands={brands}
            processes={processes}
            brandProcesses={brandProcesses}
            pods={pods}
            onRefresh={onRefreshConfig}
          />
        )}

        {activeTab === 'allocations' && (
          <AllocationsTab
            allocations={allocations}
            employees={employees}
            brandProcesses={brandProcesses}
            onRefresh={onRefreshConfig}
          />
        )}

        {activeTab === 'holidays-leaves' && (
          <HolidaysLeavesTab
            holidays={holidays}
            leaves={leaves}
            employees={employees}
            onRefresh={onRefreshConfig}
          />
        )}
      </div>
    </div>
  );
}

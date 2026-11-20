import React from 'react';
import PodsEmployeesTab from './PodsEmployeesTab';
import BrandsProcessesTab from './BrandsProcessesTab';
import AllocationsTab from './AllocationsTab';
import HolidaysLeavesTab from './HolidaysLeavesTab';

export default function ConfigWorkspace({
  activeSection = 'pods-employees',
  configData,
  onRefreshConfig,
}) {
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
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 min-h-0 overflow-y-auto">
      <div className="max-w-[1600px] mx-auto w-full p-4 sm:p-6 lg:p-8">
        {activeSection === 'pods-employees' && (
          <PodsEmployeesTab
            pods={pods}
            employees={employees}
            onRefresh={onRefreshConfig}
          />
        )}

        {activeSection === 'brands-processes' && (
          <BrandsProcessesTab
            brands={brands}
            processes={processes}
            brandProcesses={brandProcesses}
            pods={pods}
            onRefresh={onRefreshConfig}
          />
        )}

        {activeSection === 'allocations' && (
          <AllocationsTab
            allocations={allocations}
            employees={employees}
            brandProcesses={brandProcesses}
            onRefresh={onRefreshConfig}
          />
        )}

        {activeSection === 'holidays-leaves' && (
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

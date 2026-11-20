import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import KPIStrip from './components/KPIStrip';
import RosterGrid from './components/roster/RosterGrid';
import HealthMatrix from './components/roster/HealthMatrix';
import EmployeeDetailView from './components/roster/EmployeeDetailView';
import EditCellModal from './components/roster/EditCellModal';
import ConflictsDrawer from './components/roster/ConflictsDrawer';
import EmptyRosterState from './components/roster/EmptyRosterState';
import ConfigWorkspace from './components/config/ConfigWorkspace';
import { ToastProvider, useToast } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import api from './api';
import { Loader2, Briefcase, Tag } from 'lucide-react';

function DashboardApp() {
  const { showToast } = useToast();

  // Active section across entire app (1-click navigation from sidebar)
  // Options: 'company' | 'pod' | 'brand' | 'process' | 'employee' | 'pods-employees' | 'brands-processes' | 'allocations' | 'holidays-leaves'
  const [activeSection, setActiveSection] = useState('company');

  // Mobile sidebar open state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Month & Year state (Default: November 2026)
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(11);

  // Contextual selectors
  const [selectedPodId, setSelectedPodId] = useState(null);
  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [selectedProcessId, setSelectedProcessId] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  // Live Data States
  const [rosterData, setRosterData] = useState(null);
  const [configData, setConfigData] = useState(null);
  const [isLoadingRoster, setIsLoadingRoster] = useState(true);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  // Drawer & Modal States
  const [conflictsDrawerOpen, setConflictsDrawerOpen] = useState(false);
  const [drawerInitialTab, setDrawerInitialTab] = useState('ALL');
  const [editModalData, setEditModalData] = useState(null); // { employee, cell, date }

  const isRosterView = ['company', 'pod', 'brand', 'process', 'employee'].includes(activeSection);

  // 1. Fetch Configuration Overview
  const fetchConfig = useCallback(async () => {
    setIsLoadingConfig(true);
    try {
      const data = await api.getConfigOverview();
      setConfigData(data);

      // Default selectors if not set yet
      if (data.pods?.length && !selectedPodId) setSelectedPodId(data.pods[0].id);
      if (data.brands?.length && !selectedBrandId) setSelectedBrandId(data.brands[0].id);
      if (data.processes?.length && !selectedProcessId) setSelectedProcessId(data.processes[0].id);
      if (data.employees?.length && !selectedEmployeeId) setSelectedEmployeeId(data.employees[0].id);
    } catch (err) {
      showToast(err.message || 'Failed to load configuration data', 'error');
    } finally {
      setIsLoadingConfig(false);
    }
  }, [selectedPodId, selectedBrandId, selectedProcessId, selectedEmployeeId, showToast]);

  // 2. Fetch Roster View
  const fetchRoster = useCallback(async () => {
    if (!isRosterView) return;
    setIsLoadingRoster(true);
    try {
      const params = {
        year,
        month,
        view: activeSection,
        podId: activeSection === 'pod' ? selectedPodId : undefined,
        brandId: activeSection === 'brand' ? selectedBrandId : undefined,
        processId: activeSection === 'process' ? selectedProcessId : undefined,
        employeeId: activeSection === 'employee' ? selectedEmployeeId : undefined,
      };

      const res = await api.getRosterView(params);
      setRosterData(res);
    } catch (err) {
      showToast(err.message || 'Failed to fetch roster view', 'error');
    } finally {
      setIsLoadingRoster(false);
    }
  }, [year, month, activeSection, selectedPodId, selectedBrandId, selectedProcessId, selectedEmployeeId, isRosterView, showToast]);

  // Load configuration on mount
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Load roster whenever month/year or view/filters change
  useEffect(() => {
    if (isRosterView) {
      fetchRoster();
    }
  }, [fetchRoster, isRosterView]);

  // Handle Month Switch
  const handleMonthChange = (newYear, newMonth) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  // Handle Roster Generation
  const handleGenerateRoster = async () => {
    setIsGenerating(true);
    try {
      const res = await api.generateRoster(year, month);
      showToast(res.message || `Roster generated for ${year}-${month}!`, 'success');
      await fetchRoster();
    } catch (err) {
      showToast(err.message || 'Failed to generate monthly roster', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Publish / Reopen Status Toggle
  const handleToggleStatus = async () => {
    if (!rosterData?.roster) return;
    const currentStatus = rosterData.roster.status;
    const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';

    if (newStatus === 'PUBLISHED' && !rosterData.validation?.isPublishable) {
      showToast('Cannot publish roster while CRITICAL conflicts remain unresolved.', 'error');
      setDrawerInitialTab('CRITICAL');
      setConflictsDrawerOpen(true);
      return;
    }

    setIsStatusUpdating(true);
    try {
      await api.updateRosterStatus(year, month, newStatus);
      showToast(`Roster status updated to ${newStatus}.`, 'success');
      await fetchRoster();
    } catch (err) {
      showToast(err.message || 'Failed to update roster status', 'error');
    } finally {
      setIsStatusUpdating(false);
    }
  };

  // Handle cell click to edit
  const handleCellClick = (employee, cell, dateStr) => {
    setEditModalData({
      employee,
      cell,
      date: dateStr,
    });
  };

  // Close cell modal
  const handleCloseEditModal = () => {
    setEditModalData(null);
  };

  // When entry or temp cover is updated / conflict resolved
  const handleDataChanged = () => {
    fetchRoster();
  };

  const handleOpenConflictsWithTab = (tab) => {
    setDrawerInitialTab(tab || 'ALL');
    setConflictsDrawerOpen(true);
  };

  // Context objects
  const currentPod = configData?.pods?.find((p) => p.id === selectedPodId);
  const currentBrand = configData?.brands?.find((b) => b.id === selectedBrandId);
  const currentProcess = configData?.processes?.find((p) => p.id === selectedProcessId);
  const currentEmployee =
    rosterData?.employees?.find((e) => e.id === selectedEmployeeId) ||
    configData?.employees?.find((e) => e.id === selectedEmployeeId);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased">
      {/* 1. Sleek Left Sidebar Navigation */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Minimal Single-Row Top Header Bar */}
        <TopHeader
          activeSection={activeSection}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          pods={configData?.pods || []}
          selectedPodId={selectedPodId}
          onPodChange={setSelectedPodId}
          brands={configData?.brands || []}
          selectedBrandId={selectedBrandId}
          onBrandChange={setSelectedBrandId}
          processes={configData?.processes || []}
          selectedProcessId={selectedProcessId}
          onProcessChange={setSelectedProcessId}
          employees={configData?.employees || []}
          selectedEmployeeId={selectedEmployeeId}
          onEmployeeChange={setSelectedEmployeeId}
          year={year}
          month={month}
          onMonthChange={handleMonthChange}
          onGenerateRoster={handleGenerateRoster}
          isGenerating={isGenerating}
          rosterStatus={rosterData?.roster?.status}
          isPublishable={rosterData?.validation?.isPublishable}
          onToggleStatus={handleToggleStatus}
          isStatusUpdating={isStatusUpdating}
          onToggleConflictsDrawer={() => handleOpenConflictsWithTab('ALL')}
          criticalConflictsCount={rosterData?.validation?.summary?.criticalCount || 0}
          warningConflictsCount={rosterData?.validation?.summary?.warningCount || 0}
          onRefreshConfig={fetchConfig}
          isLoadingConfig={isLoadingConfig}
        />

        {/* Dynamic Workspace Body */}
        {isRosterView ? (
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Low-profile Metric Strip */}
            <KPIStrip
              summary={rosterData?.validation?.summary}
              staffCount={rosterData?.employees?.length || 0}
              isPublishable={rosterData?.validation?.isPublishable}
              onOpenConflictsDrawer={handleOpenConflictsWithTab}
            />

            {/* Roster Grid & View States */}
            {isLoadingRoster ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 dark:text-slate-500">
                <Loader2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-spin mb-2.5" />
                <p className="text-xs font-medium">Loading roster...</p>
              </div>
            ) : !rosterData?.exists ? (
              <EmptyRosterState
                year={year}
                month={month}
                onGenerate={handleGenerateRoster}
                isGenerating={isGenerating}
              />
            ) : (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Pod View Banner Card */}
                {activeSection === 'pod' && currentPod && (
                  <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2.5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                      <div>
                        <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                          {currentPod.name}
                        </h2>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Pod Lead:{' '}
                          <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">
                            {currentPod.pod_lead_name || 'Unassigned'}
                          </strong>
                        </p>
                      </div>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {rosterData.employees?.length || 0} Members in Pod
                    </div>
                  </div>
                )}

                {/* Brand View Health Matrix */}
                {activeSection === 'brand' && (
                  <div className="shrink-0">
                    <div className="bg-white dark:bg-slate-900 px-6 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          {currentBrand?.name || 'Selected Brand'}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          ({currentBrand?.pod_name || `Pod ${currentBrand?.pod_id}`})
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {rosterData.employees?.length || 0} Staff assigned or covering
                      </span>
                    </div>

                    <HealthMatrix
                      dates={rosterData.dates || []}
                      brandProcesses={rosterData.brandProcesses || []}
                      employees={rosterData.employees || []}
                      tempCovers={rosterData.tempCovers || []}
                      publicHolidays={configData?.holidays || []}
                    />
                  </div>
                )}

                {/* Process View Subheader */}
                {activeSection === 'process' && currentProcess && (
                  <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2.5 shrink-0">
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                          Process: {currentProcess.name}
                        </h2>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          Brands requiring this process:
                        </span>
                        {rosterData.brandProcesses?.map((bp) => (
                          <span
                            key={bp.brand_process_id || bp.id}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-500/30"
                          >
                            {bp.brand_name} (Min: {bp.minimum_staff})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Views */}
                {activeSection !== 'employee' ? (
                  <RosterGrid
                    dates={rosterData.dates || []}
                    employees={rosterData.employees || []}
                    onCellClick={handleCellClick}
                    publicHolidays={configData?.holidays || []}
                    groupByPod={activeSection === 'company'}
                  />
                ) : (
                  <EmployeeDetailView
                    employee={currentEmployee}
                    dates={rosterData.dates || []}
                    conflicts={rosterData.validation?.conflicts || []}
                    onCellClick={handleCellClick}
                  />
                )}
              </div>
            )}

            {/* Interactive Cell Edit Modal */}
            {editModalData && (
              <EditCellModal
                isOpen={Boolean(editModalData)}
                onClose={handleCloseEditModal}
                employee={editModalData.employee}
                cell={editModalData.cell}
                date={editModalData.date}
                brandProcesses={configData?.brandProcesses || []}
                onEntryUpdated={handleDataChanged}
              />
            )}

            {/* Live Conflict Slide-Over Drawer */}
            <ConflictsDrawer
              isOpen={conflictsDrawerOpen}
              onClose={() => setConflictsDrawerOpen(false)}
              conflicts={rosterData?.validation?.conflicts || []}
              summary={rosterData?.validation?.summary}
              onConflictResolved={handleDataChanged}
              initialTab={drawerInitialTab}
            />
          </main>
        ) : (
          /* Configuration Sections */
          <ConfigWorkspace
            activeSection={activeSection}
            configData={configData}
            onRefreshConfig={fetchConfig}
          />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <DashboardApp />
      </ToastProvider>
    </ThemeProvider>
  );
}

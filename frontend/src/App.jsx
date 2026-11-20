import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import KPIStrip from './components/KPIStrip';
import RosterHeader from './components/roster/RosterHeader';
import RosterGrid from './components/roster/RosterGrid';
import HealthMatrix from './components/roster/HealthMatrix';
import EmployeeDetailView from './components/roster/EmployeeDetailView';
import EditCellModal from './components/roster/EditCellModal';
import ConflictsDrawer from './components/roster/ConflictsDrawer';
import EmptyRosterState from './components/roster/EmptyRosterState';
import ConfigWorkspace from './components/config/ConfigWorkspace';
import { ToastProvider, useToast } from './context/ToastContext';
import api from './api';
import { Loader2, Briefcase, Tag } from 'lucide-react';

function DashboardApp() {
  const { showToast } = useToast();

  // Primary workspace
  const [activeWorkspace, setActiveWorkspace] = useState('roster'); // 'roster' | 'config'

  // Month & Year state (Default: November 2026)
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(11);

  // Roster view state
  const [activeView, setActiveView] = useState('company'); // 'company' | 'pod' | 'brand' | 'process' | 'employee'
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
  const [editModalData, setEditModalData] = useState(null); // { employee, cell, date }

  // 1. Fetch Configuration Overview (Pods, Brands, Processes, Employees, Holidays, etc.)
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
      showToast(err.message || 'Failed to connect to backend configuration API', 'error');
    } finally {
      setIsLoadingConfig(false);
    }
  }, [selectedPodId, selectedBrandId, selectedProcessId, selectedEmployeeId, showToast]);

  // 2. Fetch Roster View
  const fetchRoster = useCallback(async () => {
    setIsLoadingRoster(true);
    try {
      const params = {
        year,
        month,
        view: activeView,
        podId: activeView === 'pod' ? selectedPodId : undefined,
        brandId: activeView === 'brand' ? selectedBrandId : undefined,
        processId: activeView === 'process' ? selectedProcessId : undefined,
        employeeId: activeView === 'employee' ? selectedEmployeeId : undefined,
      };

      const res = await api.getRosterView(params);
      setRosterData(res);
    } catch (err) {
      showToast(err.message || 'Failed to fetch roster view', 'error');
    } finally {
      setIsLoadingRoster(false);
    }
  }, [year, month, activeView, selectedPodId, selectedBrandId, selectedProcessId, selectedEmployeeId, showToast]);

  // Load configuration on mount
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Load roster whenever month/year or view/filters change
  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

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

  // Selected Pod Lead (for Pod view)
  const currentPod = configData?.pods?.find((p) => p.id === selectedPodId);
  // Selected Brand (for Brand view)
  const currentBrand = configData?.brands?.find((b) => b.id === selectedBrandId);
  // Selected Process (for Process view)
  const currentProcess = configData?.processes?.find((p) => p.id === selectedProcessId);
  // Selected Employee (for Employee view)
  const currentEmployee = rosterData?.employees?.find((e) => e.id === selectedEmployeeId) ||
    configData?.employees?.find((e) => e.id === selectedEmployeeId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* 1. App Shell Navbar */}
      <Navbar
        activeWorkspace={activeWorkspace}
        setActiveWorkspace={setActiveWorkspace}
      />

      {/* 2. Workspace View Routing */}
      {activeWorkspace === 'roster' ? (
        <main className="flex-1 flex flex-col min-h-0">
          {/* KPI Strip */}
          <KPIStrip
            rosterStatus={rosterData?.roster?.status}
            isPublishable={rosterData?.validation?.isPublishable}
            summary={rosterData?.validation?.summary}
            staffCount={rosterData?.employees?.length || 0}
            onToggleStatus={handleToggleStatus}
            isStatusUpdating={isStatusUpdating}
            onOpenConflictsDrawer={() => setConflictsDrawerOpen(true)}
          />

          {/* Roster Controls Header */}
          <RosterHeader
            year={year}
            month={month}
            onMonthChange={handleMonthChange}
            activeView={activeView}
            onViewChange={setActiveView}
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
            onGenerateRoster={handleGenerateRoster}
            isGenerating={isGenerating}
            onToggleConflictsDrawer={() => setConflictsDrawerOpen(true)}
            criticalConflictsCount={rosterData?.validation?.summary?.criticalCount || 0}
            warningConflictsCount={rosterData?.validation?.summary?.warningCount || 0}
          />

          {/* Main Roster Body Area */}
          {isLoadingRoster ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
              <p className="text-xs font-semibold">Loading live roster data from Express API...</p>
            </div>
          ) : !rosterData?.exists ? (
            /* Empty State: Roster not generated yet */
            <EmptyRosterState
              year={year}
              month={month}
              onGenerate={handleGenerateRoster}
              isGenerating={isGenerating}
            />
          ) : (
            /* Active Roster Views */
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Pod View Banner Card */}
              {activeView === 'pod' && currentPod && (
                <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-indigo-600" />
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900">
                        {currentPod.name}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Pod Lead:{' '}
                        <strong className="text-indigo-700">
                          {currentPod.pod_lead_name || 'Unassigned'}
                        </strong>
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
                    {rosterData.employees?.length || 0} Members in Pod
                  </div>
                </div>
              )}

              {/* Brand View Top Health Matrix */}
              {activeView === 'brand' && (
                <div>
                  <div className="bg-white px-6 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-indigo-600" />
                      <span className="font-bold text-sm text-slate-900">
                        {currentBrand?.name || 'Selected Brand'}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({currentBrand?.pod_name || `Pod ${currentBrand?.pod_id}`})
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
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

              {/* Process View Header Info */}
              {activeView === 'process' && currentProcess && (
                <div className="bg-white border-b border-slate-200 px-6 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-600" />
                      <h2 className="text-sm font-extrabold text-slate-900">
                        Process: {currentProcess.name}
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">
                        Brands requiring this process:
                      </span>
                      {rosterData.brandProcesses?.map((bp) => (
                        <span
                          key={bp.brand_process_id || bp.id}
                          className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200"
                        >
                          {bp.brand_name} (Min: {bp.minimum_staff})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Grid Views: Company, Pod, Brand, Process */}
              {activeView !== 'employee' ? (
                <RosterGrid
                  dates={rosterData.dates || []}
                  employees={rosterData.employees || []}
                  onCellClick={handleCellClick}
                  publicHolidays={configData?.holidays || []}
                  groupByPod={activeView === 'company'}
                />
              ) : (
                /* Dedicated Employee View */
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
          />
        </main>
      ) : (
        /* Configuration & Rules Workspace */
        <ConfigWorkspace
          configData={configData}
          onRefreshConfig={fetchConfig}
          isLoading={isLoadingConfig}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <DashboardApp />
    </ToastProvider>
  );
}

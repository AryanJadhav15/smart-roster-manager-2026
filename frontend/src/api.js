const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const res = await fetch(url, config);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // --- ROSTERS & VALIDATION ---
  getRosters: () => request('/api/rosters'),
  
  generateRoster: (year, month) =>
    request('/api/rosters/generate', {
      method: 'POST',
      body: { year: Number(year), month: Number(month) },
    }),

  validateRoster: (year, month) =>
    request(`/api/rosters/validate?year=${year}&month=${month}`),

  updateRosterStatus: (year, month, status) =>
    request(`/api/rosters/${year}/${month}/status`, {
      method: 'PATCH',
      body: { status },
    }),

  getRosterView: ({ year, month, view = 'company', podId, brandId, processId, employeeId }) => {
    const params = new URLSearchParams({
      year: String(year),
      month: String(month),
      view,
    });
    if (podId) params.append('podId', String(podId));
    if (brandId) params.append('brandId', String(brandId));
    if (processId) params.append('processId', String(processId));
    if (employeeId) params.append('employeeId', String(employeeId));

    return request(`/api/rosters/view?${params.toString()}`);
  },

  updateRosterEntry: (id, { status, notes, is_manual_override = true }) =>
    request(`/api/rosters/entry/${id}`, {
      method: 'PATCH',
      body: { status, notes, is_manual_override },
    }),

  assignTempCover: ({ employee_id, date, roster_entry_id, brand_process_id, notes }) =>
    request('/api/rosters/temp-cover', {
      method: 'POST',
      body: {
        ...(employee_id && date ? { employee_id, date } : {}),
        ...(roster_entry_id ? { roster_entry_id } : {}),
        brand_process_id: Number(brand_process_id),
        notes: notes || null,
      },
    }),

  removeTempCover: (id) =>
    request(`/api/rosters/temp-cover/${id}`, {
      method: 'DELETE',
    }),

  // --- CONFIGURATION OVERVIEW ---
  getConfigOverview: () => request('/api/config/overview'),

  // --- PODS CRUD ---
  getPods: () => request('/api/config/pods'),
  createPod: (data) => request('/api/config/pods', { method: 'POST', body: data }),
  updatePod: (id, data) => request(`/api/config/pods/${id}`, { method: 'PUT', body: data }),
  deletePod: (id) => request(`/api/config/pods/${id}`, { method: 'DELETE' }),

  // --- EMPLOYEES CRUD ---
  getEmployees: () => request('/api/config/employees'),
  createEmployee: (data) => request('/api/config/employees', { method: 'POST', body: data }),
  updateEmployee: (id, data) => request(`/api/config/employees/${id}`, { method: 'PUT', body: data }),
  deleteEmployee: (id) => request(`/api/config/employees/${id}`, { method: 'DELETE' }),

  // --- PROCESSES CRUD ---
  getProcesses: () => request('/api/config/processes'),
  createProcess: (data) => request('/api/config/processes', { method: 'POST', body: data }),
  updateProcess: (id, data) => request(`/api/config/processes/${id}`, { method: 'PUT', body: data }),
  deleteProcess: (id) => request(`/api/config/processes/${id}`, { method: 'DELETE' }),

  // --- BRANDS CRUD ---
  getBrands: () => request('/api/config/brands'),
  createBrand: (data) => request('/api/config/brands', { method: 'POST', body: data }),
  updateBrand: (id, data) => request(`/api/config/brands/${id}`, { method: 'PUT', body: data }),
  deleteBrand: (id) => request(`/api/config/brands/${id}`, { method: 'DELETE' }),

  // --- BRAND-PROCESS RULES CRUD ---
  getBrandProcesses: () => request('/api/config/brand-processes'),
  createBrandProcess: (data) => request('/api/config/brand-processes', { method: 'POST', body: data }),
  updateBrandProcess: (id, data) => request(`/api/config/brand-processes/${id}`, { method: 'PUT', body: data }),
  deleteBrandProcess: (id) => request(`/api/config/brand-processes/${id}`, { method: 'DELETE' }),

  // --- PERMANENT ALLOCATIONS CRUD ---
  getAllocations: () => request('/api/config/allocations'),
  createAllocation: (data) => request('/api/config/allocations', { method: 'POST', body: data }),
  deleteAllocation: (id) => request(`/api/config/allocations/${id}`, { method: 'DELETE' }),

  // --- PUBLIC HOLIDAYS CRUD ---
  getHolidays: () => request('/api/config/holidays'),
  createHoliday: (data) => request('/api/config/holidays', { method: 'POST', body: data }),
  deleteHoliday: (id) => request(`/api/config/holidays/${id}`, { method: 'DELETE' }),

  // --- EMPLOYEE LEAVES CRUD ---
  getLeaves: () => request('/api/config/leaves'),
  createLeave: (data) => request('/api/config/leaves', { method: 'POST', body: data }),
  updateLeave: (id, data) => request(`/api/config/leaves/${id}`, { method: 'PATCH', body: data }),
  deleteLeave: (id) => request(`/api/config/leaves/${id}`, { method: 'DELETE' }),
};

export default api;

// Central API client. In dev, requests go through the Vite proxy (/api -> :8010).
// In production set VITE_API_BASE to the deployed backend URL.
const BASE = import.meta.env.VITE_API_BASE || '/api'

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body.detail || detail
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }
  return res.status === 204 ? null : res.json()
}

const qs = (params) => {
  const s = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined),
  ).toString()
  return s ? `?${s}` : ''
}

export const api = {
  // Dashboard
  summary: () => request('/dashboard/summary'),
  projectUtil: () => request('/dashboard/project-utilization'),
  floorUtil: () => request('/dashboard/floor-utilization'),

  // Employees
  employees: (params = {}) => request('/employees' + qs(params)),
  employee: (id) => request(`/employees/${id}`),
  createEmployee: (data) => request('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id, data) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deactivateEmployee: (id) => request(`/employees/${id}`, { method: 'DELETE' }),

  // Projects
  projects: () => request('/projects'),
  projectEmployees: (id) => request(`/projects/${id}/employees`),

  // Seats
  seats: (params = {}) => request('/seats' + qs(params)),
  availableSeats: (params = {}) => request('/seats/available' + qs(params)),
  suggestSeat: (params = {}) => request('/seats/suggest' + qs(params)),
  allocate: (data) => request('/seats/allocate', { method: 'POST', body: JSON.stringify(data) }),
  release: (data) => request('/seats/release', { method: 'POST', body: JSON.stringify(data) }),

  // AI
  aiQuery: (query) => request('/ai/query', { method: 'POST', body: JSON.stringify({ query }) }),
}

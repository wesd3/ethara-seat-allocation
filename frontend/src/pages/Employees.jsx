import { useEffect, useState } from 'react'
import { api } from '../api'
import { StatusBadge, Spinner, Toast } from '../components/ui.jsx'

const PAGE = 20

export default function Employees() {
  const [data, setData] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [selected, setSelected] = useState(null)

  const [filters, setFilters] = useState({ search: '', project_id: '', allocation_status: '', offset: 0 })

  useEffect(() => {
    api.projects().then(setProjects).catch(() => {})
  }, [])

  const load = () => {
    setLoading(true)
    api
      .employees({ ...filters, limit: PAGE })
      .then(setData)
      .catch((e) => setToast({ type: 'error', message: e.message }))
      .finally(() => setLoading(false))
  }

  useEffect(load, [filters])

  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v, offset: 0 }))

  const release = async (empId) => {
    try {
      await api.release({ employee_id: empId })
      setToast({ type: 'success', message: 'Seat released.' })
      load()
      if (selected?.id === empId) setSelected(await api.employee(empId))
    } catch (e) {
      setToast({ type: 'error', message: e.message })
    }
  }

  const total = data?.total || 0
  const page = Math.floor(filters.offset / PAGE) + 1
  const pages = Math.ceil(total / PAGE)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Employees</h1>
        <span className="text-sm text-slate-500">{total.toLocaleString()} results</span>
      </div>

      <div className="card grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="label">Search (name / email / code)</label>
          <input
            className="input"
            placeholder="e.g. Amit or amit@ethara.ai"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Project</label>
          <select className="input" value={filters.project_id} onChange={(e) => setFilter('project_id', e.target.value)}>
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Allocation</label>
          <select
            className="input"
            value={filters.allocation_status}
            onChange={(e) => setFilter('allocation_status', e.target.value)}
          >
            <option value="">All</option>
            <option value="allocated">Allocated</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        {loading ? (
          <Spinner />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Seat</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.items.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{e.employee_code}</td>
                  <td className="px-4 py-3">
                    <button className="font-medium text-brand-700 hover:underline" onClick={() => setSelected(e)}>
                      {e.name}
                    </button>
                    <div className="text-xs text-slate-400">{e.email}</div>
                  </td>
                  <td className="px-4 py-3">{e.project_name || '—'}</td>
                  <td className="px-4 py-3">
                    {e.seat ? (
                      <span className="font-mono text-xs">
                        F{e.seat.floor}/{e.seat.zone} · {e.seat.seat_number}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={e.allocation_status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {e.seat && (
                      <button className="text-xs text-rose-600 hover:underline" onClick={() => release(e.id)}>
                        Release
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {data?.items.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-slate-400">
                    No employees match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button
            className="btn-ghost"
            disabled={filters.offset === 0}
            onClick={() => setFilters((f) => ({ ...f, offset: f.offset - PAGE }))}
          >
            ← Prev
          </button>
          <span className="text-slate-500">
            Page {page} of {pages}
          </span>
          <button
            className="btn-ghost"
            disabled={page >= pages}
            onClick={() => setFilters((f) => ({ ...f, offset: f.offset + PAGE }))}
          >
            Next →
          </button>
        </div>
      )}

      {selected && <EmployeeDrawer emp={selected} onClose={() => setSelected(null)} onRelease={release} />}
      <Toast {...toast} onClose={() => setToast(null)} />
    </div>
  )
}

function EmployeeDrawer({ emp, onClose, onRelease }) {
  const [full, setFull] = useState(emp)
  useEffect(() => {
    api.employee(emp.id).then(setFull).catch(() => {})
  }, [emp.id])

  const rows = [
    ['Employee Code', full.employee_code],
    ['Email', full.email],
    ['Department', full.department || '—'],
    ['Role', full.role || '—'],
    ['Joining Date', full.joining_date || '—'],
    ['Status', full.status],
    ['Project', full.project_name || '—'],
    ['Allocation', full.allocation_status],
  ]

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">{full.name}</h2>
            <StatusBadge status={full.allocation_status} />
          </div>
          <button className="text-slate-400 hover:text-slate-700" onClick={onClose}>
            ✕
          </button>
        </div>

        <dl className="divide-y divide-slate-100 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between py-2">
              <dt className="text-slate-500">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>

        {full.seat ? (
          <div className="mt-4 rounded-lg bg-brand-50 p-4">
            <div className="text-xs font-medium text-brand-700">Seat Allocation</div>
            <div className="mt-1 text-lg font-semibold">
              Floor {full.seat.floor}, Zone {full.seat.zone}, Bay {full.seat.bay}
            </div>
            <div className="font-mono text-sm text-slate-600">Seat {full.seat.seat_number}</div>
            <button className="btn-ghost mt-3" onClick={() => onRelease(full.id)}>
              Release seat
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
            No seat allocated yet. Use the New Joiner page to allocate one.
          </div>
        )}
      </div>
    </div>
  )
}

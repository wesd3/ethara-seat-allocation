import { useEffect, useState } from 'react'
import { api } from '../api'
import { StatusBadge, Avatar, Skeleton, Toast } from '../components/ui.jsx'
import { IconSearch, IconClose, IconChevronLeft, IconChevronRight, IconRelease } from '../components/icons.jsx'

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
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Employees</h1>
          <p className="mt-1 text-sm text-slate-500">Search and manage the full directory.</p>
        </div>
        <span className="badge bg-slate-100 text-slate-600 ring-slate-500/20">{total.toLocaleString()} results</span>
      </div>

      <div className="card grid gap-3 sm:grid-cols-4">
        <div className="relative sm:col-span-2">
          <label className="label">Search</label>
          <IconSearch className="pointer-events-none absolute left-3 top-[34px] h-4 w-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Name, email or code…"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Project</label>
          <select className="input" value={filters.project_id} onChange={(e) => setFilter('project_id', e.target.value)}>
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Allocation</label>
          <select className="input" value={filters.allocation_status} onChange={(e) => setFilter('allocation_status', e.target.value)}>
            <option value="">All</option>
            <option value="allocated">Allocated</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Project</th>
                <th className="px-5 py-3.5">Seat</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-5 py-4" colSpan={5}><Skeleton className="h-5 w-full" /></td>
                    </tr>
                  ))
                : data?.items.map((e) => (
                    <tr key={e.id} className="transition hover:bg-slate-50/70">
                      <td className="px-5 py-3">
                        <button className="flex items-center gap-3 text-left" onClick={() => setSelected(e)}>
                          <Avatar name={e.name} />
                          <span>
                            <span className="font-semibold text-slate-800 hover:text-brand-700">{e.name}</span>
                            <span className="block text-xs text-slate-400">{e.email}</span>
                          </span>
                        </button>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{e.project_name || '—'}</td>
                      <td className="px-5 py-3">
                        {e.seat ? (
                          <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                            F{e.seat.floor}/{e.seat.zone} · {e.seat.seat_number}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3"><StatusBadge status={e.allocation_status} /></td>
                      <td className="px-5 py-3 text-right">
                        {e.seat && (
                          <button className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700" onClick={() => release(e.id)}>
                            <IconRelease className="h-4 w-4" /> Release
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              {!loading && data?.items.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-5 py-14 text-center text-slate-400">No employees match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button className="btn-ghost" disabled={filters.offset === 0} onClick={() => setFilters((f) => ({ ...f, offset: f.offset - PAGE }))}>
            <IconChevronLeft className="h-4 w-4" /> Prev
          </button>
          <span className="text-slate-500">Page <b className="text-slate-700">{page}</b> of {pages}</span>
          <button className="btn-ghost" disabled={page >= pages} onClick={() => setFilters((f) => ({ ...f, offset: f.offset + PAGE }))}>
            Next <IconChevronRight className="h-4 w-4" />
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
  ]

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="h-full w-full max-w-md animate-fade-in overflow-y-auto bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={full.name} size="h-12 w-12" text="text-sm" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">{full.name}</h2>
              <StatusBadge status={full.allocation_status} />
            </div>
          </div>
          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={onClose}>
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <dl className="divide-y divide-slate-100 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5">
              <dt className="text-slate-500">{k}</dt>
              <dd className="text-right font-medium text-slate-800">{v}</dd>
            </div>
          ))}
        </dl>

        {full.seat ? (
          <div className="mt-5 rounded-2xl bg-gradient-to-br from-brand-50 to-violet-50 p-5 ring-1 ring-brand-100">
            <div className="text-xs font-semibold uppercase tracking-wide text-brand-700">Seat Allocation</div>
            <div className="mt-1.5 text-xl font-bold text-slate-900">
              Floor {full.seat.floor} · Zone {full.seat.zone} · Bay {full.seat.bay}
            </div>
            <div className="font-mono text-sm text-slate-500">Seat {full.seat.seat_number}</div>
            <button className="btn-ghost mt-4" onClick={() => onRelease(full.id)}>
              <IconRelease className="h-4 w-4" /> Release seat
            </button>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl bg-amber-50 p-5 text-sm text-amber-700 ring-1 ring-amber-100">
            No seat allocated yet. Use the <b>New Joiner</b> page to allocate one.
          </div>
        )}
      </div>
    </div>
  )
}

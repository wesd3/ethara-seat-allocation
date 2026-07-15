import { useEffect, useState } from 'react'
import { api } from '../api'
import { StatusBadge, Spinner, Toast } from '../components/ui.jsx'

const PAGE = 40

export default function Seats() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [filters, setFilters] = useState({ search: '', floor: '', zone: '', status: '', offset: 0 })

  const load = () => {
    setLoading(true)
    api
      .seats({ ...filters, limit: PAGE })
      .then(setData)
      .catch((e) => setToast({ type: 'error', message: e.message }))
      .finally(() => setLoading(false))
  }
  useEffect(load, [filters])

  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v, offset: 0 }))

  const release = async (seatId) => {
    try {
      await api.release({ seat_id: seatId })
      setToast({ type: 'success', message: 'Seat released.' })
      load()
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
        <h1 className="text-xl font-semibold">Seats</h1>
        <span className="text-sm text-slate-500">{total.toLocaleString()} results</span>
      </div>

      <div className="card grid gap-3 sm:grid-cols-5">
        <div className="sm:col-span-2">
          <label className="label">Seat number</label>
          <input className="input" placeholder="e.g. A5-07" value={filters.search} onChange={(e) => setFilter('search', e.target.value)} />
        </div>
        <div>
          <label className="label">Floor</label>
          <select className="input" value={filters.floor} onChange={(e) => setFilter('floor', e.target.value)}>
            <option value="">All</option>
            {[1, 2, 3, 4, 5].map((f) => (
              <option key={f} value={f}>Floor {f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Zone</label>
          <select className="input" value={filters.zone} onChange={(e) => setFilter('zone', e.target.value)}>
            <option value="">All</option>
            <option value="A">A</option>
            <option value="B">B</option>
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="">All</option>
            <option>Available</option>
            <option>Occupied</option>
            <option>Reserved</option>
            <option>Maintenance</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data?.items.map((s) => (
            <div key={s.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="font-mono text-sm font-semibold">{s.seat_number}</div>
                <StatusBadge status={s.status} />
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Floor {s.floor} · Zone {s.zone} · Bay {s.bay}
              </div>
              {s.employee_name ? (
                <div className="mt-3 border-t border-slate-100 pt-2 text-xs">
                  <div className="font-medium">{s.employee_name}</div>
                  <div className="text-slate-400">{s.project_name}</div>
                  <button className="mt-2 text-rose-600 hover:underline" onClick={() => release(s.id)}>
                    Release
                  </button>
                </div>
              ) : (
                <div className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-400">Unoccupied</div>
              )}
            </div>
          ))}
          {data?.items.length === 0 && (
            <div className="col-span-full py-10 text-center text-slate-400">No seats match your filters.</div>
          )}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button className="btn-ghost" disabled={filters.offset === 0} onClick={() => setFilters((f) => ({ ...f, offset: f.offset - PAGE }))}>
            ← Prev
          </button>
          <span className="text-slate-500">Page {page} of {pages}</span>
          <button className="btn-ghost" disabled={page >= pages} onClick={() => setFilters((f) => ({ ...f, offset: f.offset + PAGE }))}>
            Next →
          </button>
        </div>
      )}

      <Toast {...toast} onClose={() => setToast(null)} />
    </div>
  )
}

import { useEffect, useState } from 'react'
import { api } from '../api'
import { StatusBadge, Skeleton, Toast } from '../components/ui.jsx'
import { IconSearch, IconChevronLeft, IconChevronRight, IconRelease } from '../components/icons.jsx'

const PAGE = 48

const ACCENT = {
  Available: 'border-l-emerald-400',
  Occupied: 'border-l-blue-400',
  Reserved: 'border-l-amber-400',
  Maintenance: 'border-l-rose-400',
}

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
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Seats</h1>
          <p className="mt-1 text-sm text-slate-500">Browse and manage all 6,000 seats.</p>
        </div>
        <span className="badge bg-slate-100 text-slate-600 ring-slate-500/20">{total.toLocaleString()} results</span>
      </div>

      <div className="card grid gap-3 sm:grid-cols-5">
        <div className="relative sm:col-span-2">
          <label className="label">Seat number</label>
          <IconSearch className="pointer-events-none absolute left-3 top-[34px] h-4 w-4 text-slate-400" />
          <input className="input pl-9" placeholder="e.g. A5-07" value={filters.search} onChange={(e) => setFilter('search', e.target.value)} />
        </div>
        <div>
          <label className="label">Floor</label>
          <select className="input" value={filters.floor} onChange={(e) => setFilter('floor', e.target.value)}>
            <option value="">All</option>
            {[1, 2, 3, 4, 5].map((f) => <option key={f} value={f}>Floor {f}</option>)}
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="card"><Skeleton className="h-4 w-20" /><Skeleton className="mt-3 h-3 w-28" /></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data?.items.map((s) => (
            <div key={s.id} className={`card card-hover animate-fade-in border-l-4 p-4 ${ACCENT[s.status] || 'border-l-slate-300'}`}>
              <div className="flex items-start justify-between">
                <div className="font-mono text-base font-bold text-slate-800">{s.seat_number}</div>
                <StatusBadge status={s.status} />
              </div>
              <div className="mt-1 text-xs text-slate-400">Floor {s.floor} · Zone {s.zone} · Bay {s.bay}</div>
              {s.employee_name ? (
                <div className="mt-3 border-t border-slate-100 pt-2.5 text-xs">
                  <div className="font-semibold text-slate-700">{s.employee_name}</div>
                  <div className="text-slate-400">{s.project_name}</div>
                  <button className="mt-2 inline-flex items-center gap-1 font-medium text-rose-600 hover:text-rose-700" onClick={() => release(s.id)}>
                    <IconRelease className="h-3.5 w-3.5" /> Release
                  </button>
                </div>
              ) : (
                <div className="mt-3 border-t border-slate-100 pt-2.5 text-xs text-slate-300">Unoccupied</div>
              )}
            </div>
          ))}
          {data?.items.length === 0 && (
            <div className="col-span-full py-14 text-center text-slate-400">No seats match your filters.</div>
          )}
        </div>
      )}

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

      <Toast {...toast} onClose={() => setToast(null)} />
    </div>
  )
}

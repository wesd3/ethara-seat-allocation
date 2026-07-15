import { useEffect, useState } from 'react'
import { api } from '../api'
import { StatCard, Bar, Skeleton } from '../components/ui.jsx'
import {
  IconUsers,
  IconSeat,
  IconCheck,
  IconBuilding,
  IconLock,
  IconWrench,
  IconUserPlus,
  IconChart,
} from '../components/icons.jsx'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [projects, setProjects] = useState([])
  const [floors, setFloors] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.summary(), api.projectUtil(), api.floorUtil()])
      .then(([s, p, f]) => {
        setSummary(s)
        setProjects(p.sort((a, b) => b.employee_count - a.employee_count))
        setFloors(f)
      })
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="card text-rose-600">Failed to load dashboard: {error}</div>

  const cards = summary
    ? [
        { label: 'Total Employees', value: summary.total_employees, icon: IconUsers, color: 'brand' },
        { label: 'Total Seats', value: summary.total_seats, icon: IconSeat, color: 'violet' },
        { label: 'Occupied', value: summary.occupied_seats, icon: IconCheck, color: 'blue' },
        { label: 'Available', value: summary.available_seats, icon: IconBuilding, color: 'emerald' },
        { label: 'Reserved', value: summary.reserved_seats, icon: IconLock, color: 'amber' },
        { label: 'Maintenance', value: summary.maintenance_seats, icon: IconWrench, color: 'rose' },
        { label: 'New Joiners Pending', value: summary.new_joiners_pending, icon: IconUserPlus, color: 'violet', sub: 'awaiting allocation' },
        {
          label: 'Occupancy',
          value: `${Math.round((summary.occupied_seats / summary.total_seats) * 100)}%`,
          icon: IconChart,
          color: 'slate',
          sub: 'of all seats',
        },
      ]
    : []

  const maxEmp = Math.max(...projects.map((p) => p.employee_count), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Live overview of seating, projects and allocation.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary
          ? cards.map((c) => <StatCard key={c.label} {...c} value={c.value.toLocaleString?.() ?? c.value} />)
          : Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-3 h-8 w-16" />
              </div>
            ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Project-wise Allocation</h2>
            <span className="badge bg-brand-50 text-brand-700 ring-brand-600/20">{projects.length} projects</span>
          </div>
          <div className="space-y-4">
            {projects.map((p) => (
              <div key={p.project_id}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{p.project_name}</span>
                  <span className="text-slate-500">
                    <b className="text-slate-700">{p.allocated_seats}</b> seats · {p.employee_count} emp
                  </span>
                </div>
                <Bar value={p.employee_count} max={maxEmp} />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Floor-wise Occupancy</h2>
            <span className="badge bg-blue-50 text-blue-700 ring-blue-600/20">{floors.length} floors</span>
          </div>
          <div className="space-y-5">
            {floors.map((f) => (
              <div key={f.floor}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">Floor {f.floor}</span>
                  <span className="text-slate-500">
                    {f.occupied}/{f.total_seats} · <b className="text-slate-700">{f.occupancy_pct}%</b>
                  </span>
                </div>
                <Bar value={f.occupied} max={f.total_seats} gradient="from-blue-500 to-cyan-500" />
                <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-400" />{f.available} available</span>
                  <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-amber-400" />{f.reserved} reserved</span>
                  <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-rose-400" />{f.maintenance} maintenance</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

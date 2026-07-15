import { useEffect, useState } from 'react'
import { api } from '../api'
import { StatCard, Bar, Spinner } from '../components/ui.jsx'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [projects, setProjects] = useState([])
  const [floors, setFloors] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.summary(), api.projectUtil(), api.floorUtil()])
      .then(([s, p, f]) => {
        setSummary(s)
        setProjects(p)
        setFloors(f)
      })
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="card text-rose-600">Failed to load dashboard: {error}</div>
  if (!summary) return <Spinner />

  const maxEmp = Math.max(...projects.map((p) => p.employee_count), 1)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Employees" value={summary.total_employees.toLocaleString()} />
        <StatCard label="Total Seats" value={summary.total_seats.toLocaleString()} />
        <StatCard label="Occupied" value={summary.occupied_seats.toLocaleString()} accent="text-blue-600" />
        <StatCard label="Available" value={summary.available_seats.toLocaleString()} accent="text-emerald-600" />
        <StatCard label="Reserved" value={summary.reserved_seats.toLocaleString()} accent="text-amber-600" />
        <StatCard label="Maintenance" value={summary.maintenance_seats.toLocaleString()} accent="text-rose-600" />
        <StatCard
          label="New Joiners Pending"
          value={summary.new_joiners_pending.toLocaleString()}
          accent="text-purple-600"
          sub="awaiting seat allocation"
        />
        <StatCard
          label="Occupancy"
          value={`${Math.round((summary.occupied_seats / summary.total_seats) * 100)}%`}
          sub="of all seats"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 font-semibold">Project-wise Allocation</h2>
          <div className="space-y-3">
            {projects.map((p) => (
              <div key={p.project_id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium">{p.project_name}</span>
                  <span className="text-slate-500">
                    {p.allocated_seats} seats · {p.employee_count} emp
                  </span>
                </div>
                <Bar value={p.employee_count} max={maxEmp} />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold">Floor-wise Occupancy</h2>
          <div className="space-y-4">
            {floors.map((f) => (
              <div key={f.floor}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium">Floor {f.floor}</span>
                  <span className="text-slate-500">
                    {f.occupied}/{f.total_seats} ({f.occupancy_pct}%)
                  </span>
                </div>
                <Bar value={f.occupied} max={f.total_seats} color="bg-blue-500" />
                <div className="mt-1 flex gap-4 text-[11px] text-slate-400">
                  <span>🟢 {f.available} available</span>
                  <span>🟠 {f.reserved} reserved</span>
                  <span>🔴 {f.maintenance} maintenance</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

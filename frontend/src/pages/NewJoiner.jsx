import { useEffect, useState } from 'react'
import { api } from '../api'
import { Toast, StatusBadge } from '../components/ui.jsx'

const EMPTY = { name: '', email: '', department: 'Engineering', role: 'Engineer', joining_date: '', project_id: '' }

export default function NewJoiner() {
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [created, setCreated] = useState(null)
  const [suggestion, setSuggestion] = useState(null)
  const [pref, setPref] = useState({ preferred_floor: '', preferred_zone: '' })
  const [toast, setToast] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.projects().then(setProjects).catch(() => {})
  }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const payload = { ...form, project_id: form.project_id ? Number(form.project_id) : null }
      if (!payload.joining_date) delete payload.joining_date
      const emp = await api.createEmployee(payload)
      setCreated(emp)
      setSuggestion(null)
      setToast({ type: 'success', message: `Created ${emp.name} (${emp.employee_code})` })
      // Immediately fetch a seat suggestion.
      await getSuggestion(emp.id)
    } catch (err) {
      setToast({ type: 'error', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  const getSuggestion = async (empId, override) => {
    try {
      const p = override || pref
      const s = await api.suggestSeat({
        employee_id: empId,
        preferred_floor: p.preferred_floor || undefined,
        preferred_zone: p.preferred_zone || undefined,
      })
      setSuggestion(s)
    } catch (err) {
      setSuggestion(null)
      setToast({ type: 'error', message: err.message })
    }
  }

  const allocate = async (seatId) => {
    setBusy(true)
    try {
      const seat = await api.allocate({ employee_id: created.id, seat_id: seatId })
      setToast({ type: 'success', message: `Allocated ${seat.seat_number} to ${created.name}` })
      const refreshed = await api.employee(created.id)
      setCreated(refreshed)
      setSuggestion(null)
    } catch (err) {
      setToast({ type: 'error', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setForm(EMPTY)
    setCreated(null)
    setSuggestion(null)
    setPref({ preferred_floor: '', preferred_zone: '' })
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">New Joiner Allocation</h1>
      <p className="text-sm text-slate-500">
        Add a new employee, get a system-suggested seat near their project team, and allocate it.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={submit} className="card space-y-3">
          <h2 className="font-semibold">1 · Employee details</h2>
          <div>
            <label className="label">Full name *</label>
            <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <label className="label">Email *</label>
            <input className="input" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Department</label>
              <input className="input" value={form.department} onChange={(e) => set('department', e.target.value)} />
            </div>
            <div>
              <label className="label">Role</label>
              <input className="input" value={form.role} onChange={(e) => set('role', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Joining date</label>
              <input className="input" type="date" value={form.joining_date} onChange={(e) => set('joining_date', e.target.value)} />
            </div>
            <div>
              <label className="label">Project</label>
              <select className="input" value={form.project_id} onChange={(e) => set('project_id', e.target.value)}>
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button className="btn-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Create employee'}
            </button>
            {created && (
              <button type="button" className="btn-ghost" onClick={reset}>
                New form
              </button>
            )}
          </div>
        </form>

        <div className="card space-y-4">
          <h2 className="font-semibold">2 · Seat suggestion & allocation</h2>
          {!created ? (
            <p className="text-sm text-slate-400">Create an employee first to see suggested seats.</p>
          ) : (
            <>
              <div className="rounded-lg bg-slate-50 p-3 text-sm">
                <div className="font-medium">{created.name}</div>
                <div className="text-slate-500">
                  {created.employee_code} · {created.project_name || 'No project'} · <StatusBadge status={created.allocation_status} />
                </div>
              </div>

              {created.seat ? (
                <div className="rounded-lg bg-emerald-50 p-4">
                  <div className="text-xs font-medium text-emerald-700">Allocated ✓</div>
                  <div className="mt-1 text-lg font-semibold">
                    Floor {created.seat.floor}, Zone {created.seat.zone}, Bay {created.seat.bay}
                  </div>
                  <div className="font-mono text-sm text-slate-600">Seat {created.seat.seat_number}</div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="label">Pref. floor</label>
                      <select
                        className="input"
                        value={pref.preferred_floor}
                        onChange={(e) => setPref((p) => ({ ...p, preferred_floor: e.target.value }))}
                      >
                        <option value="">Any</option>
                        {[1, 2, 3, 4, 5].map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Pref. zone</label>
                      <select
                        className="input"
                        value={pref.preferred_zone}
                        onChange={(e) => setPref((p) => ({ ...p, preferred_zone: e.target.value }))}
                      >
                        <option value="">Any</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button className="btn-ghost w-full" onClick={() => getSuggestion(created.id)}>
                        Suggest
                      </button>
                    </div>
                  </div>

                  {suggestion && (
                    <div className="rounded-lg border border-brand-100 bg-brand-50 p-4">
                      <div className="text-xs text-brand-700">{suggestion.reason}</div>
                      <div className="mt-1 text-lg font-semibold">
                        Floor {suggestion.seat.floor}, Zone {suggestion.seat.zone}, Bay {suggestion.seat.bay}
                      </div>
                      <div className="font-mono text-sm text-slate-600">Seat {suggestion.seat.seat_number}</div>
                      <button className="btn-primary mt-3" disabled={busy} onClick={() => allocate(suggestion.seat.id)}>
                        Allocate this seat
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <Toast {...toast} onClose={() => setToast(null)} />
    </div>
  )
}

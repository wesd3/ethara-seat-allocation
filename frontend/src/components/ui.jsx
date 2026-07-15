// Small shared presentational helpers.

export function StatusBadge({ status }) {
  const map = {
    Available: 'bg-emerald-100 text-emerald-700',
    Occupied: 'bg-blue-100 text-blue-700',
    Reserved: 'bg-amber-100 text-amber-700',
    Maintenance: 'bg-rose-100 text-rose-700',
    allocated: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-slate-200 text-slate-600',
  }
  return <span className={`badge ${map[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>
}

export function StatCard({ label, value, accent = 'text-slate-900', sub }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-3xl font-semibold ${accent}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  )
}

export function Bar({ value, max, color = 'bg-brand-500' }) {
  const pct = max ? Math.round((value / max) * 100) : 0
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-10 text-slate-400">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500" />
    </div>
  )
}

export function Toast({ message, type = 'info', onClose }) {
  if (!message) return null
  const color = type === 'error' ? 'bg-rose-600' : type === 'success' ? 'bg-emerald-600' : 'bg-slate-800'
  return (
    <div className={`fixed bottom-6 right-6 z-50 rounded-lg ${color} px-4 py-3 text-sm text-white shadow-lg`}>
      <div className="flex items-center gap-3">
        <span>{message}</span>
        <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
      </div>
    </div>
  )
}

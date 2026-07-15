// Shared presentational helpers.

const STATUS_STYLES = {
  Available: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Occupied: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  Reserved: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Maintenance: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  allocated: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  inactive: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}
const DOT = {
  Available: 'bg-emerald-500',
  Occupied: 'bg-blue-500',
  Reserved: 'bg-amber-500',
  Maintenance: 'bg-rose-500',
  allocated: 'bg-emerald-500',
  pending: 'bg-amber-500',
  active: 'bg-emerald-500',
  inactive: 'bg-slate-400',
}

export function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-600 ring-slate-500/20'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status] || 'bg-slate-400'}`} />
      {status}
    </span>
  )
}

const GRADIENTS = {
  brand: 'from-brand-500 to-violet-500',
  blue: 'from-blue-500 to-cyan-500',
  emerald: 'from-emerald-500 to-teal-500',
  amber: 'from-amber-500 to-orange-500',
  rose: 'from-rose-500 to-pink-500',
  violet: 'from-violet-500 to-fuchsia-500',
  slate: 'from-slate-500 to-slate-600',
}

export function StatCard({ label, value, icon: Icon, color = 'brand', sub }) {
  return (
    <div className="card card-hover animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
          <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</div>
          {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
        </div>
        {Icon && (
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${GRADIENTS[color]} text-white shadow-md`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  )
}

export function Bar({ value, max, gradient = 'from-brand-500 to-violet-500' }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-2 rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// Deterministic gradient avatar from a name.
const AVATAR_GRADS = [
  'from-brand-500 to-violet-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-fuchsia-500 to-purple-500',
]
export function Avatar({ name = '?', size = 'h-9 w-9', text = 'text-xs' }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const grad = AVATAR_GRADS[Math.abs(hash) % AVATAR_GRADS.length]
  return (
    <span className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${grad} ${text} font-bold text-white shadow-sm`}>
      {initials}
    </span>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16 text-slate-400">
      <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-slate-200 border-t-brand-500" />
    </div>
  )
}

export function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/70 ${className}`} />
}

export function Toast({ message, type = 'info', onClose }) {
  if (!message) return null
  const color = type === 'error' ? 'bg-rose-600' : type === 'success' ? 'bg-emerald-600' : 'bg-slate-800'
  return (
    <div className={`fixed bottom-6 right-6 z-50 animate-pop-in rounded-xl ${color} px-4 py-3 text-sm text-white shadow-hover`}>
      <div className="flex items-center gap-3">
        <span>{message}</span>
        <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
      </div>
    </div>
  )
}

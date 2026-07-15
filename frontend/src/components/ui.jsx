// Shared presentational helpers.

const STATUS_STYLES = {
  Available: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/25',
  Occupied: 'bg-blue-500/10 text-blue-600 ring-blue-500/25',
  Reserved: 'bg-amber-500/10 text-amber-600 ring-amber-500/25',
  Maintenance: 'bg-rose-500/10 text-rose-600 ring-rose-500/25',
  allocated: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/25',
  pending: 'bg-amber-500/10 text-amber-600 ring-amber-500/25',
  active: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/25',
  inactive: 'bg-slate-500/10 text-slate-500 ring-slate-500/25',
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
    <span className={`badge ${STATUS_STYLES[status] || 'bg-slate-500/10 text-slate-500 ring-slate-500/25'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status] || 'bg-slate-400'}`} />
      {status}
    </span>
  )
}

const GRADIENTS = {
  blue: 'from-blue-500 to-cyan-500',
  emerald: 'from-emerald-500 to-teal-500',
  amber: 'from-amber-500 to-orange-500',
  rose: 'from-rose-500 to-pink-500',
  violet: 'from-violet-500 to-fuchsia-500',
  slate: 'from-slate-500 to-slate-600',
}

export function StatCard({ label, value, icon: Icon, color = 'brand', sub }) {
  const iconClass = color === 'brand' ? 'grad-accent' : `bg-gradient-to-br ${GRADIENTS[color] || GRADIENTS.slate}`
  return (
    <div className="card card-hover animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</div>
          <div className="mt-2 text-3xl font-bold tracking-tight text-ink">{value}</div>
          {sub && <div className="mt-1 text-xs text-faint">{sub}</div>}
        </div>
        {Icon && (
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-md ${iconClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  )
}

export function Bar({ value, max, variant = 'accent' }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0
  const fill = variant === 'blue' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'grad-accent'
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div className={`h-2 rounded-full transition-all duration-500 ${fill}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// Deterministic gradient avatar from a name (decorative — stays multi-hue).
const AVATAR_GRADS = [
  'from-indigo-500 to-violet-500',
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
    <div className="flex items-center justify-center py-16 text-faint">
      <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-line border-t-brand-500" />
    </div>
  )
}

export function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`animate-pulse rounded-md bg-surface-2 ${className}`} />
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

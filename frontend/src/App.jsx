import { NavLink, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import Employees from './pages/Employees.jsx'
import Seats from './pages/Seats.jsx'
import NewJoiner from './pages/NewJoiner.jsx'
import Assistant from './pages/Assistant.jsx'

const NAV = [
  { to: '/', label: 'Dashboard', end: true, icon: '📊' },
  { to: '/employees', label: 'Employees', icon: '👥' },
  { to: '/seats', label: 'Seats', icon: '🪑' },
  { to: '/new-joiner', label: 'New Joiner', icon: '➕' },
  { to: '/assistant', label: 'AI Assistant', icon: '🤖' },
]

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-bold text-white">
              E
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">Ethara</div>
              <div className="text-[11px] leading-tight text-slate-400">Seat Allocation & Project Mapping</div>
            </div>
          </div>
          <nav className="flex flex-wrap gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-100'
                  }`
                }
              >
                <span className="mr-1">{n.icon}</span>
                <span className="hidden sm:inline">{n.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/seats" element={<Seats />} />
          <Route path="/new-joiner" element={<NewJoiner />} />
          <Route path="/assistant" element={<Assistant />} />
        </Routes>
      </main>

      <footer className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-slate-400">
        Ethara Seat Allocation & Project Mapping System · Vibe Coding Assessment
      </footer>
    </div>
  )
}

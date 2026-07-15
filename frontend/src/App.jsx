import { NavLink, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import Employees from './pages/Employees.jsx'
import Seats from './pages/Seats.jsx'
import NewJoiner from './pages/NewJoiner.jsx'
import Assistant from './pages/Assistant.jsx'
import {
  IconDashboard,
  IconUsers,
  IconSeat,
  IconUserPlus,
  IconSparkles,
} from './components/icons.jsx'

const NAV = [
  { to: '/', label: 'Dashboard', end: true, icon: IconDashboard },
  { to: '/employees', label: 'Employees', icon: IconUsers },
  { to: '/seats', label: 'Seats', icon: IconSeat },
  { to: '/new-joiner', label: 'New Joiner', icon: IconUserPlus },
  { to: '/assistant', label: 'AI Assistant', icon: IconSparkles },
]

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-lg font-black text-white shadow-glow">
        E
      </div>
      <div className="leading-tight">
        <div className="text-sm font-bold text-slate-900">Ethara</div>
        <div className="text-[11px] text-slate-400">Seat Allocation</div>
      </div>
    </div>
  )
}

function NavItems({ onNavigate }) {
  return (
    <>
      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
              isActive
                ? 'bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-glow'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <n.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
              {n.label}
            </>
          )}
        </NavLink>
      ))}
    </>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white/80 px-4 py-6 backdrop-blur lg:flex">
        <div className="px-1.5">
          <Brand />
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1.5">
          <NavItems />
        </nav>
        <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-violet-50 p-4 text-xs text-slate-500 ring-1 ring-brand-100">
          <div className="font-semibold text-brand-700">Vibe Coding Assessment</div>
          <p className="mt-1 leading-relaxed">Managing 5,000 employees across 6,000 seats & 11 projects.</p>
        </div>
      </aside>

      {/* Mobile top nav */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Brand />
        </div>
        <nav className="flex gap-1.5 overflow-x-auto px-4 pb-3">
          <NavItems />
        </nav>
      </header>

      {/* Content */}
      <div className="lg:pl-64">
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/seats" element={<Seats />} />
            <Route path="/new-joiner" element={<NewJoiner />} />
            <Route path="/assistant" element={<Assistant />} />
          </Routes>
          <footer className="mt-10 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
            Ethara Seat Allocation & Project Mapping System
          </footer>
        </main>
      </div>
    </div>
  )
}

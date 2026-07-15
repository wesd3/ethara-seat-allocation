import { NavLink, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import Employees from './pages/Employees.jsx'
import Seats from './pages/Seats.jsx'
import NewJoiner from './pages/NewJoiner.jsx'
import Assistant from './pages/Assistant.jsx'
import ThemeSwitcher from './components/ThemeSwitcher.jsx'
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
      <div className="grad-accent glow-accent flex h-10 w-10 items-center justify-center rounded-2xl text-lg font-black text-white">
        E
      </div>
      <div className="leading-tight">
        <div className="text-sm font-bold text-ink">Ethara</div>
        <div className="text-[11px] text-faint">Seat Allocation</div>
      </div>
    </div>
  )
}

function NavItems() {
  return (
    <>
      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.end}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
              isActive
                ? 'grad-accent glow-accent text-white'
                : 'text-muted hover:bg-surface-2 hover:text-ink-2'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <n.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-faint group-hover:text-muted'}`} />
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
    <div className="min-h-screen bg-app">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface/80 px-4 py-6 backdrop-blur lg:flex">
        <div className="px-1.5">
          <Brand />
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1.5">
          <NavItems />
        </nav>
        <div className="space-y-3">
          <ThemeSwitcher />
          <div className="grad-accent-soft rounded-2xl p-4 text-xs text-muted ring-1 ring-brand-500/20">
            <div className="font-semibold text-accent">Vibe Coding Assessment</div>
            <p className="mt-1 leading-relaxed">Managing 5,000 employees across 6,000 seats & 11 projects.</p>
          </div>
        </div>
      </aside>

      {/* Mobile top nav */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Brand />
        </div>
        <nav className="flex gap-1.5 overflow-x-auto px-4 pb-3">
          <NavItems />
        </nav>
        <div className="px-4 pb-3">
          <ThemeSwitcher />
        </div>
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
          <footer className="mt-10 border-t border-line pt-6 text-center text-xs text-faint">
            Ethara Seat Allocation & Project Mapping System
          </footer>
        </main>
      </div>
    </div>
  )
}

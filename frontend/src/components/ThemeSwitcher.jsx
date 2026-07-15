import { useState } from 'react'
import { ACCENTS, getAccent, getMode, applyAccent, applyMode } from '../theme'

// Sun / moon inline icons (kept local to this control).
const Sun = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4" {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
  </svg>
)
const Moon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" {...p}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
)

export default function ThemeSwitcher() {
  const [accent, setAccent] = useState(getAccent())
  const [mode, setMode] = useState(getMode())

  const pickAccent = (id) => {
    setAccent(id)
    applyAccent(id)
  }
  const setLight = () => {
    setMode('light')
    applyMode('light')
  }
  const setDark = () => {
    setMode('dark')
    applyMode('dark')
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-3.5">
      <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Theme</div>
      <div className="flex items-center gap-2">
        {ACCENTS.map((a) => (
          <button
            key={a.id}
            onClick={() => pickAccent(a.id)}
            title={a.label}
            aria-label={a.label}
            className={`h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-surface transition ${
              accent === a.id ? 'ring-ink/40 scale-110' : 'ring-transparent hover:scale-110'
            }`}
            style={{ backgroundImage: `linear-gradient(135deg, ${a.from}, ${a.to})` }}
          />
        ))}
      </div>

      <div className="mt-3 flex rounded-xl border border-line bg-surface-2 p-0.5">
        <button
          onClick={setLight}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
            mode === 'light' ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink-2'
          }`}
        >
          <Sun /> Light
        </button>
        <button
          onClick={setDark}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
            mode === 'dark' ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink-2'
          }`}
        >
          <Moon /> Dark
        </button>
      </div>
    </div>
  )
}

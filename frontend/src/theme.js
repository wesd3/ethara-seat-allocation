// Runtime theme system: accent presets + light/dark mode, persisted to
// localStorage and applied to <html> (data-theme + .dark). The initial
// application also happens via an inline script in index.html to avoid a flash.

export const ACCENTS = [
  { id: 'indigo', label: 'Indigo', from: '#6366f1', to: '#8b5cf6' },
  { id: 'emerald', label: 'Emerald', from: '#10b981', to: '#14b8a6' },
  { id: 'blue', label: 'Ocean', from: '#3b82f6', to: '#06b6d4' },
  { id: 'rose', label: 'Sunset', from: '#f43f5e', to: '#f59e0b' },
]

const ACCENT_KEY = 'ethara-accent'
const MODE_KEY = 'ethara-mode'

export function getAccent() {
  try {
    return localStorage.getItem(ACCENT_KEY) || 'indigo'
  } catch {
    return 'indigo'
  }
}

export function getMode() {
  try {
    return localStorage.getItem(MODE_KEY) || 'light'
  } catch {
    return 'light'
  }
}

export function applyAccent(id) {
  document.documentElement.setAttribute('data-theme', id)
  try {
    localStorage.setItem(ACCENT_KEY, id)
  } catch {
    /* ignore */
  }
}

export function applyMode(mode) {
  document.documentElement.classList.toggle('dark', mode === 'dark')
  try {
    localStorage.setItem(MODE_KEY, mode)
  } catch {
    /* ignore */
  }
}

// Ensure state is applied (safe to call on mount).
export function initTheme() {
  applyAccent(getAccent())
  applyMode(getMode())
}

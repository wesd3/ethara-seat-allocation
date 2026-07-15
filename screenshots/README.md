# Screenshots

Captured from the running app (`http://127.0.0.1:5173`).

| File | Page |
|------|------|
| `01-dashboard.png` | Dashboard — stat cards, project-wise allocation, floor-wise occupancy |
| `02-employees.png` | Employees — search/filter table with seat + status |
| `03-seats.png` | Seats — filterable grid with statuses and allocate/release |
| `04-new-joiner.png` | New Joiner — create employee → suggest seat → allocate |
| `05-assistant.png` | AI Assistant — natural-language seating chat |
| `theme-indigo-light.png` | Default Indigo accent, light mode |
| `theme-emerald-dark.png` | Emerald accent, dark mode (Dashboard) |
| `theme-rose-dark-employees.png` | Sunset accent, dark mode (Employees) |
| `theme-blue-dark-assistant.png` | Ocean accent, dark mode (AI Assistant) |

The live **theme switcher** (accent presets + light/dark) lives in the sidebar
footer and persists your choice in `localStorage`.

To regenerate:
```bash
# terminal 1
cd backend && uvicorn app.main:app --port 8010
# terminal 2
cd frontend && npm run dev
# terminal 3
cd frontend && node capture-screenshots.mjs
```

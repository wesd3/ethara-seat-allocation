# Ethara Seat Allocation & Project Mapping System

A full-stack application that manages seat allocation for ~5,000 employees at
Ethara. It lets HR/Admin/Growth teams maintain employee, project and seat data,
lets employees find where they sit and which project they're on, and includes a
natural-language **AI assistant** for seating queries.

> Built for the **Vibe Coding Assessment**. AI tooling usage and validation are
> documented in [`AI_PROMPTS.md`](./AI_PROMPTS.md).

---

## Table of contents
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Quick start (local)](#quick-start-local)
- [Run with Docker](#run-with-docker)
- [Seed data](#seed-data)
- [API reference](#api-reference)
- [AI assistant](#ai-assistant)
- [Business rules](#business-rules)
- [Deployment](#deployment)
- [Project structure](#project-structure)
- [Screenshots](#screenshots)

---

## Features

| Area | What it does |
|------|--------------|
| **Employee management** | Create, list, search, update, deactivate. Auto employee codes, duplicate-email prevention. |
| **Project mapping** | 11 seeded projects; each employee mapped to one active project. |
| **Seat allocation** | Floor / Zone / Bay / Seat model with `Available / Occupied / Reserved / Maintenance` statuses. Duplicate-seat prevention. |
| **New joiner allocation** | Add employee → system suggests a seat near their project team → allocate. Falls back to alternate zones when the team zone is full. |
| **Search & filter** | By name, employee ID/code, email, project, floor, zone, seat status. |
| **Dashboard** | Total/occupied/available/reserved seats, project-wise allocation, floor-wise occupancy, pending new joiners. |
| **AI assistant** | Natural-language Q&A over seats, projects, availability, neighbours and utilisation. Rule-based by default, optional LLM polish. |
| **CSV upload** | Bulk-import employees from CSV. |

---

## Tech stack

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router
- **Backend:** Python 3.12 + FastAPI + SQLAlchemy 2 + Pydantic v2
- **Database:** SQLite by default (zero-config); PostgreSQL supported via `DATABASE_URL`
- **AI:** Deterministic rule-based intent parser (no API key required); optional OpenAI polish
- **Deployment:** Docker / Render / Railway / Vercel / Netlify configs included

---

## Architecture

```
                 ┌──────────────────────────┐
                 │  React + Vite + Tailwind  │   (frontend/)
                 │  Dashboard · Employees ·  │
                 │  Seats · New Joiner · AI  │
                 └────────────┬─────────────┘
                       REST / JSON  (Vite proxy /api → :8010 in dev)
                 ┌────────────┴─────────────┐
                 │        FastAPI app        │   (backend/app/)
                 │  routers → services →     │
                 │  SQLAlchemy models        │
                 │  ai_assistant (rule/LLM)  │
                 └────────────┬─────────────┘
                 ┌────────────┴─────────────┐
                 │  SQLite (or PostgreSQL)   │
                 │  projects · employees ·   │
                 │  seats · seat_allocations │
                 └──────────────────────────┘
```

The core allocation rules live in a single service layer
(`backend/app/services.py`) that both the REST endpoints and the AI assistant
reuse, so behaviour stays consistent.

---

## Quick start (local)

Requires **Python 3.12** and **Node 18+**.

### 1. Backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Seed the database (5,000 employees, 6,000 seats, 11 projects)
python -m app.seed --reset

# Run the API (Swagger UI at http://127.0.0.1:8010/docs)
uvicorn app.main:app --reload --port 8010
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev          # http://127.0.0.1:5173
```

The Vite dev server proxies `/api/*` to the backend on port 8010, so no CORS or
env config is needed for local development.

---

## Run with Docker

```bash
docker compose up --build
```

- Frontend → http://localhost:8080
- Backend  → http://localhost:8000  (Swagger at `/docs`)

The backend image seeds itself at build time.

---

## Seed data

`python -m app.seed --reset` produces (all assignment minimums met):

| Requirement | Minimum | Seeded |
|-------------|--------:|-------:|
| Employees | 5,000 | **5,000** |
| Projects | 10 | **11** |
| Floors | 5 | **5** |
| Zones | 10 | **10** (2 per floor) |
| Seats | 5,500 | **6,000** |
| Available seats | 500 | **890** |
| Reserved seats | 100 | **120** |
| Pending allocation | 50 | **60** |

A known demo employee is always created: **`amit@ethara.ai`** (Amit Sharma,
Project Indigo) — used by the AI-assistant examples.

Seeding is deterministic (`random.seed(42)`), so results are reproducible.

---

## API reference

Interactive Swagger docs are served at **`/docs`** and ReDoc at **`/redoc`**.

### Employees
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/employees` | Create employee |
| `GET` | `/employees` | List / search (`search`, `project_id`, `department`, `status`, `allocation_status`, `limit`, `offset`) |
| `GET` | `/employees/{id}` | Employee details (incl. seat + project) |
| `PUT` | `/employees/{id}` | Update employee |
| `DELETE` | `/employees/{id}` | Deactivate (releases seat) |
| `POST` | `/employees/upload-csv` | Bulk import from CSV |

### Projects
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/projects` | Create project |
| `GET` | `/projects` | List projects with headcount & allocated seats |
| `GET` | `/projects/{id}/employees` | Employees in a project |

### Seats
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/seats` | Create seat |
| `GET` | `/seats` | List / filter (`floor`, `zone`, `status`, `search`) |
| `GET` | `/seats/available` | List available seats |
| `GET` | `/seats/suggest` | Suggest a seat for an employee (near their team) |
| `POST` | `/seats/allocate` | Allocate a seat to an employee |
| `POST` | `/seats/release` | Release a seat |

### Dashboard
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/dashboard/summary` | Totals: employees, seats, occupied/available/reserved, pending joiners |
| `GET` | `/dashboard/project-utilization` | Project-wise allocation |
| `GET` | `/dashboard/floor-utilization` | Floor-wise occupancy |

### AI assistant
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/ai/query` | Natural-language query |

Example:
```bash
curl -X POST http://127.0.0.1:8010/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query":"Where is my seat? My email is amit@ethara.ai"}'
# → {"answer":"Amit Sharma is allocated Floor 4, Zone A, Bay 5, Seat A5-07. Project: Indigo.", ...}
```

---

## AI assistant

The assistant has two layers:

1. **Rule-based intent parser (always on, no key required).** Parses the query,
   classifies intent, queries the database, and returns a grounded answer. This
   is the source of truth.
2. **Optional LLM polish.** If `OPENAI_API_KEY` is set, the grounded answer is
   passed to the model *only* to rephrase it more naturally — it is instructed
   not to add or change any facts. Any failure falls back to layer 1.

Supported intents: `find_seat`, `find_project`, `available_seats`,
`neighbours`, `project_utilization`, `allocate`.

Example questions:
- "Where is my seat? My email is amit@ethara.ai"
- "Which project is employee Amit assigned to?"
- "Show all available seats on Floor 3"
- "Who is sitting near amit@ethara.ai?"
- "How many seats are occupied for Project Indigo?"

---

## Business rules

Enforced centrally in `backend/app/services.py`:

- One employee → at most **one active seat**.
- One seat → at most **one active employee** (no duplicate allocation).
- **Reserved** and **Maintenance** seats cannot be allocated until status changes.
- Releasing an allocation sets the seat back to **Available** and the employee to **pending**.
- New joiners are prioritised for **available seats near their project team**; if the team zone is full the system suggests an **alternate zone / floor**.
- **Duplicate employee email** is rejected (409).
- **Duplicate seat number** on the same floor/zone is rejected (409).
- The dashboard reflects every allocation/release immediately (computed live).

---

## Deployment

Config files are included for several platforms — see [`DEPLOYMENT.md`](./DEPLOYMENT.md)
for step-by-step instructions.

| Platform | Files |
|----------|-------|
| Docker (self-host) | `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile` |
| Render (blueprint) | `render.yaml` |
| Vercel (frontend) | `frontend/vercel.json` |
| Netlify (frontend) | `frontend/netlify.toml` |
| Railway (backend) | `backend/Dockerfile` |

For a hosted backend, set on the frontend build:
`VITE_API_BASE=https://<your-backend-url>`.

---

## Project structure

```
assessment/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app + CORS + router wiring
│   │   ├── database.py        # engine/session (SQLite or Postgres)
│   │   ├── models.py          # SQLAlchemy models
│   │   ├── schemas.py         # Pydantic request/response models
│   │   ├── services.py        # allocation/release/suggest business logic
│   │   ├── ai_assistant.py    # rule-based + optional LLM assistant
│   │   ├── seed.py            # sample data generator
│   │   └── routers/           # employees, projects, seats, dashboard, ai
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # shell + routing
│   │   ├── api.js             # API client
│   │   ├── components/ui.jsx  # shared UI
│   │   └── pages/             # Dashboard, Employees, Seats, NewJoiner, Assistant
│   ├── package.json, vite.config.js, tailwind.config.js
│   ├── Dockerfile, nginx.conf, vercel.json, netlify.toml
├── database/
│   ├── schema.sql            # reference DDL (PostgreSQL-compatible)
│   └── sample_employees.csv  # sample CSV for the upload endpoint
├── docker-compose.yml
├── render.yaml
├── README.md
├── AI_PROMPTS.md
├── DEPLOYMENT.md
└── DEBUGGING_NOTES.md
```

## Screenshots

See the [`screenshots/`](./screenshots) folder (Dashboard, Employees, Seats,
New Joiner, AI Assistant). To regenerate: run both servers and capture
`http://127.0.0.1:5173`.

---

## Notes on authentication

This demo intentionally ships **without login** to keep the assessment focused
on seat/project logic and to make the live demo frictionless. The employee
identity for AI queries is supplied via email in the query itself
(e.g. "…my email is amit@ethara.ai"). Adding JWT auth would be a thin layer on
top of the existing employee table.

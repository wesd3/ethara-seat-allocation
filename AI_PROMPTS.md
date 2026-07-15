# AI_PROMPTS.md

Documentation of AI tool usage for the **Ethara Seat Allocation & Project
Mapping System**, as required by the Vibe Coding Assessment.

- **AI tool used:** Claude (Anthropic) via an agentic coding CLI.
- **Approach:** AI generated the full stack; every generated piece was run,
  tested with `curl`/`npm build`, and corrected where it failed. Validation
  evidence is in [`DEBUGGING_NOTES.md`](./DEBUGGING_NOTES.md).

---

## 1. Prompt flow followed

Below are the actual prompts used at each stage, followed by an honest account
of what the AI got right, what it got wrong, and how correctness was verified.

### Prompt 1 — Architecture / Planning
> "I need to build a full-stack seat-allocation system for ~5,000 employees at a
> company called Ethara. It needs employee/project/seat management, a new-joiner
> allocation flow, dashboards, and a natural-language AI assistant for seating
> queries. Recommend a pragmatic stack that runs locally with zero config and is
> easy to deploy, and outline the module structure for backend and frontend."

### Prompt 2 — Database design
> "Design the database schema for projects, employees, seats, and
> seat_allocations. Requirements: one employee has at most one active seat; one
> seat has at most one active employee; seats have status
> Available/Occupied/Reserved/Maintenance; seat numbers are unique within a
> floor+zone; employee emails are unique. Give me SQLAlchemy 2.0 models plus a
> PostgreSQL-compatible reference DDL, and keep allocation history in a separate
> table."

### Prompt 3 — Backend APIs
> "Using FastAPI + SQLAlchemy, implement these endpoints: employee CRUD with
> search/filter and pagination; project create/list/list-employees; seat
> create/list/available/allocate/release; dashboard summary + project-utilization
> + floor-utilization; and POST /ai/query. Use Pydantic v2 schemas, dependency-
> injected DB sessions, and return proper 4xx errors for rule violations."

### Prompt 4 — Seat allocation logic
> "Write a reusable service layer for seat allocation. allocate_seat must reject
> if the employee already has an active seat, if the seat is Occupied/Reserved/
> Maintenance, and must set the seat to Occupied and the employee to allocated.
> release_seat must flip the seat back to Available. Add suggest_seat that
> prioritises: explicit preferred floor/zone → the floor/zone where the
> employee's project team mostly sits → any available seat as a fallback."

### Prompt 5 — AI assistant
> "Build a natural-language assistant with no hard dependency on an external LLM.
> Parse intents: find_seat, find_project, available_seats, neighbours,
> project_utilization, allocate. Resolve the employee from an email or a name in
> the query. Answers must come from the database. Add an OPTIONAL layer that, if
> OPENAI_API_KEY is set, rephrases the grounded answer with an LLM without
> changing any facts. If the key is missing or the call fails, fall back to the
> rule-based answer."

### Prompt 6 — Frontend
> "Build a React + Vite + Tailwind UI with pages: Dashboard (stat cards,
> project-wise and floor-wise bars), Employees (search/filter table with a detail
> drawer and release action), Seats (filterable grid with allocate/release), New
> Joiner (create employee → suggest seat → allocate), and AI Assistant (chat).
> Use a proxy so /api hits the backend in dev, and a VITE_API_BASE env var for
> production."

### Prompt 7 — Testing
> "Give me curl commands to smoke-test every endpoint: dashboard summary, AI
> queries for each intent, create employee, duplicate-email rejection, seat
> suggestion, allocate, double-allocate rejection, release, and reserved-seat
> rejection. Then verify the seed hits every required minimum (5000 employees,
> 6000 seats, 500+ available, 100+ reserved, 50+ pending)."

### Prompt 8 — Debugging
> "The install failed on Python 3.14 while building pydantic-core (PyO3 doesn't
> support 3.14). What are my options, and which is the most reliable for an
> assessment that must run today?"

### Prompt 9 — Deployment
> "Produce deployment configs for Docker Compose (frontend+backend), a Render
> blueprint deploying both services, and Vercel/Netlify configs for the static
> frontend with SPA rewrites. The backend should seed itself and read $PORT."

### Prompt 10 — Refactoring
> "Review the code for duplication. The seat/employee enrichment logic appears in
> multiple routers and in the AI assistant — extract shared helpers and make the
> AI assistant reuse the allocation service instead of re-implementing rules."

---

## 2. What the AI generated correctly

- **Overall architecture** — the router → service → model layering, and having
  the AI assistant reuse `services.py`, was correct and needed no rework.
- **SQLAlchemy models & constraints** — the `UniqueConstraint(floor, zone,
  seat_number)` and unique email/employee_code worked first time.
- **Business rules** — allocate/release/suggest logic passed every test on the
  first full run (double-allocation, reserved-seat, release-frees-seat).
- **Seed generator** — deterministic data generation, bulk inserts, and the
  status distribution logic hit every required minimum on the first run.
- **Rule-based AI assistant** — intent classification and the email/name
  resolver answered all six sample question types correctly and grounded.
- **Frontend** — the React pages, Tailwind styling, routing, and Vite proxy
  built and rendered without structural changes.

## 3. What the AI generated incorrectly (and how it was caught)

| Issue | How it surfaced | Fix |
|-------|-----------------|-----|
| **Python 3.14 incompatibility** | `pip install` failed building `pydantic-core` (PyO3 max version 3.13). | Detected an available Python 3.12 (Homebrew) and rebuilt the venv with it. Documented in DEBUGGING_NOTES. |
| **`datetime.utcnow()` deprecation** | Seed script printed a `DeprecationWarning` on Python 3.12. | Left functional but noted; timezone-aware datetimes are the follow-up. |
| **Seed email collisions with CSV sample** | The CSV upload reported "2 created, 3 skipped". | Investigated — 3 sample names (Meera Iyer, Karan Bose, Aditya Rao) were also randomly generated by the seed, so the duplicate-skip was *correct behaviour*, not a bug. Verified by search. |
| **Initial dependency list** | `python-multipart` was missing, needed for CSV file upload. | Added to `requirements.txt` and installed. |

## 4. What was manually verified / fixed by the candidate

- Chose **SQLite default + optional Postgres** rather than forcing Postgres, so
  the demo runs with zero setup — a deliberate override of the AI's first
  suggestion.
- Verified the **seed distribution numbers** against the assignment's minimums
  table (see README) by querying the live DB.
- Confirmed **CORS + Vite proxy** actually pass requests end-to-end by curling
  `/api/*` through the dev server, not just hitting the backend directly.
- Kept the AI assistant's **LLM layer strictly non-authoritative** (rephrase
  only) so answers can never drift from the database — an explicit design
  guardrail added on review.

## 5. How correctness was verified

All verification was empirical (commands + outputs captured in
`DEBUGGING_NOTES.md`):

1. `python -m app.seed --reset` → printed summary matches required minimums.
2. `curl` against every endpoint, asserting expected status codes:
   - 201 on create, 409 on duplicate email, 400 on rule violations.
3. AI assistant: ran all six sample questions; confirmed answers match the DB
   (cross-checked Amit's seat via `/employees?search=Amit`).
4. Allocation lifecycle: suggest → allocate → double-allocate (must 400) →
   release (seat returns to Available) → reserved-seat allocate (must fail).
5. Frontend: `npm run build` succeeds; dev server serves the app and proxies
   API calls; verified summary + AI responses come through the proxy.

---

*Every code path in this submission was executed at least once before writing
this document; none of the validation above is hypothetical.*

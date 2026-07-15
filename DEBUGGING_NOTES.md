# Debugging & Verification Notes

Empirical record of issues hit during the build and the commands used to verify
the system works. Every command below was actually run.

---

## Issue 1 — Python 3.14 could not build `pydantic-core`

**Symptom**
```
error: the configured Python interpreter version (3.14) is newer than
PyO3's maximum supported version (3.13)
...
ERROR: Failed building wheel for pydantic-core
```
The system default `python3` was 3.14.4, for which pydantic-core (a Rust
extension via PyO3 0.22) had no compatible wheel and could not compile.

**Resolution**
Homebrew had `python@3.12` installed. Rebuilt the virtual environment with it:
```bash
/opt/homebrew/opt/python@3.12/bin/python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt   # ✓ all wheels resolved
```
Backend and Dockerfile both pin Python 3.12.

---

## Issue 2 — `python-multipart` missing for CSV upload

**Symptom** FastAPI raises `RuntimeError: Form data requires "python-multipart"`
when a `UploadFile` endpoint is added.

**Resolution** Added `python-multipart==0.0.20` to `requirements.txt` and
installed it.

---

## Issue 3 — CSV import reported "2 created, 3 skipped"

Not a bug. The sample CSV includes names (Meera Iyer, Karan Bose, Aditya Rao)
whose email pattern collides with randomly-generated seed employees, so the
duplicate-email guard correctly skipped them. Confirmed the guard is working
rather than dropping valid rows.

---

## Issue 4 — `datetime.utcnow()` DeprecationWarning (Python 3.12)

Non-blocking warning during seeding. Functionality unaffected; the timezone-
aware `datetime.now(datetime.UTC)` is the recommended follow-up.

---

## Verification log

### Seed hits every required minimum
```
$ python -m app.seed --reset
Created 11 projects
Created 6000 seats across 5 floors / 10 zones
Created 5000 employees
--- Seed summary ---
Employees:            5000
Seats total:          6000
  Occupied:           4940
  Available:          890
  Reserved:           120
  Maintenance:        50
Pending allocation:   60
```

### Dashboard summary
```
$ curl -s /dashboard/summary
{"total_employees":5000,"total_seats":6000,"occupied_seats":4940,
 "available_seats":890,"reserved_seats":120,"maintenance_seats":50,
 "new_joiners_pending":60}
```

### AI assistant — all sample intents
```
Q: Where is my seat? My email is amit@ethara.ai
A: Amit Sharma is allocated Floor 4, Zone A, Bay 5, Seat A5-07. Project: Indigo.

Q: Which project is employee Amit assigned to?
A: Amit Sharma is assigned to Project Indigo.

Q: Show all available seats on Floor 3
A: There are 183 available seats on Floor 3. For example: A1-05 (F3/A) ...

Q: Who is sitting near me? amit@ethara.ai
A: Near Amit Sharma (Floor 4, Zone A, Bay 5): Pooja Khan, Raj Menon, ...

Q: How many seats are occupied for Project Indigo?
A: Project Indigo has 421 occupied seats across 432 employees.
```

### Allocation lifecycle & rule enforcement
```
Create employee                        → 201, code ETH15001, status pending
Create duplicate email                 → 409  (rejected) ✓
GET /seats/suggest?employee_id=…       → A1-02, "near your project team" ✓
POST /seats/allocate                   → seat Occupied, employee allocated ✓
POST /seats/allocate (again)           → 400  (already has a seat) ✓
POST /seats/release                    → seat back to Available ✓
Allocate a Reserved seat               → 400  "Reserved ... cannot be allocated" ✓
```

### Frontend
```
$ npm run build      → ✓ built in 724ms (41 modules)
$ curl /             → <title>Ethara Seat Allocation</title>
$ curl /api/dashboard/summary   (through Vite proxy) → live JSON ✓
$ curl -X POST /api/ai/query    (through Vite proxy) → grounded answer ✓
```

All checks passed.

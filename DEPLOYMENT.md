# Deployment Notes

This project ships with configs for several platforms. Pick the backend and
frontend hosts you prefer — they are independent.

> **Important:** the frontend needs to know the backend URL at **build time**
> via the `VITE_API_BASE` environment variable. Deploy the backend first, note
> its public URL, then build the frontend with that value.

---

## Option A — Docker (self-host / any VM), one command

```bash
docker compose up --build
```
- Frontend: http://localhost:8080
- Backend:  http://localhost:8000  (Swagger at `/docs`)

The backend image runs `python -m app.seed --reset` during build, so it ships
with demo data.

---

## Option B — Render (both services, blueprint)

1. Push this repo to GitHub.
2. Render dashboard → **New → Blueprint** → select the repo. Render reads
   [`render.yaml`](./render.yaml) and provisions:
   - `ethara-backend` (Python web service) — build runs the seed step.
   - `ethara-frontend` (static site) with SPA rewrites.
3. After the backend is live, set the frontend's `VITE_API_BASE` env var to the
   backend URL (e.g. `https://ethara-backend.onrender.com`) and redeploy the
   frontend.

---

## Option C — Railway (backend) + Vercel/Netlify (frontend)

**Backend on Railway**
1. New Project → Deploy from GitHub → set root directory to `backend/`.
2. Railway detects the `Dockerfile`. It injects `$PORT` (already handled).
3. (Optional) add `OPENAI_API_KEY` to enable LLM-polished answers.
4. Copy the generated public URL.

**Frontend on Vercel**
1. Import the repo, set root directory to `frontend/`.
2. Framework preset: **Vite**. `frontend/vercel.json` provides SPA rewrites.
3. Add env var `VITE_API_BASE=https://<railway-backend-url>`.
4. Deploy.

**Frontend on Netlify** (alternative)
- `frontend/netlify.toml` sets build command, publish dir, and SPA redirects.
- Set `VITE_API_BASE` in Site settings → Environment.

---

## Environment variables

| Where | Variable | Purpose | Default |
|-------|----------|---------|---------|
| Backend | `DATABASE_URL` | Use PostgreSQL instead of SQLite | local SQLite file |
| Backend | `CORS_ORIGINS` | Comma-separated allowed origins | `*` |
| Backend | `PORT` | Port to bind | `8000` |
| Backend | `OPENAI_API_KEY` | Enable LLM answer polishing (optional) | unset (rule-based) |
| Frontend | `VITE_API_BASE` | Backend base URL (build-time) | `/api` (dev proxy) |

---

## Using PostgreSQL instead of SQLite

1. Uncomment `psycopg[binary]` in `backend/requirements.txt`.
2. Set `DATABASE_URL=postgresql+psycopg://user:pass@host:5432/ethara`.
3. Run the seed once as a release step: `python -m app.seed --reset`.

Tables are created automatically on startup; `database/schema.sql` documents the
equivalent DDL if you want to provision manually.

---

## Post-deploy smoke test

```bash
curl https://<backend-url>/health
curl https://<backend-url>/dashboard/summary
curl -X POST https://<backend-url>/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query":"Where is my seat? My email is amit@ethara.ai"}'
```

## Submission links (fill in after deploying)

- **Live frontend URL:** _<paste here>_
- **Live backend URL:** _<paste here>_
- **Swagger/API docs:** _`<backend-url>/docs`_
- **GitHub repository:** _<paste here>_
- **Sample credentials:** none — app is open (see README → Notes on authentication).
  AI queries identify the employee by email, e.g. `amit@ethara.ai`.

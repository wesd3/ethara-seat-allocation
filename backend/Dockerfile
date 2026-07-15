FROM python:3.12-slim

WORKDIR /app

# Install deps first for better layer caching.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Seed the SQLite DB at build time so the container ships with demo data.
# (For a persistent Postgres, run `python -m app.seed` as a release step instead.)
RUN python -m app.seed --reset || true

EXPOSE 8000
ENV PORT=8000

# Railway/Render inject $PORT; default to 8000 locally.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

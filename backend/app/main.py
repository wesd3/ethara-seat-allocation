"""FastAPI application entry point for the Ethara Seat Allocation system."""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import ai, dashboard, employees, projects, seats

# Create tables on startup (safe no-op if they already exist).
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Ethara Seat Allocation & Project Mapping System",
    description=(
        "Manage seat allocation for ~5,000 employees: employee & project "
        "mapping, seat allocation, dashboards, and a natural-language AI "
        "assistant. Interactive docs at /docs."
    ),
    version="1.0.0",
)

# CORS — allow the frontend dev server and any deployed origin.
_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(employees.router)
app.include_router(projects.router)
app.include_router(seats.router)
app.include_router(dashboard.router)
app.include_router(ai.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "service": "Ethara Seat Allocation & Project Mapping System",
        "status": "ok",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}

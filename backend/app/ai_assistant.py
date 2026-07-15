"""Natural-language assistant for seat & project queries.

Two layers:
  1. A deterministic rule-based intent parser (always available, no API key).
  2. Optional LLM enrichment: if OPENAI_API_KEY is set, the same structured
     data is passed to the model to phrase a nicer answer. The rule-based
     layer is the source of truth, so answers stay grounded in the DB.

Supported intents:
  * find_seat            -> "where is my seat / where is Amit seated"
  * find_project         -> "which project am I assigned to"
  * available_seats      -> "show available seats on floor 3"
  * neighbours           -> "who is sitting near me"
  * project_utilization  -> "how many seats are occupied for project Indigo"
  * allocate             -> "allocate a seat for <email>"
"""
import os
import re
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from . import models, services


# --------------------------------------------------------------------------- #
# Small parsing helpers
# --------------------------------------------------------------------------- #
EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
FLOOR_RE = re.compile(r"floor\s*(\d+)", re.I)
ZONE_RE = re.compile(r"zone\s*([a-z])", re.I)


def _find_email(text: str) -> Optional[str]:
    m = EMAIL_RE.search(text)
    return m.group(0).lower() if m else None


def _seat_label(seat: models.Seat) -> str:
    return f"Floor {seat.floor}, Zone {seat.zone}, Bay {seat.bay}, Seat {seat.seat_number}"


def _employee_by_email(db: Session, email: str):
    return db.query(models.Employee).filter(func.lower(models.Employee.email) == email).first()


def _employee_by_name(db: Session, name: str):
    return (
        db.query(models.Employee)
        .filter(func.lower(models.Employee.name).like(f"%{name.lower()}%"))
        .first()
    )


def _resolve_employee(db: Session, query: str):
    """Try to identify the employee referenced in a query (email > name)."""
    email = _find_email(query)
    if email:
        return _employee_by_email(db, email)

    # "employee Amit", "is Amit seated", "seat for John Doe"
    patterns = [
        r"employee\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)",
        r"is\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+seated",
        r"where\s+is\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)",
    ]
    for pat in patterns:
        m = re.search(pat, query)
        if m:
            emp = _employee_by_name(db, m.group(1).strip())
            if emp:
                return emp
    return None


def _active_seat(db: Session, employee_id: int):
    alloc = services.active_allocation_for_employee(db, employee_id)
    if not alloc:
        return None
    return db.get(models.Seat, alloc.seat_id)


# --------------------------------------------------------------------------- #
# Intent handlers
# --------------------------------------------------------------------------- #
def _handle_find_seat(db: Session, query: str):
    emp = _resolve_employee(db, query)
    if not emp:
        return "I couldn't identify the employee. Include a name or email, e.g. 'Where is amit@ethara.ai seated?'", "find_seat", None
    seat = _active_seat(db, emp.id)
    project = emp.project.name if emp.project else "unassigned"
    if not seat:
        return (
            f"{emp.name} does not have a seat allocated yet (status: {emp.allocation_status}). "
            f"Project: {project}.",
            "find_seat",
            {"employee": emp.name, "allocated": False, "project": project},
        )
    answer = f"{emp.name} is allocated {_seat_label(seat)}. Project: {project}."
    return answer, "find_seat", {"employee": emp.name, "seat": seat.seat_number, "project": project}


def _handle_find_project(db: Session, query: str):
    emp = _resolve_employee(db, query)
    if not emp:
        return "Tell me who you are (name or email) so I can look up your project.", "find_project", None
    project = emp.project.name if emp.project else "not assigned to any project"
    return f"{emp.name} is assigned to Project {project}.", "find_project", {"project": project}


def _handle_available_seats(db: Session, query: str):
    q = db.query(models.Seat).filter(models.Seat.status == "Available")
    floor = FLOOR_RE.search(query)
    zone = ZONE_RE.search(query)
    where = []
    if floor:
        q = q.filter(models.Seat.floor == int(floor.group(1)))
        where.append(f"Floor {floor.group(1)}")
    if zone:
        q = q.filter(models.Seat.zone == zone.group(1).upper())
        where.append(f"Zone {zone.group(1).upper()}")
    total = q.count()
    sample = q.order_by(models.Seat.floor, models.Seat.zone, models.Seat.seat_number).limit(8).all()
    scope = (" on " + ", ".join(where)) if where else ""
    if total == 0:
        return f"There are no available seats{scope}.", "available_seats", {"count": 0}
    listing = ", ".join(f"{s.seat_number} (F{s.floor}/{s.zone})" for s in sample)
    answer = f"There are {total} available seats{scope}. For example: {listing}."
    return answer, "available_seats", {"count": total, "sample": [s.seat_number for s in sample]}


def _handle_neighbours(db: Session, query: str):
    emp = _resolve_employee(db, query)
    if not emp:
        return "Tell me who you are (name or email) to find who sits near you.", "neighbours", None
    seat = _active_seat(db, emp.id)
    if not seat:
        return f"{emp.name} has no seat allocated, so there are no neighbours yet.", "neighbours", None
    # Neighbours = active allocations in the same floor+zone+bay.
    neighbours = (
        db.query(models.Employee)
        .join(models.SeatAllocation, models.SeatAllocation.employee_id == models.Employee.id)
        .join(models.Seat, models.Seat.id == models.SeatAllocation.seat_id)
        .filter(
            models.SeatAllocation.allocation_status == "active",
            models.Seat.floor == seat.floor,
            models.Seat.zone == seat.zone,
            models.Seat.bay == seat.bay,
            models.Employee.id != emp.id,
        )
        .limit(6)
        .all()
    )
    if not neighbours:
        return f"{emp.name} currently has no immediate neighbours in Bay {seat.bay}.", "neighbours", None
    names = ", ".join(n.name for n in neighbours)
    answer = f"Near {emp.name} (Floor {seat.floor}, Zone {seat.zone}, Bay {seat.bay}): {names}."
    return answer, "neighbours", {"neighbours": [n.name for n in neighbours]}


def _handle_project_utilization(db: Session, query: str):
    # Find a project name mentioned in the query.
    projects = db.query(models.Project).all()
    target = None
    for p in projects:
        if p.name.lower() in query.lower():
            target = p
            break
    if not target:
        return "Which project? e.g. 'How many seats are occupied for Project Indigo?'", "project_utilization", None
    occupied = (
        db.query(models.SeatAllocation)
        .filter(
            models.SeatAllocation.project_id == target.id,
            models.SeatAllocation.allocation_status == "active",
        )
        .count()
    )
    headcount = db.query(models.Employee).filter(models.Employee.project_id == target.id).count()
    answer = (
        f"Project {target.name} has {occupied} occupied seats across {headcount} employees."
    )
    return answer, "project_utilization", {"project": target.name, "occupied": occupied, "headcount": headcount}


def _handle_allocate(db: Session, query: str):
    emp = _resolve_employee(db, query)
    if not emp:
        return "Tell me which employee (email) to allocate a seat for.", "allocate", None
    floor = FLOOR_RE.search(query)
    zone = ZONE_RE.search(query)
    try:
        _alloc, seat = services.allocate_seat(
            db,
            emp.id,
            preferred_floor=int(floor.group(1)) if floor else None,
            preferred_zone=zone.group(1).upper() if zone else None,
        )
    except services.AllocationError as exc:
        return f"Could not allocate: {exc}", "allocate", None
    return (
        f"Allocated {_seat_label(seat)} to {emp.name}.",
        "allocate",
        {"employee": emp.name, "seat": seat.seat_number},
    )


# --------------------------------------------------------------------------- #
# Intent router
# --------------------------------------------------------------------------- #
def _classify(query: str) -> str:
    q = query.lower()
    if any(w in q for w in ["allocate", "assign a seat", "give a seat", "new joiner"]):
        return "allocate"
    if "near" in q or "neighbour" in q or "neighbor" in q or "sitting next" in q:
        return "neighbours"
    if ("occupied" in q or "utiliz" in q or "utilis" in q or "how many seats" in q) and "project" in q:
        return "project_utilization"
    if "available" in q or "free seat" in q or "empty seat" in q or "open seat" in q:
        return "available_seats"
    if "project" in q and ("which" in q or "what" in q or "assigned" in q or "am i" in q):
        return "find_project"
    if "seat" in q or "seated" in q or "sitting" in q or "where" in q:
        return "find_seat"
    return "find_seat"


_HANDLERS = {
    "find_seat": _handle_find_seat,
    "find_project": _handle_find_project,
    "available_seats": _handle_available_seats,
    "neighbours": _handle_neighbours,
    "project_utilization": _handle_project_utilization,
    "allocate": _handle_allocate,
}


def _maybe_llm_polish(query: str, answer: str, data: Optional[dict]) -> str:
    """Optionally re-phrase the grounded answer with an LLM. Never invents facts."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or not data:
        return answer
    try:
        from openai import OpenAI  # imported lazily so it's an optional dependency

        client = OpenAI(api_key=api_key)
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        resp = client.chat.completions.create(
            model=model,
            temperature=0.2,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are Ethara's seating assistant. Rephrase the given factual answer "
                        "in one friendly sentence. Do NOT add or change any facts, numbers, "
                        "seats, floors, or names."
                    ),
                },
                {"role": "user", "content": f"Question: {query}\nFacts: {answer}"},
            ],
        )
        return resp.choices[0].message.content.strip() or answer
    except Exception:
        # Any failure -> fall back to the deterministic answer.
        return answer


def answer_query(db: Session, query: str):
    """Main entry point. Returns (answer, intent, data)."""
    query = (query or "").strip()
    if not query:
        return "Please ask a question about seats, projects, or allocation.", "unknown", None
    intent = _classify(query)
    answer, intent, data = _HANDLERS[intent](db, query)
    answer = _maybe_llm_polish(query, answer, data)
    return answer, intent, data

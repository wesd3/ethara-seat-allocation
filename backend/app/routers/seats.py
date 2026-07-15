"""Seat endpoints: create, list, available, allocate, release."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import models, schemas, services
from ..database import get_db

router = APIRouter(prefix="/seats", tags=["Seats"])


def _seat_out(db: Session, seat: models.Seat) -> schemas.SeatOut:
    employee_id = employee_name = project_name = None
    alloc = services.active_allocation_for_seat(db, seat.id)
    if alloc:
        emp = db.get(models.Employee, alloc.employee_id)
        if emp:
            employee_id = emp.id
            employee_name = emp.name
            project_name = emp.project.name if emp.project else None
    return schemas.SeatOut(
        id=seat.id, floor=seat.floor, zone=seat.zone, bay=seat.bay,
        seat_number=seat.seat_number, status=seat.status,
        employee_id=employee_id, employee_name=employee_name, project_name=project_name,
    )


@router.post("", response_model=schemas.SeatOut, status_code=201)
def create_seat(payload: schemas.SeatCreate, db: Session = Depends(get_db)):
    dup = (
        db.query(models.Seat)
        .filter(
            models.Seat.floor == payload.floor,
            models.Seat.zone == payload.zone,
            models.Seat.seat_number == payload.seat_number,
        )
        .first()
    )
    if dup:
        raise HTTPException(409, "A seat with this number already exists on this floor/zone.")
    seat = models.Seat(**payload.model_dump())
    db.add(seat)
    db.commit()
    db.refresh(seat)
    return _seat_out(db, seat)


@router.get("", response_model=dict)
def list_seats(
    db: Session = Depends(get_db),
    floor: int | None = None,
    zone: str | None = None,
    status: str | None = None,
    search: str | None = Query(None, description="Match seat number"),
    limit: int = Query(100, le=1000),
    offset: int = 0,
):
    q = db.query(models.Seat)
    if floor is not None:
        q = q.filter(models.Seat.floor == floor)
    if zone:
        q = q.filter(models.Seat.zone == zone)
    if status:
        q = q.filter(models.Seat.status == status)
    if search:
        q = q.filter(models.Seat.seat_number.ilike(f"%{search}%"))
    total = q.count()
    rows = (
        q.order_by(models.Seat.floor, models.Seat.zone, models.Seat.seat_number)
        .offset(offset)
        .limit(limit)
        .all()
    )
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [_seat_out(db, s) for s in rows],
    }


@router.get("/available", response_model=dict)
def available_seats(
    db: Session = Depends(get_db),
    floor: int | None = None,
    zone: str | None = None,
    limit: int = Query(100, le=1000),
):
    q = db.query(models.Seat).filter(models.Seat.status == "Available")
    if floor is not None:
        q = q.filter(models.Seat.floor == floor)
    if zone:
        q = q.filter(models.Seat.zone == zone)
    total = q.count()
    rows = q.order_by(models.Seat.floor, models.Seat.zone, models.Seat.seat_number).limit(limit).all()
    return {"total": total, "items": [_seat_out(db, s) for s in rows]}


@router.get("/suggest", response_model=schemas.SuggestionOut)
def suggest(
    employee_id: int,
    preferred_floor: int | None = None,
    preferred_zone: str | None = None,
    db: Session = Depends(get_db),
):
    emp = db.get(models.Employee, employee_id)
    if not emp:
        raise HTTPException(404, "Employee not found.")
    seat, reason = services.suggest_seat(db, emp.project_id, preferred_floor, preferred_zone)
    if not seat:
        raise HTTPException(404, reason)
    return schemas.SuggestionOut(seat=_seat_out(db, seat), reason=reason)


@router.post("/allocate", response_model=schemas.SeatOut)
def allocate(payload: schemas.AllocateRequest, db: Session = Depends(get_db)):
    try:
        _alloc, seat = services.allocate_seat(
            db,
            payload.employee_id,
            payload.seat_id,
            payload.preferred_floor,
            payload.preferred_zone,
        )
    except services.AllocationError as exc:
        raise HTTPException(400, str(exc))
    return _seat_out(db, seat)


@router.post("/release", response_model=schemas.SeatOut)
def release(payload: schemas.ReleaseRequest, db: Session = Depends(get_db)):
    try:
        _alloc, seat = services.release_seat(db, payload.seat_id, payload.employee_id)
    except services.AllocationError as exc:
        raise HTTPException(400, str(exc))
    return _seat_out(db, seat)

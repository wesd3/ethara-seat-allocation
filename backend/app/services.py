"""Business logic for seat allocation, release, and suggestion.

Centralised so both the REST routers and the AI assistant reuse the same
rules:
  * One employee -> one active seat.
  * One seat -> one active employee.
  * Reserved / Maintenance seats cannot be auto-allocated.
  * Released seats become Available again.
  * New joiners are prioritised for seats near their project team.
"""
from datetime import datetime
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from . import models


class AllocationError(Exception):
    """Raised when an allocation/release violates a business rule."""


def active_allocation_for_employee(db: Session, employee_id: int):
    return (
        db.query(models.SeatAllocation)
        .filter(
            models.SeatAllocation.employee_id == employee_id,
            models.SeatAllocation.allocation_status == "active",
        )
        .first()
    )


def active_allocation_for_seat(db: Session, seat_id: int):
    return (
        db.query(models.SeatAllocation)
        .filter(
            models.SeatAllocation.seat_id == seat_id,
            models.SeatAllocation.allocation_status == "active",
        )
        .first()
    )


def _project_seat_hint(db: Session, project_id: Optional[int]):
    """Return (floor, zone) most used by a project's team, or (None, None).

    Used to seat new joiners near their existing team.
    """
    if not project_id:
        return None, None
    row = (
        db.query(models.Seat.floor, models.Seat.zone, func.count(models.SeatAllocation.id).label("c"))
        .join(models.SeatAllocation, models.SeatAllocation.seat_id == models.Seat.id)
        .filter(
            models.SeatAllocation.project_id == project_id,
            models.SeatAllocation.allocation_status == "active",
        )
        .group_by(models.Seat.floor, models.Seat.zone)
        .order_by(func.count(models.SeatAllocation.id).desc())
        .first()
    )
    if row:
        return row[0], row[1]
    return None, None


def suggest_seat(
    db: Session,
    project_id: Optional[int] = None,
    preferred_floor: Optional[int] = None,
    preferred_zone: Optional[str] = None,
):
    """Suggest the best available seat, returning (seat, reason).

    Priority order:
      1. Explicit preferred floor + zone.
      2. Floor/zone where the employee's project team mostly sits.
      3. Any available seat (alternate zone fallback).
    """
    base = db.query(models.Seat).filter(models.Seat.status == "Available")

    # 1. Explicit preference.
    if preferred_floor is not None or preferred_zone is not None:
        q = base
        if preferred_floor is not None:
            q = q.filter(models.Seat.floor == preferred_floor)
        if preferred_zone is not None:
            q = q.filter(models.Seat.zone == preferred_zone)
        seat = q.order_by(models.Seat.floor, models.Seat.zone, models.Seat.seat_number).first()
        if seat:
            return seat, "Matched your preferred floor/zone."

    # 2. Near the project team.
    hint_floor, hint_zone = _project_seat_hint(db, project_id)
    if hint_floor is not None:
        seat = (
            base.filter(models.Seat.floor == hint_floor, models.Seat.zone == hint_zone)
            .order_by(models.Seat.seat_number)
            .first()
        )
        if seat:
            return seat, f"Placed near your project team on Floor {hint_floor}, Zone {hint_zone}."
        # Same floor, different zone.
        seat = base.filter(models.Seat.floor == hint_floor).order_by(models.Seat.zone).first()
        if seat:
            return seat, (
                f"Your team's zone is full; suggested an alternate zone on Floor {hint_floor}."
            )

    # 3. Anywhere available.
    seat = base.order_by(models.Seat.floor, models.Seat.zone, models.Seat.seat_number).first()
    if seat:
        return seat, "Nearest available seat (no team seats free)."
    return None, "No seats are currently available."


def allocate_seat(
    db: Session,
    employee_id: int,
    seat_id: Optional[int] = None,
    preferred_floor: Optional[int] = None,
    preferred_zone: Optional[str] = None,
):
    """Allocate a seat to an employee, enforcing all business rules."""
    employee = db.get(models.Employee, employee_id)
    if not employee:
        raise AllocationError(f"Employee {employee_id} not found.")

    if active_allocation_for_employee(db, employee_id):
        raise AllocationError(
            f"{employee.name} already has an active seat. Release it before re-allocating."
        )

    # Resolve which seat to use.
    if seat_id is None:
        seat, _reason = suggest_seat(db, employee.project_id, preferred_floor, preferred_zone)
        if seat is None:
            raise AllocationError("No available seats to allocate.")
    else:
        seat = db.get(models.Seat, seat_id)
        if not seat:
            raise AllocationError(f"Seat {seat_id} not found.")

    # Seat status rules.
    if seat.status == "Occupied" or active_allocation_for_seat(db, seat.id):
        raise AllocationError(f"Seat {seat.seat_number} is already occupied.")
    if seat.status == "Reserved":
        raise AllocationError(
            f"Seat {seat.seat_number} is Reserved and cannot be allocated until its status changes."
        )
    if seat.status == "Maintenance":
        raise AllocationError(f"Seat {seat.seat_number} is under Maintenance.")

    allocation = models.SeatAllocation(
        employee_id=employee.id,
        seat_id=seat.id,
        project_id=employee.project_id,
        allocation_status="active",
        allocation_date=datetime.utcnow(),
    )
    seat.status = "Occupied"
    employee.allocation_status = "allocated"
    db.add(allocation)
    db.commit()
    db.refresh(allocation)
    return allocation, seat


def release_seat(db: Session, seat_id: Optional[int] = None, employee_id: Optional[int] = None):
    """Release an active allocation by seat id or employee id."""
    alloc = None
    if seat_id is not None:
        alloc = active_allocation_for_seat(db, seat_id)
    elif employee_id is not None:
        alloc = active_allocation_for_employee(db, employee_id)
    else:
        raise AllocationError("Provide seat_id or employee_id to release.")

    if not alloc:
        raise AllocationError("No active allocation found to release.")

    seat = db.get(models.Seat, alloc.seat_id)
    employee = db.get(models.Employee, alloc.employee_id)

    alloc.allocation_status = "released"
    alloc.released_date = datetime.utcnow()
    if seat:
        seat.status = "Available"
    if employee:
        employee.allocation_status = "pending"
    db.commit()
    return alloc, seat

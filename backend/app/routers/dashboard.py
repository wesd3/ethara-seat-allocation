"""Dashboard aggregation endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _count_status(db: Session, status: str) -> int:
    return db.query(models.Seat).filter(models.Seat.status == status).count()


@router.get("/summary", response_model=schemas.DashboardSummary)
def summary(db: Session = Depends(get_db)):
    return schemas.DashboardSummary(
        total_employees=db.query(models.Employee).count(),
        active_employees=db.query(models.Employee).filter(models.Employee.status == "active").count(),
        total_seats=db.query(models.Seat).count(),
        occupied_seats=_count_status(db, "Occupied"),
        available_seats=_count_status(db, "Available"),
        reserved_seats=_count_status(db, "Reserved"),
        maintenance_seats=_count_status(db, "Maintenance"),
        new_joiners_pending=db.query(models.Employee)
        .filter(models.Employee.allocation_status == "pending", models.Employee.status == "active")
        .count(),
    )


@router.get("/project-utilization", response_model=list[schemas.ProjectUtilization])
def project_utilization(db: Session = Depends(get_db)):
    projects = db.query(models.Project).order_by(models.Project.name).all()
    out = []
    for p in projects:
        emp_count = db.query(models.Employee).filter(models.Employee.project_id == p.id).count()
        allocated = (
            db.query(models.SeatAllocation)
            .filter(
                models.SeatAllocation.project_id == p.id,
                models.SeatAllocation.allocation_status == "active",
            )
            .count()
        )
        out.append(
            schemas.ProjectUtilization(
                project_id=p.id,
                project_name=p.name,
                employee_count=emp_count,
                allocated_seats=allocated,
            )
        )
    return out


@router.get("/floor-utilization", response_model=list[schemas.FloorUtilization])
def floor_utilization(db: Session = Depends(get_db)):
    floors = [r[0] for r in db.query(models.Seat.floor).distinct().order_by(models.Seat.floor).all()]
    out = []
    for f in floors:
        base = db.query(models.Seat).filter(models.Seat.floor == f)
        total = base.count()
        occupied = base.filter(models.Seat.status == "Occupied").count()
        available = base.filter(models.Seat.status == "Available").count()
        reserved = base.filter(models.Seat.status == "Reserved").count()
        maintenance = base.filter(models.Seat.status == "Maintenance").count()
        out.append(
            schemas.FloorUtilization(
                floor=f,
                total_seats=total,
                occupied=occupied,
                available=available,
                reserved=reserved,
                maintenance=maintenance,
                occupancy_pct=round(100 * occupied / total, 1) if total else 0.0,
            )
        )
    return out

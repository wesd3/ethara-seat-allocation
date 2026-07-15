"""Project endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from .employees import _to_detail

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("", response_model=schemas.ProjectOut, status_code=201)
def create_project(payload: schemas.ProjectCreate, db: Session = Depends(get_db)):
    if db.query(models.Project).filter(models.Project.name == payload.name).first():
        raise HTTPException(409, "A project with this name already exists.")
    project = models.Project(**payload.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("", response_model=list[dict])
def list_projects(db: Session = Depends(get_db)):
    """List projects with headcount and active-seat counts."""
    projects = db.query(models.Project).order_by(models.Project.name).all()
    out = []
    for p in projects:
        headcount = db.query(models.Employee).filter(models.Employee.project_id == p.id).count()
        allocated = (
            db.query(models.SeatAllocation)
            .filter(
                models.SeatAllocation.project_id == p.id,
                models.SeatAllocation.allocation_status == "active",
            )
            .count()
        )
        out.append(
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "manager_name": p.manager_name,
                "status": p.status,
                "employee_count": headcount,
                "allocated_seats": allocated,
            }
        )
    return out


@router.get("/{project_id}/employees", response_model=list[schemas.EmployeeDetail])
def project_employees(project_id: int, db: Session = Depends(get_db)):
    project = db.get(models.Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found.")
    emps = (
        db.query(models.Employee)
        .filter(models.Employee.project_id == project_id)
        .order_by(models.Employee.name)
        .all()
    )
    return [_to_detail(db, e) for e in emps]

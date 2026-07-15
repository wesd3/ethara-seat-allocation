"""Employee CRUD endpoints."""
import csv
import io
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .. import models, schemas, services
from ..database import get_db

router = APIRouter(prefix="/employees", tags=["Employees"])


def _next_code(db: Session) -> str:
    count = db.query(models.Employee).count()
    return f"ETH{10000 + count + 1}"


def _to_detail(db: Session, emp: models.Employee) -> schemas.EmployeeDetail:
    seat_out = None
    alloc = services.active_allocation_for_employee(db, emp.id)
    if alloc:
        seat = db.get(models.Seat, alloc.seat_id)
        if seat:
            seat_out = schemas.SeatOut(
                id=seat.id, floor=seat.floor, zone=seat.zone, bay=seat.bay,
                seat_number=seat.seat_number, status=seat.status,
                employee_id=emp.id, employee_name=emp.name,
                project_name=emp.project.name if emp.project else None,
            )
    detail = schemas.EmployeeDetail.model_validate(emp)
    detail.project_name = emp.project.name if emp.project else None
    detail.seat = seat_out
    return detail


@router.post("", response_model=schemas.EmployeeDetail, status_code=201)
def create_employee(payload: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    if db.query(models.Employee).filter(models.Employee.email == payload.email).first():
        raise HTTPException(409, "An employee with this email already exists.")
    emp = models.Employee(
        employee_code=payload.employee_code or _next_code(db),
        name=payload.name,
        email=payload.email,
        department=payload.department,
        role=payload.role,
        joining_date=payload.joining_date or date.today(),
        status=payload.status,
        project_id=payload.project_id,
        allocation_status="pending",
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return _to_detail(db, emp)


@router.get("", response_model=dict)
def list_employees(
    db: Session = Depends(get_db),
    search: str | None = Query(None, description="Match name, email or employee code"),
    project_id: int | None = None,
    department: str | None = None,
    status: str | None = None,
    allocation_status: str | None = None,
    limit: int = Query(50, le=500),
    offset: int = 0,
):
    q = db.query(models.Employee)
    if search:
        like = f"%{search}%"
        q = q.filter(
            or_(
                models.Employee.name.ilike(like),
                models.Employee.email.ilike(like),
                models.Employee.employee_code.ilike(like),
            )
        )
    if project_id is not None:
        q = q.filter(models.Employee.project_id == project_id)
    if department:
        q = q.filter(models.Employee.department == department)
    if status:
        q = q.filter(models.Employee.status == status)
    if allocation_status:
        q = q.filter(models.Employee.allocation_status == allocation_status)
    total = q.count()
    rows = q.order_by(models.Employee.id).offset(offset).limit(limit).all()
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [_to_detail(db, e) for e in rows],
    }


@router.post("/upload-csv")
def upload_csv(file: UploadFile, db: Session = Depends(get_db)):
    """Bulk-create employees from a CSV.

    Expected columns (header row required):
        name, email, department, role, joining_date, project_id
    Only name + email are mandatory. Rows with a duplicate email are skipped.
    """
    try:
        raw = file.file.read().decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(400, "File must be UTF-8 encoded CSV.")
    reader = csv.DictReader(io.StringIO(raw))

    projects_by_name = {p.name.lower(): p.id for p in db.query(models.Project).all()}
    created, skipped, errors = 0, 0, []

    for i, row in enumerate(reader, start=2):  # row 1 is the header
        name = (row.get("name") or "").strip()
        email = (row.get("email") or "").strip().lower()
        if not name or not email:
            errors.append(f"Row {i}: missing name or email.")
            continue
        if db.query(models.Employee).filter(models.Employee.email == email).first():
            skipped += 1
            continue
        # project_id can be a numeric id or a project name.
        pid = None
        proj = (row.get("project_id") or row.get("project") or "").strip()
        if proj.isdigit():
            pid = int(proj)
        elif proj:
            pid = projects_by_name.get(proj.lower())
        jd = None
        if (row.get("joining_date") or "").strip():
            try:
                jd = date.fromisoformat(row["joining_date"].strip())
            except ValueError:
                jd = None
        db.add(
            models.Employee(
                employee_code=_next_code(db),
                name=name,
                email=email,
                department=(row.get("department") or "").strip(),
                role=(row.get("role") or "").strip(),
                joining_date=jd or date.today(),
                status="active",
                allocation_status="pending",
                project_id=pid,
            )
        )
        db.flush()  # so _next_code increments correctly within the batch
        created += 1

    db.commit()
    return {"created": created, "skipped_duplicates": skipped, "errors": errors}


@router.get("/{employee_id}", response_model=schemas.EmployeeDetail)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    emp = db.get(models.Employee, employee_id)
    if not emp:
        raise HTTPException(404, "Employee not found.")
    return _to_detail(db, emp)


@router.put("/{employee_id}", response_model=schemas.EmployeeDetail)
def update_employee(employee_id: int, payload: schemas.EmployeeUpdate, db: Session = Depends(get_db)):
    emp = db.get(models.Employee, employee_id)
    if not emp:
        raise HTTPException(404, "Employee not found.")
    data = payload.model_dump(exclude_unset=True)
    if "email" in data and data["email"] != emp.email:
        if db.query(models.Employee).filter(models.Employee.email == data["email"]).first():
            raise HTTPException(409, "Another employee already uses this email.")
    for k, v in data.items():
        setattr(emp, k, v)
    db.commit()
    db.refresh(emp)
    return _to_detail(db, emp)


@router.delete("/{employee_id}", response_model=schemas.EmployeeDetail)
def deactivate_employee(employee_id: int, db: Session = Depends(get_db)):
    """Soft delete: deactivate the employee and release any active seat."""
    emp = db.get(models.Employee, employee_id)
    if not emp:
        raise HTTPException(404, "Employee not found.")
    if services.active_allocation_for_employee(db, emp.id):
        services.release_seat(db, employee_id=emp.id)
    emp.status = "inactive"
    db.commit()
    db.refresh(emp)
    return _to_detail(db, emp)

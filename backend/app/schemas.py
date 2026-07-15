"""Pydantic request/response schemas."""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# --------------------------------------------------------------------------- #
# Projects
# --------------------------------------------------------------------------- #
class ProjectBase(BaseModel):
    name: str
    description: str = ""
    manager_name: str = ""
    status: str = "active"


class ProjectCreate(ProjectBase):
    pass


class ProjectOut(ProjectBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None


# --------------------------------------------------------------------------- #
# Employees
# --------------------------------------------------------------------------- #
class EmployeeBase(BaseModel):
    name: str
    email: EmailStr
    department: str = ""
    role: str = ""
    joining_date: Optional[date] = None
    status: str = "active"
    project_id: Optional[int] = None


class EmployeeCreate(EmployeeBase):
    # employee_code is auto-generated if omitted.
    employee_code: Optional[str] = None


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    role: Optional[str] = None
    joining_date: Optional[date] = None
    status: Optional[str] = None
    project_id: Optional[int] = None


class EmployeeOut(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employee_code: str
    allocation_status: str
    created_at: Optional[datetime] = None


class EmployeeDetail(EmployeeOut):
    """Employee with resolved seat + project info."""
    project_name: Optional[str] = None
    seat: Optional["SeatOut"] = None


# --------------------------------------------------------------------------- #
# Seats
# --------------------------------------------------------------------------- #
class SeatBase(BaseModel):
    floor: int
    zone: str
    bay: str
    seat_number: str
    status: str = "Available"


class SeatCreate(SeatBase):
    pass


class SeatOut(SeatBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employee_id: Optional[int] = None
    employee_name: Optional[str] = None
    project_name: Optional[str] = None


# --------------------------------------------------------------------------- #
# Allocation actions
# --------------------------------------------------------------------------- #
class AllocateRequest(BaseModel):
    employee_id: int
    seat_id: Optional[int] = Field(
        None, description="Specific seat to allocate. If omitted, the system auto-suggests one."
    )
    preferred_floor: Optional[int] = None
    preferred_zone: Optional[str] = None


class ReleaseRequest(BaseModel):
    seat_id: Optional[int] = None
    employee_id: Optional[int] = None


class SuggestionOut(BaseModel):
    seat: SeatOut
    reason: str


# --------------------------------------------------------------------------- #
# Dashboard
# --------------------------------------------------------------------------- #
class DashboardSummary(BaseModel):
    total_employees: int
    active_employees: int
    total_seats: int
    occupied_seats: int
    available_seats: int
    reserved_seats: int
    maintenance_seats: int
    new_joiners_pending: int


class ProjectUtilization(BaseModel):
    project_id: int
    project_name: str
    employee_count: int
    allocated_seats: int


class FloorUtilization(BaseModel):
    floor: int
    total_seats: int
    occupied: int
    available: int
    reserved: int
    maintenance: int
    occupancy_pct: float


# --------------------------------------------------------------------------- #
# AI Assistant
# --------------------------------------------------------------------------- #
class AIQuery(BaseModel):
    query: str


class AIResponse(BaseModel):
    answer: str
    intent: Optional[str] = None
    data: Optional[dict] = None


EmployeeDetail.model_rebuild()

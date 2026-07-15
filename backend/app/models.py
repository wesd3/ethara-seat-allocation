"""SQLAlchemy ORM models for the Ethara Seat Allocation system.

Schema mirrors the assignment's suggested model:
  projects, employees, seats, seat_allocations
"""
from datetime import date, datetime

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship

from .database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    description = Column(String, default="")
    manager_name = Column(String, default="")
    status = Column(String, default="active")  # active / inactive
    created_at = Column(DateTime, server_default=func.now())

    employees = relationship("Employee", back_populates="project")


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_code = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    department = Column(String, default="")
    role = Column(String, default="")
    joining_date = Column(Date, default=date.today)
    status = Column(String, default="active")  # active / inactive
    # Denormalised convenience flag: allocated / pending
    allocation_status = Column(String, default="pending", index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, index=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="employees")
    allocations = relationship("SeatAllocation", back_populates="employee")


class Seat(Base):
    __tablename__ = "seats"
    __table_args__ = (
        # A seat number must be unique within a floor + zone.
        UniqueConstraint("floor", "zone", "seat_number", name="uq_seat_location"),
    )

    id = Column(Integer, primary_key=True, index=True)
    floor = Column(Integer, nullable=False, index=True)
    zone = Column(String, nullable=False, index=True)
    bay = Column(String, nullable=False)
    seat_number = Column(String, nullable=False, index=True)
    # Available / Occupied / Reserved / Maintenance
    status = Column(String, default="Available", index=True)
    created_at = Column(DateTime, server_default=func.now())

    allocations = relationship("SeatAllocation", back_populates="seat")


class SeatAllocation(Base):
    __tablename__ = "seat_allocations"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    seat_id = Column(Integer, ForeignKey("seats.id"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    # active / released
    allocation_status = Column(String, default="active", index=True)
    allocation_date = Column(DateTime, server_default=func.now())
    released_date = Column(DateTime, nullable=True)

    employee = relationship("Employee", back_populates="allocations")
    seat = relationship("Seat", back_populates="allocations")

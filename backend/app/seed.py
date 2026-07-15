"""Seed the database with realistic sample data.

Targets (assignment requirements):
  * 5,000 employees
  * 5 floors, 10 zones, 6,000 seats
  * 11 projects
  * >= 500 available seats, >= 100 reserved seats
  * >= 50 employees pending allocation

Run:  python -m app.seed          (from the backend/ directory)
      python -m app.seed --reset  (drop & recreate all tables first)
"""
import random
import sys
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine
from . import models

# Deterministic output so re-seeding is reproducible.
random.seed(42)

PROJECTS = [
    ("Indigo", "Core platform engineering", "Priya Nair"),
    ("Indreed", "Recruitment analytics", "Rahul Mehta"),
    ("Mydreed", "Customer data platform", "Sara Khan"),
    ("Preed", "Payments & billing", "Vikram Rao"),
    ("Serfy", "Field services", "Anita Desai"),
    ("Oreed", "Order management", "John Mathew"),
    ("bedegreed", "Learning platform", "Fatima Ali"),
    ("Opreed", "Operations tooling", "Deepak Sharma"),
    ("Serry", "Support & CRM", "Neha Gupta"),
    ("Kaary", "Logistics & fleet", "Arjun Patel"),
    ("Mered", "Data & ML infra", "Lea Fernandes"),
]

DEPARTMENTS = ["Engineering", "HR", "Finance", "Operations", "Sales", "Design", "Data", "Support"]
ROLES = ["Engineer", "Senior Engineer", "Lead", "Manager", "Analyst", "Designer", "Associate", "Director"]

FIRST_NAMES = [
    "Amit", "Priya", "Rahul", "Sara", "Vikram", "Anita", "John", "Fatima", "Deepak", "Neha",
    "Arjun", "Lea", "Rohan", "Meera", "Karan", "Divya", "Sameer", "Pooja", "Nikhil", "Isha",
    "Aditya", "Sneha", "Manish", "Kavya", "Raj", "Tara", "Varun", "Anjali", "Suresh", "Ritu",
    "Gaurav", "Shreya", "Ankit", "Nisha", "Harsh", "Payal", "Vivek", "Aarti", "Mohit", "Simran",
]
LAST_NAMES = [
    "Sharma", "Verma", "Nair", "Mehta", "Khan", "Rao", "Desai", "Mathew", "Ali", "Gupta",
    "Patel", "Fernandes", "Reddy", "Iyer", "Singh", "Kaur", "Bose", "Chopra", "Malhotra", "Joshi",
    "Kapoor", "Menon", "Pillai", "Das", "Sinha", "Bhat", "Shetty", "Naidu", "Roy", "Ghosh",
]

# Seat topology: 5 floors x 2 zones (A,B) = 10 zones; 10 bays x 60 seats = 600 per zone.
FLOORS = [1, 2, 3, 4, 5]
ZONES = ["A", "B"]
BAYS = list(range(1, 11))          # 10 bays
SEATS_PER_BAY = 60                 # -> 5 * 2 * 10 * 60 = 6,000 seats


def _reset():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def seed(reset: bool = False):
    if reset:
        _reset()
    else:
        Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        if db.query(models.Project).count() > 0:
            print("Database already has data. Use --reset to rebuild.")
            return

        # ---- Projects -------------------------------------------------------
        projects = []
        for name, desc, mgr in PROJECTS:
            p = models.Project(name=name, description=desc, manager_name=mgr, status="active")
            db.add(p)
            projects.append(p)
        db.commit()
        for p in projects:
            db.refresh(p)
        print(f"Created {len(projects)} projects")

        # ---- Seats ----------------------------------------------------------
        seats = []
        for floor in FLOORS:
            for zone in ZONES:
                for bay in BAYS:
                    for n in range(1, SEATS_PER_BAY + 1):
                        seat_number = f"{zone}{bay}-{n:02d}"
                        seats.append(
                            models.Seat(
                                floor=floor,
                                zone=zone,
                                bay=str(bay),
                                seat_number=seat_number,
                                status="Available",
                            )
                        )
        db.bulk_save_objects(seats)
        db.commit()
        total_seats = db.query(models.Seat).count()
        print(f"Created {total_seats} seats across {len(FLOORS)} floors / {len(FLOORS)*len(ZONES)} zones")

        # ---- Employees ------------------------------------------------------
        NUM_EMPLOYEES = 5000
        emails_used = set()
        employees = []

        # Guaranteed demo employee for the AI examples.
        demo = models.Employee(
            employee_code="ETH10001",
            name="Amit Sharma",
            email="amit@ethara.ai",
            department="Engineering",
            role="Senior Engineer",
            joining_date=date(2023, 5, 12),
            status="active",
            allocation_status="pending",
            project_id=projects[0].id,  # Indigo
        )
        employees.append(demo)
        emails_used.add(demo.email)

        for i in range(2, NUM_EMPLOYEES + 1):
            fn = random.choice(FIRST_NAMES)
            ln = random.choice(LAST_NAMES)
            name = f"{fn} {ln}"
            base_email = f"{fn.lower()}.{ln.lower()}"
            email = f"{base_email}@ethara.ai"
            suffix = 1
            while email in emails_used:
                suffix += 1
                email = f"{base_email}{suffix}@ethara.ai"
            emails_used.add(email)

            joining = date(2021, 1, 1) + timedelta(days=random.randint(0, 365 * 4))
            employees.append(
                models.Employee(
                    employee_code=f"ETH{10000 + i}",
                    name=name,
                    email=email,
                    department=random.choice(DEPARTMENTS),
                    role=random.choice(ROLES),
                    joining_date=joining,
                    status="active",
                    allocation_status="pending",
                    project_id=random.choice(projects).id,
                )
            )
        db.bulk_save_objects(employees)
        db.commit()
        print(f"Created {db.query(models.Employee).count()} employees")

        # ---- Reserve / Maintenance seats -----------------------------------
        all_seat_ids = [r[0] for r in db.query(models.Seat.id).all()]
        random.shuffle(all_seat_ids)
        reserved_ids = set(all_seat_ids[:120])          # >= 100 reserved
        maintenance_ids = set(all_seat_ids[120:170])    # 50 maintenance
        db.query(models.Seat).filter(models.Seat.id.in_(reserved_ids)).update(
            {models.Seat.status: "Reserved"}, synchronize_session=False
        )
        db.query(models.Seat).filter(models.Seat.id.in_(maintenance_ids)).update(
            {models.Seat.status: "Maintenance"}, synchronize_session=False
        )
        db.commit()

        # ---- Allocate seats to employees -----------------------------------
        # Leave 60 employees pending (>= 50 required) and keep >= 500 available.
        allocatable_seat_ids = [s for s in all_seat_ids if s not in reserved_ids and s not in maintenance_ids]
        random.shuffle(allocatable_seat_ids)

        emp_rows = db.query(models.Employee).order_by(models.Employee.id).all()
        pending_count = 60
        to_allocate = emp_rows[:-pending_count]  # last 60 stay pending

        # Cap allocations so at least 500 available seats remain.
        max_alloc = min(len(to_allocate), len(allocatable_seat_ids) - 500)
        to_allocate = to_allocate[:max_alloc]

        allocations = []
        now = datetime.utcnow()
        for emp, seat_id in zip(to_allocate, allocatable_seat_ids):
            allocations.append(
                models.SeatAllocation(
                    employee_id=emp.id,
                    seat_id=seat_id,
                    project_id=emp.project_id,
                    allocation_status="active",
                    allocation_date=now,
                )
            )
        db.bulk_save_objects(allocations)
        db.commit()

        # Flip statuses for occupied seats + allocated employees in bulk.
        occupied_seat_ids = allocatable_seat_ids[: len(to_allocate)]
        db.query(models.Seat).filter(models.Seat.id.in_(occupied_seat_ids)).update(
            {models.Seat.status: "Occupied"}, synchronize_session=False
        )
        allocated_emp_ids = [e.id for e in to_allocate]
        db.query(models.Employee).filter(models.Employee.id.in_(allocated_emp_ids)).update(
            {models.Employee.allocation_status: "allocated"}, synchronize_session=False
        )
        db.commit()

        # ---- Report --------------------------------------------------------
        def cnt(status):
            return db.query(models.Seat).filter(models.Seat.status == status).count()

        pending = (
            db.query(models.Employee)
            .filter(models.Employee.allocation_status == "pending")
            .count()
        )
        print("--- Seed summary ---")
        print(f"Employees:            {db.query(models.Employee).count()}")
        print(f"Projects:             {db.query(models.Project).count()}")
        print(f"Seats total:          {db.query(models.Seat).count()}")
        print(f"  Occupied:           {cnt('Occupied')}")
        print(f"  Available:          {cnt('Available')}")
        print(f"  Reserved:           {cnt('Reserved')}")
        print(f"  Maintenance:        {cnt('Maintenance')}")
        print(f"Pending allocation:   {pending}")
        print("Demo login employee:  amit@ethara.ai")
    finally:
        db.close()


if __name__ == "__main__":
    seed(reset="--reset" in sys.argv)

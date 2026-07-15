-- Ethara Seat Allocation & Project Mapping System
-- Reference DDL (PostgreSQL-compatible).
--
-- NOTE: The application auto-creates these tables via SQLAlchemy on startup
-- (Base.metadata.create_all). This file documents the schema and can be run
-- manually against PostgreSQL if you prefer to provision it yourself.

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
CREATE TABLE projects (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR NOT NULL UNIQUE,
    description  VARCHAR DEFAULT '',
    manager_name VARCHAR DEFAULT '',
    status       VARCHAR DEFAULT 'active',        -- active / inactive
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- employees
-- ---------------------------------------------------------------------------
CREATE TABLE employees (
    id                SERIAL PRIMARY KEY,
    employee_code     VARCHAR NOT NULL UNIQUE,
    name              VARCHAR NOT NULL,
    email             VARCHAR NOT NULL UNIQUE,     -- duplicate emails rejected
    department        VARCHAR DEFAULT '',
    role              VARCHAR DEFAULT '',
    joining_date      DATE,
    status            VARCHAR DEFAULT 'active',    -- active / inactive
    allocation_status VARCHAR DEFAULT 'pending',   -- allocated / pending
    project_id        INTEGER REFERENCES projects(id),
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_employees_name  ON employees(name);
CREATE INDEX ix_employees_email ON employees(email);

-- ---------------------------------------------------------------------------
-- seats
-- ---------------------------------------------------------------------------
CREATE TABLE seats (
    id          SERIAL PRIMARY KEY,
    floor       INTEGER NOT NULL,
    zone        VARCHAR NOT NULL,
    bay         VARCHAR NOT NULL,
    seat_number VARCHAR NOT NULL,
    status      VARCHAR DEFAULT 'Available',       -- Available/Occupied/Reserved/Maintenance
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- A seat number must be unique within a floor + zone.
    CONSTRAINT uq_seat_location UNIQUE (floor, zone, seat_number)
);
CREATE INDEX ix_seats_status ON seats(status);
CREATE INDEX ix_seats_floor  ON seats(floor);

-- ---------------------------------------------------------------------------
-- seat_allocations  (history of every allocation; one active row per seat/emp)
-- ---------------------------------------------------------------------------
CREATE TABLE seat_allocations (
    id                SERIAL PRIMARY KEY,
    employee_id       INTEGER NOT NULL REFERENCES employees(id),
    seat_id           INTEGER NOT NULL REFERENCES seats(id),
    project_id        INTEGER REFERENCES projects(id),
    allocation_status VARCHAR DEFAULT 'active',    -- active / released
    allocation_date   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    released_date     TIMESTAMP
);
CREATE INDEX ix_alloc_employee ON seat_allocations(employee_id);
CREATE INDEX ix_alloc_seat     ON seat_allocations(seat_id);
CREATE INDEX ix_alloc_status   ON seat_allocations(allocation_status);

-- Business rules enforced in application logic (app/services.py):
--   * One employee -> at most one active allocation.
--   * One seat     -> at most one active allocation.
--   * Reserved / Maintenance seats cannot be allocated.
--   * Releasing an allocation sets seat.status = 'Available'.

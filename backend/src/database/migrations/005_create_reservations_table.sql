-- Migration: Create reservations table
-- Description: Inventory reservations for time-based booking

-- Enable btree_gist extension for exclusion constraint
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE reservation_status AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id INTEGER NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status reservation_status DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Prevent overlapping reservations (PostgreSQL exclusion constraint)
  CONSTRAINT no_overlap EXCLUDE USING gist (
    variant_id WITH =,
    tsrange(start_date, end_date) WITH &&
  ) WHERE (status = 'ACTIVE')
);

CREATE INDEX idx_reservations_order ON reservations(order_id);
CREATE INDEX idx_reservations_variant ON reservations(variant_id);
CREATE INDEX idx_reservations_dates ON reservations(start_date, end_date);

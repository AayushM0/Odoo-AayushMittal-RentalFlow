-- Create pickups table for tracking order pickups
CREATE TABLE IF NOT EXISTS pickups (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  picked_up_by VARCHAR(255) NOT NULL,
  notes TEXT,
  picked_up_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_pickups_order_id ON pickups(order_id);
CREATE INDEX idx_pickups_reservation_id ON pickups(reservation_id);
CREATE INDEX idx_pickups_picked_up_at ON pickups(picked_up_at);

-- Add comments
COMMENT ON TABLE pickups IS 'Tracks when orders are picked up by customers';
COMMENT ON COLUMN pickups.picked_up_by IS 'Name of person who picked up the items';
COMMENT ON COLUMN pickups.notes IS 'Notes about the pickup (condition, special instructions, etc.)';

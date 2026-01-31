-- Create returns table for tracking order returns
CREATE TABLE IF NOT EXISTS returns (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  pickup_id INTEGER REFERENCES pickups(id) ON DELETE SET NULL,
  returned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_late BOOLEAN NOT NULL DEFAULT FALSE,
  late_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  condition_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_returns_order_id ON returns(order_id);
CREATE INDEX idx_returns_reservation_id ON returns(reservation_id);
CREATE INDEX idx_returns_pickup_id ON returns(pickup_id);
CREATE INDEX idx_returns_returned_at ON returns(returned_at);
CREATE INDEX idx_returns_is_late ON returns(is_late);

-- Add comments
COMMENT ON TABLE returns IS 'Tracks when rental items are returned by customers';
COMMENT ON COLUMN returns.is_late IS 'Whether the return was late (after end_date)';
COMMENT ON COLUMN returns.late_fee IS 'Calculated late fee amount if applicable';
COMMENT ON COLUMN returns.condition_notes IS 'Notes about the condition of returned items';

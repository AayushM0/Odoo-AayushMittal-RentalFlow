-- Migration: Create quotations table
-- Description: Quotation/quote request system for rental items

CREATE TABLE IF NOT EXISTS quotations (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vendor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED')),
  valid_until TIMESTAMP NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_quotations_customer_id ON quotations(customer_id);
CREATE INDEX idx_quotations_vendor_id ON quotations(vendor_id);
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_created_at ON quotations(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE quotations IS 'Quotation requests from customers to vendors';
COMMENT ON COLUMN quotations.items IS 'JSON array of requested items with product_id, variant_id, quantity, duration, price';
COMMENT ON COLUMN quotations.status IS 'PENDING: awaiting vendor response, APPROVED: vendor approved, REJECTED: vendor rejected, EXPIRED: past valid_until date, CONVERTED: turned into an order';
COMMENT ON COLUMN quotations.valid_until IS 'Quote validity expiration date';

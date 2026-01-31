-- Create invoices table for order billing
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  line_items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  cgst DECIMAL(10, 2) NOT NULL DEFAULT 0,
  sgst DECIMAL(10, 2) NOT NULL DEFAULT 0,
  igst DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  amount_due DECIMAL(10, 2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED')),
  pdf_url VARCHAR(255),
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_invoices_order_id ON invoices(order_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- Add comments
COMMENT ON TABLE invoices IS 'Stores invoice information for orders including line items and payment status';
COMMENT ON COLUMN invoices.line_items IS 'JSON array of line items with description, quantity, unit_price, and total';
COMMENT ON COLUMN invoices.amount_due IS 'Remaining amount to be paid';

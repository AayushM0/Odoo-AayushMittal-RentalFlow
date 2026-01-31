-- Migration: Add payment status to orders table
-- Description: Track payment status separately from order status

CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

ALTER TABLE orders 
ADD COLUMN payment_status payment_status DEFAULT 'PENDING',
ADD COLUMN payment_method VARCHAR(50),
ADD COLUMN payment_id VARCHAR(255);

COMMENT ON COLUMN orders.payment_status IS 'Payment status: PENDING, PAID, FAILED, REFUNDED';
COMMENT ON COLUMN orders.payment_method IS 'Payment method used (e.g., Razorpay, Cash, UPI)';
COMMENT ON COLUMN orders.payment_id IS 'External payment gateway transaction ID';

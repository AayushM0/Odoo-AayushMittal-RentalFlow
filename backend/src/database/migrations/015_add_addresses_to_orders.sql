-- Migration: Add billing and shipping addresses to orders table
-- Description: Store customer addresses with each order

ALTER TABLE orders 
ADD COLUMN billing_address JSONB,
ADD COLUMN shipping_address JSONB,
ADD COLUMN customer_notes TEXT;

COMMENT ON COLUMN orders.billing_address IS 'Customer billing address as JSON: {street, city, state, pincode, country}';
COMMENT ON COLUMN orders.shipping_address IS 'Customer shipping address as JSON: {street, city, state, pincode, country}';
COMMENT ON COLUMN orders.customer_notes IS 'Additional notes from customer';

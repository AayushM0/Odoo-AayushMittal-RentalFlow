-- Development Seed Data
-- Only use in development environment

-- Sample Vendor User
INSERT INTO users (email, password_hash, role, name, phone, company, category, is_active)
VALUES 
  ('vendor@example.com', '$2b$12$GcWgB9P7j5iQVGXNOcKu4e2I5eud0qp2ygvjK1Jdn9HIOi0RMF2Cq', 'VENDOR', 'Test Vendor', '9876543210', 'Test Electronics', 'Electronics', true)
ON CONFLICT (email) DO NOTHING;

-- Sample Customer User  
INSERT INTO users (email, password_hash, role, name, phone, is_active)
VALUES 
  ('customer@example.com', '$2b$12$GcWgB9P7j5iQVGXNOcKu4e2I5eud0qp2ygvjK1Jdn9HIOi0RMF2Cq', 'CUSTOMER', 'Test Customer', '9123456789', true)
ON CONFLICT (email) DO NOTHING;

-- Note: password_hash is for password "Test@123"

-- Sample Products
INSERT INTO products (vendor_id, name, description, category, brand, is_published)
SELECT 
  id,
  'Professional Camera',
  'High-quality DSLR camera for professional photography',
  'Electronics',
  'Canon',
  true
FROM users WHERE email = 'vendor@example.com'
ON CONFLICT DO NOTHING;

-- Sample Variants
INSERT INTO variants (product_id, sku, price_daily, price_weekly, price_monthly, stock_quantity)
SELECT 
  id,
  'CAM-CANON-001',
  500.00,
  3000.00,
  10000.00,
  5
FROM products WHERE name = 'Professional Camera'
ON CONFLICT (sku) DO NOTHING;

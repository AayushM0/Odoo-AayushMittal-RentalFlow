-- Migration: Create variants table
-- Description: Product variants with pricing and inventory

CREATE TABLE variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE NOT NULL,
  attributes JSONB DEFAULT '{}',
  price_hourly DECIMAL(10, 2),
  price_daily DECIMAL(10, 2),
  price_weekly DECIMAL(10, 2),
  price_monthly DECIMAL(10, 2),
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_variants_product ON variants(product_id);
CREATE INDEX idx_variants_sku ON variants(sku);

-- Migration: Create users table
-- Description: User accounts for customers and vendors

CREATE TYPE user_role AS ENUM ('CUSTOMER', 'VENDOR', 'ADMIN');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'CUSTOMER',
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(10),
  company VARCHAR(255),
  category VARCHAR(100),
  gstin VARCHAR(15),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

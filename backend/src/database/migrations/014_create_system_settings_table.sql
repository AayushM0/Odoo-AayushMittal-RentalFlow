-- Migration: Create system_settings table
-- Purpose: Store configurable application settings
-- Date: 2026-02-01

CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  category VARCHAR(50) NOT NULL,
  data_type VARCHAR(20) DEFAULT 'STRING' CHECK (data_type IN ('STRING', 'NUMBER', 'BOOLEAN', 'JSON')),
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_settings_is_public ON system_settings(is_public);
CREATE INDEX IF NOT EXISTS idx_settings_key ON system_settings(setting_key);

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, category, data_type, description, is_public) VALUES
  -- General Settings
  ('app_name', 'Rental ERP', 'GENERAL', 'STRING', 'Application name displayed to users', TRUE),
  ('app_description', 'Equipment Rental Management System', 'GENERAL', 'STRING', 'Application description', TRUE),
  ('contact_email', 'contact@example.com', 'GENERAL', 'STRING', 'Primary contact email address', TRUE),
  ('contact_phone', '+1234567890', 'GENERAL', 'STRING', 'Primary contact phone number', TRUE),
  ('currency', 'INR', 'GENERAL', 'STRING', 'Default currency code', TRUE),
  ('currency_symbol', '₹', 'GENERAL', 'STRING', 'Currency symbol', TRUE),
  ('timezone', 'Asia/Kolkata', 'GENERAL', 'STRING', 'Default application timezone', FALSE),
  ('date_format', 'DD/MM/YYYY', 'GENERAL', 'STRING', 'Default date format', TRUE),
  
  -- Email Settings
  ('smtp_host', 'smtp.gmail.com', 'EMAIL', 'STRING', 'SMTP server hostname', FALSE),
  ('smtp_port', '587', 'EMAIL', 'NUMBER', 'SMTP server port', FALSE),
  ('smtp_user', '', 'EMAIL', 'STRING', 'SMTP authentication username', FALSE),
  ('smtp_from', '', 'EMAIL', 'STRING', 'From email address for outgoing emails', FALSE),
  ('smtp_from_name', 'Rental ERP', 'EMAIL', 'STRING', 'From name for outgoing emails', FALSE),
  ('email_enabled', 'true', 'EMAIL', 'BOOLEAN', 'Enable email notifications', FALSE),
  
  -- Payment Settings
  ('razorpay_enabled', 'true', 'PAYMENT', 'BOOLEAN', 'Enable Razorpay payment gateway', FALSE),
  ('razorpay_key_id', '', 'PAYMENT', 'STRING', 'Razorpay Key ID (publishable key)', FALSE),
  ('cod_enabled', 'true', 'PAYMENT', 'BOOLEAN', 'Enable Cash on Delivery option', TRUE),
  ('payment_terms', '30', 'PAYMENT', 'NUMBER', 'Default payment terms in days', TRUE),
  ('partial_payment_enabled', 'true', 'PAYMENT', 'BOOLEAN', 'Allow partial payments', TRUE),
  ('payment_gateway_fee', '2.5', 'PAYMENT', 'NUMBER', 'Payment gateway fee percentage', TRUE),
  
  -- Rental Settings
  ('min_rental_days', '1', 'RENTAL', 'NUMBER', 'Minimum rental duration in days', TRUE),
  ('max_rental_days', '365', 'RENTAL', 'NUMBER', 'Maximum rental duration in days', TRUE),
  ('late_fee_percentage', '10', 'RENTAL', 'NUMBER', 'Late fee as percentage of daily rental', TRUE),
  ('security_deposit_percentage', '20', 'RENTAL', 'NUMBER', 'Security deposit percentage of total rental', TRUE),
  ('advance_booking_days', '90', 'RENTAL', 'NUMBER', 'Maximum days in advance for booking', TRUE),
  ('allow_same_day_rental', 'true', 'RENTAL', 'BOOLEAN', 'Allow same-day rental bookings', TRUE),
  ('require_approval', 'false', 'RENTAL', 'BOOLEAN', 'Require admin approval for rentals', TRUE),
  ('auto_extend_enabled', 'false', 'RENTAL', 'BOOLEAN', 'Allow automatic rental extensions', TRUE),
  
  -- Notification Settings
  ('push_enabled', 'true', 'NOTIFICATION', 'BOOLEAN', 'Enable push notifications', FALSE),
  ('email_notifications', 'true', 'NOTIFICATION', 'BOOLEAN', 'Enable email notifications', TRUE),
  ('sms_notifications', 'false', 'NOTIFICATION', 'BOOLEAN', 'Enable SMS notifications', FALSE),
  ('return_reminder_days', '2', 'NOTIFICATION', 'NUMBER', 'Days before return to send reminder', FALSE),
  ('order_confirmation', 'true', 'NOTIFICATION', 'BOOLEAN', 'Send order confirmation notifications', TRUE),
  ('payment_confirmation', 'true', 'NOTIFICATION', 'BOOLEAN', 'Send payment confirmation notifications', TRUE),
  
  -- Business Settings
  ('business_name', 'My Rental Business', 'BUSINESS', 'STRING', 'Legal business name', TRUE),
  ('business_address', '', 'BUSINESS', 'STRING', 'Business address', TRUE),
  ('business_phone', '', 'BUSINESS', 'STRING', 'Business phone number', TRUE),
  ('business_email', '', 'BUSINESS', 'STRING', 'Business email address', TRUE),
  ('tax_id', '', 'BUSINESS', 'STRING', 'Tax identification number', FALSE),
  ('tax_rate', '18', 'BUSINESS', 'NUMBER', 'Default tax rate percentage', TRUE)
ON CONFLICT (setting_key) DO NOTHING;

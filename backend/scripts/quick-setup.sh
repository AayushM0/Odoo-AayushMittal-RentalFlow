#!/bin/bash

# Quick Database Setup Script (requires sudo access)
# This script will be run by the user with sudo privileges

echo "========================================"
echo "  Rental ERP - Quick Database Setup"
echo "========================================"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -eq 0 ] || [ -n "$SUDO_USER" ]; then
    echo "✅ Running with appropriate privileges"
else
    echo "❌ This script needs sudo access"
    echo "Please run: sudo ./quick-setup.sh"
    exit 1
fi

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run the SQL setup as postgres user
echo "Setting up database..."
sudo -u postgres psql -f "$SCRIPT_DIR/setup-database.sql"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database setup completed successfully!"
    echo ""
    echo "Database Details:"
    echo "  Name: rental_erp"
    echo "  User: rental_user"
    echo "  Password: rental_password_123"
    echo "  Host: localhost"
    echo "  Port: 5432"
    echo ""
    echo "Next steps:"
    echo "  1. cd ../  (go to backend folder)"
    echo "  2. node scripts/test-db-connection.js"
    echo "  3. npm run dev"
else
    echo ""
    echo "❌ Database setup failed. Please check errors above."
    exit 1
fi

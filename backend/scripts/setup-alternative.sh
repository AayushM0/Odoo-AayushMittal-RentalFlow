#!/bin/bash

echo "========================================"
echo "  Alternative Database Setup"
echo "========================================"
echo ""

# Copy SQL to a location postgres can read
TEMP_SQL="/tmp/rental_erp_setup.sql"
cp setup-database.sql "$TEMP_SQL"
chmod 644 "$TEMP_SQL"

echo "Running database setup..."
sudo -u postgres psql -f "$TEMP_SQL"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database setup completed successfully!"
    echo ""
    echo "Database Details:"
    echo "  Name: rental_erp"
    echo "  User: rental_user"
    echo "  Password: rental_password_123"
    echo ""
    rm "$TEMP_SQL"
else
    echo ""
    echo "❌ Setup failed"
    rm "$TEMP_SQL"
    exit 1
fi

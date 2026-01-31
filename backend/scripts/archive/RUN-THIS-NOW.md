# 🚀 DATABASE SETUP - RUN THESE COMMANDS

## Quick Method (Recommended)

Open your terminal and run:

```bash
cd ~/everything/Odoo-AayushMittal/GENERAL_PROJECT_TEMPLATE/06_SRC/backend/scripts
sudo ./quick-setup.sh
```

**You'll be prompted for your sudo password.**

---

## Alternative Method (If quick-setup.sh fails)

### Step 1: Create PostgreSQL User for your system account
```bash
sudo -u postgres createuser -s $(whoami)
```

### Step 2: Run the SQL script directly
```bash
psql postgres -f setup-database.sql
```

---

## Alternative Method 2: Manual PostgreSQL Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Then run these commands in psql:
CREATE USER rental_user WITH PASSWORD 'rental_password_123';
CREATE DATABASE rental_erp OWNER rental_user;
\c rental_erp
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

# Copy and paste the CREATE TABLE statement from setup-database.sql
# Or use: \i /full/path/to/setup-database.sql

\q
```

---

## Verify Database Setup

After running the setup, verify it worked:

```bash
cd ~/everything/Odoo-AayushMittal/GENERAL_PROJECT_TEMPLATE/06_SRC/backend
node scripts/test-db-connection.js
```

Expected output:
```
✅ Database connection successful!
✅ PostgreSQL Version: PostgreSQL 17.x
✅ Connected to database: rental_erp
✅ Connected as user: rental_user
✅ Users table exists
✅ Current user count: 0
🎉 Database is ready!
```

---

## After Database Setup

1. **Start Backend Server**
   ```bash
   cd ~/everything/Odoo-AayushMittal/GENERAL_PROJECT_TEMPLATE/06_SRC/backend
   npm run dev
   ```

2. **Start Frontend Server** (in new terminal)
   ```bash
   cd ~/everything/Odoo-AayushMittal/GENERAL_PROJECT_TEMPLATE/06_SRC/frontend
   npm run dev
   ```

3. **Test Registration**
   - Open: http://localhost:5173/register
   - Select "Vendor" role
   - Fill in all fields including business category
   - Click "Sign up"
   - Should work without "category is not allowed" error! ✅

---

## Troubleshooting

### Error: "role does not exist"
```bash
sudo -u postgres createuser -s $(whoami)
```

### Error: "database already exists"
That's OK! Just continue to verify step.

### Error: "permission denied"
Make sure you're using `sudo` or `sudo -u postgres` prefix.

---

## Quick Command Reference

```bash
# Full setup in one go:
cd ~/everything/Odoo-AayushMittal/GENERAL_PROJECT_TEMPLATE/06_SRC/backend/scripts
sudo ./quick-setup.sh

# Test connection:
cd ..
node scripts/test-db-connection.js

# Start servers:
npm run dev                    # Backend (terminal 1)
cd ../frontend && npm run dev  # Frontend (terminal 2)
```

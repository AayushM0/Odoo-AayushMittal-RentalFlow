# 🧪 END-TO-END MANUAL TESTING GUIDE
## Rental ERP System - Complete Manual Testing Flow

**Version:** 1.0.0  
**Last Updated:** 2026-01-31  
**Test Status Tracking:** ✅ Working | ❌ Not Working | ⚠️ Partial | 📝 Notes

---

## 📋 TABLE OF CONTENTS

1. [Pre-Testing Setup](#1-pre-testing-setup)
2. [Environment Verification](#2-environment-verification)
3. [Authentication & User Management](#3-authentication--user-management)
4. [Product Management (Vendor)](#4-product-management-vendor)
5. [Product Browsing (Customer)](#5-product-browsing-customer)
6. [Reservation System](#6-reservation-system)
7. [Order Creation Flow](#7-order-creation-flow)
8. [Order Management (Vendor)](#8-order-management-vendor)
9. [Order Management (Customer)](#9-order-management-customer)
10. [Image Upload System](#10-image-upload-system)
11. [Role-Based Access Control](#11-role-based-access-control)
12. [Error Handling & Edge Cases](#12-error-handling--edge-cases)
13. [API Testing (Optional - Advanced)](#13-api-testing-optional---advanced)
14. [Bug Tracking Template](#14-bug-tracking-template)

---

## 1. PRE-TESTING SETUP

### 1.1 Database Setup
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Steps:**
```bash
# Navigate to backend directory
cd GENERAL_PROJECT_TEMPLATE/06_SRC/backend

# Check if PostgreSQL is running
psql --version
# Expected: PostgreSQL 14+ installed

# Create database
psql -U postgres
CREATE DATABASE rental_erp;
\q

# Run migrations
npm run db:migrate
# Expected: All 6 migrations should execute successfully
```

**Verification Checklist:**
- [ ] Database `rental_erp` created
- [ ] Tables created: users, products, variants, orders, reservations
- [ ] Extension `btree_gist` enabled (for reservation exclusion constraints)
- [ ] Image columns added to users and products tables

**Expected Output:**
```
✅ Migration 001_create_users_table.sql executed
✅ Migration 002_create_products_table.sql executed
✅ Migration 003_create_variants_table.sql executed
✅ Migration 004_create_orders_table.sql executed
✅ Migration 005_create_reservations_table.sql executed
✅ Migration 006_add_image_columns.sql executed
```

**Notes:** 
_[Write any issues encountered here]_

---

### 1.2 Environment Configuration
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Backend (.env):**
```bash
cd GENERAL_PROJECT_TEMPLATE/06_SRC/backend

# Copy example and configure
cp .env.example .env

# Edit .env file with your values:
nano .env
```

**Required Environment Variables:**
```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/rental_erp

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Frontend (.env):**
```bash
cd GENERAL_PROJECT_TEMPLATE/06_SRC/frontend

# Copy example and configure
cp .env.example .env

# Edit .env file:
nano .env
```

```env
VITE_API_URL=http://localhost:5000/api
```

**Verification:**
- [ ] Backend .env file exists with all required variables
- [ ] Frontend .env file exists with API URL
- [ ] Cloudinary credentials are valid (test upload later)

**Notes:**
_[Write any configuration issues here]_

---

### 1.3 Install Dependencies
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Backend:**
```bash
cd GENERAL_PROJECT_TEMPLATE/06_SRC/backend
npm install
```

**Expected packages:**
- express
- pg (PostgreSQL client)
- bcrypt
- jsonwebtoken
- dotenv
- cors
- helmet
- morgan
- cloudinary
- multer

**Frontend:**
```bash
cd GENERAL_PROJECT_TEMPLATE/06_SRC/frontend
npm install
```

**Expected packages:**
- react
- react-dom
- react-router-dom
- axios
- tailwindcss
- vite

**Verification:**
- [ ] No installation errors
- [ ] node_modules directories created
- [ ] package-lock.json files generated

**Notes:**
_[Write any dependency issues here]_

---

### 1.4 Seed Database (Optional but Recommended)
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

```bash
cd GENERAL_PROJECT_TEMPLATE/06_SRC/backend
npm run db:seed
```

**What this creates:**
- 3 test users (customer, vendor, admin)
- 5-10 sample products with variants
- Sample categories

**Default Test Accounts:**
```
Customer Account:
Email: customer@test.com
Password: password123

Vendor Account:
Email: vendor@test.com
Password: password123

Admin Account:
Email: admin@test.com
Password: password123
```

**Verification:**
- [ ] Seed script runs without errors
- [ ] Can login with test accounts
- [ ] Sample products visible in database

**Notes:**
_[Write any seeding issues here]_

---

### 1.5 Start Servers
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Option A: Start Both Servers Separately**

**Terminal 1 - Backend:**
```bash
cd GENERAL_PROJECT_TEMPLATE/06_SRC/backend
npm run dev
```

**Expected Output:**
```
🚀 Server running on port 5000
📝 Environment: development
🔗 Health check: http://localhost:5000/health
🔗 API: http://localhost:5000/api
```

**Terminal 2 - Frontend:**
```bash
cd GENERAL_PROJECT_TEMPLATE/06_SRC/frontend
npm run dev
```

**Expected Output:**
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Option B: Start Both with One Command**
```bash
cd GENERAL_PROJECT_TEMPLATE/06_SRC
npm run dev
```

**Verification:**
- [ ] Backend running on http://localhost:5000
- [ ] Frontend running on http://localhost:5173
- [ ] No error messages in console
- [ ] Health check endpoint responds: http://localhost:5000/health

**Browser Test:**
- [ ] Open http://localhost:5173 - Homepage loads
- [ ] Open http://localhost:5000/api - API info displayed
- [ ] No CORS errors in browser console

**Notes:**
_[Write any startup issues here]_

---


## 2. ENVIRONMENT VERIFICATION

### 2.1 Backend Health Check
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Test URL:** http://localhost:5000/health

**Expected Response:**
```json
{
  "status": "OK",
  "message": "Rental ERP Backend is running",
  "timestamp": "2026-01-31T20:00:00.000Z",
  "environment": "development"
}
```

**Verification:**
- [ ] Status code: 200
- [ ] JSON response contains all fields
- [ ] Timestamp is current

**Notes:**
_[Write any issues here]_

---

### 2.2 API Endpoints List
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Test URL:** http://localhost:5000/api

**Expected Response:**
```json
{
  "message": "Welcome to Rental ERP API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "api": "/api",
    "auth": "/api/auth",
    "products": "/api/products",
    "upload": "/api/upload",
    "reservations": "/api/reservations",
    "orders": "/api/orders"
  }
}
```

**Verification:**
- [ ] All endpoint routes listed
- [ ] Version number displayed

**Notes:**
_[Write any issues here]_

---

### 2.3 Database Connection
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Test via psql:**
```bash
psql -U postgres -d rental_erp -c "\dt"
```

**Expected Tables:**
```
         List of relations
 Schema |     Name      | Type  |  Owner   
--------+---------------+-------+----------
 public | orders        | table | postgres
 public | products      | table | postgres
 public | reservations  | table | postgres
 public | users         | table | postgres
 public | variants      | table | postgres
```

**Verification:**
- [ ] All 5 tables exist
- [ ] No error messages

**Notes:**
_[Write any issues here]_

---

## 3. AUTHENTICATION & USER MANAGEMENT

### 3.1 User Registration (Customer)
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Frontend Steps:**
1. Open http://localhost:5173
2. Click "Register" or navigate to `/register`
3. Fill in registration form:
   - **Name:** Test Customer
   - **Email:** testcustomer@example.com
   - **Password:** Test123!@#
   - **Confirm Password:** Test123!@#
   - **Role:** Customer
   - **Phone:** +1234567890 (optional)

4. Click "Register" button

**Expected Behavior:**
- [ ] Form validates all fields
- [ ] Password strength indicator shows (if implemented)
- [ ] Success message appears
- [ ] Redirects to login or dashboard
- [ ] User automatically logged in (if auto-login enabled)

**Backend Verification:**
```bash
psql -U postgres -d rental_erp -c "SELECT id, name, email, role FROM users WHERE email='testcustomer@example.com';"
```

**Expected:**
- [ ] User record created in database
- [ ] Password is hashed (not plain text)
- [ ] Role is 'customer'
- [ ] Created_at timestamp is set

**Error Cases to Test:**
- [ ] Empty email → Shows "Email required" error
- [ ] Invalid email format → Shows "Invalid email" error
- [ ] Duplicate email → Shows "Email already exists" error
- [ ] Password too short → Shows "Password must be at least 6 characters" error
- [ ] Passwords don't match → Shows "Passwords must match" error

**Notes:**
_[Write any registration issues here]_

---

### 3.2 User Registration (Vendor)
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Frontend Steps:**
1. Navigate to `/register`
2. Fill in form:
   - **Name:** Test Vendor
   - **Email:** testvendor@example.com
   - **Password:** Test123!@#
   - **Confirm Password:** Test123!@#
   - **Role:** Vendor
   - **Phone:** +1987654321
   - **Business Name:** Test Rentals Inc. (if field exists)

3. Click "Register"

**Expected Behavior:**
- [ ] Registration successful
- [ ] User redirected appropriately
- [ ] Role set as 'vendor'

**Verification:**
```bash
psql -U postgres -d rental_erp -c "SELECT id, name, email, role FROM users WHERE email='testvendor@example.com';"
```

**Expected:**
- [ ] User created with role='vendor'

**Notes:**
_[Write any issues here]_

---

### 3.3 User Login
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Frontend Steps:**
1. Navigate to http://localhost:5173/login
2. Enter credentials:
   - **Email:** testcustomer@example.com
   - **Password:** Test123!@#
3. Click "Login"

**Expected Behavior:**
- [ ] Loading indicator appears during request
- [ ] Success message shown
- [ ] JWT token stored in localStorage/sessionStorage
- [ ] User redirected to dashboard
- [ ] Navbar shows user name
- [ ] Logout button visible

**Browser Console Check:**
```javascript
// Open DevTools (F12) → Console
localStorage.getItem('token')
// Should return JWT token string

localStorage.getItem('user')
// Should return user object as JSON
```

**Expected Token Format:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdGN1c3RvbWVyQGV4YW1wbGUuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzA2NzI0MDAwLCJleHAiOjE3MDczMjg4MDB9.signature
```

**Error Cases to Test:**
- [ ] Wrong password → Shows "Invalid credentials" error
- [ ] Non-existent email → Shows "Invalid credentials" error
- [ ] Empty fields → Shows validation errors
- [ ] Network error → Shows "Connection failed" error

**Notes:**
_[Write any login issues here]_

---

### 3.4 User Logout
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Frontend Steps:**
1. While logged in, click "Logout" button
2. Observe behavior

**Expected Behavior:**
- [ ] Token removed from localStorage
- [ ] User redirected to login or home page
- [ ] Navbar returns to logged-out state
- [ ] Protected pages inaccessible

**Browser Console Verification:**
```javascript
localStorage.getItem('token')
// Should return null

localStorage.getItem('user')
// Should return null
```

**Notes:**
_[Write any logout issues here]_

---

### 3.5 Protected Routes
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Test While Logged Out:**

Try accessing these URLs directly:
- http://localhost:5173/dashboard
- http://localhost:5173/products/create
- http://localhost:5173/orders
- http://localhost:5173/my-products

**Expected Behavior:**
- [ ] Redirects to /login
- [ ] Shows "Please login to continue" message (if implemented)

**Test While Logged In:**
- [ ] Can access protected routes
- [ ] No redirect to login

**Notes:**
_[Write any issues here]_

---


## 4. PRODUCT MANAGEMENT (VENDOR)

### 4.1 View Products List (Vendor Dashboard)
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Prerequisites:**
- Login as vendor (testvendor@example.com)

**Frontend Steps:**
1. Navigate to `/dashboard` or `/my-products`
2. View list of vendor's products

**Expected Display:**
- [ ] Table/Grid showing all vendor's products
- [ ] Columns: Image, Name, Category, Base Price, Stock, Status, Actions
- [ ] "Create Product" button visible
- [ ] Edit/Delete buttons for each product

**If No Products:**
- [ ] Shows "No products found" message
- [ ] Shows "Create Your First Product" button

**Notes:**
_[Write any issues here]_

---

### 4.2 Create Product (Basic)
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Frontend Steps:**
1. Login as vendor
2. Navigate to `/products/create` or click "Create Product"
3. Fill in basic product details:
   - **Name:** Professional Camera Kit
   - **Description:** High-end DSLR camera with multiple lenses
   - **Category:** Electronics
   - **Base Price:** 50
   - **Pricing Unit:** per day
   - **Stock Quantity:** 5
   - **Status:** Active

4. Click "Create Product" or "Save"

**Expected Behavior:**
- [ ] Form validation works
- [ ] Success message appears
- [ ] Redirects to product list or product detail page
- [ ] New product appears in vendor's product list

**Backend Verification:**
```bash
psql -U postgres -d rental_erp -c "SELECT id, name, category, base_price, stock_quantity FROM products ORDER BY id DESC LIMIT 1;"
```

**Expected:**
- [ ] Product created with correct vendor_id
- [ ] All fields saved correctly
- [ ] Timestamps set (created_at, updated_at)

**Error Cases to Test:**
- [ ] Empty name → Shows "Name is required"
- [ ] Negative price → Shows "Price must be positive"
- [ ] Negative stock → Shows "Stock must be non-negative"
- [ ] Missing category → Shows validation error

**Notes:**
_[Write any issues here]_

---

### 4.3 Create Product with Variants
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Frontend Steps:**
1. Create a new product: "Camping Tent"
2. After product creation, add variants:

**Variant 1:**
- **Name:** 2-Person Tent
- **Price Adjustment:** 0 (same as base price)
- **Stock:** 3

**Variant 2:**
- **Name:** 4-Person Tent
- **Price Adjustment:** 20 (adds $20 to base price)
- **Stock:** 2

**Variant 3:**
- **Name:** 6-Person Tent
- **Price Adjustment:** 40 (adds $40 to base price)
- **Stock:** 1

3. Click "Add Variant" for each
4. Save product

**Expected Behavior:**
- [ ] Can add multiple variants
- [ ] Each variant shows in list
- [ ] Can edit variant details
- [ ] Can delete variants
- [ ] Total stock = sum of all variant stocks

**Database Verification:**
```bash
psql -U postgres -d rental_erp -c "SELECT v.id, v.name, v.price_adjustment, v.stock_quantity, p.name as product_name FROM variants v JOIN products p ON v.product_id = p.id ORDER BY v.id DESC LIMIT 3;"
```

**Expected:**
- [ ] 3 variant records created
- [ ] Linked to correct product_id
- [ ] Price adjustments stored correctly

**Notes:**
_[Write any issues here]_

---

### 4.4 Upload Product Images
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Prerequisites:**
- Cloudinary credentials configured in backend .env

**Frontend Steps:**
1. Edit an existing product
2. Click "Upload Image" or image upload area
3. Select image file (JPG/PNG, < 5MB)
4. Wait for upload

**Expected Behavior:**
- [ ] File picker opens
- [ ] Upload progress indicator shows
- [ ] Image preview displays after upload
- [ ] Image URL saved to database
- [ ] Can upload multiple images (if gallery supported)

**Backend Verification:**
```bash
psql -U postgres -d rental_erp -c "SELECT id, name, image_url FROM products WHERE image_url IS NOT NULL LIMIT 1;"
```

**Expected:**
- [ ] image_url contains Cloudinary URL
- [ ] Format: https://res.cloudinary.com/[cloud_name]/image/upload/...

**Error Cases to Test:**
- [ ] File too large → Shows "File size exceeds limit"
- [ ] Invalid file type → Shows "Invalid file type"
- [ ] Network error → Shows upload failed message

**Notes:**
_[Write any Cloudinary issues here]_

---

### 4.5 Edit Product
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Frontend Steps:**
1. Login as vendor
2. Go to product list
3. Click "Edit" on a product
4. Modify fields:
   - Change name
   - Update price
   - Change stock quantity
   - Update description
5. Click "Save"

**Expected Behavior:**
- [ ] Form pre-fills with existing data
- [ ] Can modify all fields
- [ ] Validation works on update
- [ ] Success message appears
- [ ] Changes reflected immediately in list
- [ ] Updated_at timestamp changes

**Database Verification:**
```bash
psql -U postgres -d rental_erp -c "SELECT id, name, base_price, stock_quantity, updated_at FROM products WHERE id = [product_id];"
```

**Expected:**
- [ ] Fields updated correctly
- [ ] updated_at is newer than created_at

**Notes:**
_[Write any issues here]_

---

### 4.6 Delete Product
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Frontend Steps:**
1. Login as vendor
2. Navigate to product list
3. Click "Delete" on a product
4. Confirm deletion (if confirmation dialog appears)

**Expected Behavior:**
- [ ] Confirmation dialog appears
- [ ] After confirmation, product removed from list
- [ ] Success message shown
- [ ] Cannot delete if active reservations exist (business logic)

**Database Verification:**
```bash
# Check if product is soft-deleted or hard-deleted
psql -U postgres -d rental_erp -c "SELECT id, name, deleted_at FROM products WHERE id = [product_id];"
```

**Expected:**
- [ ] Product removed from active listings
- [ ] If soft delete: deleted_at is set
- [ ] If hard delete: record doesn't exist

**Cascade Behavior:**
- [ ] Associated variants also deleted
- [ ] Existing orders remain intact (referential integrity)

**Notes:**
_[Write any issues here]_

---

## 5. PRODUCT BROWSING (CUSTOMER)

### 5.1 Browse Products Page
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Frontend Steps:**
1. Login as customer OR stay logged out
2. Navigate to `/products`

**Expected Display:**
- [ ] Grid/List of all active products
- [ ] Product cards show: Image, Name, Price, Stock status
- [ ] "View Details" button on each card
- [ ] Pagination (if many products)
- [ ] Products from all vendors visible

**Product Card Information:**
- [ ] Product image (or placeholder if no image)
- [ ] Product name
- [ ] Base price with unit (e.g., "$50/day")
- [ ] Category badge
- [ ] Stock availability indicator
- [ ] Vendor name (optional)

**Notes:**
_[Write any issues here]_

---

### 5.2 Search Products
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Frontend Steps:**
1. On products page, use search box
2. Test searches:
   - Search: "camera" → Should show camera products
   - Search: "tent" → Should show tent products
   - Search: "xyz123" → Should show "No products found"

**Expected Behavior:**
- [ ] Search updates results in real-time or on submit
- [ ] Results match search term in name/description
- [ ] Case-insensitive search
- [ ] Shows count of results found

**Notes:**
_[Write any issues here]_

---

### 5.3 Filter Products by Category
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Frontend Steps:**
1. On products page, find category filter
2. Select a category (e.g., "Electronics")
3. Observe filtered results

**Expected Behavior:**
- [ ] Only products in selected category shown
- [ ] Category filter badge/indicator appears
- [ ] Can clear filter to show all products
- [ ] Can select multiple categories (if multi-select enabled)

**Categories to Test:**
- [ ] Electronics
- [ ] Sports
- [ ] Camping
- [ ] Photography
- [ ] Other/Miscellaneous

**Notes:**
_[Write any issues here]_

---

### 5.4 Sort Products
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Frontend Steps:**
1. Use sort dropdown on products page
2. Test sort options:
   - Price: Low to High
   - Price: High to Low
   - Name: A-Z
   - Name: Z-A
   - Newest First

**Expected Behavior:**
- [ ] Products reorder correctly
- [ ] Sort persists during pagination
- [ ] Can combine with filters and search

**Notes:**
_[Write any issues here]_

---

### 5.5 View Product Detail Page
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Frontend Steps:**
1. Click "View Details" on any product
2. Navigate to `/products/:id`

**Expected Display:**
- [ ] Product name as heading
- [ ] Full description
- [ ] Image gallery (if multiple images)
- [ ] Price information
- [ ] Stock availability
- [ ] Vendor information
- [ ] Category
- [ ] Variant selector (if variants exist)

**Variant Selector (if applicable):**
- [ ] Radio buttons or dropdown for variants
- [ ] Selecting variant updates:
  - Price display
  - Stock availability
  - Selected variant highlighted

**Action Buttons:**
- [ ] "Reserve Now" or "Add to Cart" button
- [ ] "Back to Products" button

**Notes:**
_[Write any issues here]_

---

### 5.6 Product Detail - Variant Selection
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Test Product:** Use "Camping Tent" with 3 variants

**Frontend Steps:**
1. Navigate to tent product detail page
2. Select "2-Person Tent" variant
   - [ ] Price shows base price
   - [ ] Stock shows 3 available
3. Select "4-Person Tent" variant
   - [ ] Price shows base price + $20
   - [ ] Stock shows 2 available
4. Select "6-Person Tent" variant
   - [ ] Price shows base price + $40
   - [ ] Stock shows 1 available

**Expected Behavior:**
- [ ] Smooth transition between variants
- [ ] No page reload needed
- [ ] Price recalculates automatically
- [ ] Stock indicator updates
- [ ] Selected variant visually distinct

**Notes:**
_[Write any issues here]_

---


## 6. RESERVATION SYSTEM

### 6.1 Check Product Availability
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Frontend Steps:**
1. On product detail page, look for availability checker
2. Select date range (if calendar interface exists)

**Expected Display:**
- [ ] Shows stock available for selected dates
- [ ] Shows "X units available" message
- [ ] If no stock: Shows "Not available for selected dates"

**Notes:**
_[Write any issues here]_

---

### 6.2 Create Reservation via API
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**API Test using curl or Postman:**

**Step 1: Get auth token**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testcustomer@example.com",
    "password": "Test123!@#"
  }'
```

**Save the token from response.**

**Step 2: Create reservation**
```bash
curl -X POST http://localhost:5000/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "product_id": 1,
    "variant_id": null,
    "quantity": 2,
    "start_date": "2026-02-01T00:00:00Z",
    "end_date": "2026-02-05T00:00:00Z"
  }'
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Reservation created successfully",
  "data": {
    "id": 1,
    "product_id": 1,
    "user_id": 1,
    "quantity": 2,
    "start_date": "2026-02-01T00:00:00.000Z",
    "end_date": "2026-02-05T00:00:00.000Z",
    "status": "pending",
    "created_at": "2026-01-31T20:00:00.000Z"
  }
}
```

**Database Verification:**
```bash
psql -U postgres -d rental_erp -c "SELECT * FROM reservations ORDER BY id DESC LIMIT 1;"
```

**Expected:**
- [ ] Reservation record created
- [ ] Status is 'pending'
- [ ] Dates stored correctly with tsrange
- [ ] Product and user linked correctly

**Notes:**
_[Write any issues here]_

---

### 6.3 Anti-Overbooking Test
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**This tests the exclusion constraint!**

**Setup:**
- Product: Camera (ID: 1)
- Stock: 5 units

**Test Scenario:**

**Reservation 1:**
```bash
# Reserve 3 units from Feb 1-5
curl -X POST http://localhost:5000/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "product_id": 1,
    "quantity": 3,
    "start_date": "2026-02-01",
    "end_date": "2026-02-05"
  }'
```
**Expected:** ✅ Success (3 of 5 reserved)

**Reservation 2:**
```bash
# Reserve 2 more units from Feb 3-7 (overlapping)
curl -X POST http://localhost:5000/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "product_id": 1,
    "quantity": 2,
    "start_date": "2026-02-03",
    "end_date": "2026-02-07"
  }'
```
**Expected:** ✅ Success (5 of 5 reserved, no conflict yet)

**Reservation 3 (Should FAIL):**
```bash
# Try to reserve 1 more unit from Feb 4-6 (overlapping)
curl -X POST http://localhost:5000/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "product_id": 1,
    "quantity": 1,
    "start_date": "2026-02-04",
    "end_date": "2026-02-06"
  }'
```

**Expected Response (409 Conflict):**
```json
{
  "success": false,
  "error": "Insufficient stock available for selected dates",
  "details": {
    "requested": 1,
    "available": 0,
    "total_stock": 5
  }
}
```

**Verification Checklist:**
- [ ] First 2 reservations succeed
- [ ] Third reservation fails with proper error
- [ ] Error message explains stock unavailability
- [ ] No data corruption in database
- [ ] Transaction rolled back on failure

**Database Check:**
```bash
psql -U postgres -d rental_erp -c "SELECT id, product_id, quantity, start_date, end_date, status FROM reservations WHERE product_id = 1;"
```

**Expected:**
- [ ] Only 2 reservations exist (3rd rejected)
- [ ] Total quantity = 5 (not exceeded)

**Notes:**
_[Write critical overbooking test results here]_

---

### 6.4 Non-Overlapping Reservations
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Test Scenario:**
Reserve same product for non-overlapping dates

**Reservation A:**
- Dates: Feb 1-5
- Quantity: 5

**Reservation B:**
- Dates: Feb 6-10
- Quantity: 5

**Expected:**
- [ ] Both reservations succeed
- [ ] No conflict because dates don't overlap
- [ ] Full stock available for each period

**Notes:**
_[Write any issues here]_

---

### 6.5 Get User's Reservations
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**API Test:**
```bash
curl -X GET http://localhost:5000/api/reservations/my-reservations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "product_id": 1,
      "product_name": "Professional Camera Kit",
      "quantity": 2,
      "start_date": "2026-02-01T00:00:00.000Z",
      "end_date": "2026-02-05T00:00:00.000Z",
      "status": "pending",
      "total_price": 200,
      "created_at": "2026-01-31T20:00:00.000Z"
    }
  ]
}
```

**Verification:**
- [ ] Returns only logged-in user's reservations
- [ ] Includes product details
- [ ] Shows all reservation statuses
- [ ] Sorted by date (newest first)

**Notes:**
_[Write any issues here]_

---

### 6.6 Cancel Reservation
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**API Test:**
```bash
curl -X PUT http://localhost:5000/api/reservations/1/cancel \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Reservation cancelled successfully",
  "data": {
    "id": 1,
    "status": "cancelled"
  }
}
```

**Database Verification:**
```bash
psql -U postgres -d rental_erp -c "SELECT id, status FROM reservations WHERE id = 1;"
```

**Expected:**
- [ ] Status changed to 'cancelled'
- [ ] Stock released (available for other reservations)

**Business Rules to Test:**
- [ ] Can only cancel own reservations
- [ ] Cannot cancel if status is 'completed' or 'confirmed'
- [ ] Cannot cancel past reservations (if rule implemented)

**Notes:**
_[Write any issues here]_

---

## 7. ORDER CREATION FLOW

### 7.1 Create Order (Auto-Creates Reservation)
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**This is the integrated flow: Order → Reservation**

**API Test:**
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN" \
  -d '{
    "items": [
      {
        "product_id": 1,
        "variant_id": null,
        "quantity": 2,
        "start_date": "2026-02-10T00:00:00Z",
        "end_date": "2026-02-15T00:00:00Z"
      }
    ],
    "delivery_address": "123 Main St, City, State 12345",
    "notes": "Please deliver before noon"
  }'
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "id": 1,
      "user_id": 1,
      "status": "pending",
      "total_amount": 250,
      "delivery_address": "123 Main St, City, State 12345",
      "notes": "Please deliver before noon",
      "created_at": "2026-01-31T20:00:00.000Z"
    },
    "reservations": [
      {
        "id": 2,
        "order_id": 1,
        "product_id": 1,
        "quantity": 2,
        "start_date": "2026-02-10T00:00:00.000Z",
        "end_date": "2026-02-15T00:00:00.000Z",
        "status": "reserved"
      }
    ]
  }
}
```

**Database Verification:**
```bash
# Check order created
psql -U postgres -d rental_erp -c "SELECT * FROM orders ORDER BY id DESC LIMIT 1;"

# Check reservation auto-created
psql -U postgres -d rental_erp -c "SELECT * FROM reservations WHERE order_id IS NOT NULL ORDER BY id DESC LIMIT 1;"
```

**Expected:**
- [ ] Order record created
- [ ] Reservation record created with order_id link
- [ ] Reservation status is 'reserved' (not 'pending')
- [ ] Stock deducted from available pool
- [ ] Total amount calculated correctly

**Transaction Safety:**
- [ ] If reservation fails (no stock), order also fails
- [ ] No orphaned records
- [ ] Atomic operation (all or nothing)

**Notes:**
_[Write critical order creation issues here]_

---

### 7.2 Order with Multiple Products
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**API Test:**
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "items": [
      {
        "product_id": 1,
        "quantity": 1,
        "start_date": "2026-02-20",
        "end_date": "2026-02-25"
      },
      {
        "product_id": 2,
        "quantity": 2,
        "start_date": "2026-02-20",
        "end_date": "2026-02-25"
      }
    ],
    "delivery_address": "456 Oak Ave"
  }'
```

**Expected:**
- [ ] Single order created
- [ ] Multiple reservations created (one per product)
- [ ] All reservations linked to same order_id
- [ ] Total amount = sum of all items

**Database Verification:**
```bash
psql -U postgres -d rental_erp -c "SELECT r.id, r.order_id, r.product_id, r.quantity, o.total_amount FROM reservations r JOIN orders o ON r.order_id = o.id WHERE o.id = [order_id];"
```

**Expected:**
- [ ] 2 reservation records with same order_id
- [ ] Each linked to different product

**Notes:**
_[Write any issues here]_

---

### 7.3 Order with Variants
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**API Test:**
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "items": [
      {
        "product_id": 3,
        "variant_id": 2,
        "quantity": 1,
        "start_date": "2026-03-01",
        "end_date": "2026-03-05"
      }
    ],
    "delivery_address": "789 Pine Rd"
  }'
```

**Expected:**
- [ ] Order created
- [ ] Reservation includes variant_id
- [ ] Price calculated with variant adjustment
- [ ] Stock checked against variant's stock (not product's base stock)

**Database Verification:**
```bash
psql -U postgres -d rental_erp -c "SELECT r.id, r.product_id, r.variant_id, v.name as variant_name FROM reservations r LEFT JOIN variants v ON r.variant_id = v.id ORDER BY r.id DESC LIMIT 1;"
```

**Expected:**
- [ ] variant_id is not null
- [ ] Linked to correct variant

**Notes:**
_[Write any issues here]_

---

### 7.4 Order Validation - Insufficient Stock
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Setup:**
- Product with only 2 units available

**API Test:**
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "items": [
      {
        "product_id": 1,
        "quantity": 10,
        "start_date": "2026-04-01",
        "end_date": "2026-04-05"
      }
    ],
    "delivery_address": "Test Address"
  }'
```

**Expected Response (400 or 409):**
```json
{
  "success": false,
  "error": "Insufficient stock available",
  "details": {
    "product_id": 1,
    "requested": 10,
    "available": 2
  }
}
```

**Verification:**
- [ ] Order NOT created
- [ ] Reservation NOT created
- [ ] No stock deducted
- [ ] Clear error message

**Notes:**
_[Write any issues here]_

---

### 7.5 Order Validation - Invalid Dates
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Test Cases:**

**Case 1: End date before start date**
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "items": [
      {
        "product_id": 1,
        "quantity": 1,
        "start_date": "2026-05-10",
        "end_date": "2026-05-05"
      }
    ],
    "delivery_address": "Test"
  }'
```

**Expected:** ❌ Error "End date must be after start date"

**Case 2: Past dates**
```bash
{
  "start_date": "2025-01-01",
  "end_date": "2025-01-05"
}
```

**Expected:** ❌ Error "Cannot reserve dates in the past"

**Case 3: Same start and end date**
```bash
{
  "start_date": "2026-06-01",
  "end_date": "2026-06-01"
}
```

**Expected:** Maybe allow (1 day rental) or reject based on business rules

**Verification:**
- [ ] Date validation works correctly
- [ ] Clear error messages
- [ ] No records created on validation failure

**Notes:**
_[Write any issues here]_

---


## 8. ORDER MANAGEMENT (VENDOR)

### 8.1 View All Orders (Vendor)
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Prerequisites:**
- Login as vendor
- Some orders exist for vendor's products

**Frontend Steps:**
1. Navigate to `/orders` or vendor dashboard
2. View orders related to vendor's products

**Expected Display:**
- [ ] Table showing all orders
- [ ] Columns: Order ID, Customer Name, Product, Quantity, Dates, Status, Total, Actions
- [ ] Filter by status: All, Pending, Confirmed, Delivered, Completed, Cancelled
- [ ] Search by customer name or order ID

**Status Color Coding (if implemented):**
- Pending: Yellow/Orange
- Confirmed: Blue
- Delivered: Green
- Completed: Dark Green
- Cancelled: Red

**Notes:**
_[Write any issues here]_

---

### 8.2 View Order Details (Vendor)
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Frontend Steps:**
1. Click on an order to view details

**Expected Display:**
- [ ] Order number and date
- [ ] Customer information (name, email, phone)
- [ ] Delivery address
- [ ] List of items in order
- [ ] Reservation details (dates, quantity)
- [ ] Total amount
- [ ] Order status
- [ ] Status change actions (if available)
- [ ] Notes/comments

**Actions Available (based on status):**
- [ ] Confirm order (if pending)
- [ ] Mark as delivered
- [ ] Cancel order
- [ ] Add notes

**Notes:**
_[Write any issues here]_

---

### 8.3 Confirm Order (Vendor Action)
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**API Test:**
```bash
curl -X PUT http://localhost:5000/api/orders/1/confirm \
  -H "Authorization: Bearer YOUR_VENDOR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order confirmed successfully",
  "data": {
    "id": 1,
    "status": "confirmed"
  }
}
```

**Frontend Behavior:**
- [ ] "Confirm" button visible on pending orders
- [ ] After click, status updates to "Confirmed"
- [ ] Success notification shown
- [ ] Button changes to "Mark as Delivered" or similar

**Database Verification:**
```bash
psql -U postgres -d rental_erp -c "SELECT id, status, updated_at FROM orders WHERE id = 1;"
```

**Expected:**
- [ ] Status changed to 'confirmed'
- [ ] updated_at timestamp updated

**Notes:**
_[Write any issues here]_

---

### 8.4 Update Order Status Workflow
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Test the complete state machine:**

**Initial State:** pending
```bash
curl -X POST http://localhost:5000/api/orders -d '{...}' 
# Order created with status: pending
```

**Transition 1:** pending → confirmed
```bash
curl -X PUT http://localhost:5000/api/orders/1/confirm
```
- [ ] Success
- [ ] Reservation status also updates

**Transition 2:** confirmed → delivered (or picked_up)
```bash
curl -X PUT http://localhost:5000/api/orders/1/deliver
```
- [ ] Success
- [ ] Delivery timestamp recorded

**Transition 3:** delivered → completed (or returned)
```bash
curl -X PUT http://localhost:5000/api/orders/1/complete
```
- [ ] Success
- [ ] Stock returned to available pool

**Invalid Transitions to Test:**
- [ ] pending → completed (skip states) → Should FAIL
- [ ] completed → pending (reverse) → Should FAIL
- [ ] cancelled → confirmed → Should FAIL

**Notes:**
_[Write state machine issues here]_

---

### 8.5 Cancel Order (Vendor)
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**API Test:**
```bash
curl -X PUT http://localhost:5000/api/orders/1/cancel \
  -H "Authorization: Bearer YOUR_VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Product unavailable due to maintenance"
  }'
```

**Expected:**
- [ ] Order status changes to 'cancelled'
- [ ] Reservation status changes to 'cancelled'
- [ ] Stock becomes available again
- [ ] Customer notified (if notification system exists)

**Business Rules:**
- [ ] Can cancel pending or confirmed orders
- [ ] Cannot cancel completed orders
- [ ] Cancellation reason stored (if field exists)

**Notes:**
_[Write any issues here]_

---

## 9. ORDER MANAGEMENT (CUSTOMER)

### 9.1 View My Orders (Customer)
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Frontend Steps:**
1. Login as customer
2. Navigate to `/my-orders` or `/orders`

**Expected Display:**
- [ ] List of all customer's orders
- [ ] Order cards/rows showing:
  - Order number
  - Product names
  - Dates
  - Status
  - Total amount
- [ ] Filter by status
- [ ] Sorted by date (newest first)

**Notes:**
_[Write any issues here]_

---

### 9.2 View Order Details (Customer)
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Frontend Steps:**
1. Click on an order to view details

**Expected Display:**
- [ ] Order summary
- [ ] Product details with images
- [ ] Rental dates
- [ ] Delivery address
- [ ] Payment status (if implemented)
- [ ] Status history/timeline
- [ ] Vendor contact information

**Actions Available:**
- [ ] Cancel order (if pending)
- [ ] Contact vendor
- [ ] Download invoice (if implemented)

**Notes:**
_[Write any issues here]_

---

### 9.3 Cancel Order (Customer)
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Frontend Steps:**
1. Go to order details
2. Click "Cancel Order" button
3. Confirm cancellation

**Expected Behavior:**
- [ ] Confirmation dialog appears
- [ ] After confirmation, status changes to 'cancelled'
- [ ] Refund initiated message (if payment implemented)
- [ ] Cannot cancel if already confirmed/delivered

**API Test:**
```bash
curl -X PUT http://localhost:5000/api/orders/1/cancel \
  -H "Authorization: Bearer YOUR_CUSTOMER_TOKEN"
```

**Expected:**
- [ ] Success if order is pending
- [ ] Fail with error if order is confirmed/delivered

**Notes:**
_[Write any issues here]_

---

### 9.4 Order History
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Frontend Steps:**
1. Navigate to order history page
2. View past orders (completed and cancelled)

**Expected Display:**
- [ ] Completed orders shown
- [ ] Can filter: Active, Completed, Cancelled
- [ ] Can search by product name
- [ ] Pagination for many orders

**Notes:**
_[Write any issues here]_

---

## 10. IMAGE UPLOAD SYSTEM

### 10.1 User Profile Picture Upload
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Frontend Steps:**
1. Login and go to profile page
2. Click profile picture or "Upload" button
3. Select image file

**Expected Behavior:**
- [ ] File picker opens
- [ ] Image preview before upload
- [ ] Upload progress indicator
- [ ] Image appears after upload
- [ ] URL saved to database

**API Test:**
```bash
# Upload image
curl -X POST http://localhost:5000/api/upload/user \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User image uploaded successfully",
  "data": {
    "imageUrl": "https://res.cloudinary.com/..."
  }
}
```

**Validation Tests:**
- [ ] File size limit (e.g., 5MB) enforced
- [ ] File type validation (JPG, PNG, GIF only)
- [ ] Non-image files rejected

**Notes:**
_[Write Cloudinary issues here]_

---

### 10.2 Product Image Upload
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Frontend Steps:**
1. Login as vendor
2. Create/edit product
3. Upload product images

**API Test:**
```bash
curl -X POST http://localhost:5000/api/upload/product/1 \
  -H "Authorization: Bearer YOUR_VENDOR_TOKEN" \
  -F "image=@/path/to/product.jpg"
```

**Expected:**
- [ ] Image uploaded to Cloudinary
- [ ] URL saved to product record
- [ ] Image visible on product detail page

**Multiple Images (if implemented):**
- [ ] Can upload multiple images
- [ ] Gallery view on frontend
- [ ] Can delete images
- [ ] Can set primary image

**Notes:**
_[Write any issues here]_

---

### 10.3 Image Upload Error Handling
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Test Cases:**

**Case 1: File too large**
- Upload 10MB file
- Expected: Error "File size exceeds 5MB limit"

**Case 2: Invalid file type**
- Upload .exe or .pdf file
- Expected: Error "Invalid file type"

**Case 3: Network failure**
- Disconnect internet during upload
- Expected: Error "Upload failed, please try again"

**Case 4: Invalid Cloudinary credentials**
- Expected: Error "Image upload service unavailable"

**Verification:**
- [ ] Appropriate error messages shown
- [ ] Upload can be retried
- [ ] No partial data saved

**Notes:**
_[Write any issues here]_

---

## 11. ROLE-BASED ACCESS CONTROL

### 11.1 Customer Role Permissions
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Login as customer and test access:**

**Should ALLOW:**
- [ ] Browse products
- [ ] View product details
- [ ] Create orders
- [ ] View own orders
- [ ] Cancel own orders (if pending)
- [ ] Update own profile

**Should DENY (403 Forbidden):**
- [ ] Create/edit products
- [ ] View other customers' orders
- [ ] View vendor dashboard
- [ ] Confirm/manage orders

**API Test:**
```bash
# Try to create product as customer
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer CUSTOMER_TOKEN" \
  -d '{...}'
```

**Expected:** 403 Forbidden

**Notes:**
_[Write any RBAC issues here]_

---

### 11.2 Vendor Role Permissions
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Login as vendor and test access:**

**Should ALLOW:**
- [ ] Create/edit/delete own products
- [ ] View orders for own products
- [ ] Confirm/manage orders for own products
- [ ] Upload product images
- [ ] View vendor dashboard

**Should DENY:**
- [ ] Edit other vendors' products
- [ ] View other vendors' orders
- [ ] Access admin functions
- [ ] Delete other users

**API Test:**
```bash
# Try to edit another vendor's product
curl -X PUT http://localhost:5000/api/products/999 \
  -H "Authorization: Bearer VENDOR_TOKEN" \
  -d '{...}'
```

**Expected:** 403 Forbidden or 404 Not Found

**Notes:**
_[Write any issues here]_

---

### 11.3 Admin Role Permissions (if implemented)
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Login as admin and test access:**

**Should ALLOW:**
- [ ] View all users
- [ ] View all products
- [ ] View all orders
- [ ] Manage system settings
- [ ] Access admin dashboard

**Notes:**
_[Write any issues here]_

---

### 11.4 Unauthorized Access Tests
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Test without authentication token:**

```bash
# Try to access protected endpoint without token
curl -X GET http://localhost:5000/api/orders
```

**Expected:** 401 Unauthorized

**Test with invalid token:**
```bash
curl -X GET http://localhost:5000/api/orders \
  -H "Authorization: Bearer invalid_token_12345"
```

**Expected:** 401 Unauthorized

**Test with expired token:**
- Use old token (if you have one)
- Expected: 401 Unauthorized with "Token expired" message

**Notes:**
_[Write any auth issues here]_

---


## 12. ERROR HANDLING & EDGE CASES

### 12.1 Network Error Handling
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Test Steps:**
1. Open frontend in browser
2. Open DevTools → Network tab
3. Set throttling to "Offline"
4. Try to perform actions (login, load products, create order)

**Expected Behavior:**
- [ ] Loading indicators appear
- [ ] After timeout, error message displays
- [ ] Error message: "Network error, please check connection"
- [ ] Can retry action
- [ ] App doesn't crash

**Notes:**
_[Write any issues here]_

---

### 12.2 Server Error Handling
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Test Steps:**
1. Stop backend server
2. Try actions on frontend

**Expected Behavior:**
- [ ] Error message: "Cannot connect to server"
- [ ] User-friendly message (not technical stack trace)
- [ ] App remains functional (no crash)

**Notes:**
_[Write any issues here]_

---

### 12.3 Database Error Handling
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Test Steps:**
1. Stop PostgreSQL service
2. Try to perform database operations via API

**Expected:**
- [ ] Backend logs error
- [ ] Returns 500 with generic error message
- [ ] No database credentials leaked in error

**Notes:**
_[Write any issues here]_

---

### 12.4 Form Validation
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Test on all forms (Login, Register, Create Product, Create Order):**

**Empty Fields:**
- [ ] Shows "This field is required" errors
- [ ] Prevents submission

**Invalid Email:**
- [ ] Shows "Invalid email format"
- [ ] Examples: "test", "test@", "@test.com"

**Weak Password:**
- [ ] Shows password requirements
- [ ] Example: "123" → too short

**Negative Numbers:**
- [ ] Price: -10 → Error
- [ ] Stock: -5 → Error
- [ ] Quantity: -1 → Error

**Notes:**
_[Write any validation issues here]_

---

### 12.5 XSS Prevention
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Test Steps:**
1. Try to create product with name: `<script>alert('XSS')</script>`
2. View product on frontend

**Expected:**
- [ ] Script does NOT execute
- [ ] Text displayed as plain text
- [ ] HTML escaped properly

**Test on:**
- [ ] Product names
- [ ] Descriptions
- [ ] User names
- [ ] Addresses
- [ ] Notes/comments

**Notes:**
_[Write any security issues here]_

---

### 12.6 SQL Injection Prevention
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Test Steps:**
Try malicious inputs in API calls:

```bash
curl -X GET "http://localhost:5000/api/products?search=' OR '1'='1"
```

**Expected:**
- [ ] Query fails safely or returns empty results
- [ ] No database error exposed
- [ ] Using parameterized queries (check code)

**Notes:**
_[Write any SQL injection vulnerabilities here]_

---

### 12.7 Concurrent Reservation Handling
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Advanced Test - Requires 2 Browser Windows:**

**Setup:**
- Product with 1 unit available
- Window A: Customer 1 logged in
- Window B: Customer 2 logged in

**Test:**
1. Both customers navigate to same product
2. Both select same dates
3. Both click "Reserve" at same time

**Expected:**
- [ ] Only ONE reservation succeeds
- [ ] Second one gets "Insufficient stock" error
- [ ] No race condition (database constraint prevents)

**Database Verification:**
```bash
psql -U postgres -d rental_erp -c "SELECT COUNT(*) FROM reservations WHERE product_id = 1 AND start_date = '2026-05-01';"
```

**Expected:** Count = 1 (not 2)

**Notes:**
_[Write critical concurrency issues here]_

---

## 13. API TESTING (OPTIONAL - ADVANCED)

### 13.1 API Health and Info Endpoints
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

```bash
# Health check
curl http://localhost:5000/health

# API info
curl http://localhost:5000/api
```

**Expected:** Both return 200 OK with JSON

---

### 13.2 Authentication Endpoints
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test User",
    "email": "apitest@example.com",
    "password": "Test123!@#",
    "role": "customer"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "apitest@example.com",
    "password": "Test123!@#"
  }'
```

**Expected:** Returns token

**Get Profile:**
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Returns user object

---

### 13.3 Product Endpoints
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**List Products:**
```bash
curl http://localhost:5000/api/products
```

**Get Product by ID:**
```bash
curl http://localhost:5000/api/products/1
```

**Create Product (as vendor):**
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test Product",
    "description": "Created via API",
    "category": "Test",
    "base_price": 25,
    "pricing_unit": "per day",
    "stock_quantity": 10
  }'
```

**Update Product:**
```bash
curl -X PUT http://localhost:5000/api/products/1 \
  -H "Authorization: Bearer VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Product Name",
    "base_price": 30
  }'
```

**Delete Product:**
```bash
curl -X DELETE http://localhost:5000/api/products/1 \
  -H "Authorization: Bearer VENDOR_TOKEN"
```

---

### 13.4 Reservation Endpoints
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Check Availability:**
```bash
curl "http://localhost:5000/api/reservations/check-availability?product_id=1&start_date=2026-06-01&end_date=2026-06-05&quantity=2"
```

**Create Reservation:**
```bash
curl -X POST http://localhost:5000/api/reservations \
  -H "Authorization: Bearer CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "quantity": 1,
    "start_date": "2026-06-01",
    "end_date": "2026-06-05"
  }'
```

**Get My Reservations:**
```bash
curl -X GET http://localhost:5000/api/reservations/my-reservations \
  -H "Authorization: Bearer CUSTOMER_TOKEN"
```

**Cancel Reservation:**
```bash
curl -X PUT http://localhost:5000/api/reservations/1/cancel \
  -H "Authorization: Bearer CUSTOMER_TOKEN"
```

---

### 13.5 Order Endpoints
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Create Order:**
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "product_id": 1,
        "quantity": 1,
        "start_date": "2026-07-01",
        "end_date": "2026-07-05"
      }
    ],
    "delivery_address": "789 API Street, Test City, TS 12345"
  }'
```

**Get My Orders:**
```bash
curl -X GET http://localhost:5000/api/orders/my-orders \
  -H "Authorization: Bearer CUSTOMER_TOKEN"
```

**Get Order by ID:**
```bash
curl -X GET http://localhost:5000/api/orders/1 \
  -H "Authorization: Bearer CUSTOMER_TOKEN"
```

**Confirm Order (vendor):**
```bash
curl -X PUT http://localhost:5000/api/orders/1/confirm \
  -H "Authorization: Bearer VENDOR_TOKEN"
```

**Cancel Order:**
```bash
curl -X PUT http://localhost:5000/api/orders/1/cancel \
  -H "Authorization: Bearer CUSTOMER_TOKEN"
```

---

### 13.6 Upload Endpoints
**Test Status:** [ ] ✅ | [ ] ❌ | [ ] ⚠️

**Upload User Image:**
```bash
curl -X POST http://localhost:5000/api/upload/user \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

**Upload Product Image:**
```bash
curl -X POST http://localhost:5000/api/upload/product/1 \
  -H "Authorization: Bearer VENDOR_TOKEN" \
  -F "image=@/path/to/product.jpg"
```

---

## 14. BUG TRACKING TEMPLATE

Use this template to document any bugs found during testing:

---

### BUG #001
**Test Section:** [e.g., 3.1 User Registration]  
**Status:** [ ] ✅ Fixed | [ ] ❌ Not Working | [ ] ⚠️ Workaround  
**Severity:** [ ] Critical | [ ] High | [ ] Medium | [ ] Low

**Description:**
_Detailed description of the bug_

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**
_What should happen_

**Actual Behavior:**
_What actually happens_

**Screenshots/Error Messages:**
```
Paste error messages here
```

**Browser/Environment:**
- OS: 
- Browser: 
- Node Version: 
- Database Version: 

**Workaround (if any):**
_Temporary fix or workaround_

**Notes:**
_Additional information_

---

### BUG #002
_Copy template above for each bug_

---

## 15. TESTING SUMMARY

### Overall System Status

**Database & Backend:**
- [ ] Database setup: ____%
- [ ] Migrations: ____%
- [ ] API endpoints: ____%
- [ ] Authentication: ____%

**Frontend:**
- [ ] UI components: ____%
- [ ] Navigation: ____%
- [ ] Forms: ____%
- [ ] API integration: ____%

**Core Features:**
- [ ] User registration/login: ____%
- [ ] Product management: ____%
- [ ] Product browsing: ____%
- [ ] Reservation system: ____%
- [ ] Order creation: ____%
- [ ] Order management: ____%
- [ ] Image uploads: ____%
- [ ] RBAC: ____%

**Total Features Working:** ___/100

**Critical Issues Found:** ___

**Minor Issues Found:** ___

**System Ready for Demo:** [ ] Yes | [ ] No | [ ] With Caveats

---

## 16. TESTING TIPS

### Best Practices:
1. **Test in order** - Follow sections sequentially as features depend on each other
2. **Document everything** - Write notes even if tests pass
3. **Use real data** - Don't just use "test" for everything
4. **Test edge cases** - Empty inputs, large numbers, special characters
5. **Clear browser cache** - Between major test sections
6. **Check browser console** - Always have DevTools open
7. **Monitor backend logs** - Watch terminal for errors
8. **Database state** - Verify data in database, not just UI

### Quick Database Checks:
```bash
# Connect to database
psql -U postgres -d rental_erp

# Check record counts
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'reservations', COUNT(*) FROM reservations;

# View recent orders
SELECT o.id, o.status, o.total_amount, u.name as customer 
FROM orders o 
JOIN users u ON o.user_id = u.id 
ORDER BY o.created_at DESC 
LIMIT 10;

# Check reservation overlaps
SELECT product_id, COUNT(*) as reservation_count, 
       SUM(quantity) as total_quantity
FROM reservations 
WHERE status != 'cancelled'
GROUP BY product_id;
```

---

## 17. QUICK REFERENCE

### Default Test Accounts (if seeded):
```
Customer:
Email: customer@test.com
Password: password123

Vendor:
Email: vendor@test.com
Password: password123

Admin:
Email: admin@test.com
Password: password123
```

### Server URLs:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/health

### Important API Endpoints:
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/profile

GET    /api/products
POST   /api/products
GET    /api/products/:id
PUT    /api/products/:id
DELETE /api/products/:id

POST   /api/reservations
GET    /api/reservations/my-reservations
GET    /api/reservations/check-availability
PUT    /api/reservations/:id/cancel

POST   /api/orders
GET    /api/orders/my-orders
GET    /api/orders/:id
PUT    /api/orders/:id/confirm
PUT    /api/orders/:id/cancel

POST   /api/upload/user
POST   /api/upload/product/:id
```

---

## 18. COMPLETION CHECKLIST

Before marking testing complete, ensure:

**Setup:**
- [ ] All dependencies installed
- [ ] Database created and migrated
- [ ] Environment variables configured
- [ ] Both servers running without errors

**Core Features:**
- [ ] User registration works
- [ ] User login/logout works
- [ ] Products can be created (vendor)
- [ ] Products can be browsed (customer)
- [ ] Reservations can be created
- [ ] Orders can be created
- [ ] Anti-overbooking works correctly

**Security:**
- [ ] Authentication required for protected routes
- [ ] RBAC enforced (customer cannot create products)
- [ ] XSS prevention works
- [ ] SQL injection prevention works

**Error Handling:**
- [ ] Validation errors shown
- [ ] Network errors handled
- [ ] User-friendly error messages

**Documentation:**
- [ ] All bugs documented
- [ ] Screenshots taken (if needed)
- [ ] Test results summarized

---

**END OF TESTING GUIDE**

---

**Notes:** Remember to keep this document updated as you test. Your detailed notes will help developers fix issues quickly!

**Good luck with testing! 🚀**

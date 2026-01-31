# 🧪 COMPLETE MANUAL TESTING GUIDE
## Rental Management ERP System

**Version:** 1.0  
**Last Updated:** 2026-02-01  
**Estimated Testing Time:** 3-4 hours (complete walkthrough)

---

## 📋 Table of Contents
1. [Pre-Testing Setup](#pre-testing-setup)
2. [User Registration & Authentication](#user-registration--authentication)
3. [Vendor Workflows](#vendor-workflows)
4. [Customer Workflows](#customer-workflows)
5. [Admin Workflows](#admin-workflows)
6. [Payment & Invoice Testing](#payment--invoice-testing)
7. [Notification Testing](#notification-testing)
8. [Search & Filter Testing](#search--filter-testing)
9. [Edge Cases & Error Handling](#edge-cases--error-handling)
10. [Performance & Load Testing](#performance--load-testing)

---

## 🚀 Pre-Testing Setup

### 1. Environment Setup
```bash
# Terminal 1 - Backend
cd GENERAL_PROJECT_TEMPLATE/06_SRC/backend
npm install
npm run db:setup    # Initialize database
npm run db:seed     # Seed with test data
npm start           # Start backend on port 5000

# Terminal 2 - Frontend
cd GENERAL_PROJECT_TEMPLATE/06_SRC/frontend
npm install
npm run dev         # Start frontend on port 5173
```

### 2. Verify Services Running
- ✅ Backend: http://localhost:5000/health
- ✅ Frontend: http://localhost:5173
- ✅ Database: PostgreSQL running on port 5432

### 3. Test Accounts (After Seeding)
| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Admin | admin@test.com | admin123 | System administration |
| Vendor | vendor@test.com | vendor123 | Product management |
| Customer | customer@test.com | customer123 | Rental orders |

### 4. Testing Tools
- **Browser:** Chrome/Firefox (with DevTools)
- **Extensions:** JSON Formatter, React DevTools
- **API Testing:** Postman/Thunder Client (optional)

---

## 🔐 User Registration & Authentication

### Test Case 1: User Registration (Customer)
**Priority:** HIGH | **Expected Time:** 3 minutes

1. Navigate to http://localhost:5173/register
2. Fill registration form:
   - Name: `Test Customer`
   - Email: `testcustomer@example.com`
   - Phone: `9876543210`
   - Password: `password123`
   - Confirm Password: `password123`
   - Role: `Customer`
3. Click "Register"

**Expected Results:**
- ✅ Success message displayed
- ✅ Redirect to login page
- ✅ Email notification sent (check console logs)

**Validation Points:**
- Email format validation works
- Password strength check (min 6 chars)
- Confirm password matching
- Duplicate email detection

### Test Case 2: User Registration (Vendor)
**Priority:** HIGH | **Expected Time:** 3 minutes

1. Navigate to registration page
2. Fill form with vendor details:
   - Name: `Test Vendor`
   - Email: `testvendor@example.com`
   - Company: `Test Rental Co.`
   - GSTIN: `TEST1234567890`
   - Password: `password123`
   - Role: `Vendor`
3. Submit form

**Expected Results:**
- ✅ Vendor account created
- ✅ Additional fields (company, GSTIN) captured
- ✅ Welcome email sent

### Test Case 3: Login Flow
**Priority:** HIGH | **Expected Time:** 2 minutes

1. Navigate to http://localhost:5173/login
2. Enter credentials:
   - Email: `customer@test.com`
   - Password: `customer123`
3. Click "Login"

**Expected Results:**
- ✅ JWT token stored in localStorage
- ✅ User redirected to appropriate dashboard
- ✅ Navbar shows user name and role
- ✅ Notification bell appears (if notifications exist)

**Test Invalid Credentials:**
- Wrong password → Error message
- Non-existent email → Error message
- Empty fields → Validation errors

### Test Case 4: Role-Based Access Control
**Priority:** HIGH | **Expected Time:** 5 minutes

1. Login as Customer
   - Try accessing `/admin/dashboard` → Should redirect/show 403
   - Try accessing `/vendor/pickups` → Should redirect/show 403
   - Can access `/cart`, `/orders`, `/products` ✅

2. Login as Vendor
   - Try accessing `/admin/dashboard` → Should redirect
   - Can access `/dashboard/my-products` ✅
   - Can access `/vendor/pickups`, `/vendor/returns` ✅

3. Login as Admin
   - Can access all routes ✅
   - `/admin/dashboard`, `/admin/users`, `/admin/analytics` ✅

### Test Case 5: Logout
**Priority:** MEDIUM | **Expected Time:** 1 minute

1. Click user menu → Logout
2. Verify:
   - ✅ Redirected to home page
   - ✅ JWT token cleared
   - ✅ Cannot access protected routes
   - ✅ Navbar shows "Login" button

---

## 🏪 Vendor Workflows

### Test Case 6: Create Product (Simple - No Variants)
**Priority:** HIGH | **Expected Time:** 5 minutes

1. Login as Vendor
2. Navigate to "My Products" → "Create Product"
3. Fill product form:
   - Name: `Lawn Mower - Electric`
   - Description: `Professional electric lawn mower for rent`
   - Category: `Garden Equipment`
   - Upload Image (optional)
4. **Pricing** (No variants - direct pricing):
   - Hourly Rate: `₹50`
   - Daily Rate: `₹200`
   - Weekly Rate: `₹1000`
   - Stock: `5`
5. Submit

**Expected Results:**
- ✅ Product created successfully
- ✅ Appears in "My Products" list
- ✅ Shows active status
- ✅ Pricing visible
- ✅ Image uploaded (if provided)

**Validation Points:**
- All required fields enforced
- Price validation (positive numbers)
- Stock validation (integer)
- Image size/format check

### Test Case 7: Create Product (With Variants)
**Priority:** HIGH | **Expected Time:** 7 minutes

1. Create new product
2. Fill basic details:
   - Name: `Scaffolding System`
   - Category: `Construction`
3. **Add Variants:**
   - **Variant 1:**
     - Name: `Small (10ft)`
     - SKU: `SCAF-SMALL-10`
     - Hourly: `₹100`
     - Daily: `₹500`
     - Weekly: `₹2500`
     - Stock: `3`
   - **Variant 2:**
     - Name: `Large (20ft)`
     - SKU: `SCAF-LARGE-20`
     - Hourly: `₹200`
     - Daily: `₹900`
     - Weekly: `₹4500`
     - Stock: `2`
4. Submit

**Expected Results:**
- ✅ Product with 2 variants created
- ✅ Each variant has independent pricing
- ✅ Each variant has separate stock
- ✅ SKU uniqueness enforced
- ✅ Min/max price calculated automatically

### Test Case 8: Edit Product
**Priority:** MEDIUM | **Expected Time:** 3 minutes

1. Go to "My Products"
2. Click "Edit" on any product
3. Modify details:
   - Change description
   - Update pricing
   - Add/remove variants
   - Change image
4. Save changes

**Expected Results:**
- ✅ Changes reflected immediately
- ✅ Updated timestamp shown
- ✅ Old data preserved in edit form
- ✅ Validation still works

### Test Case 9: Deactivate/Delete Product
**Priority:** MEDIUM | **Expected Time:** 2 minutes

1. Click "Delete" on a product
2. Confirm deletion

**Expected Results:**
- ✅ Product marked as inactive (soft delete)
- ✅ Not shown in customer search
- ✅ Still visible in vendor's "My Products" with inactive badge
- ✅ Cannot be ordered

### Test Case 10: View Product Orders
**Priority:** HIGH | **Expected Time:** 3 minutes

1. Navigate to "Orders" tab
2. View list of orders for your products
3. Check order details:
   - Customer information
   - Rental period
   - Pricing breakdown
   - Order status

**Expected Results:**
- ✅ Only orders for vendor's products shown
- ✅ Status badges visible
- ✅ Filters work (status, date range)
- ✅ Pagination works for many orders

---

## 🛒 Customer Workflows

### Test Case 11: Browse Products
**Priority:** HIGH | **Expected Time:** 5 minutes

1. Login as Customer
2. Navigate to "Products"
3. Browse product catalog:
   - View all products
   - Click on product cards
   - Check product details page

**Verify:**
- ✅ Product images load
- ✅ Pricing displayed correctly
- ✅ Stock availability shown
- ✅ Vendor name visible
- ✅ Category badges present
- ✅ Out of stock products marked

### Test Case 12: Search & Filter Products
**Priority:** HIGH | **Expected Time:** 5 minutes

1. Use search bar:
   - Search by name: `lawn`
   - Search by category: `Garden Equipment`
2. Apply filters:
   - Category filter
   - Price range
   - Availability
3. Sort results:
   - Price (low to high)
   - Price (high to low)
   - Newest first

**Expected Results:**
- ✅ Search returns relevant results
- ✅ Filters apply correctly
- ✅ Multiple filters work together
- ✅ Sorting works as expected
- ✅ "No results" message when appropriate

### Test Case 13: Request Quotation
**Priority:** HIGH | **Expected Time:** 5 minutes

1. Go to product detail page
2. Click "Request Quotation"
3. Fill quotation form:
   - Select variant (if applicable)
   - Start Date: Tomorrow's date
   - End Date: 7 days from start
   - Quantity: `2`
   - Special Requirements: `Need delivery to construction site`
4. Submit request

**Expected Results:**
- ✅ Quotation created with `PENDING` status
- ✅ Pricing calculated automatically
- ✅ Duration calculated (hourly/daily/weekly)
- ✅ GST calculated based on states
- ✅ Email sent to vendor
- ✅ Visible in "My Quotations"

**Pricing Validation:**
- Hourly: < 24 hours
- Daily: 1-6 days
- Weekly: 7+ days
- GST: 18% (inter-state), 9% CGST + 9% SGST (intra-state)

### Test Case 14: View Quotation Details
**Priority:** MEDIUM | **Expected Time:** 3 minutes

1. Navigate to "Quotations"
2. Click on a quotation
3. View details:
   - Product information
   - Pricing breakdown
   - Rental period
   - Status
   - Vendor response (if any)

**Check:**
- ✅ All details visible
- ✅ Status updates in real-time
- ✅ Actions available based on status

### Test Case 15: Create Order from Quotation
**Priority:** HIGH | **Expected Time:** 5 minutes

1. Open an `APPROVED` quotation
2. Click "Create Order"
3. Review order summary
4. Proceed to checkout

**Expected Results:**
- ✅ Order created with `PENDING_PAYMENT` status
- ✅ Invoice generated automatically
- ✅ Redirect to payment page
- ✅ Reservation created (stock reserved)

### Test Case 16: Add to Cart & Checkout
**Priority:** HIGH | **Expected Time:** 7 minutes

1. Browse products
2. Add items to cart:
   - Product 1: Select variant, dates, quantity
   - Product 2: Different dates
3. View cart
4. Modify cart:
   - Change quantity
   - Update dates
   - Remove item
5. Proceed to checkout

**Checkout Steps:**
- **Step 1: Billing Information**
  - Name, email, phone auto-filled
  - Address fields
  - Save
  
- **Step 2: Review Order**
  - Verify items
  - Check pricing
  - Rental periods
  - Total amount
  
- **Step 3: Payment**
  - Choose payment method
  - Process payment (Razorpay test mode)

**Expected Results:**
- ✅ Cart persists across sessions
- ✅ Availability checked before checkout
- ✅ Pricing recalculated on changes
- ✅ GST calculated correctly
- ✅ Order created on successful payment
- ✅ Invoice generated
- ✅ Email confirmations sent

### Test Case 17: View Orders
**Priority:** HIGH | **Expected Time:** 3 minutes

1. Navigate to "My Orders"
2. View order list
3. Click on an order
4. Check order details:
   - Items
   - Rental period
   - Payment status
   - Order status
   - Invoice link

**Verify:**
- ✅ All orders visible
- ✅ Status badges correct
- ✅ Timeline/status tracking
- ✅ Download invoice option

---

## 👨‍💼 Admin Workflows

### Test Case 18: Admin Dashboard
**Priority:** HIGH | **Expected Time:** 5 minutes

1. Login as Admin
2. View dashboard at `/admin/dashboard`
3. Check statistics:
   - Total revenue
   - Active orders
   - Total users
   - Product count
4. View charts:
   - Revenue trend
   - Order status distribution
   - User registrations

**Expected Results:**
- ✅ All stats load correctly
- ✅ Charts render
- ✅ Real-time data
- ✅ Responsive layout

### Test Case 19: User Management
**Priority:** HIGH | **Expected Time:** 10 minutes

**View Users:**
1. Navigate to "User Management"
2. View user list with:
   - Name, email, role
   - Status (active/inactive)
   - Registration date
3. Use search: Search by name/email
4. Apply filters: Role, Status

**Create User:**
1. Click "Create User"
2. Fill form:
   - Name: `Admin Test User`
   - Email: `admintest@example.com`
   - Password: `password123`
   - Role: `CUSTOMER`
3. Submit

**Edit User:**
1. Click "Edit" on a user
2. Change details:
   - Name
   - Phone
   - Role
3. Save changes

**Toggle Status:**
1. Click toggle button on active user
2. Confirm deactivation
3. Verify user cannot login
4. Reactivate user

**Reset Password:**
1. Edit user
2. Go to password reset section
3. Enter new password
4. Confirm
5. Verify user can login with new password

**Delete User:**
1. Click delete on a user
2. Confirm deletion
3. Verify soft delete (user marked inactive)

**Expected Results:**
- ✅ All CRUD operations work
- ✅ Search and filters functional
- ✅ Pagination works
- ✅ Statistics update in real-time
- ✅ Role changes take effect immediately
- ✅ Cannot delete own admin account

### Test Case 20: Analytics Dashboard
**Priority:** MEDIUM | **Expected Time:** 5 minutes

1. Navigate to "Analytics"
2. View comprehensive reports:
   - Revenue analytics
   - Order trends
   - User growth
   - Product performance
   - Payment statistics

**Test Filters:**
- Date range selection
- Category filters
- Status filters

**Expected Results:**
- ✅ Charts load and render
- ✅ Data accurate
- ✅ Filters update charts
- ✅ Export options work

### Test Case 21: Generate Reports
**Priority:** MEDIUM | **Expected Time:** 5 minutes

1. Navigate to "Reports"
2. Select report type:
   - Revenue Report
   - Orders Report
   - Rental Report
   - User Report
   - Inventory Report
   - Payment Report
3. Set date range
4. Generate report
5. Download in different formats:
   - PDF
   - Excel (XLSX)
   - CSV

**Expected Results:**
- ✅ Reports generate correctly
- ✅ Data matches dashboard
- ✅ All formats download
- ✅ Files open correctly
- ✅ Formatting preserved

---

## 💳 Payment & Invoice Testing

### Test Case 22: Payment Flow (Razorpay Test Mode)
**Priority:** HIGH | **Expected Time:** 5 minutes

1. Create an order (from cart or quotation)
2. Proceed to payment
3. Razorpay modal opens
4. Use test card:
   - Card Number: `4111 1111 1111 1111`
   - Expiry: Any future date
   - CVV: `123`
   - Name: Any name
5. Complete payment

**Expected Results:**
- ✅ Payment processed successfully
- ✅ Order status changes to `CONFIRMED`
- ✅ Payment record created
- ✅ Invoice generated
- ✅ Email confirmation sent
- ✅ Redirect to order confirmation page

**Test Failed Payment:**
1. Use failing test card (check Razorpay docs)
2. Verify:
   - ✅ Order status remains `PENDING_PAYMENT`
   - ✅ Error message shown
   - ✅ Can retry payment
   - ✅ Reservation still held (with timeout)

### Test Case 23: Invoice Generation & Download
**Priority:** HIGH | **Expected Time:** 3 minutes

1. View any confirmed order
2. Click "Download Invoice" or "View Invoice"
3. Invoice opens in new tab

**Verify Invoice Contains:**
- ✅ Invoice number (INV-YYYYMM-XXXX)
- ✅ Issue date
- ✅ Customer details
- ✅ Vendor details (if applicable)
- ✅ Item details
- ✅ Rental period
- ✅ Pricing breakdown
- ✅ GST breakdown (CGST/SGST or IGST)
- ✅ Total amount
- ✅ Payment status

**Test Actions:**
- Download PDF
- Print invoice
- Email invoice (if feature exists)

### Test Case 24: Refund Processing
**Priority:** HIGH | **Expected Time:** 5 minutes

1. Find a completed order
2. Navigate to order details (as admin or vendor)
3. Initiate refund:
   - Full refund
   - Partial refund
4. Enter refund reason
5. Process refund

**Expected Results:**
- ✅ Refund initiated
- ✅ Status changes to `REFUND_PENDING`
- ✅ Admin notification
- ✅ Customer notification
- ✅ Refund amount visible
- ✅ Payment gateway updated (test mode)

---

## 🔔 Notification Testing

### Test Case 25: In-App Notifications
**Priority:** MEDIUM | **Expected Time:** 5 minutes

1. Login as Customer
2. Create an order
3. Click notification bell icon
4. View notifications:
   - Order confirmation
   - Payment confirmation
   - Quotation responses

**Test Actions:**
- Mark as read
- Mark all as read
- Delete notification
- Click notification to go to related page

**Expected Results:**
- ✅ Unread count badge shows
- ✅ Notifications list displays
- ✅ Real-time updates (if WebSocket enabled)
- ✅ Mark as read works
- ✅ Notifications grouped by type
- ✅ Timestamps shown

### Test Case 26: Email Notifications
**Priority:** MEDIUM | **Expected Time:** 3 minutes

**Check Backend Console for:**
1. Welcome email (on registration)
2. Order confirmation email
3. Payment confirmation email
4. Quotation status emails
5. Pickup reminders
6. Return reminders

**Verify Email Contents:**
- ✅ Proper subject line
- ✅ Recipient correct
- ✅ HTML formatting
- ✅ All data populated
- ✅ Links work (if any)

---

## 🔍 Search & Filter Testing

### Test Case 27: Advanced Search
**Priority:** HIGH | **Expected Time:** 7 minutes

1. Navigate to Search page (`/search`)
2. Test search features:

**Basic Search:**
- Product name
- Category
- Description keywords

**Advanced Filters:**
- Price range (min-max)
- Category selection
- Availability only
- Vendor filter
- Rating filter (if implemented)

**Sort Options:**
- Price: Low to High
- Price: High to Low
- Newest First
- Most Popular

**Test Combinations:**
- Multiple filters together
- Search + filters
- Clear all filters
- Save search (if implemented)

**Expected Results:**
- ✅ Fast search results (< 500ms)
- ✅ Accurate filtering
- ✅ Pagination works
- ✅ "No results" handled gracefully
- ✅ Filter counts update
- ✅ URL parameters for bookmarking

### Test Case 28: Product Availability Search
**Priority:** HIGH | **Expected Time:** 5 minutes

1. Use availability checker
2. Select:
   - Category
   - Start date
   - End date
   - Location (if applicable)
3. View available products

**Expected Results:**
- ✅ Only available products shown
- ✅ Stock considers existing reservations
- ✅ Pricing for selected period shown
- ✅ Can book directly from results

---

## 🚨 Edge Cases & Error Handling

### Test Case 29: Concurrent Booking (Race Condition)
**Priority:** HIGH | **Expected Time:** 5 minutes

**Setup:** Product with stock = 1

1. Open product in two browser tabs
2. In both tabs simultaneously:
   - Add to cart with overlapping dates
   - Proceed to checkout
3. Complete payment in both

**Expected Results:**
- ✅ First payment succeeds
- ✅ Second payment fails with "Out of stock" error
- ✅ Stock accuracy maintained
- ✅ No overselling occurs

### Test Case 30: Invalid Date Ranges
**Priority:** MEDIUM | **Expected Time:** 3 minutes

Test various invalid scenarios:
1. Start date in the past
2. End date before start date
3. Start date = End date
4. Dates beyond availability

**Expected Results:**
- ✅ Validation errors shown
- ✅ Cannot proceed with invalid dates
- ✅ Helpful error messages

### Test Case 31: Network Error Handling
**Priority:** MEDIUM | **Expected Time:** 5 minutes

1. Disconnect network (or use DevTools to simulate offline)
2. Try various actions:
   - Search products
   - Add to cart
   - Submit form
3. Reconnect network

**Expected Results:**
- ✅ Graceful error messages
- ✅ No data loss (cart persists)
- ✅ Retry mechanisms work
- ✅ Loading states clear

### Test Case 32: XSS & SQL Injection Prevention
**Priority:** HIGH | **Expected Time:** 5 minutes

**Test Inputs:**
- `<script>alert('XSS')</script>`
- `'; DROP TABLE users; --`
- `<img src=x onerror=alert('XSS')>`

**Test in:**
- Search box
- Product name
- Description fields
- User name
- Comments/notes

**Expected Results:**
- ✅ Scripts don't execute
- ✅ Data sanitized
- ✅ Database queries safe (parameterized)
- ✅ HTML encoded in output

### Test Case 33: File Upload Security
**Priority:** HIGH | **Expected Time:** 3 minutes

1. Try uploading:
   - Very large file (> 5MB)
   - Invalid format (.exe, .php)
   - Malicious file name
   - No file selected

**Expected Results:**
- ✅ Size limits enforced
- ✅ File type validation
- ✅ Sanitized file names
- ✅ Proper error messages

### Test Case 34: Session & Token Expiry
**Priority:** MEDIUM | **Expected Time:** 5 minutes

1. Login and get JWT token
2. Wait or manually expire token
3. Try accessing protected routes
4. Try API calls

**Expected Results:**
- ✅ Redirect to login
- ✅ Session cleared
- ✅ Token refresh works (if implemented)
- ✅ Error message shown

---

## ⚡ Performance & Load Testing

### Test Case 35: Page Load Performance
**Priority:** MEDIUM | **Expected Time:** 10 minutes

Use Chrome DevTools Performance tab:

1. Measure initial page load
2. Check Lighthouse scores:
   - Performance
   - Accessibility
   - Best Practices
   - SEO

**Targets:**
- ✅ First Contentful Paint < 1.5s
- ✅ Time to Interactive < 3s
- ✅ Lighthouse Performance > 80

**Optimization Checks:**
- Images optimized/lazy loaded
- Code splitting
- Caching headers
- Minification

### Test Case 36: API Response Times
**Priority:** MEDIUM | **Expected Time:** 5 minutes

Use Network tab to measure:

**Endpoints:**
- GET /api/products (list)
- GET /api/products/:id (detail)
- POST /api/orders (create)
- GET /api/admin/users (list)

**Targets:**
- ✅ Simple GET < 200ms
- ✅ Complex queries < 500ms
- ✅ POST operations < 1s

### Test Case 37: Large Dataset Handling
**Priority:** LOW | **Expected Time:** 5 minutes

1. Seed database with large dataset:
   - 1000+ products
   - 5000+ orders
   - 10000+ notifications
2. Test pagination
3. Test search/filter performance
4. Check memory usage

**Expected Results:**
- ✅ Pagination loads quickly
- ✅ No memory leaks
- ✅ Smooth scrolling
- ✅ Filters remain responsive

---

## 📝 Test Results Documentation

### Test Report Template

Create `TEST_REPORT_[DATE].md`:

```markdown
# Manual Test Report - [Date]

## Summary
- Total Test Cases: 37
- Passed: XX
- Failed: XX
- Blocked: XX
- Pass Rate: XX%

## Critical Issues Found
1. Issue description
   - Severity: High/Medium/Low
   - Steps to reproduce
   - Expected vs Actual
   - Screenshots/logs

## Test Case Results

### Authentication (5 tests)
- ✅ TC1: User Registration (Customer)
- ✅ TC2: User Registration (Vendor)
- ✅ TC3: Login Flow
- ❌ TC4: Role-Based Access (Failed - Admin can access vendor routes)
- ✅ TC5: Logout

[Continue for all test cases...]

## Browser Compatibility
- ✅ Chrome 120
- ✅ Firefox 121
- ⏳ Safari (Not tested)
- ⏳ Edge (Not tested)

## Performance Metrics
- Average page load: 1.2s
- Average API response: 250ms
- Lighthouse score: 85/100

## Recommendations
1. Fix RBAC issue in TC4
2. Improve error handling in payment flow
3. Add loading states for slow operations

## Tester Info
- Name: [Your Name]
- Date: [Date]
- Environment: Development
```

---

## 🎯 Quick Smoke Test (30 minutes)

For rapid verification, run these critical tests:

1. **Authentication (5 min)**
   - Register → Login → Logout

2. **Vendor Flow (7 min)**
   - Create product → View product

3. **Customer Flow (10 min)**
   - Browse → Request quotation → Create order

4. **Payment (5 min)**
   - Complete payment → Download invoice

5. **Admin (3 min)**
   - View dashboard → User management

**Pass Criteria:** All critical paths work without errors

---

## 🐛 Known Issues & Workarounds

Document any known issues here:

| Issue | Severity | Workaround | Status |
|-------|----------|------------|--------|
| Example: Payment modal doesn't close | Low | Refresh page | Open |

---

## 📞 Support & Questions

For testing-related questions:
- Check console logs first
- Review API responses in Network tab
- Check database state directly if needed
- Document unexpected behavior with screenshots

---

**Happy Testing! 🚀**

*This guide is a living document. Update as new features are added.*

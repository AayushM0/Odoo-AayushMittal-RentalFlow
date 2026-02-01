# 🔐 Admin Workflow Complete Testing Guide

## Overview
This guide helps you test the complete admin workflow from login to all administrative functions.

---

## 📋 Admin Credentials

**Existing Admin Users:**
- Email: `admin@test.com` (ID: 53)
- Email: `admin@example.com` (ID: 66)
- Password: [Your admin password]

---

## 🧪 Testing Checklist

### 1. Admin Login ✅

**Steps:**
1. Navigate to `/login`
2. Enter admin email
3. Enter password
4. Click "Login"

**Expected:**
- ✅ Successful login
- ✅ Redirect to `/admin/dashboard`
- ✅ See admin navigation menu

**What to Check:**
- Open browser console (F12)
- Look for: "Fetching admin dashboard data..."
- Should NOT see authentication errors

---

### 2. Admin Dashboard 📊

**URL:** `/admin/dashboard`

**Features to Test:**

#### Statistics Cards:
- [ ] **Total Users** - Shows count + monthly growth
- [ ] **Total Orders** - Shows count + monthly orders
- [ ] **Total Revenue** - Shows amount + monthly revenue
- [ ] **Active Rentals** - Shows currently picked up orders

#### User Statistics:
- [ ] Customers count
- [ ] Vendors count
- [ ] Admins count
- [ ] Active users today

#### Recent Activity:
- [ ] Shows last 20 orders
- [ ] Displays order numbers
- [ ] Shows timestamps

#### System Health:
- [ ] API uptime percentage
- [ ] Storage used percentage
- [ ] Pending issues count

**Console Logs to Check:**
```
Fetching admin dashboard data...
Admin dashboard response: { success: true, data: {...} }
```

**Common Issues:**
- If "Failed to load dashboard" → Check backend is running
- If 403 error → User is not ADMIN role
- If empty data → Database might be empty

---

### 3. User Management 👥

**URL:** `/admin/users`

**Features to Test:**

#### User List:
- [ ] Shows all users in table format
- [ ] Displays: Name, Email, Phone, Role, Status, Actions
- [ ] Pagination works (20 users per page)

#### Search:
- [ ] Search by name
- [ ] Search by email
- [ ] Search by phone
- [ ] Results update immediately

#### Filters:
- [ ] Filter by role: ALL, ADMIN, VENDOR, CUSTOMER
- [ ] Filter by status: all, active, inactive
- [ ] Sort by: newest, oldest, name_asc, name_desc

#### User Actions:
- [ ] **Create User** button → Goes to `/admin/users/create`
- [ ] **Edit** button → Goes to `/admin/users/:id/edit`
- [ ] **Toggle Status** → Activates/deactivates user
- [ ] **Delete** button → Deletes user (with confirmation)

#### Stats Display:
- [ ] Total users
- [ ] Active users
- [ ] Total customers
- [ ] Total vendors

**Console Logs to Check:**
```
Fetching users with filters: {q: '', role: '', ...}
Users response: { success: true, data: { users: [...], pagination: {...} } }
Fetching user stats...
Stats response: { success: true, data: {...} }
```

---

### 4. Create User 👤➕

**URL:** `/admin/users/create`

**Form Fields:**
- [ ] Name (required)
- [ ] Email (required, unique)
- [ ] Phone (optional)
- [ ] Password (required, min 6 characters)
- [ ] Role dropdown (CUSTOMER, VENDOR, ADMIN)
- [ ] Active status checkbox

**Test Cases:**
1. **Valid user creation:**
   - Fill all required fields
   - Click "Create User"
   - Should redirect to `/admin/users`
   - New user appears in list

2. **Validation errors:**
   - Try empty name → Shows error
   - Try invalid email → Shows error
   - Try short password → Shows error
   - Try duplicate email → Shows error

---

### 5. Edit User ✏️

**URL:** `/admin/users/:id/edit`

**Features:**
- [ ] Pre-filled form with user data
- [ ] Can update name
- [ ] Can update email
- [ ] Can update phone
- [ ] Can change role
- [ ] Can toggle active status
- [ ] Save button updates user

**Test Cases:**
1. Update user information
2. Change user role
3. Deactivate user
4. Save changes
5. Verify changes in user list

---

### 6. Analytics Dashboard 📈

**URL:** `/admin/analytics`

**Time Range Selection:**
- [ ] 1 month
- [ ] 3 months
- [ ] 6 months (default)
- [ ] 12 months

**Charts to Verify:**
- [ ] **Revenue Trend** - Line chart showing monthly revenue
- [ ] **Order Volume** - Bar chart showing monthly orders
- [ ] **User Growth** - Line chart showing customers & vendors
- [ ] **Rental Status** - Pie chart showing order statuses
- [ ] **Top Products** - List showing top 10 by revenue

**Expected Data Structure:**
```javascript
{
  success: true,
  data: {
    revenue_trend: [{month: '2026-01', revenue: 5000}, ...],
    order_volume: [{month: '2026-01', orders: 25}, ...],
    user_growth: [{month: '2026-01', customers: 10, vendors: 3}, ...],
    rental_status: [{name: 'CONFIRMED', value: 15}, ...],
    top_products: [{name: 'Product A', revenue: 2500}, ...]
  }
}
```

---

### 7. Reports Generation 📋

**URL:** `/admin/reports`

**Report Types:**

#### 1. Revenue Report
- [ ] Select "Revenue" type
- [ ] Choose start date
- [ ] Choose end date
- [ ] Click "Generate"
- [ ] Shows: total orders, revenue, avg order value
- [ ] Daily breakdown table

#### 2. Orders Report
- [ ] Lists all orders in date range
- [ ] Shows: order number, customer, status, amount, date

#### 3. Rentals Report
- [ ] Lists all rentals in date range
- [ ] Shows: order number, product, customer, dates, status

#### 4. Users Report
- [ ] Lists new users in date range
- [ ] Shows: name, email, role, joined date
- [ ] Summary: customers, vendors count

#### 5. Inventory Report
- [ ] Lists all products
- [ ] Shows: name, SKU, total stock, available, rented
- [ ] No date filter needed

#### 6. Payments Report
- [ ] Lists all payments in date range
- [ ] Shows: transaction ID, order, customer, amount, status

**Test Each Report:**
- [ ] Select type
- [ ] Enter valid date range
- [ ] Generate report
- [ ] Verify data displays
- [ ] Check summary statistics

---

### 8. Audit Logs 📝

**URL:** `/admin/audit`

**Features to Verify:**
- [ ] Shows list of system activities
- [ ] Displays: timestamp, user, action, details
- [ ] Filterable by action type
- [ ] Filterable by user
- [ ] Filterable by date range
- [ ] Paginated results

**Test Cases:**
1. View recent audit logs
2. Filter by action type
3. Search by user
4. Check pagination

---

### 9. System Settings ⚙️

**URL:** `/admin/settings`

**Settings Categories:**
- [ ] General settings
- [ ] Email configuration
- [ ] Payment gateway settings
- [ ] Notification settings
- [ ] Platform settings

**Test Cases:**
1. View current settings
2. Update a setting
3. Save changes
4. Verify changes take effect

---

## 🐛 Troubleshooting

### Dashboard Not Loading
**Symptoms:**
- Spinner shows indefinitely
- Error message displays

**Check:**
1. Open console (F12)
2. Look for: `Admin dashboard error:`
3. Check network tab for failed requests

**Common Fixes:**
- Backend not running → Start backend server
- 403 Forbidden → Not logged in as ADMIN
- 500 error → Database query issue

### Users List Empty
**Symptoms:**
- "No users found" message
- Empty table

**Check:**
1. Console logs: `Users response: {...}`
2. Check if `response.data.data.users` is empty

**Common Fixes:**
- Database actually empty → Create some users
- Wrong response structure → Check backend logs
- Filter too restrictive → Reset filters

### Reports Not Generating
**Symptoms:**
- Error message after clicking Generate
- No data shown

**Check:**
1. Date range validity
2. Report type selected
3. Console errors

**Common Fixes:**
- Invalid date range → Check dates
- Missing data → No records in date range
- Backend error → Check backend logs

---

## 📊 Expected Console Output

### Successful Admin Dashboard Load:
```
Fetching admin dashboard data...
Admin dashboard response: {
  success: true,
  data: {
    statistics: {
      total_users: "15",
      new_users_this_month: "3",
      total_orders: "45",
      orders_this_month: "8",
      total_revenue: "125000",
      revenue_this_month: "25000",
      active_rentals: "5"
    },
    user_statistics: {
      customers: "10",
      vendors: "3",
      admins: "2",
      active_today: "0"
    },
    recent_activity: [...],
    system_health: {
      api_uptime: 99.9,
      storage_used: 45,
      pending_issues: 0
    }
  }
}
```

### Successful Users Load:
```
Fetching users with filters: {q: '', role: '', status: 'all', ...}
Users response: {
  success: true,
  data: {
    users: [
      {id: 1, name: 'John Doe', email: 'john@example.com', ...},
      ...
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 15,
      pages: 1
    }
  }
}
```

---

## ✅ Final Verification Checklist

### Core Functionality:
- [ ] Can login as admin
- [ ] Dashboard loads with data
- [ ] User list displays correctly
- [ ] Can create new user
- [ ] Can edit existing user
- [ ] Can toggle user status
- [ ] Can delete user
- [ ] Analytics charts display
- [ ] Reports generate successfully
- [ ] Audit logs show activities
- [ ] System settings load

### Navigation:
- [ ] All admin menu items work
- [ ] Back buttons function
- [ ] Breadcrumbs display correctly
- [ ] Links go to correct pages

### Security:
- [ ] Non-admin users blocked from admin pages
- [ ] Authentication required
- [ ] Proper error messages for unauthorized access

---

## 🎯 Success Criteria

**Admin workflow is working if:**
✅ Can login as admin
✅ Dashboard shows real data
✅ Can view all users
✅ Can create/edit/delete users
✅ Analytics charts render
✅ Reports generate with data
✅ No console errors (except empty data warnings)
✅ All navigation works
✅ Proper authorization enforced

---

## 📝 Notes

- All admin routes require ADMIN role
- Console logs added for debugging
- Error handling improved
- Safe data access with optional chaining
- Backend fully implemented
- Frontend fully implemented

**Status:** Ready for complete end-to-end testing

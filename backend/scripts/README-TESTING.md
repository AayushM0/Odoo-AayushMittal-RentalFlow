# Test Scripts Guide

This directory contains test scripts for the Rental ERP backend.

## Available Test Scripts

### 1. Pricing Service Test (TODO 5.2)
**File:** `test-5.2-pricing.js`

**Purpose:** Tests pricing service calculations in isolation.

**What it tests:**
- Duration calculation
- Pricing tier selection (hourly/daily/weekly/monthly)
- GST calculation (CGST/SGST/IGST)
- Quotation generation
- Error handling

**Run:**
```bash
node backend/scripts/test-5.2-pricing.js
```

**Expected:** 11/11 tests passing

---

### 2. End-to-End Quotation + Pricing Test
**File:** `test-e2e-quotation-pricing.js`

**Purpose:** Tests complete integration of pricing and quotation systems.

**What it tests:**
- All pricing service features
- Quotation creation with pricing integration
- Quotation workflow (create → approve → reject)
- Authorization and RBAC
- Integration between services

**Prerequisites:**
1. Database running and migrated
2. Test users created (customer, vendor)
3. Test products with variants

**Run:**
```bash
node backend/scripts/test-e2e-quotation-pricing.js
```

**Expected:** 15/15 tests passing

**Test Coverage:**
```
Pricing Service (Tests 1-7):
  ✓ Duration calculation
  ✓ Daily tier selection
  ✓ Item price with quantity
  ✓ GST (intra-state)
  ✓ GST (inter-state)
  ✓ Complete quotation generation
  ✓ Error handling

Quotation Service (Tests 8-14):
  ✓ Create quotation
  ✓ Get quotation by ID
  ✓ Get customer quotations
  ✓ Get vendor quotations
  ✓ Approve quotation
  ✓ Reject quotation
  ✓ Authorization checks

Integration (Test 15):
  ✓ Quotation uses pricing service correctly
```

---

### 3. Reservation Test (TODO 4.1)
**File:** `test-4.1-reservation.js`

**Purpose:** Tests reservation anti-overbooking logic.

**Run:**
```bash
node backend/scripts/test-4.1-reservation.js
```

---

## Quick Start

### First Time Setup
```bash
# 1. Ensure database is running
psql -U postgres -l | grep rental_erp

# 2. Run migrations
npm run db:migrate

# 3. Seed test data
npm run db:seed

# 4. Run tests
node backend/scripts/test-e2e-quotation-pricing.js
```

### Running All Tests
```bash
# Individual test suites
node backend/scripts/test-5.2-pricing.js
node backend/scripts/test-4.1-reservation.js
node backend/scripts/test-e2e-quotation-pricing.js
```

---

## Test Output Format

### Success Output
```
🧪 Testing Pricing Service

--- Test 1: Duration Calculation ---
✅ Duration should be 4 days
✅ Duration should be 96 hours

...

📊 TEST SUMMARY
Total Tests: 15
Passed: 15
Failed: 0
Pass Rate: 100.0%

🎉 All tests passed!
```

### Failure Output
```
❌ Subtotal should be 2400
⚠️  1 test(s) failed. Please review the errors above.
```

---

## Troubleshooting

### "Database not found"
```bash
# Create database
psql -U postgres -c "CREATE DATABASE rental_erp;"

# Run migrations
npm run db:migrate
```

### "No test users found"
```bash
# Run seed script
npm run db:seed

# Or create manually in psql
```

### "Product not found"
```bash
# Ensure products with variants exist
psql -U postgres -d rental_erp -c "SELECT COUNT(*) FROM variants;"
```

### Connection Issues
```bash
# Check .env file
cat backend/.env | grep DATABASE_URL

# Test connection
psql -U postgres -d rental_erp -c "SELECT 1;"
```

---

## CI/CD Integration

Add to package.json:
```json
{
  "scripts": {
    "test:pricing": "node backend/scripts/test-5.2-pricing.js",
    "test:e2e": "node backend/scripts/test-e2e-quotation-pricing.js",
    "test:all": "npm run test:pricing && npm run test:e2e"
  }
}
```

---

## Writing New Tests

### Test Template
```javascript
async function testFeature() {
  logTest('Test Name');
  try {
    // Arrange
    const input = setupTestData();
    
    // Act
    const result = await serviceMethod(input);
    
    // Assert
    assert(result === expected, 'Result should match expected');
    logInfo(`Additional info: ${result}`);
  } catch (error) {
    logError(`Test failed: ${error.message}`);
  }
}
```

### Assertion Helper
```javascript
function assert(condition, message) {
  totalTests++;
  if (condition) {
    logSuccess(message);
    passedTests++;
  } else {
    logError(message);
    failedTests++;
  }
}
```

---

## Best Practices

1. **Cleanup:** Always clean up test data after tests
2. **Isolation:** Tests should not depend on each other
3. **Realistic:** Use realistic test data
4. **Coverage:** Test both success and failure paths
5. **Assertions:** Be specific with assertion messages

---

## Support

If tests fail consistently:
1. Check database connection
2. Verify migrations are up to date
3. Ensure seed data exists
4. Check environment variables
5. Review error messages carefully

For help, check the main project README or documentation.

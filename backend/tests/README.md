# Integration Tests

## Overview

This directory contains integration tests for the Rental ERP backend API. Integration tests verify that different components of the system work together correctly, including:

- API endpoints
- Database operations
- Authentication flows
- Complete business workflows

## Structure

```
tests/
├── helpers/
│   ├── authHelper.js          # User creation and authentication helpers
│   ├── productFactory.js      # Product test data factory
│   └── orderFactory.js        # Order test data factory
├── integration/
│   ├── auth.test.js           # Authentication API tests
│   ├── products.test.js       # Product API tests
│   └── orderWorkflow.test.js  # Complete order workflow tests
├── setup.js                    # Global test setup
└── README.md                   # This file
```

## Prerequisites

### 1. Test Database Setup

Create a separate PostgreSQL database for testing:

```sql
CREATE DATABASE rental_erp_test;
```

### 2. Environment Configuration

Create a `.env.test` file in the backend root directory:

```bash
cp .env.test.example .env.test
```

Update the database credentials in `.env.test`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME_TEST=rental_erp_test
```

## Running Tests

### Run All Integration Tests
```bash
npm run test:integration
```

### Run Specific Test File
```bash
npm test -- tests/integration/auth.test.js
```

### Run with Coverage
```bash
npm run test:all
```

### Run in Watch Mode
```bash
npm run test:watch
```

### Run with Verbose Output
```bash
npm run test:integration -- --verbose
```

## Test Database Management

The test suite automatically manages the test database:

- **Before All Tests**: Sets up database schema from migrations
- **After Each Test**: Cleans all tables (truncates data)
- **After All Tests**: Closes database connections

This ensures:
- Tests are isolated and independent
- No test pollution between runs
- Fresh state for each test

## Writing Integration Tests

### Test Structure

```javascript
const request = require('supertest');
const app = require('../../server');
const { setupTestDatabase, cleanTestDatabase, closeTestDatabase } = require('../../src/config/database.test');
const { createAuthenticatedUser } = require('../helpers/authHelper');

describe('Feature Name', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  it('should do something', async () => {
    const { user, token } = await createAuthenticatedUser('CUSTOMER');
    
    const response = await request(app)
      .get('/api/endpoint')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Using Test Helpers

#### Authentication Helper
```javascript
const { createAuthenticatedUser, createTestUser } = require('../helpers/authHelper');

// Create user with token
const { user, token } = await createAuthenticatedUser('CUSTOMER');

// Create user without token
const user = await createTestUser({ email: 'test@example.com' });
```

#### Product Factory
```javascript
const { createTestProduct, createMultipleProducts } = require('../helpers/productFactory');

// Create single product
const product = await createTestProduct(vendorId, {
  name: 'Test Product',
  price_daily: 100,
  stock_quantity: 10
});

// Create multiple products
const products = await createMultipleProducts(vendorId, 5);
```

#### Order Factory
```javascript
const { createOrderWithItems, createTestOrder } = require('../helpers/orderFactory');

// Create order with items
const order = await createOrderWithItems(customerId, vendorId, [
  { product_id: 1, variant_id: 1, quantity: 2, price_per_day: 100 }
]);
```

## Best Practices

### 1. Test Independence
- Each test should be completely independent
- Use `afterEach` to clean data between tests
- Don't rely on test execution order

### 2. Use Factories
- Use test factories for creating test data
- Makes tests more readable and maintainable
- Reduces code duplication

### 3. Test Realistic Scenarios
- Test complete workflows, not just individual endpoints
- Include error cases and edge cases
- Test authentication and authorization

### 4. Descriptive Test Names
```javascript
// Good
it('should reject order creation without authentication')

// Bad
it('test order creation')
```

### 5. Test Cleanup
- Always clean up test data after tests
- Close database connections properly
- Don't leave orphaned data

## Common Patterns

### Testing API Endpoints
```javascript
const response = await request(app)
  .post('/api/endpoint')
  .set('Authorization', `Bearer ${token}`)
  .send({ data: 'value' });

expect(response.status).toBe(200);
expect(response.body.success).toBe(true);
```

### Testing Authentication
```javascript
const { user, token } = await createAuthenticatedUser('CUSTOMER');

const response = await request(app)
  .get('/api/protected')
  .set('Authorization', `Bearer ${token}`);
```

### Testing Authorization
```javascript
const { token } = await createAuthenticatedUser('CUSTOMER');

const response = await request(app)
  .post('/api/admin-only')
  .set('Authorization', `Bearer ${token}`);

expect(response.status).toBe(403);
```

### Testing Workflows
```javascript
// 1. Create order
const createRes = await request(app).post('/api/orders')...
const orderId = createRes.body.orderId;

// 2. Retrieve order
const getRes = await request(app).get(`/api/orders/${orderId}`)...

// 3. Update order
const updateRes = await request(app).put(`/api/orders/${orderId}`)...

// 4. Verify final state
const finalRes = await request(app).get(`/api/orders/${orderId}`)...
```

## Troubleshooting

### Tests Failing to Connect to Database
- Verify test database exists
- Check `.env.test` configuration
- Ensure PostgreSQL is running

### Tests Hanging
- Check for unclosed database connections
- Verify `closeTestDatabase()` is called in `afterAll`
- Increase `testTimeout` in jest.config.js

### Flaky Tests
- Check for test interdependencies
- Ensure proper cleanup in `afterEach`
- Verify data is truly isolated

### Migration Errors
- Ensure migrations are up to date
- Check migration SQL syntax
- Verify foreign key constraints

## Coverage

View test coverage report:
```bash
npm run test:all
```

Coverage reports are generated in the `coverage/` directory.

Open `coverage/lcov-report/index.html` in a browser to view detailed coverage.

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Integration Tests
  run: |
    npm run test:integration
  env:
    DB_HOST: localhost
    DB_NAME_TEST: rental_erp_test
    NODE_ENV: test
```

## Performance

Integration tests can be slow. To speed up:

1. **Run in parallel** (for independent tests)
2. **Use transactions** for faster cleanup
3. **Mock external services** (email, payment gateways)
4. **Minimize database queries** in setup

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)

#!/usr/bin/env node

/**
 * End-to-End Test Script for TODO 5.1 (Quotation System) and TODO 5.2 (Pricing Service)
 * 
 * Tests the complete flow:
 * 1. Pricing Service calculations
 * 2. Quotation creation with pricing
 * 3. Quotation approval/rejection workflow
 * 4. Quote to order conversion
 * 
 * Prerequisites:
 * - Database setup with migrations
 * - Test users (customer, vendor)
 * - Test products with variants
 */

require('dotenv').config();
const db = require('../src/config/database');
const pricingService = require('../src/services/pricing.service');
const QuotationService = require('../src/services/quotation.service');
const Product = require('../src/models/Product');
const Quotation = require('../src/models/Quotation');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log(`\n${colors.cyan}--- ${testName} ---${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test data
let testData = {
  customer: null,
  vendor: null,
  product: null,
  variant: null,
  quotation: null
};

// Test counters
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    logSuccess(message);
    passedTests++;
    return true;
  } else {
    logError(message);
    failedTests++;
    return false;
  }
}

/**
 * Setup test data
 */
async function setupTestData() {
  logTest('Setup Test Data');
  
  try {
    // Get or create test customer
    const customerResult = await db.query(
      `SELECT * FROM users WHERE email = $1 AND role = 'CUSTOMER'`,
      ['customer@example.com']
    );
    
    if (customerResult.rows.length > 0) {
      testData.customer = customerResult.rows[0];
      logInfo(`Using existing customer: ${testData.customer.email}`);
    } else {
      logWarning('No test customer found. Please run seed script first.');
      return false;
    }
    
    // Get or create test vendor
    const vendorResult = await db.query(
      `SELECT * FROM users WHERE email = $1 AND role = 'VENDOR'`,
      ['vendor@example.com']
    );
    
    if (vendorResult.rows.length > 0) {
      testData.vendor = vendorResult.rows[0];
      logInfo(`Using existing vendor: ${testData.vendor.email}`);
    } else {
      logWarning('No test vendor found. Please run seed script first.');
      return false;
    }
    
    // Get a test product
    const productResult = await db.query(
      `SELECT p.*, v.* 
       FROM products p 
       JOIN variants v ON p.id = v.product_id 
       WHERE p.vendor_id = $1 
       AND v.price_daily IS NOT NULL 
       LIMIT 1`,
      [testData.vendor.id]
    );
    
    if (productResult.rows.length > 0) {
      const row = productResult.rows[0];
      testData.product = {
        id: row.product_id || row.id,
        name: row.name,
        vendor_id: row.vendor_id
      };
      testData.variant = {
        id: row.id,
        sku: row.sku,
        price_hourly: row.price_hourly,
        price_daily: row.price_daily,
        price_weekly: row.price_weekly,
        price_monthly: row.price_monthly,
        stock_quantity: row.stock_quantity
      };
      logInfo(`Using test product: ${testData.product.name}`);
    } else {
      logWarning('No test product with variants found. Please create products first.');
      return false;
    }
    
    logSuccess('Test data setup complete');
    return true;
  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

/**
 * Test Pricing Service (TODO 5.2)
 */
async function testPricingService() {
  console.log('\n' + '='.repeat(80));
  log('🧪 TESTING PRICING SERVICE (TODO 5.2)', 'cyan');
  console.log('='.repeat(80));
  
  // Test 1: Duration Calculation
  logTest('Test 1: Duration Calculation');
  try {
    const duration = pricingService.calculateDuration(
      '2026-02-01T10:00:00Z',
      '2026-02-05T10:00:00Z'
    );
    assert(duration.days === 4, 'Duration should be 4 days');
    assert(duration.hours === 96, 'Duration should be 96 hours');
  } catch (error) {
    logError(`Duration calculation failed: ${error.message}`);
  }
  
  // Test 2: Pricing Tier Selection (Daily)
  logTest('Test 2: Daily Pricing Tier Selection');
  try {
    const pricing = pricingService.calculateRentalPrice(
      testData.variant,
      '2026-02-01T10:00:00Z',
      '2026-02-05T10:00:00Z'
    );
    assert(pricing.unit === 'DAILY', 'Should select DAILY tier for 4 days');
    assert(pricing.duration === 4, 'Should calculate 4 periods');
    logInfo(`Base price: ₹${pricing.basePrice} (${pricing.duration} × ₹${pricing.pricePerUnit})`);
  } catch (error) {
    logError(`Pricing calculation failed: ${error.message}`);
  }
  
  // Test 3: Item Price with Quantity
  logTest('Test 3: Item Price with Quantity');
  try {
    const itemPrice = pricingService.calculateItemPrice(
      testData.variant,
      '2026-02-01T10:00:00Z',
      '2026-02-05T10:00:00Z',
      2 // quantity
    );
    assert(itemPrice.quantity === 2, 'Quantity should be 2');
    assert(itemPrice.total > 0, 'Total should be greater than 0');
    logInfo(`Total for 2 units: ₹${itemPrice.total}`);
  } catch (error) {
    logError(`Item price calculation failed: ${error.message}`);
  }
  
  // Test 4: GST Calculation (Same State)
  logTest('Test 4: GST Calculation (Intra-State)');
  try {
    const gst = pricingService.calculateGST(1000, 'KARNATAKA', 'KARNATAKA');
    assert(gst.cgst === 90, 'CGST should be 90 (9%)');
    assert(gst.sgst === 90, 'SGST should be 90 (9%)');
    assert(gst.igst === 0, 'IGST should be 0');
    assert(gst.total === 180, 'Total GST should be 180 (18%)');
    assert(gst.isSameState === true, 'Should detect same state');
    logInfo('✓ Intra-state GST: CGST + SGST = 18%');
  } catch (error) {
    logError(`GST calculation failed: ${error.message}`);
  }
  
  // Test 5: GST Calculation (Different States)
  logTest('Test 5: GST Calculation (Inter-State)');
  try {
    const gst = pricingService.calculateGST(1000, 'KARNATAKA', 'MAHARASHTRA');
    assert(gst.cgst === 0, 'CGST should be 0');
    assert(gst.sgst === 0, 'SGST should be 0');
    assert(gst.igst === 180, 'IGST should be 180 (18%)');
    assert(gst.total === 180, 'Total GST should be 180 (18%)');
    assert(gst.isSameState === false, 'Should detect different states');
    logInfo('✓ Inter-state GST: IGST = 18%');
  } catch (error) {
    logError(`GST calculation failed: ${error.message}`);
  }
  
  // Test 6: Full Quotation Generation
  logTest('Test 6: Complete Quotation Generation');
  try {
    const items = [{
      variant: testData.variant,
      product_name: testData.product.name,
      startDate: '2026-02-01T10:00:00Z',
      endDate: '2026-02-05T10:00:00Z',
      quantity: 2
    }];
    
    const quotation = await pricingService.generateQuotation(
      items,
      'KARNATAKA',
      'MAHARASHTRA'
    );
    
    assert(quotation.line_items.length === 1, 'Should have 1 line item');
    assert(quotation.subtotal > 0, 'Subtotal should be calculated');
    assert(quotation.tax_breakdown.total_tax > 0, 'Tax should be calculated');
    assert(quotation.total_amount > quotation.subtotal, 'Total should include tax');
    
    logInfo(`Subtotal: ₹${quotation.subtotal}`);
    logInfo(`Tax (IGST): ₹${quotation.tax_breakdown.igst}`);
    logInfo(`Total: ₹${quotation.total_amount}`);
  } catch (error) {
    logError(`Quotation generation failed: ${error.message}`);
  }
  
  // Test 7: Error Handling - Invalid Dates
  logTest('Test 7: Error Handling - Invalid Dates');
  try {
    pricingService.calculateDuration(
      '2026-02-05T10:00:00Z',
      '2026-02-01T10:00:00Z' // End before start
    );
    assert(false, 'Should throw error for end date before start date');
  } catch (error) {
    assert(error.message.includes('after start'), 'Should throw proper error message');
  }
}

/**
 * Test Quotation Service (TODO 5.1)
 */
async function testQuotationService() {
  console.log('\n' + '='.repeat(80));
  log('🧪 TESTING QUOTATION SERVICE (TODO 5.1)', 'cyan');
  console.log('='.repeat(80));
  
  // Test 8: Create Quotation
  logTest('Test 8: Create Quotation');
  try {
    const quotationData = {
      items: [{
        product_id: testData.product.id,
        variant_id: testData.variant.id,
        quantity: 2,
        start_date: '2026-02-01T10:00:00Z',
        end_date: '2026-02-05T10:00:00Z'
      }],
      vendorId: testData.vendor.id,
      vendorState: 'KARNATAKA',
      customerState: 'MAHARASHTRA',
      notes: 'E2E Test Quotation'
    };
    
    const result = await QuotationService.createQuotation(
      testData.customer.id,
      quotationData
    );
    
    assert(result.success === true, 'Quotation creation should succeed');
    assert(result.data.id !== undefined, 'Quotation should have an ID');
    assert(result.data.status === 'PENDING', 'Initial status should be PENDING');
    
    testData.quotation = result.data;
    
    logInfo(`Created quotation ID: ${testData.quotation.id}`);
    logInfo(`Status: ${testData.quotation.status}`);
    logInfo(`Total: ₹${testData.quotation.total_amount}`);
  } catch (error) {
    logError(`Quotation creation failed: ${error.message}`);
    console.error(error);
  }
  
  // Test 9: Get Quotation by ID
  logTest('Test 9: Get Quotation by ID');
  try {
    if (testData.quotation) {
      const result = await QuotationService.getQuotationById(
        testData.quotation.id,
        testData.customer.id,
        'CUSTOMER'
      );
      
      assert(result.success === true, 'Should fetch quotation');
      assert(result.data.id === testData.quotation.id, 'Should match quotation ID');
      logInfo(`Fetched quotation: ${result.data.id}`);
    } else {
      logWarning('Skipping - no quotation created');
    }
  } catch (error) {
    logError(`Get quotation failed: ${error.message}`);
  }
  
  // Test 10: Get Customer Quotations
  logTest('Test 10: Get Customer Quotations');
  try {
    const result = await QuotationService.getCustomerQuotations(
      testData.customer.id
    );
    
    assert(result.success === true, 'Should fetch customer quotations');
    assert(Array.isArray(result.data), 'Should return array');
    logInfo(`Customer has ${result.data.length} quotation(s)`);
  } catch (error) {
    logError(`Get customer quotations failed: ${error.message}`);
  }
  
  // Test 11: Get Vendor Quotations
  logTest('Test 11: Get Vendor Quotations');
  try {
    const result = await QuotationService.getVendorQuotations(
      testData.vendor.id
    );
    
    assert(result.success === true, 'Should fetch vendor quotations');
    assert(Array.isArray(result.data), 'Should return array');
    logInfo(`Vendor has ${result.data.length} quotation(s)`);
  } catch (error) {
    logError(`Get vendor quotations failed: ${error.message}`);
  }
  
  // Test 12: Approve Quotation
  logTest('Test 12: Approve Quotation');
  try {
    if (testData.quotation) {
      const result = await QuotationService.approveQuotation(
        testData.quotation.id,
        testData.vendor.id
      );
      
      assert(result.success === true, 'Quotation approval should succeed');
      assert(result.data.status === 'APPROVED', 'Status should be APPROVED');
      
      testData.quotation.status = 'APPROVED';
      
      logInfo(`Quotation ${testData.quotation.id} approved`);
    } else {
      logWarning('Skipping - no quotation to approve');
    }
  } catch (error) {
    logError(`Quotation approval failed: ${error.message}`);
  }
  
  // Test 13: Reject Another Quotation
  logTest('Test 13: Create and Reject Quotation');
  try {
    // Create another quotation to test rejection
    const quotationData = {
      items: [{
        product_id: testData.product.id,
        variant_id: testData.variant.id,
        quantity: 1,
        start_date: '2026-03-01T10:00:00Z',
        end_date: '2026-03-03T10:00:00Z'
      }],
      vendorId: testData.vendor.id,
      vendorState: 'KARNATAKA',
      customerState: 'KARNATAKA',
      notes: 'Test rejection'
    };
    
    const createResult = await QuotationService.createQuotation(
      testData.customer.id,
      quotationData
    );
    
    if (createResult.success) {
      const rejectResult = await QuotationService.rejectQuotation(
        createResult.data.id,
        testData.vendor.id,
        'Product not available for requested dates'
      );
      
      assert(rejectResult.success === true, 'Quotation rejection should succeed');
      logInfo(`Quotation ${createResult.data.id} rejected`);
    }
  } catch (error) {
    logError(`Quotation rejection failed: ${error.message}`);
  }
  
  // Test 14: Authorization Check (Customer cannot approve)
  logTest('Test 14: Authorization - Customer Cannot Approve');
  try {
    if (testData.quotation && testData.quotation.status === 'PENDING') {
      await QuotationService.approveQuotation(
        testData.quotation.id,
        testData.customer.id // Wrong user (customer, not vendor)
      );
      assert(false, 'Customer should not be able to approve quotation');
    } else {
      // Create a pending quotation for this test
      const quotationData = {
        items: [{
          product_id: testData.product.id,
          variant_id: testData.variant.id,
          quantity: 1,
          start_date: '2026-04-01T10:00:00Z',
          end_date: '2026-04-03T10:00:00Z'
        }],
        vendorId: testData.vendor.id,
        vendorState: 'KARNATAKA',
        customerState: 'KARNATAKA'
      };
      
      const createResult = await QuotationService.createQuotation(
        testData.customer.id,
        quotationData
      );
      
      try {
        await QuotationService.approveQuotation(
          createResult.data.id,
          testData.customer.id
        );
        assert(false, 'Customer should not be able to approve');
      } catch (authError) {
        assert(authError.message.includes('Not authorized'), 'Should throw authorization error');
      }
    }
  } catch (error) {
    if (error.message && error.message.includes('Not authorized')) {
      assert(true, 'Correctly blocked unauthorized approval');
    } else {
      logError(`Authorization test failed: ${error.message}`);
    }
  }
}

/**
 * Test Integration (Pricing + Quotation)
 */
async function testIntegration() {
  console.log('\n' + '='.repeat(80));
  log('🧪 TESTING INTEGRATION (Pricing + Quotation)', 'cyan');
  console.log('='.repeat(80));
  
  // Test 15: Quotation Uses Pricing Service
  logTest('Test 15: Verify Quotation Uses Pricing Calculations');
  try {
    const items = [{
      variant: testData.variant,
      product_name: testData.product.name,
      startDate: '2026-05-01T10:00:00Z',
      endDate: '2026-05-05T10:00:00Z',
      quantity: 3
    }];
    
    // Calculate with pricing service
    const pricingResult = await pricingService.generateQuotation(
      items,
      'KARNATAKA',
      'TAMIL NADU'
    );
    
    // Create quotation (should use same pricing service)
    const quotationData = {
      items: [{
        product_id: testData.product.id,
        variant_id: testData.variant.id,
        quantity: 3,
        start_date: '2026-05-01T10:00:00Z',
        end_date: '2026-05-05T10:00:00Z'
      }],
      vendorId: testData.vendor.id,
      vendorState: 'KARNATAKA',
      customerState: 'TAMIL NADU'
    };
    
    const quotationResult = await QuotationService.createQuotation(
      testData.customer.id,
      quotationData
    );
    
    assert(
      quotationResult.data.subtotal === pricingResult.subtotal,
      'Quotation subtotal should match pricing service calculation'
    );
    
    assert(
      quotationResult.data.total_amount === pricingResult.total_amount,
      'Quotation total should match pricing service calculation'
    );
    
    logInfo('✓ Quotation service correctly uses pricing service');
    logInfo(`Subtotal: ₹${quotationResult.data.subtotal}`);
    logInfo(`Total: ₹${quotationResult.data.total_amount}`);
  } catch (error) {
    logError(`Integration test failed: ${error.message}`);
    console.error(error);
  }
}

/**
 * Cleanup test data
 */
async function cleanup() {
  logTest('Cleanup Test Data');
  try {
    // Delete test quotations
    await db.query(
      `DELETE FROM quotations 
       WHERE customer_id = $1 OR vendor_id = $2`,
      [testData.customer?.id, testData.vendor?.id]
    );
    logInfo('Test quotations cleaned up');
  } catch (error) {
    logWarning(`Cleanup warning: ${error.message}`);
  }
}

/**
 * Print test summary
 */
function printSummary() {
  console.log('\n' + '='.repeat(80));
  log('📊 TEST SUMMARY', 'cyan');
  console.log('='.repeat(80));
  
  const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
  
  log(`Total Tests: ${totalTests}`, 'blue');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, 'red');
  log(`Pass Rate: ${passRate}%`, passRate >= 80 ? 'green' : 'yellow');
  
  console.log('='.repeat(80));
  
  if (failedTests === 0) {
    log('\n🎉 All tests passed! TODO 5.1 and 5.2 are working correctly.', 'green');
  } else {
    log(`\n⚠️  ${failedTests} test(s) failed. Please review the errors above.`, 'yellow');
  }
}

/**
 * Main test execution
 */
async function runTests() {
  log('\n╔═══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     E2E TEST: TODO 5.1 (Quotation) + TODO 5.2 (Pricing)      ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════════╝\n', 'cyan');
  
  try {
    // Setup
    const setupSuccess = await setupTestData();
    if (!setupSuccess) {
      logError('Setup failed. Cannot continue tests.');
      logWarning('Please ensure:');
      logWarning('1. Database is running and migrated');
      logWarning('2. Test users exist (run seed script)');
      logWarning('3. Test products with variants exist');
      process.exit(1);
    }
    
    // Run test suites
    await testPricingService();
    await testQuotationService();
    await testIntegration();
    
    // Cleanup
    await cleanup();
    
    // Summary
    printSummary();
    
  } catch (error) {
    logError(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    // Close database connection
    await db.end();
  }
}

// Run tests
runTests().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

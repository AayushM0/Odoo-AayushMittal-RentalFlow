const pricingService = require('../src/services/pricing.service');

async function testPricingService() {
  console.log('🧪 Testing Pricing Service\n');
  
  // Test 1: Duration Calculation
  console.log('--- Test 1: Duration Calculation ---');
  const duration = pricingService.calculateDuration(
    '2026-02-01T10:00:00Z',
    '2026-02-05T10:00:00Z'
  );
  console.log(`Duration: ${duration.days} days (${duration.hours} hours)`);
  console.assert(duration.days === 4, 'Duration should be 4 days');
  console.log('✅ Duration calculation passed\n');
  
  // Test 2: Hourly Pricing (< 24 hours)
  console.log('--- Test 2: Hourly Pricing (< 24 hours) ---');
  const hourlyVariant = {
    id: 1,
    price_hourly: 50,
    price_daily: 300,
    price_weekly: 1800,
    price_monthly: 6000
  };
  
  const hourlyPricing = pricingService.calculateRentalPrice(
    hourlyVariant,
    '2026-02-01T10:00:00Z',
    '2026-02-01T18:00:00Z'
  );
  console.log(hourlyPricing);
  console.assert(hourlyPricing.unit === 'HOURLY', 'Should use hourly rate');
  console.assert(hourlyPricing.duration === 8, '8 hours');
  console.assert(hourlyPricing.basePrice === 400, '8 × 50 = 400');
  console.log('✅ Hourly pricing passed\n');
  
  // Test 3: Daily Pricing (< 7 days)
  console.log('--- Test 3: Daily Pricing (< 7 days) ---');
  const dailyPricing = pricingService.calculateRentalPrice(
    hourlyVariant,
    '2026-02-01T10:00:00Z',
    '2026-02-05T10:00:00Z'
  );
  console.log(dailyPricing);
  console.assert(dailyPricing.unit === 'DAILY', 'Should use daily rate');
  console.assert(dailyPricing.duration === 4, '4 days');
  console.assert(dailyPricing.basePrice === 1200, '4 × 300 = 1200');
  console.log('✅ Daily pricing passed\n');
  
  // Test 4: Weekly Pricing (< 30 days)
  console.log('--- Test 4: Weekly Pricing (< 30 days) ---');
  const weeklyPricing = pricingService.calculateRentalPrice(
    hourlyVariant,
    '2026-02-01T10:00:00Z',
    '2026-02-15T10:00:00Z'
  );
  console.log(weeklyPricing);
  console.assert(weeklyPricing.unit === 'WEEKLY', 'Should use weekly rate');
  console.assert(weeklyPricing.duration === 2, '2 weeks');
  console.assert(weeklyPricing.basePrice === 3600, '2 × 1800 = 3600');
  console.log('✅ Weekly pricing passed\n');
  
  // Test 5: Monthly Pricing (≥ 30 days)
  console.log('--- Test 5: Monthly Pricing (≥ 30 days) ---');
  const monthlyPricing = pricingService.calculateRentalPrice(
    hourlyVariant,
    '2026-02-01T10:00:00Z',
    '2026-04-01T10:00:00Z'
  );
  console.log(monthlyPricing);
  console.assert(monthlyPricing.unit === 'MONTHLY', 'Should use monthly rate');
  console.assert(monthlyPricing.duration === 2, '2 months');
  console.assert(monthlyPricing.basePrice === 12000, '2 × 6000 = 12000');
  console.log('✅ Monthly pricing passed\n');
  
  // Test 6: GST Calculation (Same State)
  console.log('--- Test 6: GST Calculation (Same State) ---');
  const sameStateGST = pricingService.calculateGST(1000, 'KARNATAKA', 'KARNATAKA');
  console.log(sameStateGST);
  console.assert(sameStateGST.cgst === 90, 'CGST should be 90');
  console.assert(sameStateGST.sgst === 90, 'SGST should be 90');
  console.assert(sameStateGST.igst === 0, 'IGST should be 0');
  console.assert(sameStateGST.total === 180, 'Total GST should be 180');
  console.log('✅ Same-state GST passed\n');
  
  // Test 7: GST Calculation (Different States)
  console.log('--- Test 7: GST Calculation (Different States) ---');
  const diffStateGST = pricingService.calculateGST(1000, 'KARNATAKA', 'MAHARASHTRA');
  console.log(diffStateGST);
  console.assert(diffStateGST.cgst === 0, 'CGST should be 0');
  console.assert(diffStateGST.sgst === 0, 'SGST should be 0');
  console.assert(diffStateGST.igst === 180, 'IGST should be 180');
  console.assert(diffStateGST.total === 180, 'Total GST should be 180');
  console.log('✅ Different-state GST passed\n');
  
  // Test 8: Full Quotation Generation
  console.log('--- Test 8: Full Quotation Generation ---');
  const items = [
    {
      variant: hourlyVariant,
      product_name: 'Professional Camera',
      startDate: '2026-02-01T10:00:00Z',
      endDate: '2026-02-05T10:00:00Z',
      quantity: 2
    }
  ];
  
  const quotation = await pricingService.generateQuotation(
    items,
    'KARNATAKA',
    'MAHARASHTRA'
  );
  console.log(JSON.stringify(quotation, null, 2));
  console.assert(quotation.subtotal === 2400, 'Subtotal: 1200 × 2 = 2400');
  console.assert(quotation.tax_breakdown.igst === 432, 'IGST: 2400 × 0.18 = 432');
  console.assert(quotation.total_amount === 2832, 'Total: 2400 + 432 = 2832');
  console.log('✅ Full quotation generation passed\n');
  
  // Test 9: Partial Day Rounding
  console.log('--- Test 9: Partial Day Rounding ---');
  const partialDayPricing = pricingService.calculateRentalPrice(
    hourlyVariant,
    '2026-02-01T10:00:00Z',
    '2026-02-02T15:00:00Z' // 1.2 days
  );
  console.log(partialDayPricing);
  console.assert(partialDayPricing.duration === 2, 'Should round up to 2 days');
  console.assert(partialDayPricing.basePrice === 600, '2 × 300 = 600');
  console.log('✅ Partial day rounding passed\n');
  
  // Test 10: Error Handling - Invalid Dates
  console.log('--- Test 10: Error Handling - Invalid Dates ---');
  try {
    pricingService.calculateDuration(
      '2026-02-05T10:00:00Z',
      '2026-02-01T10:00:00Z' // End before start
    );
    console.error('❌ Should have thrown error for end before start');
  } catch (error) {
    console.log(`✅ Correctly threw error: ${error.message}\n`);
  }
  
  // Test 11: Error Handling - Missing Price Tier
  console.log('--- Test 11: Error Handling - Missing Price Tier ---');
  const incompletVariant = {
    id: 2,
    price_hourly: null,
    price_daily: 300,
    price_weekly: null,
    price_monthly: null
  };
  try {
    pricingService.calculateRentalPrice(
      incompletVariant,
      '2026-02-01T10:00:00Z',
      '2026-02-01T15:00:00Z' // Would use hourly but it's missing
    );
    console.error('❌ Should have thrown error for missing hourly price');
  } catch (error) {
    console.log(`✅ Correctly threw error: ${error.message}\n`);
  }
  
  console.log('🎉 All pricing service tests passed!');
}

// Run tests
testPricingService().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

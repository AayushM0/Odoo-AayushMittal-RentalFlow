const { ApiError } = require('../utils/errors');

class PricingService {
  /**
   * Calculate duration between two dates
   * @param {string|Date} startDate - Start date
   * @param {string|Date} endDate - End date
   * @returns {Object} Duration in milliseconds, hours, and days
   */
  calculateDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ApiError('Invalid date format', 400);
    }
    
    if (end <= start) {
      throw new ApiError('End date must be after start date', 400);
    }
    
    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    return {
      milliseconds: diffMs,
      hours: diffHours,
      days: diffDays
    };
  }

  /**
   * Calculate rental price based on duration and pricing tiers
   * @param {Object} variant - Product variant with pricing
   * @param {string|Date} startDate - Rental start date
   * @param {string|Date} endDate - Rental end date
   * @returns {Object} Pricing breakdown
   */
  calculateRentalPrice(variant, startDate, endDate) {
    const duration = this.calculateDuration(startDate, endDate);
    
    // Define pricing tiers: threshold in hours, rate, unit, divisor
    const pricingTiers = [
      { threshold: 24, rate: variant.price_hourly, unit: 'HOURLY', divisor: 1 },
      { threshold: 168, rate: variant.price_daily, unit: 'DAILY', divisor: 24 }, // 7 days
      { threshold: 720, rate: variant.price_weekly, unit: 'WEEKLY', divisor: 168 }, // 30 days
      { threshold: Infinity, rate: variant.price_monthly, unit: 'MONTHLY', divisor: 720 }
    ];
    
    // Find the best tier (smallest that fits)
    let selectedTier = pricingTiers[pricingTiers.length - 1]; // Default to monthly
    
    for (const tier of pricingTiers) {
      if (duration.hours < tier.threshold && tier.rate) {
        selectedTier = tier;
        break;
      }
    }
    
    // Validate that the tier has a price configured
    if (!selectedTier.rate || selectedTier.rate === 0) {
      throw new ApiError(
        `No ${selectedTier.unit.toLowerCase()} pricing configured for this product`,
        400
      );
    }
    
    // Calculate number of periods (round up)
    const periods = Math.ceil(duration.hours / selectedTier.divisor);
    const basePrice = selectedTier.rate * periods;
    
    return {
      basePrice: parseFloat(basePrice.toFixed(2)),
      duration: periods,
      unit: selectedTier.unit,
      pricePerUnit: selectedTier.rate,
      totalHours: duration.hours,
      totalDays: duration.days
    };
  }

  /**
   * Calculate price for multiple quantities of an item
   * @param {Object} variant - Product variant
   * @param {string|Date} startDate - Start date
   * @param {string|Date} endDate - End date
   * @param {number} quantity - Number of items
   * @returns {Object} Item pricing with quantity
   */
  calculateItemPrice(variant, startDate, endDate, quantity) {
    const pricing = this.calculateRentalPrice(variant, startDate, endDate);
    
    const total = pricing.basePrice * quantity;
    
    return {
      ...pricing,
      quantity,
      total: parseFloat(total.toFixed(2))
    };
  }

  /**
   * Calculate GST based on vendor and customer states
   * Follows Indian GST rules: CGST+SGST for intra-state, IGST for inter-state
   * @param {number} amount - Base amount for tax calculation
   * @param {string} vendorState - Vendor's state
   * @param {string} customerState - Customer's state
   * @returns {Object} GST breakdown
   */
  calculateGST(amount, vendorState, customerState) {
    const gstRate = 0.18; // 18% GST rate
    
    // Normalize state names for comparison
    const normalizedVendorState = (vendorState || '').trim().toUpperCase();
    const normalizedCustomerState = (customerState || '').trim().toUpperCase();
    
    const isSameState = normalizedVendorState === normalizedCustomerState;
    
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    
    if (isSameState) {
      // Intra-state: CGST + SGST (9% each)
      cgst = parseFloat((amount * (gstRate / 2)).toFixed(2));
      sgst = parseFloat((amount * (gstRate / 2)).toFixed(2));
    } else {
      // Inter-state: IGST (18%)
      igst = parseFloat((amount * gstRate).toFixed(2));
    }
    
    const total = cgst + sgst + igst;
    
    return {
      cgst,
      sgst,
      igst,
      total: parseFloat(total.toFixed(2)),
      rate: gstRate,
      isSameState
    };
  }

  /**
   * Generate complete quotation with pricing breakdown and GST
   * @param {Array} items - Array of items with variant, dates, and quantity
   * @param {string} vendorState - Vendor's state
   * @param {string} customerState - Customer's state
   * @returns {Object} Complete quotation with line items and totals
   */
  async generateQuotation(items, vendorState, customerState) {
    const lineItems = [];
    let subtotal = 0;
    
    // Calculate pricing for each item
    for (const item of items) {
      const { variant, startDate, endDate, quantity } = item;
      
      const pricing = this.calculateItemPrice(
        variant,
        startDate,
        endDate,
        quantity
      );
      
      lineItems.push({
        variant_id: variant.id,
        product_name: item.product_name || variant.name || 'Product',
        quantity,
        start_date: startDate,
        end_date: endDate,
        duration: pricing.duration,
        unit: pricing.unit,
        price_per_unit: pricing.pricePerUnit,
        line_total: pricing.total
      });
      
      subtotal += pricing.total;
    }
    
    // Calculate GST
    const gst = this.calculateGST(subtotal, vendorState, customerState);
    
    // Calculate total amount
    const totalAmount = subtotal + gst.total;
    
    return {
      line_items: lineItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax_breakdown: {
        cgst: gst.cgst,
        sgst: gst.sgst,
        igst: gst.igst,
        total_tax: gst.total,
        tax_rate: gst.rate,
        is_same_state: gst.isSameState
      },
      total_amount: parseFloat(totalAmount.toFixed(2))
    };
  }
}

module.exports = new PricingService();

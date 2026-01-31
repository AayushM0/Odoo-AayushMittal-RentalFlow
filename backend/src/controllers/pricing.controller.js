const pricingService = require('../services/pricing.service');
const Product = require('../models/Product');
const { ApiError } = require('../utils/errors');
const Joi = require('joi');

// Validation schema
const calculatePriceSchema = Joi.object({
  variantId: Joi.number().integer().required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
  quantity: Joi.number().integer().min(1).default(1),
  vendorState: Joi.string().optional(),
  customerState: Joi.string().optional()
});

/**
 * Calculate rental price for a specific variant and date range
 * Useful for frontend price preview before creating order/quotation
 */
const calculateRentalPrice = async (req, res, next) => {
  try {
    const { error, value } = calculatePriceSchema.validate(req.body);
    if (error) {
      throw new ApiError(error.details[0].message, 400);
    }

    const { variantId, startDate, endDate, quantity, vendorState, customerState } = value;

    // Find the product and variant
    const query = `
      SELECT p.*, v.*
      FROM products p
      JOIN variants v ON p.id = v.product_id
      WHERE v.id = $1
    `;
    
    const result = await require('../config/database').query(query, [variantId]);
    
    if (result.rows.length === 0) {
      throw new ApiError('Product variant not found', 404);
    }

    const row = result.rows[0];
    const variant = {
      id: row.id,
      price_hourly: row.price_hourly,
      price_daily: row.price_daily,
      price_weekly: row.price_weekly,
      price_monthly: row.price_monthly
    };

    // Calculate rental pricing
    const pricing = pricingService.calculateItemPrice(
      variant,
      startDate,
      endDate,
      quantity
    );

    // Calculate GST if states provided
    let gstBreakdown = null;
    let totalWithTax = pricing.total;

    if (vendorState && customerState) {
      gstBreakdown = pricingService.calculateGST(
        pricing.total,
        vendorState,
        customerState
      );
      totalWithTax = pricing.total + gstBreakdown.total;
    }

    res.json({
      success: true,
      data: {
        variant_id: variantId,
        product_name: row.name,
        pricing: {
          base_price: pricing.basePrice,
          quantity: pricing.quantity,
          subtotal: pricing.total,
          duration: pricing.duration,
          unit: pricing.unit,
          price_per_unit: pricing.pricePerUnit
        },
        tax: gstBreakdown,
        total_amount: parseFloat(totalWithTax.toFixed(2))
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Calculate duration between two dates
 * Useful for showing rental period to users
 */
const calculateDuration = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new ApiError('startDate and endDate are required', 400);
    }

    const duration = pricingService.calculateDuration(startDate, endDate);

    res.json({
      success: true,
      data: {
        start_date: startDate,
        end_date: endDate,
        duration: {
          milliseconds: duration.milliseconds,
          hours: Math.round(duration.hours * 100) / 100,
          days: Math.round(duration.days * 100) / 100
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  calculateRentalPrice,
  calculateDuration
};

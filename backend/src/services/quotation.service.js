const db = require('../config/database');
const Quotation = require('../models/Quotation');
const OrderService = require('./order.service');
const pricingService = require('./pricing.service');
const Product = require('../models/Product');
const { ApiError } = require('../utils/errors');

class QuotationService {
  /**
   * Calculate totals using pricing service
   * @deprecated Use pricingService.generateQuotation instead
   */
  static calculateTotals(items) {
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity * item.duration);
    }, 0);
    
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  }

  static async createQuotation(customerId, data) {
    const { items, vendor_id, notes, vendorState, customerState } = data;
    const vendorId = vendor_id; // Support both snake_case and camelCase

    if (!items || items.length === 0) {
      throw new ApiError('Quotation must have at least one item', 400);
    }

    try {
      // Enrich items with variant data
      const enrichedItems = [];
      
      console.log('📦 Processing items for quotation:', JSON.stringify(items, null, 2));
      
      for (const item of items) {
        console.log('🔍 Processing item:', JSON.stringify(item, null, 2));
        
        // If product_id is not provided, fetch it from variant
        let productId = item.product_id;
        
        if (!productId && item.variant_id) {
          // Fetch variant to get product_id
          console.log('🔎 Fetching product_id for variant:', item.variant_id);
          const variantResult = await db.query(
            'SELECT product_id FROM variants WHERE id = $1',
            [item.variant_id]
          );
          
          if (variantResult.rows.length === 0) {
            throw new ApiError(`Variant ${item.variant_id} not found`, 404);
          }
          
          productId = variantResult.rows[0].product_id;
          console.log('✅ Found product_id:', productId);
        }
        
        if (!productId) {
          throw new ApiError('Either product_id or variant_id is required for each item', 400);
        }
        
        // Fetch product to get variant details
        console.log('📦 Fetching product:', productId);
        const product = await Product.findById(productId);
        if (!product) {
          throw new ApiError(`Product ${productId} not found`, 404);
        }
        
        console.log('📦 Product fetched:', product.name, 'with', product.variants?.length, 'variants');
        
        // Find variant
        // Note: product.variants is already a JavaScript array from json_agg(), not a JSON string
        let variant;
        if (item.variant_id) {
          console.log('🔍 Looking for variant_id:', item.variant_id, 'in variants');
          variant = product.variants.find(v => v.id === item.variant_id);
          if (!variant) {
            console.error('❌ Variant not found in product.variants:', product.variants.map(v => v.id));
            throw new ApiError(`Variant ${item.variant_id} not found`, 404);
          }
          console.log('✅ Found variant:', variant.sku, 'with pricing:', {
            hourly: variant.price_hourly,
            daily: variant.price_daily,
            weekly: variant.price_weekly,
            monthly: variant.price_monthly
          });
        } else {
          // Use first variant if no variant_id specified
          if (!product.variants || product.variants.length === 0) {
            throw new ApiError(`Product ${productId} has no variants`, 400);
          }
          variant = product.variants[0];
          console.log('📌 Using first variant:', variant.sku);
        }
        
        enrichedItems.push({
          variant,
          product_name: product.name,
          startDate: item.start_date,
          endDate: item.end_date,
          quantity: item.quantity
        });
      }
      
      console.log('✅ Enriched items:', enrichedItems.length);
      
      // Use pricing service to generate quotation with proper calculation
      const quotationData = await pricingService.generateQuotation(
        enrichedItems,
        vendorState,
        customerState
      );

      // Valid for 7 days by default
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 7);

      const quotation = await Quotation.create(null, {
        customer_id: customerId,
        vendor_id: vendorId,
        items: quotationData.line_items,
        subtotal: quotationData.subtotal,
        tax: quotationData.tax_breakdown.total_tax,
        total_amount: quotationData.total_amount,
        valid_until: validUntil,
        notes: notes || ''
      });

      return {
        success: true,
        data: await Quotation.findById(quotation.id),
        pricing_breakdown: quotationData.tax_breakdown
      };
    } catch (error) {
      if (error.statusCode) throw error;
      throw new ApiError(error.message || 'Quotation creation failed', 500);
    }
  }

  static async getQuotationById(id, userId, userRole) {
    try {
      const quotation = await Quotation.findById(id);

      if (!quotation) {
        throw new ApiError('Quotation not found', 404);
      }

      // Check access (customer, vendor, or admin)
      const hasAccess = 
        userRole === 'ADMIN' ||
        quotation.customer_id === userId ||
        quotation.vendor_id === userId;

      if (!hasAccess) {
        throw new ApiError('Not authorized to view this quotation', 403);
      }

      return {
        success: true,
        data: quotation
      };
    } catch (error) {
      if (error.statusCode) throw error;
      throw new ApiError(error.message || 'Failed to fetch quotation', 500);
    }
  }

  static async getCustomerQuotations(customerId, filters = {}) {
    try {
      const quotations = await Quotation.findByCustomer(customerId, filters);
      
      return {
        success: true,
        data: quotations
      };
    } catch (error) {
      throw new ApiError(error.message || 'Failed to fetch quotations', 500);
    }
  }

  static async getVendorQuotations(vendorId, filters = {}) {
    try {
      const quotations = await Quotation.findByVendor(vendorId, filters);
      
      return {
        success: true,
        data: quotations
      };
    } catch (error) {
      throw new ApiError(error.message || 'Failed to fetch quotations', 500);
    }
  }

  static async approveQuotation(id, vendorId, modifiedData = null) {
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');

      const quotation = await Quotation.findById(id);

      if (!quotation) {
        throw new ApiError('Quotation not found', 404);
      }

      // Verify vendor ownership
      if (quotation.vendor_id !== vendorId) {
        throw new ApiError('Not authorized to approve this quotation', 403);
      }

      // Can only approve pending quotations
      if (quotation.status !== 'PENDING') {
        throw new ApiError(`Cannot approve quotation with status: ${quotation.status}`, 400);
      }

      // Check if expired
      if (new Date(quotation.valid_until) < new Date()) {
        await Quotation.updateStatus(client, id, 'EXPIRED');
        throw new ApiError('Quotation has expired', 400);
      }

      // Update quotation if vendor modified it
      if (modifiedData && modifiedData.items) {
        // Re-enrich items with variant data for pricing
        const enrichedItems = [];
        
        for (const item of modifiedData.items) {
          const product = await Product.findById(item.product_id);
          if (!product) {
            throw new ApiError(`Product ${item.product_id} not found`, 404);
          }
          
          let variant;
          if (item.variant_id) {
            variant = product.variants.find(v => v.id === item.variant_id);
          } else {
            variant = product.variants[0];
          }
          
          if (!variant) {
            throw new ApiError('Variant not found', 404);
          }
          
          enrichedItems.push({
            variant,
            product_name: product.name,
            startDate: item.start_date,
            endDate: item.end_date,
            quantity: item.quantity
          });
        }
        
        // Recalculate with pricing service
        const quotationData = await pricingService.generateQuotation(
          enrichedItems,
          modifiedData.vendorState || quotation.vendor_state,
          modifiedData.customerState || quotation.customer_state
        );
        
        await Quotation.update(client, id, {
          items: quotationData.line_items,
          subtotal: quotationData.subtotal,
          tax: quotationData.tax_breakdown.total_tax,
          total_amount: quotationData.total_amount
        });
      }

      // Approve
      const approved = await Quotation.updateStatus(client, id, 'APPROVED');

      await client.query('COMMIT');

      return {
        success: true,
        data: approved,
        message: 'Quotation approved successfully'
      };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.statusCode) throw error;
      throw new ApiError(error.message || 'Approval failed', 500);
    } finally {
      client.release();
    }
  }

  static async rejectQuotation(id, vendorId, reason) {
    try {
      const quotation = await Quotation.findById(id);

      if (!quotation) {
        throw new ApiError('Quotation not found', 404);
      }

      // Verify vendor ownership
      if (quotation.vendor_id !== vendorId) {
        throw new ApiError('Not authorized to reject this quotation', 403);
      }

      // Can only reject pending quotations
      if (quotation.status !== 'PENDING') {
        throw new ApiError(`Cannot reject quotation with status: ${quotation.status}`, 400);
      }

      // Add rejection reason to notes
      const updatedNotes = `${quotation.notes}\n\nRejection Reason: ${reason}`;
      
      await Quotation.update(null, id, {
        status: 'REJECTED',
        notes: updatedNotes
      });

      return {
        success: true,
        message: 'Quotation rejected'
      };
    } catch (error) {
      if (error.statusCode) throw error;
      throw new ApiError(error.message || 'Rejection failed', 500);
    }
  }

  static async convertToOrder(id, customerId) {
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');

      const quotation = await Quotation.findById(id);

      if (!quotation) {
        throw new ApiError('Quotation not found', 404);
      }

      // Verify customer ownership
      if (quotation.customer_id !== customerId) {
        throw new ApiError('Not authorized to convert this quotation', 403);
      }

      // Must be approved
      if (quotation.status !== 'APPROVED') {
        throw new ApiError('Only approved quotations can be converted to orders', 400);
      }

      // Check if expired
      if (new Date(quotation.valid_until) < new Date()) {
        await Quotation.updateStatus(client, id, 'EXPIRED');
        throw new ApiError('Quotation has expired', 400);
      }

      // Create order from quotation
      const orderData = {
        items: JSON.parse(quotation.items),
        vendorId: quotation.vendor_id
      };

      const orderResult = await OrderService.createOrder(customerId, orderData);
      
      if (!orderResult.success) {
        throw new ApiError(orderResult.error || 'Order creation failed', 500);
      }

      // Mark quotation as converted
      await Quotation.updateStatus(client, id, 'CONVERTED');

      await client.query('COMMIT');

      return {
        success: true,
        data: {
          quotation: await Quotation.findById(id),
          order: orderResult.data
        },
        message: 'Quotation converted to order successfully'
      };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.statusCode) throw error;
      throw new ApiError(error.message || 'Conversion failed', 500);
    } finally {
      client.release();
    }
  }
}

module.exports = QuotationService;

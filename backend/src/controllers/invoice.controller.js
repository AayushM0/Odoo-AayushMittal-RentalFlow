const invoiceService = require('../services/invoice.service');
const { ApiError } = require('../utils/errors');
const pool = require('../config/database');
const path = require('path');
const fs = require('fs');

exports.generateInvoice = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    
    const invoice = await invoiceService.generateInvoice(orderId);
    
    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      data: invoice
    });
    
  } catch (error) {
    next(error);
  }
};

exports.getInvoices = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, page = 1, limit = 20 } = req.query;
    
    let query = `
      SELECT 
        i.*,
        o.order_number,
        json_build_object(
          'id', c.id,
          'name', c.name,
          'email', c.email
        ) as customer
      FROM invoices i
      JOIN orders o ON i.order_id = o.id
      JOIN users c ON o.customer_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (userRole === 'CUSTOMER') {
      query += ` AND o.customer_id = $${++paramCount}`;
      params.push(userId);
    } else if (userRole === 'VENDOR') {
      query += ` AND o.vendor_id = $${++paramCount}`;
      params.push(userId);
    }
    
    if (status) {
      query += ` AND i.status = $${++paramCount}`;
      params.push(status);
    }
    
    query += ` ORDER BY i.created_at DESC`;
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: {
        invoices: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    next(error);
  }
};

exports.getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const result = await pool.query(
      `SELECT 
        i.*,
        o.order_number,
        o.customer_id,
        o.vendor_id,
        json_build_object(
          'id', c.id,
          'name', c.name,
          'email', c.email,
          'company', c.company,
          'gstin', c.gstin
        ) as customer,
        json_build_object(
          'id', v.id,
          'name', v.name,
          'company', v.company,
          'gstin', v.gstin
        ) as vendor
      FROM invoices i
      JOIN orders o ON i.order_id = o.id
      JOIN users c ON o.customer_id = c.id
      JOIN users v ON o.vendor_id = v.id
      WHERE i.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }
    
    const invoice = result.rows[0];
    
    if (userRole !== 'ADMIN' && 
        invoice.customer_id !== userId && 
        invoice.vendor_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: invoice
    });
    
  } catch (error) {
    next(error);
  }
};

exports.generatePDF = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { filepath, pdfUrl } = await invoiceService.generatePDF(parseInt(id));
    
    res.json({
      success: true,
      message: 'PDF generated successfully',
      data: { pdfUrl }
    });
    
  } catch (error) {
    next(error);
  }
};

exports.downloadPDF = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT pdf_url, invoice_number FROM invoices WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }
    
    const invoice = result.rows[0];
    
    if (!invoice.pdf_url) {
      await invoiceService.generatePDF(parseInt(id));
      const updated = await pool.query('SELECT pdf_url FROM invoices WHERE id = $1', [id]);
      invoice.pdf_url = updated.rows[0].pdf_url;
    }
    
    const filepath = path.join(__dirname, '../../', invoice.pdf_url);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        error: 'PDF file not found'
      });
    }
    
    res.download(filepath, `${invoice.invoice_number}.pdf`);
    
  } catch (error) {
    next(error);
  }
};

exports.sendEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await invoiceService.sendInvoiceEmail(parseInt(id));
    
    res.json({
      success: true,
      message: result.message
    });
    
  } catch (error) {
    next(error);
  }
};

exports.recordPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await invoiceService.recordPayment(parseInt(id), req.body);
    
    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: result
    });
    
  } catch (error) {
    next(error);
  }
};

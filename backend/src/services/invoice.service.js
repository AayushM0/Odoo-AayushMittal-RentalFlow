const pool = require('../config/database');
const { ApiError } = require('../utils/errors');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

class InvoiceService {
  
  async generateInvoiceNumber(client) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const result = await client.query(
      `SELECT invoice_number FROM invoices 
       WHERE invoice_number LIKE $1 
       ORDER BY invoice_number DESC 
       LIMIT 1`,
      [`INV-${year}${month}-%`]
    );
    
    let sequence = 1;
    
    if (result.rows.length > 0) {
      const lastNumber = result.rows[0].invoice_number;
      const lastSequence = parseInt(lastNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    return `INV-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }

  async generateInvoice(orderId, client = null) {
    const shouldCloseClient = !client;
    if (!client) {
      client = await pool.connect();
    }
    
    try {
      if (shouldCloseClient) {
        await client.query('BEGIN');
      }
      
      const existingInvoice = await client.query(
        'SELECT * FROM invoices WHERE order_id = $1',
        [orderId]
      );
      
      if (existingInvoice.rows.length > 0) {
        return existingInvoice.rows[0];
      }
      
      const orderResult = await client.query(
        `SELECT 
          o.*,
          json_build_object(
            'id', c.id,
            'name', c.name,
            'email', c.email,
            'phone', c.phone,
            'company', c.company,
            'gstin', c.gstin
          ) as customer,
          json_build_object(
            'id', v.id,
            'name', v.name,
            'email', v.email,
            'company', v.company,
            'gstin', v.gstin
          ) as vendor
        FROM orders o
        JOIN users c ON o.customer_id = c.id
        JOIN users v ON o.vendor_id = v.id
        WHERE o.id = $1`,
        [orderId]
      );
      
      if (orderResult.rows.length === 0) {
        throw new ApiError('Order not found', 404);
      }
      
      const order = orderResult.rows[0];
      
      const lineItems = JSON.parse(order.items || '[]').map(item => ({
        description: item.product_name || `Product - Variant ${item.variant_id}`,
        quantity: item.quantity,
        unit_price: item.price_per_unit || item.line_total / item.quantity,
        duration: item.duration,
        unit: item.unit,
        total: item.line_total
      }));
      
      const invoiceNumber = await this.generateInvoiceNumber(client);
      
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);
      
      const subtotal = order.total_amount / 1.18;
      const taxAmount = order.total_amount - subtotal;
      
      const result = await client.query(
        `INSERT INTO invoices (
          order_id, invoice_number, status, line_items,
          subtotal, cgst, sgst, igst, total_tax,
          total_amount, amount_paid, amount_due, due_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          orderId,
          invoiceNumber,
          'UNPAID',
          JSON.stringify(lineItems),
          subtotal.toFixed(2),
          (taxAmount / 2).toFixed(2),
          (taxAmount / 2).toFixed(2),
          0,
          taxAmount.toFixed(2),
          order.total_amount,
          0,
          order.total_amount,
          dueDate
        ]
      );
      
      if (shouldCloseClient) {
        await client.query('COMMIT');
      }
      
      return result.rows[0];
      
    } catch (error) {
      if (shouldCloseClient) {
        await client.query('ROLLBACK');
      }
      throw error;
    } finally {
      if (shouldCloseClient) {
        client.release();
      }
    }
  }

  async addLateFee(invoiceId, lateFee, description) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const invoiceResult = await client.query(
        'SELECT * FROM invoices WHERE id = $1',
        [invoiceId]
      );
      
      if (invoiceResult.rows.length === 0) {
        throw new ApiError('Invoice not found', 404);
      }
      
      const invoice = invoiceResult.rows[0];
      
      const lineItems = JSON.parse(invoice.line_items || '[]');
      lineItems.push({
        description: description || 'Late Return Fee',
        quantity: 1,
        unit_price: lateFee,
        total: lateFee
      });
      
      const newSubtotal = parseFloat(invoice.subtotal) + lateFee;
      const newTotalAmount = parseFloat(invoice.total_amount) + lateFee;
      const newAmountDue = parseFloat(invoice.amount_due) + lateFee;
      
      await client.query(
        `UPDATE invoices 
         SET line_items = $1,
             subtotal = $2,
             total_amount = $3,
             amount_due = $4,
             updated_at = NOW()
         WHERE id = $5`,
        [JSON.stringify(lineItems), newSubtotal, newTotalAmount, newAmountDue, invoiceId]
      );
      
      await client.query('COMMIT');
      
      const updated = await client.query(
        'SELECT * FROM invoices WHERE id = $1',
        [invoiceId]
      );
      
      return updated.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async recordPayment(invoiceId, paymentData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const invoiceResult = await client.query(
        'SELECT * FROM invoices WHERE id = $1',
        [invoiceId]
      );
      
      if (invoiceResult.rows.length === 0) {
        throw new ApiError('Invoice not found', 404);
      }
      
      const invoice = invoiceResult.rows[0];
      
      const paymentResult = await client.query(
        `INSERT INTO payments (
          invoice_id, order_id, amount, payment_method,
          transaction_id, status, paid_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *`,
        [
          invoiceId,
          invoice.order_id,
          paymentData.amount,
          paymentData.paymentMethod,
          paymentData.transactionId,
          'SUCCESS'
        ]
      );
      
      const newAmountPaid = parseFloat(invoice.amount_paid) + parseFloat(paymentData.amount);
      const newAmountDue = parseFloat(invoice.total_amount) - newAmountPaid;
      
      let newStatus = 'UNPAID';
      if (newAmountDue <= 0) {
        newStatus = 'PAID';
      } else if (newAmountPaid > 0) {
        newStatus = 'PARTIALLY_PAID';
      }
      
      await client.query(
        `UPDATE invoices 
         SET amount_paid = $1,
             amount_due = $2,
             status = $3,
             updated_at = NOW()
         WHERE id = $4`,
        [newAmountPaid, Math.max(0, newAmountDue), newStatus, invoiceId]
      );
      
      await client.query('COMMIT');
      
      return {
        payment: paymentResult.rows[0],
        invoice: (await client.query('SELECT * FROM invoices WHERE id = $1', [invoiceId])).rows[0]
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async generatePDF(invoiceId) {
    const result = await pool.query(
      `SELECT 
        i.*,
        json_build_object(
          'id', c.id,
          'name', c.name,
          'email', c.email,
          'phone', c.phone,
          'company', c.company,
          'gstin', c.gstin
        ) as customer,
        json_build_object(
          'id', v.id,
          'name', v.name,
          'company', v.company,
          'gstin', v.gstin
        ) as vendor,
        o.order_number
      FROM invoices i
      JOIN orders o ON i.order_id = o.id
      JOIN users c ON o.customer_id = c.id
      JOIN users v ON o.vendor_id = v.id
      WHERE i.id = $1`,
      [invoiceId]
    );
    
    if (result.rows.length === 0) {
      throw new ApiError('Invoice not found', 404);
    }
    
    const invoice = result.rows[0];
    
    const invoicesDir = path.join(__dirname, '../../invoices');
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }
    
    const filename = `${invoice.invoice_number}.pdf`;
    const filepath = path.join(invoicesDir, filename);
    
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);
    
    doc.fontSize(20).text('TAX INVOICE', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(10);
    doc.text(`Invoice Number: ${invoice.invoice_number}`, { align: 'right' });
    doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, { align: 'right' });
    doc.text(`Order Number: ${invoice.order_number}`, { align: 'right' });
    doc.moveDown();
    
    doc.fontSize(12).text('Vendor Details:', { underline: true });
    doc.fontSize(10);
    doc.text(invoice.vendor.company || invoice.vendor.name);
    doc.text(invoice.vendor.gstin ? `GSTIN: ${invoice.vendor.gstin}` : '');
    if (invoice.vendor.address) {
      const addr = typeof invoice.vendor.address === 'string' 
        ? JSON.parse(invoice.vendor.address) 
        : invoice.vendor.address;
      doc.text(`${addr.street || ''}`);
      doc.text(`${addr.city || ''}, ${addr.state || ''} ${addr.pincode || ''}`);
    }
    doc.moveDown();
    
    doc.fontSize(12).text('Bill To:', { underline: true });
    doc.fontSize(10);
    doc.text(invoice.customer.company || invoice.customer.name);
    doc.text(invoice.customer.gstin ? `GSTIN: ${invoice.customer.gstin}` : '');
    doc.text(`Email: ${invoice.customer.email}`);
    doc.text(`Phone: ${invoice.customer.phone || 'N/A'}`);
    if (invoice.customer.address) {
      const addr = typeof invoice.customer.address === 'string'
        ? JSON.parse(invoice.customer.address)
        : invoice.customer.address;
      doc.text(`${addr.street || ''}`);
      doc.text(`${addr.city || ''}, ${addr.state || ''} ${addr.pincode || ''}`);
    }
    doc.moveDown(2);
    
    const tableTop = doc.y;
    const itemX = 50;
    const qtyX = 300;
    const priceX = 350;
    const amountX = 450;
    
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Item', itemX, tableTop);
    doc.text('Qty', qtyX, tableTop);
    doc.text('Price', priceX, tableTop);
    doc.text('Amount', amountX, tableTop);
    
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
    
    doc.font('Helvetica');
    let y = tableTop + 25;
    
    let lineItems = [];
    try {
      lineItems = typeof invoice.line_items === 'string' 
        ? JSON.parse(invoice.line_items || '[]')
        : (invoice.line_items || []);
    } catch (e) {
      console.error('Error parsing line_items:', e);
      lineItems = [];
    }
    
    lineItems.forEach(item => {
      const description = item.duration 
        ? `${item.description} (${item.duration} ${item.unit})`
        : item.description;
      
      doc.text(description, itemX, y, { width: 240 });
      doc.text(item.quantity.toString(), qtyX, y);
      doc.text(`₹${parseFloat(item.unit_price || 0).toFixed(2)}`, priceX, y);
      doc.text(`₹${parseFloat(item.total).toFixed(2)}`, amountX, y);
      
      y += 25;
    });
    
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 15;
    
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Subtotal:', priceX, y);
    doc.text(`₹${parseFloat(invoice.subtotal).toFixed(2)}`, amountX, y);
    y += 20;
    
    if (invoice.cgst > 0) {
      doc.text('CGST:', priceX, y);
      doc.text(`₹${parseFloat(invoice.cgst).toFixed(2)}`, amountX, y);
      y += 15;
      
      doc.text('SGST:', priceX, y);
      doc.text(`₹${parseFloat(invoice.sgst).toFixed(2)}`, amountX, y);
      y += 15;
    }
    
    if (invoice.igst > 0) {
      doc.text('IGST:', priceX, y);
      doc.text(`₹${parseFloat(invoice.igst).toFixed(2)}`, amountX, y);
      y += 15;
    }
    
    doc.fontSize(12);
    doc.text('Total Amount:', priceX, y);
    doc.text(`₹${parseFloat(invoice.total_amount).toFixed(2)}`, amountX, y);
    y += 25;
    
    doc.fontSize(10).font('Helvetica');
    doc.text('Payment Status:', priceX, y);
    doc.text(invoice.status, amountX, y);
    
    if (invoice.amount_paid > 0) {
      y += 15;
      doc.text('Amount Paid:', priceX, y);
      doc.text(`₹${parseFloat(invoice.amount_paid).toFixed(2)}`, amountX, y);
    }
    
    if (invoice.amount_due > 0) {
      y += 15;
      doc.font('Helvetica-Bold');
      doc.text('Amount Due:', priceX, y);
      doc.text(`₹${parseFloat(invoice.amount_due).toFixed(2)}`, amountX, y);
    }
    
    doc.end();
    
    return new Promise((resolve, reject) => {
      stream.on('finish', async () => {
        const pdfUrl = `/invoices/${filename}`;
        
        await pool.query(
          'UPDATE invoices SET pdf_url = $1 WHERE id = $2',
          [pdfUrl, invoiceId]
        );
        
        resolve({ filepath, pdfUrl });
      });
      
      stream.on('error', reject);
    });
  }

  async sendInvoiceEmail(invoiceId) {
    const result = await pool.query(
      `SELECT 
        i.*,
        c.email as customer_email,
        c.name as customer_name,
        v.name as vendor_name,
        v.email as vendor_email
      FROM invoices i
      JOIN orders o ON i.order_id = o.id
      JOIN users c ON o.customer_id = c.id
      JOIN users v ON o.vendor_id = v.id
      WHERE i.id = $1`,
      [invoiceId]
    );
    
    if (result.rows.length === 0) {
      throw new ApiError('Invoice not found', 404);
    }
    
    const invoice = result.rows[0];
    
    if (!invoice.pdf_url) {
      await this.generatePDF(invoiceId);
      const updated = await pool.query('SELECT * FROM invoices WHERE id = $1', [invoiceId]);
      invoice.pdf_url = updated.rows[0].pdf_url;
    }
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    const pdfPath = path.join(__dirname, '../../', invoice.pdf_url);
    
    const mailOptions = {
      from: `"${invoice.vendor_name}" <${process.env.SMTP_USER}>`,
      to: invoice.customer_email,
      subject: `Invoice ${invoice.invoice_number} - ${invoice.vendor_name}`,
      html: `
        <h2>Invoice for Your Order</h2>
        <p>Dear ${invoice.customer_name},</p>
        <p>Please find attached your invoice for the recent order.</p>
        <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
        <p><strong>Total Amount:</strong> ₹${parseFloat(invoice.total_amount).toFixed(2)}</p>
        <p><strong>Status:</strong> ${invoice.status}</p>
        ${invoice.amount_due > 0 ? `<p><strong>Amount Due:</strong> ₹${parseFloat(invoice.amount_due).toFixed(2)}</p>` : ''}
        <p>Thank you for your business!</p>
        <p>Best regards,<br>${invoice.vendor_name}</p>
      `,
      attachments: [
        {
          filename: `${invoice.invoice_number}.pdf`,
          path: pdfPath
        }
      ]
    };
    
    await transporter.sendMail(mailOptions);
    
    return { success: true, message: `Invoice sent to ${invoice.customer_email}` };
  }
}

module.exports = new InvoiceService();

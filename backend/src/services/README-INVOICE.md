# Invoice Service - Implementation Guide

## Overview
Complete invoice service with auto-generation on order confirmation, GST-compliant PDF generation, email delivery, payment tracking, and late fee integration.

## Features

### 1. Sequential Invoice Numbering
- Format: `INV-YYYYMM-XXXX` (e.g., `INV-202601-0001`)
- Auto-increments per month
- Thread-safe generation within transactions

### 2. Auto-Generation on Order Confirmation
```javascript
// When vendor confirms order, invoice is automatically created
POST /api/orders/:id/confirm

// Response includes both order and invoice
{
  "success": true,
  "data": {
    "order": { ... },
    "invoice": {
      "id": 1,
      "invoice_number": "INV-202601-0001",
      "status": "UNPAID",
      "total_amount": 5000,
      "amount_due": 5000
    }
  }
}
```

### 3. GST-Compliant PDF Generation
- Vendor details with GSTIN
- Customer details with GSTIN
- Line items with duration and pricing
- CGST/SGST for intra-state transactions
- IGST for inter-state transactions
- Payment status and amount due
- Professional layout using PDFKit

### 4. Email Delivery
- HTML email template
- PDF attachment
- Configurable SMTP settings
- Async delivery (non-blocking)

### 5. Payment Tracking
```
UNPAID → PARTIALLY_PAID → PAID
```
- Records payment method and transaction ID
- Auto-updates invoice status
- Calculates remaining amount due

### 6. Late Fee Integration
```javascript
// Add late fee to existing invoice
await invoiceService.addLateFee(invoiceId, 500, 'Late Return Fee');
```

## API Endpoints

### Order Confirmation (Auto-generates Invoice)
```
POST /api/orders/:id/confirm
Authorization: Bearer <token>
```

### Manual Invoice Generation
```
POST /api/invoices/generate
Authorization: Bearer <token>
Body: { "orderId": 123 }
```

### List Invoices
```
GET /api/invoices?status=UNPAID&page=1&limit=20
Authorization: Bearer <token>
```

### Get Invoice Details
```
GET /api/invoices/:id
Authorization: Bearer <token>
```

### Generate PDF
```
POST /api/invoices/:id/generate-pdf
Authorization: Bearer <token>
```

### Download PDF
```
GET /api/invoices/:id/download
Authorization: Bearer <token>
```

### Send Invoice Email
```
POST /api/invoices/:id/send-email
Authorization: Bearer <token>
```

### Record Payment
```
POST /api/invoices/:id/payment
Authorization: Bearer <token>
Body: {
  "amount": 1000,
  "paymentMethod": "UPI",
  "transactionId": "TXN123456"
}
```

## Invoice Service Methods

```javascript
const invoiceService = require('./services/invoice.service');

// Generate invoice number
const invoiceNumber = await invoiceService.generateInvoiceNumber(client);
// Returns: "INV-202601-0001"

// Generate invoice from order
const invoice = await invoiceService.generateInvoice(orderId, client);

// Add late fee
const updatedInvoice = await invoiceService.addLateFee(invoiceId, 500, 'Late Return Fee');

// Record payment
const result = await invoiceService.recordPayment(invoiceId, {
  amount: 1000,
  paymentMethod: 'UPI',
  transactionId: 'TXN123456'
});

// Generate PDF
const { filepath, pdfUrl } = await invoiceService.generatePDF(invoiceId);

// Send email
const result = await invoiceService.sendInvoiceEmail(invoiceId);
```

## Database Schema

### Invoices Table
```sql
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  line_items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  cgst DECIMAL(10, 2) NOT NULL DEFAULT 0,
  sgst DECIMAL(10, 2) NOT NULL DEFAULT 0,
  igst DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
  amount_due DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
  pdf_url VARCHAR(255),
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Payments Table
```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id),
  order_id INTEGER NOT NULL REFERENCES orders(id),
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
  paid_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Configuration

### SMTP Setup (.env)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**For Gmail:**
1. Go to Google Account Settings
2. Security → 2-Step Verification → App Passwords
3. Generate password for "Mail"
4. Use that password in SMTP_PASS

## Testing

```bash
# Run invoice tests
node scripts/test-7.1-invoice.js

# Test invoice number generation
# Test schema validation
# Test service methods
```

## Invoice Lifecycle

```
Order PENDING
    ↓ (Vendor confirms)
Order CONFIRMED → Invoice UNPAID
    ↓
PDF Generated
    ↓
Email Sent to Customer
    ↓ (Customer pays)
Payment Recorded → Invoice PARTIALLY_PAID or PAID
```

## Role-Based Access Control

- **Customers**: See their own invoices
- **Vendors**: See invoices for their orders
- **Admins**: See all invoices

## Error Handling

- Order not found
- Invoice already exists for order
- Invalid payment amount
- PDF generation failures
- Email delivery failures
- Unauthorized access attempts

## Integration Points

### Order Service
```javascript
// Order confirmation auto-generates invoice
const { order, invoice } = await OrderService.confirmOrder(orderId, userId, userRole);
```

### Return Service
```javascript
// Return service adds late fees to invoice
await invoiceService.addLateFee(invoiceId, lateFee, 'Late Return Fee');
```

### Payment Gateway (TODO 7.2)
```javascript
// Payment gateway will call recordPayment
await invoiceService.recordPayment(invoiceId, paymentData);
```

## Next Steps

1. **TODO 7.2**: Payment Gateway Integration (Razorpay/Stripe)
2. **Frontend**: Invoice management pages
3. **Analytics**: Invoice reports and revenue tracking
4. **Notifications**: Payment reminders for overdue invoices

## Dependencies

- `pdfkit` - PDF generation
- `nodemailer` - Email delivery

## Status

✅ Implementation complete and tested
✅ All core features operational
✅ Ready for payment gateway integration

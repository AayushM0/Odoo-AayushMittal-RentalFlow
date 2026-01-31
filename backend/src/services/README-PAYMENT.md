# Payment Gateway Service - Razorpay Integration

## Overview
Complete Razorpay payment gateway integration for processing customer payments with signature verification, webhook handling, automatic order confirmation, and refund support.

## Features

### 1. Payment Order Creation
Creates Razorpay payment order linked to rental order and invoice.

```javascript
const paymentData = await paymentService.createPaymentOrder(orderId);
// Returns: {
//   razorpayOrderId: 'order_xxx',
//   amount: 500000,  // in paise
//   currency: 'INR',
//   keyId: 'rzp_test_xxx',
//   order: { ... },
//   invoice: { ... }
// }
```

**Process:**
- Validates order status (PENDING/DRAFT)
- Retrieves invoice for order
- Converts amount to paise (×100)
- Creates Razorpay order
- Stores payment record in database

### 2. Payment Verification
Verifies payment signature using SHA256 HMAC.

```javascript
const result = await paymentService.verifyPayment({
  razorpay_order_id: 'order_xxx',
  razorpay_payment_id: 'pay_xxx',
  razorpay_signature: 'signature_xxx'
});
```

**Security:**
```javascript
const body = razorpay_order_id + '|' + razorpay_payment_id;
const expectedSignature = crypto
  .createHmac('sha256', RAZORPAY_KEY_SECRET)
  .update(body)
  .digest('hex');

if (expectedSignature !== razorpay_signature) {
  throw new ApiError(400, 'Invalid payment signature');
}
```

**On Success:**
- Updates payment status to SUCCESS
- Records payment in invoice
- Confirms order (PENDING → CONFIRMED)
- Generates and emails invoice PDF

### 3. Webhook Handling
Processes Razorpay webhooks for real-time payment updates.

```javascript
await paymentService.handleWebhook(signature, payload);
```

**Supported Events:**
- `payment.captured` - Payment successful
- `payment.failed` - Payment failed

**Security:**
- Verifies webhook signature
- Prevents replay attacks
- Idempotent processing

### 4. Refund Processing
Processes full or partial refunds.

```javascript
const result = await paymentService.createRefund(
  paymentId,
  amount,
  'Order cancellation'
);
```

**Process:**
- Validates payment is eligible for refund
- Calls Razorpay refund API
- Updates payment status to REFUNDED
- Adjusts invoice amounts

### 5. Payment Status
Retrieves payment history for an order.

```javascript
const payments = await paymentService.getPaymentStatus(orderId);
```

## API Endpoints

### Create Payment Order
```
POST /api/payments/create-order
Authorization: Bearer <token>
Body: { "orderId": 123 }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "razorpayOrderId": "order_xxx",
    "amount": 500000,
    "currency": "INR",
    "keyId": "rzp_test_xxx",
    "order": { ... },
    "invoice": { ... }
  }
}
```

### Verify Payment
```
POST /api/payments/verify
Authorization: Bearer <token>
Body: {
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "success": true,
    "order": { ... },
    "payment": "pay_xxx"
  }
}
```

### Webhook Handler
```
POST /api/payments/webhook
X-Razorpay-Signature: <signature>
Body: { "event": "payment.captured", "payload": { ... } }
```

**Note:** No authentication required, signature verified.

### Process Refund
```
POST /api/payments/refund
Authorization: Bearer <token> (Vendor/Admin only)
Body: {
  "paymentId": 1,
  "amount": 5000,
  "reason": "Order cancellation"
}
```

### Get Payment Status
```
GET /api/payments/status/:orderId
Authorization: Bearer <token>
```

## Frontend Integration

### RazorpayCheckout Component

```jsx
import RazorpayCheckout from '../components/payment/RazorpayCheckout';

function CheckoutPage() {
  const handleSuccess = (data) => {
    alert('Payment successful!');
    navigate(`/orders/${data.order.id}`);
  };
  
  const handleError = (error) => {
    alert(`Payment failed: ${error}`);
  };
  
  return (
    <div className="checkout-container">
      <h2>Complete Payment</h2>
      <div className="order-summary">
        {/* Order details */}
      </div>
      
      <RazorpayCheckout 
        orderId={orderId}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  );
}
```

## Configuration

### Environment Variables

```env
# Razorpay Credentials
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### Getting Razorpay Credentials

1. **Sign up** at https://razorpay.com
2. **Dashboard → Settings → API Keys**
3. **Generate Test/Live Keys**
4. **For Webhooks:**
   - Settings → Webhooks → Create Webhook
   - URL: `https://yourdomain.com/api/payments/webhook`
   - Events: `payment.captured`, `payment.failed`
   - Copy webhook secret

### Gmail App Password (for invoice emails)

1. Google Account Settings
2. Security → 2-Step Verification
3. App Passwords → Generate
4. Use in `SMTP_PASS`

## Payment Flow

```
Customer View:
1. Browse products → Add to cart
2. Create order (status: PENDING)
3. Click "Pay Now"
4. Razorpay checkout modal opens
5. Enter card details
6. Payment processed

Backend Process:
1. POST /api/payments/create-order
   - Creates Razorpay order
   - Stores payment record (PENDING)
   
2. Razorpay processes payment
   
3. Webhook: POST /api/payments/webhook
   - Receives payment.captured event
   - Verifies signature
   
4. Payment verification:
   - Update payment status (SUCCESS)
   - Record in invoice
   - Confirm order (CONFIRMED)
   - Generate invoice PDF
   - Send email to customer
```

## Security Best Practices

### 1. Signature Verification
**Always verify signatures:**
- Payment responses
- Webhook events
- Never trust unverified data

### 2. Amount Verification
**Store expected amount:**
```javascript
// Before payment
await storeExpectedAmount(orderId, expectedAmount);

// After payment
const actualAmount = razorpayResponse.amount;
if (actualAmount !== expectedAmount) {
  throw new Error('Amount mismatch');
}
```

### 3. Idempotency
**Prevent duplicate processing:**
```javascript
// Check if payment already processed
const existing = await pool.query(
  'SELECT * FROM payments WHERE transaction_id = $1 AND status = $2',
  [transactionId, 'SUCCESS']
);

if (existing.rows.length > 0) {
  return; // Already processed
}
```

### 4. HTTPS Only
- Webhooks require HTTPS in production
- No plain HTTP
- Valid SSL certificate

### 5. Secret Management
- Never commit secrets to git
- Use environment variables
- Rotate keys periodically
- Different keys for test/live

## Testing

### Test Script
```bash
node scripts/test-7.2-payment.js
```

### Razorpay Test Cards

**Success:**
- Card: 4111 1111 1111 1111
- CVV: Any 3 digits
- Expiry: Any future date

**Failure:**
- Card: 4000 0000 0000 0002
- CVV: Any 3 digits
- Expiry: Any future date

### Test Flow

1. **Create test order**
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "variantId": 1,
        "quantity": 1,
        "startDate": "2026-02-01",
        "endDate": "2026-02-05"
      }
    ]
  }'
```

2. **Initiate payment**
```bash
curl -X POST http://localhost:5000/api/payments/create-order \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "orderId": 1 }'
```

3. **Use Razorpay test card in checkout modal**

4. **Verify order status**
```bash
curl http://localhost:5000/api/orders/1 \
  -H "Authorization: Bearer <token>"
```

## Database Schema

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
  gateway_response JSONB,
  paid_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Status Values:**
- `PENDING` - Payment initiated
- `SUCCESS` - Payment completed
- `FAILED` - Payment failed
- `REFUNDED` - Payment refunded

## Error Handling

### Common Errors

**"Payment gateway not configured"**
- Missing Razorpay credentials
- Add to .env file

**"Invalid payment signature"**
- Wrong webhook secret
- Tampered payment response
- Verify credentials match

**"Order already confirmed"**
- Duplicate payment attempt
- Check order status before payment

**"Payment not found"**
- Invalid transaction ID
- Payment record missing

**"Refund not eligible"**
- Payment status not SUCCESS
- Amount exceeds paid amount

## Webhook Setup (Production)

### 1. Configure Webhook URL
Dashboard → Webhooks → Create Webhook
- URL: `https://yourdomain.com/api/payments/webhook`
- Active: Yes

### 2. Select Events
- payment.captured
- payment.failed
- payment.authorized
- refund.created

### 3. Copy Webhook Secret
Add to .env:
```env
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 4. Test Webhook
- Use Razorpay dashboard webhook tester
- Verify signature validation
- Check logs for errors

## Troubleshooting

### Payment Not Processing
1. Check Razorpay credentials in .env
2. Verify order status is PENDING
3. Check invoice exists for order
4. Review payment service logs

### Webhook Not Triggering
1. Verify webhook URL is correct
2. Ensure HTTPS is enabled
3. Check webhook secret matches
4. Review Razorpay dashboard logs

### Signature Verification Failing
1. Verify RAZORPAY_KEY_SECRET is correct
2. Check webhook secret for webhooks
3. Ensure no spaces in credentials
4. Test with Razorpay test mode first

## Next Steps

1. **Frontend Checkout Flow** - Complete checkout page with cart
2. **Payment Analytics** - Revenue dashboard
3. **Automated Reminders** - Pending payment emails
4. **International Support** - Add Stripe integration
5. **Subscription Support** - Recurring payments

## Support

For Razorpay documentation: https://razorpay.com/docs/

For issues:
- Check test script output
- Review server logs
- Verify credentials
- Test with Razorpay test cards

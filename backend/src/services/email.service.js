const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Only verify email service if credentials are configured
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('Email service error:', error);
    } else {
      console.log('✅ Email service ready');
    }
  });
} else {
  console.log('⚠️  Email service disabled (SMTP credentials not configured)');
}

async function sendEmail({ to, subject, html, text }) {
  // Skip sending if credentials not configured (development mode)
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`📧 [DEV] Email skipped - To: ${to}, Subject: ${subject}`);
    return { success: true, skipped: true, reason: 'No SMTP credentials configured' };
  }

  try {
    const mailOptions = {
      from: `"${process.env.APP_NAME || 'Rental ERP'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('📧 Email send error:', error.message);
    return { success: false, error: error.message };
  }
}

async function sendWelcomeEmail(user) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Rental ERP!</h1>
        </div>
        <div class="content">
          <p>Hi ${user.name},</p>
          <p>Thank you for registering! We're excited to have you on board.</p>
          <p>You can now browse our products and start renting equipment.</p>
          <a href="${process.env.FRONTEND_URL}/products" class="button">Browse Products</a>
        </div>
        <div class="footer">
          <p>If you have any questions, feel free to contact us.</p>
          <p>&copy; ${new Date().getFullYear()} Rental ERP. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Welcome to Rental ERP!',
    html
  });
}

async function sendOrderConfirmationEmail(order, customer) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .order-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .order-item { border-bottom: 1px solid #e5e7eb; padding: 10px 0; }
        .total { font-size: 18px; font-weight: bold; margin-top: 15px; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmed!</h1>
        </div>
        <div class="content">
          <p>Hi ${customer.name},</p>
          <p>Your order has been confirmed successfully.</p>
          
          <div class="order-details">
            <h3>Order #${order.order_number}</h3>
            <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p class="total">Total: ₹${parseFloat(order.total_amount).toFixed(2)}</p>
          </div>
          <p>We'll notify you when your order is ready for pickup.</p>
          <a href="${process.env.FRONTEND_URL}/orders/${order.id}" class="button">View Order Details</a>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Rental ERP. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: customer.email,
    subject: `Order Confirmation - #${order.order_number}`,
    html
  });
}

async function sendPaymentConfirmationEmail(payment, order, customer) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .payment-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Payment Received</h1>
        </div>
        <div class="content">
          <p>Hi ${customer.name},</p>
          <p>We've received your payment successfully.</p>
          
          <div class="payment-details">
            <h3>Payment Details</h3>
            <p><strong>Amount:</strong> ₹${parseFloat(payment.amount).toFixed(2)}</p>
            <p><strong>Payment ID:</strong> ${payment.payment_id}</p>
            <p><strong>Order:</strong> #${order.order_number}</p>
            <p><strong>Date:</strong> ${new Date(payment.created_at).toLocaleDateString()}</p>
          </div>
          <p>Your order is now being processed.</p>
          <a href="${process.env.FRONTEND_URL}/orders/${order.id}" class="button">View Order</a>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Rental ERP. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: customer.email,
    subject: `Payment Confirmation - ₹${parseFloat(payment.amount).toFixed(2)}`,
    html
  });
}

async function sendPickupReminderEmail(order, customer) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .reminder-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Pickup Reminder</h1>
        </div>
        <div class="content">
          <p>Hi ${customer.name},</p>
          
          <div class="reminder-box">
            <h3>Your order is ready for pickup!</h3>
            <p><strong>Order:</strong> #${order.order_number}</p>
            <p>Please arrange to pick up your rental equipment at your earliest convenience.</p>
          </div>
          <a href="${process.env.FRONTEND_URL}/orders/${order.id}" class="button">View Order Details</a>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Rental ERP. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: customer.email,
    subject: `Pickup Reminder - Order #${order.order_number}`,
    html
  });
}

async function sendReturnReminderEmail(order, customer, daysRemaining) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .reminder-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Return Reminder</h1>
        </div>
        <div class="content">
          <p>Hi ${customer.name},</p>
          
          <div class="reminder-box">
            <h3>Return Due Soon!</h3>
            <p><strong>Order:</strong> #${order.order_number}</p>
            <p><strong>Days Remaining:</strong> ${daysRemaining}</p>
            <p>Please return your rental equipment on time to avoid late fees.</p>
          </div>
          <a href="${process.env.FRONTEND_URL}/orders/${order.id}" class="button">View Order Details</a>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Rental ERP. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: customer.email,
    subject: `Return Reminder - Order #${order.order_number} (${daysRemaining} days left)`,
    html
  });
}

async function sendQuotationStatusEmail(quotation, customer, status) {
  const statusColors = {
    APPROVED: { bg: '#10b981', text: 'Approved' },
    REJECTED: { bg: '#ef4444', text: 'Rejected' }
  };
  const statusInfo = statusColors[status] || { bg: '#6b7280', text: status };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${statusInfo.bg}; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .status-box { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Quotation ${statusInfo.text}</h1>
        </div>
        <div class="content">
          <p>Hi ${customer.name},</p>
          <p>Your quotation request has been ${statusInfo.text.toLowerCase()}.</p>
          
          <div class="status-box">
            <h3>Quotation #${quotation.id}</h3>
            <p><strong>Status:</strong> ${statusInfo.text}</p>
            ${status === 'APPROVED' ? `<p><strong>Total Amount:</strong> ₹${parseFloat(quotation.total_amount).toFixed(2)}</p>` : ''}
          </div>
          ${status === 'APPROVED' ? '<p>You can now proceed to create an order from this quotation.</p>' : ''}
          <a href="${process.env.FRONTEND_URL}/quotations/${quotation.id}" class="button">View Quotation</a>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Rental ERP. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: customer.email,
    subject: `Quotation ${statusInfo.text} - #${quotation.id}`,
    html
  });
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendPaymentConfirmationEmail,
  sendPickupReminderEmail,
  sendReturnReminderEmail,
  sendQuotationStatusEmail
};

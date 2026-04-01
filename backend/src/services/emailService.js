// backend/src/services/emailService.js
import createTransporter from '../config/email.js';
import {
  sellerRegistrationEmail,
  sellerApprovalEmail,
  sellerRejectionEmail,
  adminNewSellerNotification,
  orderStatusUpdateEmail,
  lowStockEmail,
  otpEmail, // Added for OTP functionality
} from '../utils/emailTemplates.js';

/**
 * Send email function
 */
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'AgriShop',
        address: process.env.EMAIL_USER
      },
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send registration email to new seller
 */
export const sendSellerRegistrationEmail = async (sellerEmail, sellerName, role) => {
  const { subject, html } = sellerRegistrationEmail(sellerName, role);
  return await sendEmail(sellerEmail, subject, html);
};

/**
 * Send approval email to seller
 */
export const sendSellerApprovalEmail = async (sellerEmail, sellerName, role) => {
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const { subject, html } = sellerApprovalEmail(sellerName, role, loginUrl);
  return await sendEmail(sellerEmail, subject, html);
};

/**
 * Send rejection email to seller
 */
export const sendSellerRejectionEmail = async (sellerEmail, sellerName, role, reason) => {
  const { subject, html } = sellerRejectionEmail(sellerName, role, reason);
  return await sendEmail(sellerEmail, subject, html);
};

/**
 * Notify admin about new seller registration
 */
export const sendAdminNewSellerNotification = async (sellerName, sellerEmail, role) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  const { subject, html } = adminNewSellerNotification(sellerName, sellerEmail, role);
  return await sendEmail(adminEmail, subject, html);
};

/**
 * Send order status update email
 */
export const sendOrderStatusUpdateEmail = async (email, name, orderNumber, status, trackingNumber) => {
  const { subject, html } = orderStatusUpdateEmail(name, orderNumber, status, trackingNumber);
  return await sendEmail(email, subject, html);
};

/**
 * Send low stock alert email to supplier
 */
export const sendLowStockEmail = async (email, name, productName, currentStock, threshold = 150) => {
  const { subject, html } = lowStockEmail(name, productName, currentStock, threshold);
  return await sendEmail(email, subject, html);
};

/**
 * Send OTP email for password reset
 */
export const sendOTPEmail = async (email, otp) => {
  const { subject, html } = otpEmail(otp);
  return await sendEmail(email, subject, html);
};

export default sendEmail;
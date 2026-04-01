// backend/src/utils/emailTemplates.js

/**
 * Email template for new seller registration (pending approval)
 */
export const sellerRegistrationEmail = (name, role) => {
  return {
    subject: 'Registration Successful - Pending Approval',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .header {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header-icon {
            width: 60px;
            height: 60px;
            background: white;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 15px;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #16a34a;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .info-box {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .icon-list {
            list-style: none;
            padding: 0;
          }
          .icon-list li {
            padding: 8px 0;
            display: flex;
            align-items: center;
          }
          .icon-list li:before {
            content: "✓";
            background: #16a34a;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-right: 10px;
            font-weight: bold;
            flex-shrink: 0;
          }
          .contact-info {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
          }
          .contact-item {
            display: flex;
            align-items: center;
            margin: 8px 0;
          }
          .contact-icon {
            width: 20px;
            height: 20px;
            margin-right: 10px;
            color: #16a34a;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h1 style="margin: 0;">Welcome to AgriShop</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            
            <p>Thank you for registering as a <strong>${role}</strong> on AgriShop!</p>
            
            <div class="info-box">
              <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" style="margin-right: 10px;">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <strong>Account Status: Pending Approval</strong>
              </div>
              <p style="margin: 10px 0 0 34px;">
                Your account is currently under review by our admin team. 
                This typically takes 24-48 hours.
              </p>
            </div>
            
            <h3>What happens next?</h3>
            <ul class="icon-list">
              <li>Our team will review your registration details</li>
              <li>We'll verify your business information</li>
              <li>You'll receive an email once approved</li>
              <li>After approval, you can start listing products</li>
            </ul>
            
            <h3>Need Help?</h3>
            <p>If you have any questions, feel free to contact our support team:</p>
            
            <div class="contact-info">
              <div class="contact-item">
                <svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span>support@agrishop.com</span>
              </div>
              <div class="contact-item">
                <svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span>+91 1234567890</span>
              </div>
            </div>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>The AgriShop Team</strong>
            </p>
          </div>
          <div class="footer">
            <p>© 2026 AgriShop. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

/**
 * Email template for seller approval
 */
export const sellerApprovalEmail = (name, role, loginUrl) => {
  return {
    subject: 'Account Approved - Start Selling Now!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .header {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header-icon {
            width: 60px;
            height: 60px;
            background: white;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 15px;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            padding: 15px 40px;
            background-color: #16a34a;
            color: white !important;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: bold;
            text-align: center;
          }
          .success-box {
            background-color: #dcfce7;
            border-left: 4px solid #16a34a;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .steps-list {
            counter-reset: step-counter;
            list-style: none;
            padding: 0;
          }
          .steps-list li {
            counter-increment: step-counter;
            padding: 12px 0;
            display: flex;
            align-items: flex-start;
          }
          .steps-list li:before {
            content: counter(step-counter);
            background: #16a34a;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            font-weight: bold;
            flex-shrink: 0;
          }
          .tips-list {
            list-style: none;
            padding: 0;
          }
          .tips-list li {
            padding: 8px 0;
            display: flex;
            align-items: center;
          }
          .tips-list li:before {
            content: "";
            width: 8px;
            height: 8px;
            background: #16a34a;
            border-radius: 50%;
            display: inline-block;
            margin-right: 12px;
            flex-shrink: 0;
          }
          .contact-info {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
          }
          .contact-item {
            display: flex;
            align-items: center;
            margin: 8px 0;
          }
          .contact-icon {
            width: 20px;
            height: 20px;
            margin-right: 10px;
            color: #16a34a;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h1 style="margin: 0;">Congratulations!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name}!</h2>
            
            <div class="success-box">
              <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" style="margin-right: 10px;">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <strong>Your ${role} account has been approved!</strong>
              </div>
              <p style="margin: 10px 0 0 34px;">
                You can now start listing your products and reach thousands of customers.
              </p>
            </div>
            
            <h3>Get Started:</h3>
            <ol class="steps-list">
              <li><strong>Login to your account</strong> using the button below</li>
              <li><strong>Complete your profile</strong> with business details</li>
              <li><strong>Add your first product</strong> to start selling</li>
              <li><strong>Manage orders</strong> and grow your business</li>
            </ol>
            
            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">
                <span style="display: inline-flex; align-items: center;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                  </svg>
                  Login to Dashboard
                </span>
              </a>
            </div>
            
            <h3>Quick Tips:</h3>
            <ul class="tips-list">
              <li>Add clear product images</li>
              <li>Set competitive prices</li>
              <li>Write detailed descriptions</li>
              <li>Keep stock updated</li>
            </ul>
            
            <h3>Need Help?</h3>
            <p>Check out our seller guide or contact support:</p>
            
            <div class="contact-info">
              <div class="contact-item">
                <svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span>support@agrishop.com</span>
              </div>
              <div class="contact-item">
                <svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span>+91 1234567890</span>
              </div>
              <div class="contact-item">
                <svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <a href="${loginUrl}/help" style="color: #16a34a; text-decoration: none;">Seller Guide</a>
              </div>
            </div>
            
            <p style="margin-top: 30px;">
              We're excited to have you onboard!<br>
              <strong>The AgriShop Team</strong>
            </p>
          </div>
          <div class="footer">
            <p>© 2026 AgriShop. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

/**
 * Email template for seller rejection
 */
export const sellerRejectionEmail = (name, role, reason) => {
  return {
    subject: 'Account Registration - Action Required',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .header {
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header-icon {
            width: 60px;
            height: 60px;
            background: white;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 15px;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .warning-box {
            background-color: #fee2e2;
            border-left: 4px solid #dc2626;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .action-list {
            list-style: none;
            padding: 0;
          }
          .action-list li {
            padding: 10px 0;
            display: flex;
            align-items: flex-start;
          }
          .action-list li:before {
            content: "→";
            color: #dc2626;
            font-weight: bold;
            font-size: 20px;
            margin-right: 12px;
            flex-shrink: 0;
          }
          .contact-info {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
          }
          .contact-item {
            display: flex;
            align-items: center;
            margin: 8px 0;
          }
          .contact-icon {
            width: 20px;
            height: 20px;
            margin-right: 10px;
            color: #dc2626;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h1 style="margin: 0;">Registration Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            
            <p>Thank you for your interest in becoming a ${role} on AgriShop.</p>
            
            <div class="warning-box">
              <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" style="margin-right: 10px;">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <strong>Your registration was not approved</strong>
              </div>
              ${reason ? `<p style="margin: 10px 0 0 34px;"><strong>Reason:</strong> ${reason}</p>` : ''}
            </div>
            
            <h3>What can you do?</h3>
            <ul class="action-list">
              <li>Contact our support team for clarification</li>
              <li>Resubmit with correct information</li>
              <li>Call us for assistance</li>
            </ul>
            
            <h3>Contact Support:</h3>
            <div class="contact-info">
              <div class="contact-item">
                <svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span>support@agrishop.com</span>
              </div>
              <div class="contact-item">
                <svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span>+91 1234567890</span>
              </div>
            </div>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>The AgriShop Team</strong>
            </p>
          </div>
          <div class="footer">
            <p>© 2026 AgriShop. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

/**
 * Email template for admin notification (new seller registration)
 */
export const adminNewSellerNotification = (sellerName, sellerEmail, role) => {
  return {
    subject: `New ${role} Registration - Approval Required`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #f9f9f9;
          }
          .header { 
            background: #1f2937; 
            color: white; 
            padding: 20px; 
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .header-icon {
            width: 50px;
            height: 50px;
            background: white;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 10px;
          }
          .content { 
            background: white; 
            padding: 20px; 
            border-radius: 0 0 8px 8px;
          }
          .info-box { 
            background: #f3f4f6; 
            padding: 15px; 
            margin: 15px 0; 
            border-radius: 5px;
            border-left: 4px solid #16a34a;
          }
          .info-row {
            display: flex;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            font-weight: bold;
            width: 100px;
            color: #6b7280;
          }
          .info-value {
            flex: 1;
            color: #1f2937;
          }
          .button {
            display: inline-block;
            background: #16a34a;
            color: white !important;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin-top: 15px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-icon">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1f2937" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h2 style="margin: 0;">New Seller Registration</h2>
          </div>
          <div class="content">
            <p><strong>A new ${role} has registered and needs approval:</strong></p>
            
            <div class="info-box">
              <div class="info-row">
                <div class="info-label">Name:</div>
                <div class="info-value">${sellerName}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Email:</div>
                <div class="info-value">${sellerEmail}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Role:</div>
                <div class="info-value">${role}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Date:</div>
                <div class="info-value">${new Date().toLocaleString()}</div>
              </div>
            </div>
            
            <p>Please review and approve/reject this registration from the admin panel.</p>
            
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/admin/user-approval" class="button">
                  <span style="display: inline-flex; align-items: center;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                      <path d="M9 11l3 3L22 4"></path>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                    Review Registration
                  </span>
                </a>
              </div>
              
              <div class="footer">
            <p>© 2026 AgriShop Admin Panel</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
  };
};

// ========================================
// WHOLESALE INQUIRY EMAIL TEMPLATES
// ========================================

/**
 * Email template for supplier when new wholesale inquiry is received
 */
export const wholesaleInquiryReceivedTemplate = (supplierName, customerName, productName, quantity, unit, message, inquiryNumber) => {
  return {
    subject: `New Bulk Order Inquiry #${inquiryNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
          .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; padding: 15px 40px; background-color: #2563eb; color: white !important; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🏭 New Bulk Order Inquiry</h1>
          </div>
          <div class="content">
            <h2>Hello ${supplierName}!</h2>
            <p>You have received a new bulk order inquiry from a customer.</p>
            
            <div class="info-box">
              <p><strong>Inquiry #${inquiryNumber}</strong></p>
              <p><strong>Customer:</strong> ${customerName}</p>
              <p><strong>Product:</strong> ${productName}</p>
              <p><strong>Quantity:</strong> ${quantity} ${unit}</p>
              <p><strong>Customer Message:</strong></p>
              <p style="background: white; padding: 10px; border-radius: 4px;">${message}</p>
            </div>
            
            <p>Please review this inquiry and send your quote with pricing and delivery terms.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/supplier/wholesale-inquiries" class="button">View & Respond</a>
            </div>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>The AgriShop Team</strong></p>
          </div>
          <div class="footer"><p>© 2026 AgriShop. All rights reserved.</p></div>
        </div>
      </body>
      </html>
    `
  };
};

/**
 * Email template for customer when supplier sends quote
 */
export const wholesaleQuoteReceivedTemplate = (customerName, supplierName, productName, quantity, unit, quotedPrice, message, inquiryNumber, expiresAt, selectedVariants) => {
  const expiryDate = new Date(expiresAt).toLocaleString();
  
  // Format variants breakdown for the email
  const variantsHtml = selectedVariants && selectedVariants.length > 0 
    ? `<div style="margin-top: 15px; border-top: 1px dashed #16a34a; pt-10px;">
        <p style="font-size: 12px; color: #666; font-weight: bold; text-transform: uppercase;">Itemized Quote Breakdown:</p>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          ${selectedVariants.map(v => `
            <tr>
              <td style="padding: 5px 0; color: #333;">${v.size} Bag</td>
              <td style="padding: 5px 0; text-align: center; color: #666;">x ${v.quantity}</td>
              <td style="padding: 5px 0; text-align: right; font-weight: bold; color: #16a34a;">₹${(v.price * v.quantity).toLocaleString()}</td>
            </tr>
          `).join('')}
        </table>
      </div>`
    : '';

  return {
    subject: `Quote Received for Inquiry #${inquiryNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
          .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
          .price-box { background: #dcfce7; border: 2px solid #16a34a; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
          .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; padding: 15px 40px; background-color: #16a34a; color: white !important; text-decoration: none; border-radius: 8px; margin: 10px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">💰 Quote Received!</h1>
          </div>
          <div class="content">
            <h2>Hello ${customerName}!</h2>
            <p>${supplierName} has sent you a quote for your bulk order inquiry.</p>
            
            <div class="price-box">
              <h3 style="margin: 0 0 10px 0; color: #16a34a;">Quoted Price</h3>
              <p style="font-size: 32px; font-weight: bold; margin: 0; color: #15803d;">₹${quotedPrice.toLocaleString()}</p>
              <p style="margin: 5px 0 0 0; color: #666;">For ${quantity} ${unit} of ${productName}</p>
              ${variantsHtml}
            </div>
            
            <p><strong>Supplier Message:</strong></p>
            <p style="background: #f3f4f6; padding: 15px; border-radius: 4px;">${message}</p>
            
            <div class="info-box">
              <p style="margin: 0;">⏰ <strong>This quote expires on ${expiryDate}</strong></p>
              <p style="margin: 5px 0 0 0; font-size: 14px;">Please accept or reject within 48 hours.</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/wholesale-inquiries" class="button">Accept Quote</a>
            </div>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>The AgriShop Team</strong></p>
          </div>
          <div class="footer"><p>© 2026 AgriShop. All rights reserved.</p></div>
        </div>
      </body>
      </html>
    `
  };
};

/**
 * Email template for supplier when customer accepts quote
 */
export const wholesaleQuoteAcceptedTemplate = (supplierName, customerName, customerEmail, customerPhone, productName, quantity, unit, quotedPrice, inquiryNumber) => {
  return {
    subject: `Quote Accepted! Inquiry #${inquiryNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
          .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-box { background: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .contact-box { background: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">✅ Quote Accepted!</h1>
          </div>
          <div class="content">
            <h2>Hello ${supplierName}!</h2>
            <p>Great news! ${customerName} has accepted your quote.</p>
            
            <div class="success-box">
              <p><strong>Inquiry #${inquiryNumber}</strong></p>
              <p><strong>Product:</strong> ${productName}</p>
              <p><strong>Quantity:</strong> ${quantity} ${unit}</p>
              <p><strong>Quoted Price:</strong> ₹${quotedPrice.toLocaleString()}</p>
            </div>
            
            <h3>Customer Contact Information:</h3>
            <div class="contact-box">
              <p><strong>Name:</strong> ${customerName}</p>
              <p><strong>Email:</strong> ${customerEmail}</p>
              ${customerPhone ? `<p><strong>Phone:</strong> ${customerPhone}</p>` : ''}
            </div>
            
            <p>Please contact the customer to finalize the order details and arrange delivery.</p>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>The AgriShop Team</strong></p>
          </div>
          <div class="footer"><p>© 2026 AgriShop. All rights reserved.</p></div>
        </div>
      </body>
      </html>
    `
  };
};

/**
 * Email template for supplier when customer rejects quote
 */
export const wholesaleQuoteRejectedTemplate = (supplierName, customerName, productName, quantity, unit, inquiryNumber) => {
  return {
    subject: `Quote Declined - Inquiry #${inquiryNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Quote Declined</h1>
          </div>
          <div class="content">
            <h2>Hello ${supplierName},</h2>
            <p>Unfortunately, ${customerName} has declined your quote for inquiry #${inquiryNumber}.</p>
            
            <div class="info-box">
              <p><strong>Product:</strong> ${productName}</p>
              <p><strong>Quantity:</strong> ${quantity} ${unit}</p>
            </div>
            
            <p>Thank you for your time and effort. We hope to see more successful transactions in the future.</p>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>The AgriShop Team</strong></p>
          </div>
          <div class="footer"><p>© 2026 AgriShop. All rights reserved.</p></div>
        </div>
      </body>
      </html>
    `
  };
};

/**
 * Email template for customer when supplier rejects inquiry
 */
export const wholesaleInquiryRejectedTemplate = (customerName, supplierName, productName, quantity, unit, rejectionReason, inquiryNumber) => {
  return {
    subject: `Bulk Order Inquiry Declined - #${inquiryNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; padding: 15px 40px; background-color: #16a34a; color: white !important; text-decoration: none; border-radius: 8px; margin: 10px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Inquiry Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${customerName},</h2>
            <p>Unfortunately, ${supplierName} is unable to fulfill your bulk order inquiry at this time.</p>
            
            <div class="info-box">
              <p><strong>Inquiry #${inquiryNumber}</strong></p>
              <p><strong>Product:</strong> ${productName}</p>
              <p><strong>Quantity:</strong> ${quantity} ${unit}</p>
              ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
            </div>
            
            <p>You can try submitting a new inquiry to other suppliers or purchase from retailers.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/products" class="button">Browse Products</a>
            </div>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>The AgriShop Team</strong></p>
          </div>
          <div class="footer"><p>© 2026 AgriShop. All rights reserved.</p></div>
        </div>
      </body>
      </html>
    `
  };
};

/**
 * Email template for customer when acceptance is about to expire (24h warning)
 */
export const wholesaleAcceptanceExpiringTemplate = (customerName, productName, quantity, unit, quotedPrice, inquiryNumber, expiresAt) => {
  const expiryDate = new Date(expiresAt).toLocaleString();
  return {
    subject: `⏰ Quote Expiring Soon - Inquiry #${inquiryNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
          .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; padding: 15px 40px; background-color: #f59e0b; color: white !important; text-decoration: none; border-radius: 8px; margin: 10px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">⏰ Quote Expiring Soon!</h1>
          </div>
          <div class="content">
            <h2>Hello ${customerName}!</h2>
            <p>This is a reminder that your quote for inquiry #${inquiryNumber} will expire soon.</p>
            
            <div class="warning-box">
              <p style="font-size: 18px; font-weight: bold; margin: 0 0 10px 0; color: #d97706;">⏰ Expires on ${expiryDate}</p>
              <p><strong>Product:</strong> ${productName}</p>
              <p><strong>Quantity:</strong> ${quantity} ${unit}</p>
              <p><strong>Quoted Price:</strong> ₹${quotedPrice.toLocaleString()}</p>
            </div>
            
            <p>Please accept the quote before it expires, or you'll need to submit a new inquiry.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/wholesale-inquiries" class="button">Accept Quote Now</a>
            </div>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>The AgriShop Team</strong></p>
          </div>
          <div class="footer"><p>© 2026 AgriShop. All rights reserved.</p></div>
        </div>
      </body>
      </html>
    `
  };
};

/**
 * Email template for customer when acceptance has expired
 */
export const wholesaleAcceptanceExpiredTemplate = (customerName, productName, quantity, unit, inquiryNumber) => {
  return {
    subject: `Quote Expired - Inquiry #${inquiryNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
          .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: #f3f4f6; border-left: 4px solid #6b7280; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; padding: 15px 40px; background-color: #16a34a; color: white !important; text-decoration: none; border-radius: 8px; margin: 10px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Quote Expired</h1>
          </div>
          <div class="content">
            <h2>Hello ${customerName},</h2>
            <p>The quote for your bulk order inquiry #${inquiryNumber} has expired.</p>
            
            <div class="info-box">
              <p><strong>Product:</strong> ${productName}</p>
              <p><strong>Quantity:</strong> ${quantity} ${unit}</p>
            </div>
            
            <p>If you're still interested in this bulk order, please submit a new inquiry.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/products" class="button">Submit New Inquiry</a>
            </div>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>The AgriShop Team</strong></p>
          </div>
          <div class="footer"><p>© 2026 AgriShop. All rights reserved.</p></div>
        </div>
      </body>
      </html>
    `
  };
};

/**
 * Email template for order completion confirmation (sent to both customer and supplier)
 */
export const wholesaleOrderCompletedTemplate = (recipientName, isSupplier, customerName, supplierName, productName, quantity, unit, totalPrice, orderNumber, inquiryNumber) => {
  return {
    subject: `Order Confirmed - #${orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
          .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-box { background: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .order-details { background: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">✅ Order Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Hello ${recipientName}!</h2>
            <p>${isSupplier ? 'You have received a new bulk order!' : 'Your bulk order has been confirmed!'}</p>
            
            <div class="success-box">
              <p style="font-size: 18px; font-weight: bold; margin: 0 0 10px 0; color: #15803d;">Order #${orderNumber}</p>
              <p style="font-size: 14px; color: #666; margin: 0;">From Inquiry #${inquiryNumber}</p>
            </div>
            
            <h3>Order Details:</h3>
            <div class="order-details">
              ${isSupplier ? `<p><strong>Customer:</strong> ${customerName}</p>` : `<p><strong>Supplier:</strong> ${supplierName}</p>`}
              <p><strong>Product:</strong> ${productName}</p>
              <p><strong>Quantity:</strong> ${quantity} ${unit}</p>
              <p><strong>Total Price:</strong> ₹${totalPrice.toLocaleString()}</p>
            </div>
            
            <p>${isSupplier ? 'Please prepare the order and contact the customer to arrange delivery.' : 'The supplier will contact you soon to arrange delivery.'}</p>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>The AgriShop Team</strong></p>
          </div>
          <div class="footer"><p>© 2026 AgriShop. All rights reserved.</p></div>
        </div>
      </body>
      </html>
    `
  };
};
/**
 * Email template for order status updates (Sent to Customers)
 */
export const orderStatusUpdateEmail = (customerName, orderNumber, status, trackingNumber) => {
  const statusColors = {
    confirmed: '#16a34a',
    processing: '#2563eb',
    shipped: '#7c3aed',
    delivered: '#059669',
    cancelled: '#dc2626'
  };

  const statusIcons = {
    confirmed: '✅',
    processing: '⚙️',
    shipped: '🚚',
    delivered: '🎁',
    cancelled: '❌'
  };

  const color = statusColors[status] || '#16a34a';
  const icon = statusIcons[status] || '📦';

  return {
    subject: `Order #${orderNumber} Status Updated: ${status.toUpperCase()}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
          .header { background: ${color}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-badge { display: inline-block; padding: 8px 16px; background-color: ${color}; color: white; border-radius: 20px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; }
          .info-box { background: #f3f4f6; border-left: 4px solid ${color}; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; padding: 15px 40px; background-color: ${color}; color: white !important; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">${icon} Order Updated</h1>
          </div>
          <div class="content">
            <h2>Hello ${customerName}!</h2>
            <p>The status of your order <strong>#${orderNumber}</strong> has been updated.</p>
            
            <div style="text-align: center;">
              <span class="status-badge">${status}</span>
            </div>
            
            <div class="info-box">
              <p><strong>Order Number:</strong> #${orderNumber}</p>
              <p><strong>New Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
              ${trackingNumber ? `<p><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ''}
            </div>
            
            <p>You can track your order progress on your dashboard.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/customer/orders" class="button">View Order Status</a>
            </div>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>The AgriShop Team</strong></p>
          </div>
          <div class="footer"><p>© 2026 AgriShop. All rights reserved.</p></div>
        </div>
      </body>
      </html>
    `
  };
};

/**
 * Email template for order status updates (Sent to Retailers from Suppliers)
 */
export const orderStatusUpdateForRetailerEmail = (retailerName, orderNumber, status, trackingNumber) => {
  return orderStatusUpdateEmail(retailerName, orderNumber, status, trackingNumber); // Same template, just different link potentially
};

/**
 * Email template for supplier low stock alert
 */
export const lowStockEmail = (name, productName, currentStock, threshold) => {
  return {
    subject: `🚨 Urgent: Low Stock Alert for ${productName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
          .warning-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #ef4444; color: white !important; text-decoration: none; border-radius: 5px; margin: 15px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">⚠️ Low Stock Alert</h2>
          </div>
          <div class="content">
            <h3>Hello ${name},</h3>
            <p>This is an automated alert to notify you that one of your products is running critically low on stock.</p>
            
            <div class="warning-box">
              <h3 style="margin-top:0; color:#b91c1c;">${productName}</h3>
              <p><strong>Current Stock:</strong> ${currentStock} units</p>
              <p><strong>Alert Threshold:</strong> ${threshold} units</p>
            </div>
            
            <p>Please restock this item as soon as possible to avoid losing potential sales and to fulfill any unconfirmed bulk orders.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/supplier/products" class="button">Update Inventory Now</a>
            </div>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>The AgriShop System</strong></p>
          </div>
          <div class="footer"><p>© 2026 AgriShop. Automated System Notification.</p></div>
        </div>
      </body>
      </html>
    `
  };
};
/**
 * Email template for OTP-based password reset
 */
export const otpEmail = (otp) => {
  return {
    subject: 'Your AgriShop Password Reset OTP',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
          .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; text-align: center; }
          .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #16a34a; margin: 20px 0; padding: 15px; background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 8px; display: inline-block; }
          .timer { font-size: 14px; color: #666; margin-top: 10px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Password Reset OTP</h1>
          </div>
          <div class="content">
            <h2>Hello!</h2>
            <p>You requested a password reset for your AgriShop account. Use the following OTP code to verify your identity:</p>
            <div class="otp-code">${otp}</div>
            <p class="timer">This OTP is valid for <strong>10 minutes</strong>.</p>
            <p>If you didn't request this, please ignore this email or contact support.</p>
            <p style="margin-top: 30px;">Best regards,<br><strong>The AgriShop Team</strong></p>
          </div>
          <div class="footer"><p>© 2026 AgriShop. All rights reserved.</p></div>
        </div>
      </body>
      </html>
    `
  };
};

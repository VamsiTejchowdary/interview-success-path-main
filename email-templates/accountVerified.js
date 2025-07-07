export const accountVerifiedTemplate = (userName, userRole) => ({
  subject: 'Account Verified - Payment Required | JobSmartly',
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Verified - JobSmartly</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
          font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
          color: #1f2937;
          line-height: 1.6;
        }
        .container {
          max-width: 500px;
          margin: 30px auto;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }
        .header {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          padding: 36px 32px 24px 32px;
          text-align: center;
          position: relative;
        }
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
          opacity: 0.3;
        }
        .header h1 {
          color: #ffffff;
          font-size: 32px;
          font-weight: 800;
          margin: 0 0 8px 0;
          letter-spacing: -1.5px;
          position: relative;
          z-index: 1;
        }
        .header p {
          color: #e0e7ff;
          font-size: 16px;
          margin: 0;
          font-weight: 500;
          position: relative;
          z-index: 1;
        }
        .content {
          padding: 36px 32px 32px 32px;
        }
        .content h2 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 16px 0;
          color: #111827;
          text-align: center;
        }
        .content p {
          font-size: 16px;
          color: #4b5563;
          margin: 0 0 24px 0;
          text-align: center;
        }
        .status {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: #ffffff;
          border-radius: 12px;
          padding: 20px 24px;
          margin: 0 0 24px 0;
          text-align: center;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
          border: 1px solid #f59e0b;
        }
        .status-icon {
          font-size: 20px;
          margin-right: 8px;
        }
        .status-title {
          display: block;
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .status-subtitle {
          font-size: 14px;
          opacity: 0.9;
          font-weight: 500;
        }
        .next-steps {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-left: 4px solid #6366f1;
          border-radius: 10px;
          padding: 24px;
          margin: 0 0 24px 0;
        }
        .next-steps h3 {
          color: #6366f1;
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
        }
        .next-steps h3::before {
          content: '📋';
          margin-right: 8px;
        }
        .next-steps ul {
          padding-left: 0;
          margin: 0;
          list-style: none;
        }
        .next-steps li {
          color: #374151;
          font-size: 15px;
          margin-bottom: 12px;
          padding-left: 24px;
          position: relative;
        }
        .next-steps li::before {
          content: '•';
          color: #6366f1;
          font-weight: bold;
          position: absolute;
          left: 8px;
        }
        .platform {
          background: #eff6ff;
          border: 1px solid #dbeafe;
          border-radius: 12px;
          padding: 20px 24px;
          text-align: center;
          margin: 0 0 24px 0;
        }
        .platform h4 {
          color: #1d4ed8;
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }
        .platform p {
          color: #1e40af;
          font-size: 14px;
          margin: 0;
          line-height: 1.5;
        }
        .approval-time {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 16px 20px;
          text-align: center;
          margin: 0 0 24px 0;
        }
        .approval-time p {
          color: #6b7280;
          font-size: 14px;
          margin: 0;
          font-weight: 500;
        }
        .footer {
          background: #111827;
          color: #ffffff;
          text-align: center;
          padding: 24px 32px 16px 32px;
        }
        .footer h5 {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }
        .footer p {
          font-size: 13px;
          opacity: 0.8;
          margin: 0 0 6px 0;
        }
        .footer .copyright {
          font-size: 11px;
          opacity: 0.5;
          margin-top: 12px;
        }
        
        /* Responsive design */
        @media (max-width: 600px) {
          .container {
            margin: 20px 16px;
          }
          .header {
            padding: 24px 20px 16px 20px;
          }
          .content {
            padding: 24px 20px 20px 20px;
          }
          .footer {
            padding: 20px 20px 12px 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>JobSmartly</h1>
          <p>Connecting Talent with Opportunity</p>
        </div>
        <div class="content">
          <h2>Account Successfully Verified</h2>
          <p>Dear <strong>${userName}</strong>,<br>Your <span style="color:#6366f1;font-weight:600;">${userRole}</span> account has been created and your email is verified.<br>
            ${userRole === 'student' 
              ? 'Prepare to connect with leading companies seeking your unique talents.' 
              : 'You are now ready to engage with top-tier candidates through our innovative platform.'
            }
          </p>
          <div class="status">
            <span class="status-icon">🔒</span>
            <span class="status-title">Account On Hold</span>
            <span class="status-subtitle">Please login and complete payment to unlock all features. Once payment is processed, you'll receive detailed instructions via email.</span>
          </div>
          <!-- Next Steps Section: Only for students, with custom content -->
          ${userRole === 'student' ? `
          <div class="next-steps">
            <h3>Next Steps</h3>
            <ul>
              <li><strong>Login to Your Account:</strong> Access your dashboard and complete the payment process to activate your profile.</li>
              <li><strong>Payment Confirmation:</strong> Once payment is successful, you'll receive a detailed email with setup instructions within 24 hours.</li>
              <li><strong>Profile Activation:</strong> We'll create a dedicated communication channel and guide you through the next steps.</li>
            </ul>
          </div>
          ` : ''}
          <div class="platform">
            <h4>Why JobSmartly?</h4>
            <p>
              ${userRole === 'student' 
                ? 'Our reverse recruiting model empowers you, with employers applying to you.' 
                : 'Access pre-vetted, motivated candidates through our innovative recruitment platform.'
              }
            </p>
          </div>
          <div class="approval-time">
            <p><strong>Next Email:</strong> Detailed instructions will be sent within 24 hours after payment completion</p>
          </div>
        </div>
        <div class="footer">
          <h5>JobSmartly Team</h5>
          <p>Transforming Recruitment for the Future</p>
          <p>Need assistance? Contact our support team at support@jobsmartly.com</p>
          <p class="copyright">© 2025 JobSmartly. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
});
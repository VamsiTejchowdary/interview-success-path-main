export const subscriptionRenewalTemplate = (userName = "there", userRole = "User") => ({
  subject: 'Your Subscription Has Been Renewed!',
  html: `
    <!DOCTYPE html>
    <html lang="en" dir="ltr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Renewed - JobSmartly</title>
      <style>
        body {
          margin: 0;
          padding: 20px 0;
          background: #ffffff;
          font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
          color: #333333;
          line-height: 1.6;
        }
        .container {
          max-width: 500px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }
        .header {
          padding: 20px 24px;
          text-align: center;
          border-bottom: 1px solid #e5e7eb;
        }
        .header img {
          width: 72px;
          height: auto;
          margin: 0 auto;
        }
        .header p {
          color: #666666;
          font-size: 14px;
          margin: 8px 0 0 0;
          font-weight: 500;
        }
        .content {
          padding: 24px;
        }
        .content h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 12px 0;
          color: #059669;
          text-align: center;
        }
        .content p {
          font-size: 14px;
          color: #555555;
          margin: 0 0 16px 0;
          text-align: center;
          line-height: 22px;
        }
        .status {
          background: #ecfdf5;
          color: #059669;
          border-radius: 6px;
          padding: 16px;
          margin: 0 0 20px 0;
          text-align: center;
          font-size: 14px;
          border: 1px solid #bbf7d0;
        }
        .status-icon {
          font-size: 16px;
          margin-right: 6px;
        }
        .status-title {
          display: block;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .status-subtitle {
          font-size: 13px;
          font-weight: 500;
        }
        .cta-button {
          display: block;
          background: #4f46e5;
          color: #ffffff;
          text-align: center;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          margin: 0 auto 20px auto;
          max-width: 250px;
        }
        .footer {
          background: #f8f9fa;
          color: #666666;
          text-align: center;
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
        }
        .footer h5 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 6px 0;
        }
        .footer p {
          font-size: 12px;
          margin: 0 0 4px 0;
        }
        .footer a {
          color: #4f46e5;
          text-decoration: underline;
        }
        .footer .copyright {
          font-size: 11px;
          margin-top: 8px;
        }
        @media (max-width: 600px) {
          .container {
            margin: 16px;
          }
          .header {
            padding: 16px;
          }
          .content {
            padding: 16px;
          }
          .footer {
            padding: 16px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://res.cloudinary.com/dcwnk7s9z/image/upload/v1752174018/b1a2a17b-b3eb-46ff-8ee2-6528160fe25c-copied-media_2_wtccwz.png" alt="JobSmartly" />
          <p>Connecting Talent with Opportunity</p>
        </div>
        <div class="content">
          <h2>Hi, ${userName}!</h2>
          <p>
            Dear <strong>${userName}</strong>,<br />
            Your <span style="color:#059669;font-weight:600;">${userRole}</span> subscription has been <strong>successfully renewed</strong>.<br />
            You can continue enjoying all premium features without interruption.
          </p>
          <div class="status">
            <span class="status-icon">🔄</span>
            <span class="status-title">Subscription Status: Renewed</span>
            <span class="status-subtitle">Thank you for staying with us!</span>
          </div>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://app.jobsmartly.com'}" class="cta-button" style="background: #4f46e5; color: #fff; font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.15); text-align: center; padding: 12px 24px; border-radius: 6px; font-size: 14px; text-decoration: none; display: block; margin: 0 auto 20px auto; max-width: 250px;">
            Go to Dashboard
          </a>
        </div>
        <div class="footer">
          <h5>Team JobSmartly</h5>
          <p>Transforming Recruitment for the Future</p>
          <p>Need help? Contact us at <a href="mailto:support@jobsmartly.com">support@jobsmartly.com</a></p>
          <p class="copyright">© 2025 JobSmartly. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}); 
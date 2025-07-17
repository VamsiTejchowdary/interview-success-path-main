// Subscription cancellation email template
// Usage: subscriptionCancellationTemplate(userEmail, userName, type)
// type: 'request' or 'revoke'

export function subscriptionCancellationTemplate(userEmail, userName = "there", type) {
  let subject, mainMessage, statusTitle, statusSubtitle, statusColor, statusIcon;
  if (type === 'request') {
    subject = 'Subscription Cancellation Requested | JobSmartly';
    mainMessage = `
      <p>
        Dear <strong>${userName}</strong>,<br />
        We have received your request to <span style="color:#e53e3e;font-weight:600;">cancel your subscription</span>.<br />
        Our team will contact you soon to discuss your subscription and next steps.<br />
        If you did not request this, please contact support immediately.
      </p>
    `;
    statusTitle = 'Cancellation Requested';
    statusSubtitle = 'Your cancellation request is being processed. You will retain access until the end of your billing cycle.';
    statusColor = '#fff3cd';
    statusIcon = '⚠️';
  } else {
    subject = 'Subscription Cancellation Revoked | JobSmartly';
    mainMessage = `
      <p>
        Dear <strong>${userName}</strong>,<br />
        You have <span style="color:#38a169;font-weight:600;">revoked your cancellation request</span> and your subscription will remain active.<br />
        Thank you for staying with JobSmartly! If you have any questions, please contact our support team.
      </p>
    `;
    statusTitle = 'Cancellation Revoked';
    statusSubtitle = 'Your subscription will remain active. No further action is required.';
    statusColor = '#d1fae5';
    statusIcon = '✅';
  }

  return {
    subject,
    html: `
      <!DOCTYPE html>
      <html lang="en" dir="ltr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
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
            color: #333333;
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
            background: ${statusColor};
            color: #333333;
            border-radius: 6px;
            padding: 16px;
            margin: 0 0 20px 0;
            text-align: center;
            font-size: 14px;
            border: 1px solid #e5e7eb;
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
            ${mainMessage}
            <div class="status">
              <span class="status-icon">${statusIcon}</span>
              <span class="status-title">${statusTitle}</span>
              <span class="status-subtitle">${statusSubtitle}</span>
            </div>
          </div>
          <div class="footer">
            <h5>JobSmartly Team</h5>
            <p>Transforming Recruitment for the Future</p>
            <p>Need help? Contact us at <a href="mailto:support@jobsmartly.com">support@jobsmartly.com</a></p>
            <p class="copyright">© 2025 JobSmartly. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
} 
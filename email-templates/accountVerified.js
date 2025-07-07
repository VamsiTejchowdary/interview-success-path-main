export const accountVerifiedTemplate = (userName, userRole) => ({
  subject: 'Account Verified - Pending Approval | JobSmartly',
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
          background: linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%);
          font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
          color: #1f2937;
        }
        .container {
          max-width: 480px;
          margin: 40px auto;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 8px 32px rgba(139, 92, 246, 0.10), 0 1.5px 6px rgba(59, 130, 246, 0.08);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%);
          padding: 32px 0 20px 0;
          text-align: center;
        }
        .header h1 {
          color: #fff;
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 6px 0;
          letter-spacing: -1px;
        }
        .header p {
          color: #e0e7ff;
          font-size: 15px;
          margin: 0;
        }
        .content {
          padding: 32px 28px 24px 28px;
        }
        .content h2 {
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #1f2937;
          text-align: center;
        }
        .content p {
          font-size: 15px;
          color: #4b5563;
          margin: 0 0 18px 0;
          text-align: center;
        }
        .status {
          background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
          color: #fff;
          border-radius: 10px;
          padding: 18px 20px;
          margin: 0 0 18px 0;
          text-align: center;
          font-weight: 600;
          font-size: 15px;
        }
        .next-steps {
          background: #f5f3ff;
          border-left: 4px solid #8b5cf6;
          border-radius: 8px;
          padding: 18px 20px;
          margin: 0 0 18px 0;
        }
        .next-steps h3 {
          color: #8b5cf6;
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 10px 0;
        }
        .next-steps ul {
          padding-left: 18px;
          margin: 0;
        }
        .next-steps li {
          color: #4b5563;
          font-size: 14px;
          margin-bottom: 7px;
        }
        .platform {
          background: #eff6ff;
          border-radius: 8px;
          padding: 16px 18px;
          text-align: center;
          margin: 0 0 18px 0;
        }
        .platform h4 {
          color: #3b82f6;
          font-size: 15px;
          font-weight: 700;
          margin: 0 0 6px 0;
        }
        .platform p {
          color: #2563eb;
          font-size: 13px;
          margin: 0;
        }
        .footer {
          background: #1f2937;
          color: #fff;
          text-align: center;
          padding: 20px 0 12px 0;
        }
        .footer h5 {
          font-size: 15px;
          font-weight: 700;
          margin: 0 0 6px 0;
        }
        .footer p {
          font-size: 12px;
          opacity: 0.7;
          margin: 0 0 4px 0;
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
          <p>Dear <strong>${userName}</strong>,<br>Your <span style="color:#8b5cf6;font-weight:600;">${userRole}</span> account has been created and your email is verified.<br>
            ${userRole === 'student' 
              ? 'Prepare to connect with leading companies seeking your unique talents.' 
              : 'You are now ready to engage with top-tier candidates through our innovative platform.'
            }
          </p>
          <div class="status">
            <span>⏳ Account Under Review</span><br>
            Our team is reviewing your profile. You will receive an approval notification within 24-48 hours.
          </div>
          <div class="next-steps">
            <h3>Next Steps</h3>
            <ul>
              <li><strong>Profile Review:</strong> Our team verifies your credentials and profile details.</li>
              <li><strong>Approval Notification:</strong> You will receive an email once there is a status change to <strong>On Hold</strong>. That email will include instructions to make your payment.</li>
              <li><strong>Full Platform Access:</strong> Unlock all JobSmartly features and opportunities.</li>
            </ul>
          </div>
          <div class="platform">
            <h4>Why JobSmartly?</h4>
            <p>
              ${userRole === 'student' 
                ? 'Our reverse recruiting model empowers you, with employers applying to you.' 
                : 'Access pre-vetted, motivated candidates through our innovative recruitment platform.'
              }
            </p>
          </div>
          <div style="text-align:center; margin-bottom: 18px;">
            <p style="color: #6b7280; font-size: 13px; margin: 0;">
              <strong>Estimated Approval Time:</strong> 24-48 hours
            </p>
          </div>
        </div>
        <div class="footer">
          <h5>JobSmartly Team</h5>
          <p>Transforming Recruitment for the Future</p>
          <p>Need assistance? Contact our support team at support@jobsmartly.com.</p>
          <p style="font-size:11px;opacity:0.5;">© 2025 JobSmartly. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
});
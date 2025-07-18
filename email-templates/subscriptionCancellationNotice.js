export function cancellationScheduledTemplate(userName) {
  return {
    subject: 'Your subscription cancellation request has been processed',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Cancellation Scheduled</title>
        <style>
          body { margin: 0; padding: 20px 0; background: #fff; font-family: 'Segoe UI', 'Roboto', Arial, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 500px; margin: 0 auto; background: #fff; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; }
          .header { padding: 20px 24px; text-align: center; border-bottom: 1px solid #e5e7eb; }
          .header img { width: 72px; height: auto; margin: 0 auto; }
          .header p { color: #666; font-size: 14px; margin: 8px 0 0 0; font-weight: 500; }
          .content { padding: 24px; }
          .content h2 { font-size: 20px; font-weight: 600; margin: 0 0 12px 0; color: #eab308; text-align: center; }
          .content p { font-size: 14px; color: #555; margin: 0 0 16px 0; text-align: center; line-height: 22px; }
          .status { background: #fef9c3; color: #a16207; border-radius: 6px; padding: 16px; margin: 0 0 20px 0; text-align: center; font-size: 14px; border: 1px solid #fde68a; }
          .status-icon { font-size: 16px; margin-right: 6px; }
          .status-title { display: block; font-size: 16px; font-weight: 600; margin-bottom: 6px; }
          .status-subtitle { font-size: 13px; font-weight: 500; }
          .footer { background: #f8f9fa; color: #666; text-align: center; padding: 16px 24px; border-top: 1px solid #e5e7eb; }
          .footer h5 { font-size: 16px; font-weight: 600; margin: 0 0 6px 0; }
          .footer p { font-size: 12px; margin: 0 0 4px 0; }
          .footer a { color: #4f46e5; text-decoration: underline; }
          .footer .copyright { font-size: 11px; margin-top: 8px; }
          @media (max-width: 600px) { .container { margin: 16px; } .header { padding: 16px; } .content { padding: 16px; } .footer { padding: 16px; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://res.cloudinary.com/dcwnk7s9z/image/upload/v1752174018/b1a2a17b-b3eb-46ff-8ee2-6528160fe25c-copied-media_2_wtccwz.png" alt="JobSmartly" />
            <p>Connecting Talent with Opportunity</p>
          </div>
          <div class="content">
            <h2>Cancellation Scheduled</h2>
            <p>Hi <strong>${userName}</strong>,</p>
            <div class="status">
              <span class="status-icon">⏳</span>
              <span class="status-title">Access Until End of Billing Cycle</span>
              <span class="status-subtitle">You will continue to have access to all features until your current billing cycle ends.</span>
            </div>
            <p>If you have any questions, please contact support.</p>
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
  };
}

export function cancellationEndedTemplate(userName) {
  return {
    subject: 'Your subscription has ended',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Ended</title>
        <style>
          body { margin: 0; padding: 20px 0; background: #fff; font-family: 'Segoe UI', 'Roboto', Arial, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 500px; margin: 0 auto; background: #fff; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; }
          .header { padding: 20px 24px; text-align: center; border-bottom: 1px solid #e5e7eb; }
          .header img { width: 72px; height: auto; margin: 0 auto; }
          .header p { color: #666; font-size: 14px; margin: 8px 0 0 0; font-weight: 500; }
          .content { padding: 24px; }
          .content h2 { font-size: 20px; font-weight: 600; margin: 0 0 12px 0; color: #ef4444; text-align: center; }
          .content p { font-size: 14px; color: #555; margin: 0 0 16px 0; text-align: center; line-height: 22px; }
          .status { background: #fee2e2; color: #b91c1c; border-radius: 6px; padding: 16px; margin: 0 0 20px 0; text-align: center; font-size: 14px; border: 1px solid #fecaca; }
          .status-icon { font-size: 16px; margin-right: 6px; }
          .status-title { display: block; font-size: 16px; font-weight: 600; margin-bottom: 6px; }
          .status-subtitle { font-size: 13px; font-weight: 500; }
          .footer { background: #f8f9fa; color: #666; text-align: center; padding: 16px 24px; border-top: 1px solid #e5e7eb; }
          .footer h5 { font-size: 16px; font-weight: 600; margin: 0 0 6px 0; }
          .footer p { font-size: 12px; margin: 0 0 4px 0; }
          .footer a { color: #4f46e5; text-decoration: underline; }
          .footer .copyright { font-size: 11px; margin-top: 8px; }
          @media (max-width: 600px) { .container { margin: 16px; } .header { padding: 16px; } .content { padding: 16px; } .footer { padding: 16px; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://res.cloudinary.com/dcwnk7s9z/image/upload/v1752174018/b1a2a17b-b3eb-46ff-8ee2-6528160fe25c-copied-media_2_wtccwz.png" alt="JobSmartly" />
            <p>Connecting Talent with Opportunity</p>
          </div>
          <div class="content">
            <h2>Subscription Ended</h2>
            <p>Hi <strong>${userName}</strong>,</p>
            <div class="status">
              <span class="status-icon">👋</span>
              <span class="status-title">Your Subscription Has Ended</span>
              <span class="status-subtitle">Thank you for being a valuable customer. We’re always here if you want to join back!</span>
            </div>
            <p>If you have any questions, please contact support.</p>
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
  };
}

export function cancellationRevokedTemplate(userName) {
  return {
    subject: 'Your subscription cancellation has been revoked',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cancellation Revoked</title>
        <style>
          body { margin: 0; padding: 20px 0; background: #fff; font-family: 'Segoe UI', 'Roboto', Arial, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 500px; margin: 0 auto; background: #fff; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; }
          .header { padding: 20px 24px; text-align: center; border-bottom: 1px solid #e5e7eb; }
          .header img { width: 72px; height: auto; margin: 0 auto; }
          .header p { color: #666; font-size: 14px; margin: 8px 0 0 0; font-weight: 500; }
          .content { padding: 24px; }
          .content h2 { font-size: 20px; font-weight: 600; margin: 0 0 12px 0; color: #22c55e; text-align: center; }
          .content p { font-size: 14px; color: #555; margin: 0 0 16px 0; text-align: center; line-height: 22px; }
          .status { background: #dcfce7; color: #166534; border-radius: 6px; padding: 16px; margin: 0 0 20px 0; text-align: center; font-size: 14px; border: 1px solid #bbf7d0; }
          .status-icon { font-size: 16px; margin-right: 6px; }
          .status-title { display: block; font-size: 16px; font-weight: 600; margin-bottom: 6px; }
          .status-subtitle { font-size: 13px; font-weight: 500; }
          .footer { background: #f8f9fa; color: #666; text-align: center; padding: 16px 24px; border-top: 1px solid #e5e7eb; }
          .footer h5 { font-size: 16px; font-weight: 600; margin: 0 0 6px 0; }
          .footer p { font-size: 12px; margin: 0 0 4px 0; }
          .footer a { color: #4f46e5; text-decoration: underline; }
          .footer .copyright { font-size: 11px; margin-top: 8px; }
          @media (max-width: 600px) { .container { margin: 16px; } .header { padding: 16px; } .content { padding: 16px; } .footer { padding: 16px; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://res.cloudinary.com/dcwnk7s9z/image/upload/v1752174018/b1a2a17b-b3eb-46ff-8ee2-6528160fe25c-copied-media_2_wtccwz.png" alt="JobSmartly" />
            <p>Connecting Talent with Opportunity</p>
          </div>
          <div class="content">
            <h2>Cancellation Revoked</h2>
            <p>Hi <strong>${userName}</strong>,</p>
            <div class="status">
              <span class="status-icon">✅</span>
              <span class="status-title">Your Subscription Remains Active</span>
              <span class="status-subtitle">You will continue to have access to all features. Thank you for staying with us!</span>
            </div>
            <p>If you have any questions, please contact support.</p>
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
  };
} 
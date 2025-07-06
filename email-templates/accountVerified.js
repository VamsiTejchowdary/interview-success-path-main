export const accountVerifiedTemplate = (userName, userRole) => ({
  subject: 'Account Verified - Pending Approval | Interview Success Path',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4F46E5; margin-bottom: 10px;">🎉 Account Successfully Verified!</h1>
        <p style="color: #6B7280; font-size: 16px;">Welcome to Interview Success Path</p>
      </div>
      
      <div style="background-color: #F8FAFC; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #4F46E5;">
        <h2 style="color: #1F2937; margin-top: 0;">Hi ${userName},</h2>
        <p style="color: #374151; line-height: 1.6;">
          Great news! Your email has been successfully verified. Your account is now created and is currently pending admin approval.
        </p>
      </div>

      <div style="background-color: #FEF3C7; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #F59E0B;">
        <h3 style="color: #92400E; margin-top: 0;">⏳ What's Next?</h3>
        <ul style="color: #92400E; line-height: 1.8;">
          <li><strong>Admin Review:</strong> Our team will review your ${userRole} account</li>
          <li><strong>Approval Notification:</strong> You'll receive an email once approved</li>
          <li><strong>Access Granted:</strong> You'll be able to log in and use all features</li>
        </ul>
      </div>

      <div style="background-color: #ECFDF5; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #059669;">
        <h3 style="color: #065F46; margin-top: 0;">📋 While You Wait</h3>
        <p style="color: #065F46; line-height: 1.6;">
          Prepare for your next steps by gathering your resume and professional information. 
          Once approved, you'll be able to start your career journey immediately!
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <p style="color: #6B7280; font-size: 14px;">
          This process typically takes 24-48 hours. We'll notify you as soon as your account is approved.
        </p>
      </div>

      <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; margin-top: 30px;">
        <p style="color: #6B7280; font-size: 14px; margin-bottom: 5px;">
          Best regards,<br>
          <strong>The Interview Success Path Team</strong>
        </p>
        <p style="color: #9CA3AF; font-size: 12px;">
          If you have any questions, please contact our support team.
        </p>
      </div>
    </div>
  `
}); 
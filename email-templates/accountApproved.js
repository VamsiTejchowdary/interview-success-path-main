export const accountApprovedTemplate = (userName, userRole) => ({
  subject: 'Account Approved! Welcome to Interview Success Path',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #059669; margin-bottom: 10px;">✅ Account Approved!</h1>
        <p style="color: #6B7280; font-size: 16px;">You're all set to start your journey</p>
      </div>
      
      <div style="background-color: #ECFDF5; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #059669;">
        <h2 style="color: #065F46; margin-top: 0;">Congratulations, ${userName}!</h2>
        <p style="color: #065F46; line-height: 1.6;">
          Your ${userRole} account has been approved! You can now log in and access all features.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}" style="background-color: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
          🚀 Get Started Now
        </a>
      </div>

      <div style="background-color: #F8FAFC; padding: 25px; border-radius: 12px; margin: 20px 0;">
        <h3 style="color: #1F2937; margin-top: 0;">What You Can Do Now:</h3>
        <ul style="color: #374151; line-height: 1.8;">
          <li>Complete your profile</li>
          <li>Upload your resume</li>
          <li>Start applying to jobs</li>
          <li>Track your applications</li>
        </ul>
      </div>

      <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; margin-top: 30px;">
        <p style="color: #6B7280; font-size: 14px; margin-bottom: 5px;">
          Best regards,<br>
          <strong>The Interview Success Path Team</strong>
        </p>
      </div>
    </div>
  `
}); 
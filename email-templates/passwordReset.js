export const passwordResetTemplate = (resetLink) => ({
  subject: 'Reset Your Password - Interview Success Path',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #DC2626; margin-bottom: 10px;">🔐 Password Reset Request</h1>
        <p style="color: #6B7280; font-size: 16px;">Secure your account</p>
      </div>
      
      <div style="background-color: #FEF2F2; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #DC2626;">
        <h2 style="color: #991B1B; margin-top: 0;">Reset Your Password</h2>
        <p style="color: #7F1D1D; line-height: 1.6;">
          You requested to reset your password. Click the button below to create a new password:
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #DC2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
          Reset Password
        </a>
      </div>

      <div style="background-color: #F8FAFC; padding: 25px; border-radius: 12px; margin: 20px 0;">
        <h3 style="color: #1F2937; margin-top: 0;">Important Notes:</h3>
        <ul style="color: #374151; line-height: 1.8;">
          <li>This link will expire in 1 hour</li>
          <li>If you didn't request this, please ignore this email</li>
          <li>For security, this link can only be used once</li>
        </ul>
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
export const passwordResetTemplate = (resetLink) => ({
  subject: 'Reset Your Password - Interview Success Path',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #dc2626; margin-bottom: 18px;">Reset Password</h2>
        <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">Click the button below to reset your password:</p>
        <a href="${resetLink || '{{ .ConfirmationURL }}'}"
           style="background-color: #dc2626; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; margin-bottom: 18px;">
          Reset Password
        </a>
        <p style="margin-top: 24px; color: #374151; font-size: 14px;">If the button above does not work, copy and paste the following link into your browser:</p>
        <a href="${resetLink || '{{ .ConfirmationURL }}'}" style="color: #2563eb; word-break: break-all;">${resetLink || '{{ .ConfirmationURL }}'}</a>
      </div>
      <div style="margin-top: 32px; color: #6b7280; font-size: 13px; text-align: center;">
        <p>If you did not request this, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour and can only be used once.</p>
      </div>
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">
          Best regards,<br>
          <strong>The Interview Success Path Team</strong>
        </p>
      </div>
    </div>
  `
}); 
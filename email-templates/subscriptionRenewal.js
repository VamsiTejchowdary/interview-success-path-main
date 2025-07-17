export const subscriptionRenewalTemplate = (userName, userRole) => ({
  subject: 'Your Subscription Has Been Renewed!',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://res.cloudinary.com/dcwnk7s9z/image/upload/v1752174018/b1a2a17b-b3eb-46ff-8ee2-6528160fe25c-copied-media_2_wtccwz.png" alt="Interview Success Path Logo" style="height: 48px; margin-bottom: 10px;"/>
        <h1 style="color: #059669; margin-bottom: 10px;">🔄 Subscription Renewed!</h1>
        <p style="color: #6B7280; font-size: 16px;">Thank you for staying with us</p>
      </div>
      <div style="background-color: #ECFDF5; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #059669;">
        <h2 style="color: #065F46; margin-top: 0;">Hi, ${userName}!</h2>
        <p style="color: #065F46; line-height: 1.6;">
          Your ${userRole} subscription has been successfully renewed. You can continue enjoying all premium features without interruption.
        </p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}" style="background-color: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
          Go to Dashboard
        </a>
      </div>
      <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; margin-top: 30px;">
        <p style="color: #6B7280; font-size: 14px; margin-bottom: 5px;">
          Best regards,<br>
          <strong>Team JobSmartly</strong>
        </p>
      </div>
    </div>
  `
}); 
import { Resend } from 'resend';
import { 
  accountVerifiedTemplate, 
  accountApprovedTemplate, 
  passwordResetTemplate,
  subscriptionCancellationTemplate,
  subscriptionRenewalTemplate
} from '../email-templates/index.js';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates
const emailTemplates = {
  accountVerified: accountVerifiedTemplate,
  accountApproved: accountApprovedTemplate,
  passwordReset: passwordResetTemplate,
  subscriptionCancellation: subscriptionCancellationTemplate,
  subscriptionRenewal: subscriptionRenewalTemplate,
  // Special: 'subscription' will be handled below
};

// Email sending function
const sendEmail = async (emailData) => {
  try {
    const { data, error } = await resend.emails.send({
      from: emailData.from || 'JobSmartly <noreply@jobsmartly.com>',
      to: emailData.to || "support@jobsmartly.com",
      subject: emailData.subject,
      html: emailData.html,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, html, template, templateData, isRenewal } = req.body;

    let emailData;
    let recipients = Array.isArray(to) ? to : [to];
    let results = [];
    let errors = [];

    for (const recipient of recipients) {
      if (template && templateData) {
        let templateFn;
        if (template === 'subscription') {
          templateFn = isRenewal ? subscriptionRenewalTemplate : accountApprovedTemplate;
        } else {
          templateFn = emailTemplates[template];
        }
        if (!templateFn) {
          return res.status(400).json({ error: 'Template not found' });
        }
        emailData = templateFn(...templateData);
        emailData.to = recipient;
      } else {
        emailData = { to: recipient, subject, html };
      }
      try {
        const result = await sendEmail(emailData);
        results.push(result);
      } catch (err) {
        errors.push({ recipient, error: err.message });
      }
    }

    if (errors.length > 0) {
      return res.status(500).json({ error: 'Failed to send to some recipients', details: errors });
    }
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error('Email API error:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
} 
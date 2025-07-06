import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import { 
  accountVerifiedTemplate, 
  accountApprovedTemplate, 
  passwordResetTemplate 
} from '../email-templates/index.js';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates
const emailTemplates = {
  accountVerified: accountVerifiedTemplate,
  accountApproved: accountApprovedTemplate,
  passwordReset: passwordResetTemplate
};

// Email sending function
const sendEmail = async (emailData) => {
  try {
    const { data, error } = await resend.emails.send({
      from: emailData.from || 'noreply@jobsmartly.com',
      to: [emailData.to],
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
    const { to, subject, html, template, templateData } = req.body;

    let emailData;
    
    if (template && templateData) {
      const templateFn = emailTemplates[template];
      if (!templateFn) {
        return res.status(400).json({ error: 'Template not found' });
      }
      emailData = templateFn(...templateData);
      emailData.to = to;
    } else {
      emailData = { to, subject, html };
    }

    const result = await sendEmail(emailData);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Email API error:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
} 
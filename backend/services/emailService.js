/**
 * emailService.js
 *
 * Centralized email notification service for Zuari Catalyst.
 * Configured for Outlook (smtp.office365.com / Office 365).
 *
 * Events that trigger emails:
 *   - idea_submitted   → Central Team
 *   - idea_assigned    → Assigned Org Admin + Central Team
 *   - idea_approved    → Idea Author + Central Team
 *   - idea_rejected    → Idea Author + Central Team
 *   - mention          → Mentioned user(s) (via @mention in project chat)
 *
 * .env variables required:
 *   EMAIL_HOST=smtp.office365.com
 *   EMAIL_PORT=587
 *   EMAIL_USER=your_email@company.com
 *   EMAIL_PASS=your_password_or_app_password
 */

const nodemailer = require('nodemailer');

// ─── Transporter (lazy-created once) ──────────────────────────────────────
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  _transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.office365.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,          // TLS via STARTTLS
    requireTLS: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      ciphers: 'SSLv3'      // Required for Office 365
    }
  });

  return _transporter;
}

// ─── Core send function ────────────────────────────────────────────────────
async function sendEmail({ to, subject, html, eventType = 'unknown' }) {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn(`[Email] Skipping email (${eventType}): EMAIL_USER or EMAIL_PASS not configured in .env`);
    return false;
  }

  // System copy logic — ensure the app email always gets a blind copy for tracking
  const systemEmail = process.env.EMAIL_USER;
  let recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  const toStr = recipients.join(', ');

  if (!toStr) {
    console.warn(`[Email] Skipping email (${eventType}): no recipients`);
    return false;
  }

  try {
    const mailOptions = {
      from: `"Zuari Catalyst" <${systemEmail}>`,
      to: toStr,
      subject,
      html
    };
    
    // Strict requirement: BCC the app info email invisibly
    if (systemEmail) {
      mailOptions.bcc = systemEmail;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] ✓ Sent (${eventType}) to ${recipients} — MessageId: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`[Email] ✗ Failed (${eventType}) to ${recipients}:`, err.message);
    return false;
  }
}

// ─── Shared HTML wrapper ───────────────────────────────────────────────────
function wrapHtml(body) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
      .container { max-width: 560px; margin: 32px auto; background: #ffffff; border-radius: 10px;
                   border: 1px solid #e2e8f0; overflow: hidden; }
      .header { background: #003580; padding: 24px 32px; }
      .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.3px; }
      .header p  { color: #a8c4f0; margin: 4px 0 0; font-size: 13px; }
      .body { padding: 28px 32px; }
      .body p { color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 16px; }
      .detail-box { background: #f8fafc; border-left: 4px solid #003580; border-radius: 0 6px 6px 0;
                    padding: 14px 18px; margin: 16px 0; }
      .detail-row { display: flex; margin: 6px 0; font-size: 13px; }
      .detail-label { color: #6b7280; min-width: 140px; font-weight: 600; }
      .detail-value { color: #111827; font-weight: 500; }
      .action-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;
                    padding: 12px 16px; margin: 20px 0; font-size: 13px; color: #1e40af; }
      .quote-box { background: #faf5ff; border-left: 4px solid #7c3aed; border-radius: 0 6px 6px 0;
                   padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #4b5563; font-style: italic; }
      .footer { padding: 16px 32px; border-top: 1px solid #e5e7eb; background: #f9fafb;
                font-size: 11px; color: #9ca3af; text-align: center; }
      .btn-primary { display: inline-block; background: #003580; color: #ffffff !important; text-decoration: none;
                     padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 16px; 
                     text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>💡 Zuari Catalyst</h1>
        <p>Idea Management &amp; Innovation Platform</p>
      </div>
      <div class="body">
        ${body}
        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="margin-bottom: 12px; font-size: 13px; color: #6b7280;">Access the platform securely to view details and take actions.</p>
          <a href="${process.env.APP_URL || 'https://catalyst.zuarione.com'}" class="btn-primary">Open Zuari Catalyst</a>
        </div>
      </div>
      <div class="footer">This is an automated message from Zuari Catalyst. Please do not reply to this email.</div>
    </div>
  </body>
  </html>`;
}

// ─── 1. Template: Idea Submitted ────────────────────────────────────────────
// Event: New idea is submitted.
// Recipients: Central Team + Org Admin (of that org)
async function sendIdeaSubmittedEmail({ toEmails, ideaTitle, submittedBy, organization }) {
  const html = wrapHtml(`
    <p>Hello,</p>
    <p>A new idea has been submitted in Zuari Catalyst and requires attention.</p>
    <div class="detail-box">
      <div class="detail-row"><span class="detail-label">Title</span><span class="detail-value">${ideaTitle}</span></div>
      <div class="detail-row"><span class="detail-label">Submitted By</span><span class="detail-value">${submittedBy}</span></div>
      <div class="detail-row"><span class="detail-label">Organization</span><span class="detail-value">${organization}</span></div>
    </div>
    <div class="action-box">📋 <strong>Action Required:</strong> Log in to the platform to review this submission.</div>
  `);

  return sendEmail({
    to: toEmails,
    subject: `[Zuari Catalyst] New Idea Submitted — ${ideaTitle}`,
    html,
    eventType: 'idea_submitted'
  });
}

// ─── 2. Template: Idea Status Change ─────────────────────────────────────────
// Events: Submitted → Under Review | Under Review → Approved | Under Review → Rejected
// Recipients: Employee
async function sendIdeaStatusChangeEmail({ toEmail, ideaTitle, authorName, newStatus, reason, projectId }) {
  let statusColor = '#374151'; // default
  if (newStatus === 'Approved') statusColor = '#16a34a';
  if (newStatus === 'Rejected') statusColor = '#dc2626';
  if (newStatus === 'Under Review') statusColor = '#d97706';

  let nextStep = 'Your idea is currently being evaluated by the committee.';
  if (newStatus === 'Approved') nextStep = 'Your project is now active! You can track its progress and collaborate with your team.';
  if (newStatus === 'Rejected') nextStep = 'Review the feedback provided. You can resubmit or propose a different idea in the future.';

  const html = wrapHtml(`
    <p>Hello ${authorName},</p>
    <p>There is an update on your submitted idea.</p>
    <div class="detail-box">
      <div class="detail-row"><span class="detail-label">Idea Title</span><span class="detail-value">${ideaTitle}</span></div>
      <div class="detail-row"><span class="detail-label">New Status</span><span class="detail-value" style="color:${statusColor}; font-weight:700;">${newStatus}</span></div>
      ${projectId ? `<div class="detail-row"><span class="detail-label">Project ID</span><span class="detail-value" style="font-family:monospace;color:#003580;">${projectId}</span></div>` : ''}
      ${reason ? `<div class="detail-row"><span class="detail-label">Reason/Feedback</span><span class="detail-value" style="color:#374151;">${reason}</span></div>` : ''}
    </div>
    <div class="action-box">💡 <strong>Next Steps:</strong> ${nextStep}</div>
  `);

  return sendEmail({
    to: toEmail,
    subject: `[Zuari Catalyst] Idea Status Update: ${newStatus} — ${ideaTitle}`,
    html,
    eventType: 'idea_status_change'
  });
}

// ─── 3. Template: Project Status Change ──────────────────────────────────────
// Events: Any project status change after an idea becomes a project.
// Recipients: Employee
async function sendProjectStatusChangeEmail({ toEmail, projectTitle, authorName, newStatus, projectId }) {
  const html = wrapHtml(`
    <p>Hello ${authorName},</p>
    <p>Your project status has been updated.</p>
    <div class="detail-box">
      <div class="detail-row"><span class="detail-label">Project Title</span><span class="detail-value">${projectTitle}</span></div>
      <div class="detail-row"><span class="detail-label">Project ID</span><span class="detail-value" style="font-family:monospace;color:#003580;">${projectId}</span></div>
      <div class="detail-row"><span class="detail-label">New Status</span><span class="detail-value" style="color:#2563eb; font-weight:700;">${newStatus}</span></div>
    </div>
    <div class="action-box">📊 <strong>Action Required:</strong> Log in to Zuari Catalyst to review your project timeline and collaborate on next steps.</div>
  `);

  return sendEmail({
    to: toEmail,
    subject: `[Zuari Catalyst] Project Status Update: ${newStatus} — ${projectTitle}`,
    html,
    eventType: 'project_status_change'
  });
}

// ─── 4. Template: Chat @Mention ──────────────────────────────────────────────
// Events: @mention in chat or replying to a tagged message.
// Recipients: Tagged User
async function sendChatMentionEmail({ toEmail, mentionedName, senderName, projectTitle, projectId, messageExcerpt }) {
  const html = wrapHtml(`
    <p>Hello ${mentionedName},</p>
    <p>You have been tagged in a discussion by <strong>${senderName}</strong>.</p>
    <div class="detail-box">
      <div class="detail-row"><span class="detail-label">Project</span><span class="detail-value">${projectTitle}</span></div>
      <div class="detail-row"><span class="detail-label">Project ID</span><span class="detail-value" style="font-family:monospace;color:#003580;">${projectId}</span></div>
      <div class="detail-row"><span class="detail-label">Mentioned by</span><span class="detail-value">${senderName}</span></div>
    </div>
    <div class="quote-box"><strong>Message:</strong><br/>${messageExcerpt}</div>
    <div class="action-box">💬 <strong>Action Required:</strong> Check the project discussion to respond.</div>
  `);

  return sendEmail({
    to: toEmail,
    subject: `[Zuari Catalyst] You were tagged by ${senderName} in: ${projectTitle}`,
    html,
    eventType: 'chat_mention'
  });
}

// ─── Test email ────────────────────────────────────────────────────────────
async function sendTestEmail({ toEmail, subject, message }) {
  const html = wrapHtml(`
    <p>Hello,</p>
    <p>This is a <strong>test email</strong> from Zuari Catalyst email service.</p>
    <div class="detail-box">
      <div class="detail-row"><span class="detail-label">Subject</span><span class="detail-value">${subject}</span></div>
      <div class="detail-row"><span class="detail-label">Message</span><span class="detail-value">${message}</span></div>
    </div>
    <p>If you received this, your Outlook email configuration is working correctly. ✓</p>
  `);

  return sendEmail({
    to: toEmail,
    subject: `[Zuari Catalyst] Email Test — ${subject}`,
    html,
    eventType: 'test'
  });
}

module.exports = {
  sendIdeaSubmittedEmail,
  sendIdeaStatusChangeEmail,
  sendProjectStatusChangeEmail,
  sendChatMentionEmail,
  sendTestEmail
};

# Microsoft Outlook & Azure AD Integration Blueprint

> A comprehensive, plug-and-play architectural guide and code template for implementing **Microsoft Outlook / Azure AD SSO Authentication** and **Office 365 / Outlook SMTP Email Delivery** in full-stack web applications.

---

## 📑 Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites & Azure Portal Setup](#2-prerequisites--azure-portal-setup)
3. [Environment Configuration (`.env`)](#3-environment-configuration-env)
4. [Part 1: Microsoft SSO (Azure AD + MSAL)](#4-part-1-microsoft-sso-azure-ad--msal)
   - [4.1 Frontend Installation & Configuration](#41-frontend-installation--configuration)
   - [4.2 Frontend Root Provider](#42-frontend-root-provider)
   - [4.3 Frontend Login Component & Flow](#43-frontend-login-component--flow)
   - [4.4 Backend Token Verification (`/api/auth/ms-login`)](#44-backend-token-verification-apiauthms-login)
5. [Part 2: Outlook / Office 365 Email Notification Engine](#5-part-2-outlook--office-365-email-notification-engine)
   - [5.1 Backend SMTP Configuration (`emailService.js`)](#51-backend-smtp-configuration-emailservicejs)
   - [5.2 Responsive HTML Template System](#52-responsive-html-template-system)
   - [5.3 Verification / Test Email Endpoint](#53-verification--test-email-endpoint)
   - [5.4 Triggering Emails in Business Logic](#54-triggering-emails-in-business-logic)
6. [Critical Office 365 Gotchas & Troubleshooting](#6-critical-office-365-gotchas--troubleshooting)
7. [Implementation Checklist](#7-implementation-checklist)

---

## 1. Architecture Overview

Outlook integration in modern enterprise web applications consists of two distinct subsystems:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          1. AUTHENTICATION (SSO)                            │
│                                                                             │
│  [ React Frontend ] ──(1) Login Popup──> [ Microsoft Identity (Azure AD) ] │
│         │                                                │                  │
│         │ <─────────(2) idToken (JWT)────────────────────┘                  │
│         │                                                                   │
│         └──(3) POST /api/auth/ms-login { idToken } ──> [ Express Backend ]  │
│                                                              │              │
│                                           (4) Verify JWT via JWKS (MS certs)│
│                                           (5) Check domain & role in DB     │
│                                           (6) Set HTTP-only session cookie  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                       2. NOTIFICATIONS (SMTP ENGINE)                        │
│                                                                             │
│  [ App Business Event ] ──> [ emailService.js ]                             │
│                                     │                                       │
│                                     └──> Nodemailer (STARTTLS / Port 587)   │
│                                               │                             │
│                                               └──> [ smtp.office365.com ]   │
│                                                           │                 │
│                                                           └──> [ Recipients]│
│                                                           └──> [ BCC System]│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Prerequisites & Azure Portal Setup

### A. Azure App Registration (For SSO Login)
1. Go to **[Azure Portal](https://portal.azure.com)** > **Microsoft Entra ID** (formerly Azure Active Directory) > **App registrations** > **New registration**.
2. **Name**: `YourAppName` (e.g. `Zuari Catalyst`).
3. **Supported account types**:
   - *Accounts in this organizational directory only* (Single tenant - e.g. company internal app) **OR**
   - *Accounts in any organizational directory* (Multitenant).
4. **Redirect URI**:
   - Platform: **Single-page application (SPA)**
   - URI: `http://localhost:5173` (Development) and `https://yourdomain.com` (Production).
5. Click **Register**.
6. Note down from the **Overview** page:
   - **Application (client) ID** -> `AZURE_CLIENT_ID`
   - **Directory (tenant) ID** -> `AZURE_TENANT_ID`
7. Under **API permissions**:
   - Confirm `User.Read`, `openid`, `profile`, `email` delegated permissions are added.
   - Click **Grant admin consent for [Organization]** (if administrator).

---

### B. Office 365 Mailbox & SMTP AUTH (For Email Sending)
1. Ensure the sending account has an active Exchange Online license (e.g., `notifications@yourcompany.com` or individual account).
2. **Enable Authenticated SMTP** for the mailbox:
   - Go to **Microsoft 365 Admin Center** > **Users** > **Active Users** > Select user > **Mail** tab > **Manage email apps**.
   - Ensure **Authenticated SMTP** is **Checked / Enabled**.
3. **MFA / App Passwords**:
   - If Multi-Factor Authentication (MFA) or Security Defaults are enforced on the account, create an **App Password** via `https://mysignins.microsoft.com/security-info` > **Add sign-in method** > **App password**.
   - Use this 16-character generated password as `EMAIL_PASS`.

---

## 3. Environment Configuration (`.env`)

### Backend `.env`
```env
# ─── Server & JWT ───
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_strong_random_jwt_secret_min_32_chars
APP_URL=http://localhost:5173

# ─── Microsoft Azure AD (SSO Login) ───
AZURE_TENANT_ID=7b00a15b-93dc-4b6a-8bce-06909dcecf35
AZURE_CLIENT_ID=15a5c8f7-6848-46df-8b1c-500a906cab56

# ─── Email (Office 365 / Outlook SMTP) ───
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=your_notifications_email@yourdomain.com
EMAIL_PASS=your_office365_app_password
```

### Frontend `.env` (or config file)
```env
VITE_AZURE_CLIENT_ID=15a5c8f7-6848-46df-8b1c-500a906cab56
VITE_AZURE_TENANT_ID=7b00a15b-93dc-4b6a-8bce-06909dcecf35
```

---

## 4. Part 1: Microsoft SSO (Azure AD + MSAL)

### 4.1 Frontend Installation & Configuration

#### Dependencies:
```bash
npm install @azure/msal-browser @azure/msal-react
```

#### Configuration File: `frontend/src/lib/msalConfig.js`
```javascript
import { PublicClientApplication } from "@azure/msal-browser";

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || "YOUR_AZURE_CLIENT_ID",
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || "YOUR_AZURE_TENANT_ID"}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage", // or "localStorage"
    storeAuthStateInCookie: false,
  }
};

export const loginRequest = {
  scopes: ["User.Read", "openid", "profile", "email"]
};

// Instantiate singleton MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);
```

---

### 4.2 Frontend Root Provider

Wrap your React app in `<MsalProvider>` in `main.jsx` (or `App.jsx`):

```jsx
// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './lib/msalConfig';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  </React.StrictMode>
);
```

---

### 4.3 Frontend Login Component & Flow

```jsx
// frontend/src/components/LoginButton.jsx
import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../lib/msalConfig';

export function MicrosoftLoginButton({ onLoginSuccess }) {
  const { instance } = useMsal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOutlookLogin = async () => {
    setError('');
    setLoading(true);
    try {
      // 1. Trigger Microsoft OAuth Popup
      const response = await instance.loginPopup(loginRequest);
      
      if (response && response.idToken) {
        // 2. Send the idToken to our backend
        const res = await fetch('/api/auth/ms-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: response.idToken }),
          credentials: 'include' // to store httpOnly cookie
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');

        if (onLoginSuccess) onLoginSuccess(data.user);
      }
    } catch (err) {
      console.error('Microsoft login error:', err);
      setError(err.message || 'Microsoft authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleOutlookLogin}
        disabled={loading}
        className="flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition shadow-sm"
      >
        {/* Microsoft 4-square SVG Icon */}
        <svg className="w-5 h-5" viewBox="0 0 21 21">
          <path fill="#f25022" d="M1 1h9v9H1z"/>
          <path fill="#00a4ef" d="M1 11h9v9H1z"/>
          <path fill="#7fba00" d="M11 1h9v9H11z"/>
          <path fill="#ffb900" d="M11 11h9v9H11z"/>
        </svg>
        <span>{loading ? 'Authenticating...' : 'Sign in with Microsoft'}</span>
      </button>
      {error && <p className="text-red-500 text-xs text-center">{error}</p>}
    </div>
  );
}
```

---

### 4.4 Backend Token Verification (`/api/auth/ms-login`)

#### Backend Dependencies:
```bash
npm install jsonwebtoken jwks-rsa express
```

#### Implementation: `backend/routes/auth.js`
```javascript
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// ─── Azure AD JWKS Public Key Client ─────────────────────────────────────────
// Automatically fetches and caches Microsoft's public signing keys
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/discovery/v2.0/keys`,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

// ─── POST /api/auth/ms-login ──────────────────────────────────────────────────
router.post('/ms-login', (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'Missing idToken' });

  // 1. Verify Microsoft JWT signature, audience, and issuer
  jwt.verify(
    idToken,
    getKey,
    {
      audience: process.env.AZURE_CLIENT_ID,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0`
    },
    async (err, decoded) => {
      if (err) {
        console.error('[Auth] Microsoft JWT Verification Error:', err.message);
        return res.status(401).json({ error: 'Invalid Microsoft token' });
      }

      // 2. Extract authenticated user details from token claims
      const email = decoded.preferred_username || decoded.email;
      const name = decoded.name;
      
      if (!email) {
        return res.status(400).json({ error: 'Email claim missing from Microsoft token' });
      }

      // 3. Optional: Domain restriction
      const ALLOWED_DOMAIN = '@yourcompany.com';
      if (ALLOWED_DOMAIN && !email.toLowerCase().endsWith(ALLOWED_DOMAIN.toLowerCase())) {
        return res.status(403).json({ error: `Only ${ALLOWED_DOMAIN} accounts are permitted.` });
      }

      try {
        // 4. Database Lookup / Provisioning (example using generic DB/Prisma)
        let user = await db.user.findUnique({ where: { email: email.toLowerCase() } });

        if (!user) {
          return res.status(404).json({
            error: 'Your Microsoft account is not registered. Please contact an administrator.'
          });
        }

        // 5. Issue your application's session JWT as an httpOnly Cookie
        const sessionToken = jwt.sign(
          {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.cookie('auth_token', sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/'
        });

        return res.json({ user });
      } catch (dbErr) {
        console.error('[Auth] Database error during MS login:', dbErr);
        return res.status(500).json({ error: 'An error occurred during authentication.' });
      }
    }
  );
});

module.exports = router;
```

---

## 5. Part 2: Outlook / Office 365 Email Notification Engine

### 5.1 Backend SMTP Configuration (`emailService.js`)

#### Dependencies:
```bash
npm install nodemailer
```

#### Production-Grade Service: `backend/services/emailService.js`
```javascript
/**
 * emailService.js
 * Production-ready email service configured for Microsoft Office 365 / Outlook.
 */

const nodemailer = require('nodemailer');

// ─── Transporter Singleton (Lazy Initialization) ────────────────────────────
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  _transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.office365.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: false,        // false for port 587; uses STARTTLS
    requireTLS: true,     // Enforce TLS handshake
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      ciphers: 'SSLv3'    // Critical for Office 365 STARTTLS negotiation
    }
  });

  return _transporter;
}

// ─── Core Send Utility ──────────────────────────────────────────────────────
async function sendEmail({ to, subject, html, eventType = 'notification' }) {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn(`[Email] Skipping email (${eventType}): EMAIL_USER or EMAIL_PASS missing in .env`);
    return false;
  }

  const systemEmail = process.env.EMAIL_USER;
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  const toStr = recipients.join(', ');

  if (!toStr) {
    console.warn(`[Email] Skipping email (${eventType}): No recipients provided.`);
    return false;
  }

  try {
    const mailOptions = {
      from: `"App Notifications" <${systemEmail}>`,
      to: toStr,
      subject,
      html
    };

    // Optional: Invisible BCC to system account for audit and tracking
    if (systemEmail) {
      mailOptions.bcc = systemEmail;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] ✓ Sent (${eventType}) to [${toStr}] — ID: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`[Email] ✗ Failed (${eventType}) to [${toStr}]:`, err.message);
    return false;
  }
}
```

---

### 5.2 Responsive HTML Template System

```javascript
// ─── Universal HTML Wrapper ────────────────────────────────────────────────
function wrapHtml(bodyContent) {
  const appUrl = process.env.APP_URL || 'https://yourdomain.com';
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; background-color: #f4f6fb; margin: 0; padding: 0; }
      .container { max-width: 580px; margin: 32px auto; background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
      .header { background: #003580; padding: 24px 32px; }
      .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; }
      .header p  { color: #a8c4f0; margin: 4px 0 0; font-size: 13px; }
      .body { padding: 28px 32px; }
      .body p { color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 16px; }
      .detail-box { background: #f8fafc; border-left: 4px solid #003580; border-radius: 0 6px 6px 0; padding: 14px 18px; margin: 16px 0; }
      .detail-row { display: flex; margin: 6px 0; font-size: 13px; }
      .detail-label { color: #6b7280; min-width: 130px; font-weight: 600; }
      .detail-value { color: #111827; font-weight: 500; }
      .action-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 16px; margin: 20px 0; font-size: 13px; color: #1e40af; }
      .btn-primary { display: inline-block; background: #003580; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 16px; text-align: center; }
      .footer { padding: 16px 32px; border-top: 1px solid #e5e7eb; background: #f9fafb; font-size: 11px; color: #9ca3af; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Your App Notification</h1>
        <p>Real-time updates &amp; alerts</p>
      </div>
      <div class="body">
        ${bodyContent}
        <div style="text-align: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <a href="${appUrl}" class="btn-primary">View in Dashboard</a>
        </div>
      </div>
      <div class="footer">This is an automated system message. Please do not reply directly to this email.</div>
    </div>
  </body>
  </html>`;
}

// ─── Custom Event Templates ────────────────────────────────────────────────
async function sendNotificationEmail({ toEmail, userName, title, message, details = [] }) {
  const detailsHtml = details.length > 0 ? `
    <div class="detail-box">
      ${details.map(d => `<div class="detail-row"><span class="detail-label">${d.label}</span><span class="detail-value">${d.value}</span></div>`).join('')}
    </div>
  ` : '';

  const html = wrapHtml(`
    <p>Hello ${userName || 'there'},</p>
    <p>${message}</p>
    ${detailsHtml}
    <div class="action-box">⚡ <strong>Action:</strong> Please log in to review the latest changes.</div>
  `);

  return sendEmail({
    to: toEmail,
    subject: `[Notification] ${title}`,
    html,
    eventType: 'notification'
  });
}

// ─── Test / Diagnostic Template ────────────────────────────────────────────
async function sendTestEmail({ toEmail, subject, message }) {
  const html = wrapHtml(`
    <p>Hello,</p>
    <p>This is a <strong>diagnostic test email</strong> from your application's Outlook SMTP integration.</p>
    <div class="detail-box">
      <div class="detail-row"><span class="detail-label">Subject</span><span class="detail-value">${subject}</span></div>
      <div class="detail-row"><span class="detail-label">Message</span><span class="detail-value">${message}</span></div>
      <div class="detail-row"><span class="detail-label">Timestamp</span><span class="detail-value">${new Date().toISOString()}</span></div>
    </div>
    <p style="color: #16a34a; font-weight: 600;">✓ If you received this, your Outlook SMTP configuration is 100% operational.</p>
  `);

  return sendEmail({
    to: toEmail,
    subject: `[Test] ${subject}`,
    html,
    eventType: 'test'
  });
}

module.exports = {
  sendEmail,
  sendNotificationEmail,
  sendTestEmail
};
```

---

### 5.3 Verification / Test Email Endpoint

Add this route to `server.js` or an admin routes file to verify connectivity on demand:

```javascript
// POST /api/test-email
app.post('/api/test-email', async (req, res) => {
  const { toEmail, subject, message } = req.body;
  
  if (!toEmail || !subject || !message) {
    return res.status(400).json({ error: 'toEmail, subject, and message are required fields' });
  }

  try {
    const sent = await sendTestEmail({ toEmail, subject, message });
    if (sent) {
      return res.json({ success: true, message: `Test email successfully sent to ${toEmail}` });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Email delivery failed. Please verify EMAIL_USER, EMAIL_PASS, and SMTP settings in .env'
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
```

---

### 5.4 Triggering Emails in Business Logic

Execute email triggers asynchronously alongside your database transactions:

```javascript
// Example in a controller or route handler
const { sendNotificationEmail } = require('../services/emailService');

router.post('/tickets', async (req, res) => {
  const ticket = await db.ticket.create({ data: req.body });

  // Trigger Outlook email notification asynchronously
  sendNotificationEmail({
    toEmail: ticket.assignedUserEmail,
    userName: ticket.assignedUserName,
    title: `Ticket #${ticket.id} Assigned: ${ticket.title}`,
    message: `You have been assigned a new ticket.`,
    details: [
      { label: 'Ticket ID', value: `#${ticket.id}` },
      { label: 'Priority', value: ticket.priority },
      { label: 'Created By', value: req.user.name }
    ]
  }).catch(err => console.error('[Email Error]', err)); // Non-blocking

  res.status(201).json({ ticket });
});
```

---

## 6. Critical Office 365 Gotchas & Troubleshooting

| Issue / Error Code | Root Cause | Solution |
|---|---|---|
| `535 5.7.139 Authentication unsuccessful` | Basic authentication disabled or MFA active on the account. | 1. Ensure **Authenticated SMTP** is enabled on the mailbox in M365 Admin.<br>2. Generate and use an **App Password** instead of regular password.<br>3. Check if Conditional Access or Security Defaults block SMTP. |
| `Self-signed certificate in certificate chain` / TLS Handshake Failure | Office 365 cipher mismatch during STARTTLS negotiation. | Include `tls: { ciphers: 'SSLv3' }` and `requireTLS: true` in your Nodemailer configuration. |
| `554 5.2.254 StoreDriver.Submission` / `SendAsDenied` | Sending user (`from`) does not match the authenticated account (`EMAIL_USER`). | Ensure `from:` address matches `EMAIL_USER` or the mailbox has **Send As** / **Send on Behalf** permissions. |
| `AADSTS50011: The reply URL specified in the request does not match` | Redirect URI in Azure App Registration does not match browser origin. | In Azure Portal > App Registration > **Authentication**, add exact redirect URL (e.g. `http://localhost:5173`). |
| `AADSTS700016: Application with identifier was not found` | `AZURE_CLIENT_ID` or `AZURE_TENANT_ID` incorrect. | Verify values in `.env` against the Azure App Registration Overview page. |
| MSAL Popup blocked in browser | `instance.loginPopup()` called outside user click event. | Ensure MSAL login is triggered directly inside an `onClick` handler. |

---

## 7. Implementation Checklist

When integrating this into a new application, follow this sequence:

- [ ] **Azure App Registration**: Create App Registration in Azure Portal and set SPA redirect URI.
- [ ] **Mailbox Config**: Enable Authenticated SMTP on Office 365 mailbox and generate App Password.
- [ ] **Backend `.env`**: Set `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`.
- [ ] **Frontend Packages**: `npm install @azure/msal-browser @azure/msal-react`.
- [ ] **Frontend Setup**: Add `msalConfig.js` and wrap app root with `<MsalProvider>`.
- [ ] **Backend Packages**: `npm install jsonwebtoken jwks-rsa nodemailer`.
- [ ] **Backend SSO**: Create `/api/auth/ms-login` with JWKS token validation.
- [ ] **Backend SMTP**: Add `emailService.js` with `smtp.office365.com`, port `587`, and `SSLv3` ciphers.
- [ ] **Smoke Test**: Test login popup and test email delivery via `POST /api/test-email`.

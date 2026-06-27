import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.resolve(__dirname, "../public/invoice.png");
const logoCid = "elevenorbits-logo";

let transporter = null;

function isEmailConfigured() {
  return Boolean(env.smtpHost && env.smtpPort && env.smtpUser && env.smtpPassword);
}

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPassword,
    },
    tls: {
      rejectUnauthorized: env.smtpTlsRejectUnauthorized,
      ...(env.smtpTlsServername ? { servername: env.smtpTlsServername } : {}),
    },
  });

  return transporter;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMoney(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

function formatDate(value) {
  if (!value) {
    return "Pending";
  }

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function humanizeValue(value, fallback = "Pending") {
  if (!value) {
    return fallback;
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeRows(rows = []) {
  return rows.filter((row) => row?.label && row?.value !== undefined && row?.value !== null && row?.value !== "");
}

function buildRows(rows = []) {
  const normalizedRows = normalizeRows(rows);

  if (!normalizedRows.length) {
    return "";
  }

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:18px;border:1px solid #dbe4ef;border-radius:16px;overflow:hidden;">
      ${normalizedRows
        .map(
          (row) => `
            <tr>
              <td style="padding:13px 16px;border-bottom:1px solid #e8eef6;background:#f8fafc;width:42%;font:700 12px Arial,Helvetica,sans-serif;color:#475569;text-transform:uppercase;letter-spacing:.08em;">${escapeHtml(row.label)}</td>
              <td style="padding:13px 16px;border-bottom:1px solid #e8eef6;font:600 14px Arial,Helvetica,sans-serif;color:#0f172a;">${escapeHtml(row.value)}</td>
            </tr>
          `,
        )
        .join("")}
    </table>
  `;
}

function buildAction(action) {
  if (!action?.href || !action?.label) {
    return "";
  }

  return `
    <div style="margin-top:24px;">
      <a href="${escapeHtml(action.href)}" style="display:inline-block;border-radius:999px;background:#020617;color:#ffffff;text-decoration:none;font:700 14px Arial,Helvetica,sans-serif;padding:13px 20px;box-shadow:0 12px 28px rgba(2,6,23,.18);">${escapeHtml(action.label)}</a>
    </div>
  `;
}

function buildList(items = []) {
  const safeItems = items.filter(Boolean);

  if (!safeItems.length) {
    return "";
  }

  return `
    <ul style="margin:16px 0 0;padding:0 0 0 20px;font:14px/1.65 Arial,Helvetica,sans-serif;color:#334155;">
      ${safeItems.map((item) => `<li style="margin:4px 0;">${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
}

function buildEmailHtml({ title, preheader, intro, badge = "ElevenOrbits Notification", rows = [], action, notes = [] }) {
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="margin:0;background:#eef3f8;padding:0;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader || title)}</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#eef3f8;">
        <tr>
          <td align="center" style="padding:32px 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;max-width:680px;background:#ffffff;border:1px solid #dbe4ef;border-radius:24px;overflow:hidden;box-shadow:0 26px 60px rgba(15,23,42,.10);">
              <tr>
                <td style="background:#020617;padding:28px 30px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                    <tr>
                      <td style="width:72px;vertical-align:middle;">
                        <img src="cid:${logoCid}" width="58" height="58" alt="ElevenOrbits" style="display:block;border:0;border-radius:14px;">
                      </td>
                      <td style="vertical-align:middle;">
                        <div style="font:700 21px Arial,Helvetica,sans-serif;color:#ffffff;letter-spacing:-.01em;">ElevenOrbits</div>
                        <div style="margin-top:5px;font:13px Arial,Helvetica,sans-serif;color:#cbd5e1;">Customer operations portal</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:30px;">
                  <div style="display:inline-block;border:1px solid #dbeafe;border-radius:999px;background:#f0f7ff;color:#1d4ed8;font:700 11px Arial,Helvetica,sans-serif;text-transform:uppercase;letter-spacing:.12em;padding:7px 11px;">${escapeHtml(badge)}</div>
                  <h1 style="margin:18px 0 0;font:800 28px/1.2 Arial,Helvetica,sans-serif;color:#020617;letter-spacing:-.02em;">${escapeHtml(title)}</h1>
                  <p style="margin:14px 0 0;font:15px/1.65 Arial,Helvetica,sans-serif;color:#334155;">${escapeHtml(intro)}</p>
                  ${buildRows(rows)}
                  ${buildAction(action)}
                  ${buildList(notes)}
                  <div style="margin-top:24px;border:1px solid #dbe4ef;border-radius:16px;background:#f8fafc;padding:16px;font:13px/1.6 Arial,Helvetica,sans-serif;color:#475569;">
                    If you do not see ElevenOrbits emails in your inbox, please check your spam or junk folder and mark ElevenOrbits as a trusted sender.
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:22px 30px;background:#f8fafc;border-top:1px solid #e2e8f0;font:12px/1.6 Arial,Helvetica,sans-serif;color:#64748b;">
                  For questions, contact <a href="mailto:${escapeHtml(env.supportEmail)}" style="color:#0f172a;font-weight:700;text-decoration:none;">${escapeHtml(env.supportEmail)}</a>.
                  This message was sent from a notification-only address. Replies to this mailbox are not monitored and will not create a support ticket.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

function buildTextFallback({ title, intro, rows = [], action, notes = [] }) {
  const rowText = normalizeRows(rows).map((row) => `${row.label}: ${row.value}`).join("\n");
  const notesText = notes.filter(Boolean).join("\n");
  const actionText = action?.href ? `\n${action.label || "Open"}: ${action.href}` : "";

  return [
    "ElevenOrbits",
    title,
    intro,
    rowText,
    actionText,
    notesText,
    `If you do not see ElevenOrbits emails in your inbox, check your spam or junk folder and mark ElevenOrbits as a trusted sender.`,
    `For questions, contact ${env.supportEmail}. Replies to this notification-only mailbox are not monitored.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function sendTransactionalEmail({ to, subject, title, preheader, intro, badge, rows, action, notes, attachments = [] }) {
  const recipient = String(to || "").trim();

  if (!recipient) {
    return false;
  }

  if (!isEmailConfigured()) {
    console.warn(`Email not sent to ${recipient}: SMTP is not configured.`);
    return false;
  }

  const hasLogo = fs.existsSync(logoPath);
  const message = {
    from: `"${env.notificationFromName}" <${env.notificationFromEmail}>`,
    to: recipient,
    replyTo: env.supportEmail,
    subject,
    html: buildEmailHtml({ title, preheader, intro, badge, rows, action, notes }),
    text: buildTextFallback({ title, intro, rows, action, notes }),
    attachments: [
      ...(hasLogo
        ? [
            {
              filename: "elevenorbits.png",
              path: logoPath,
              cid: logoCid,
            },
          ]
        : []),
      ...attachments,
    ],
  };

  try {
    await getTransporter().sendMail(message);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${recipient}`, error);
    return false;
  }
}

function getCustomerEmail(customer) {
  return customer?.email || customer?.primaryEmail || customer?.primaryEmailAddress?.emailAddress || "";
}

function getCustomerName(customer) {
  return customer?.name || getCustomerEmail(customer) || "Customer";
}

function getInvoiceSubject(invoice, eventType) {
  if (eventType === "invoice_paid") {
    return `Payment received for ${invoice.invoiceNumber}`;
  }

  if (eventType === "renewal_paid") {
    return `Renewal payment received for ${invoice.invoiceNumber}`;
  }

  if (eventType === "renewal_pending") {
    return `Renewal invoice ${invoice.invoiceNumber} needs attention`;
  }

  return `Invoice ${invoice.invoiceNumber} is ready`;
}

function getInvoiceIntro(invoice, planName, eventType) {
  const serviceName = planName || invoice.lineItems?.[0]?.label || "your ElevenOrbits service";

  if (eventType === "invoice_paid" || eventType === "renewal_paid") {
    return `We received payment for ${serviceName}. Your invoice has been updated and is available in your customer portal.`;
  }

  if (eventType === "renewal_pending") {
    return `A renewal invoice has been created for ${serviceName}. Please review your billing status in the customer portal.`;
  }

  return `Your invoice for ${serviceName} has been generated and added to your ElevenOrbits customer portal.`;
}

export async function sendInvoiceNotification({ customer, invoice, planName, eventType = "invoice_created" }) {
  const recipient = getCustomerEmail(customer);
  const subject = getInvoiceSubject(invoice, eventType);
  const invoiceUrl = `${env.appUrl}/portal/invoices`;
  const attachmentPath = invoice?.pdfPath && fs.existsSync(invoice.pdfPath) ? invoice.pdfPath : "";

  return sendTransactionalEmail({
    to: recipient,
    subject,
    title: subject,
    preheader: `Invoice ${invoice.invoiceNumber} is available in your ElevenOrbits portal.`,
    badge: invoice.status === "paid" ? "Payment Receipt" : "Invoice Notice",
    intro: getInvoiceIntro(invoice, planName, eventType),
    rows: [
      { label: "Customer", value: getCustomerName(customer) },
      { label: "Invoice", value: invoice.invoiceNumber },
      { label: "Status", value: humanizeValue(invoice.status) },
      { label: "Amount", value: formatMoney(invoice.amount, invoice.currency) },
      { label: "Issued", value: formatDate(invoice.issuedAt) },
      { label: "Paid", value: invoice.status === "paid" ? formatDate(invoice.paidAt) : "Pending" },
      { label: "Reference", value: invoice.paymentReferenceCode || "Pending" },
    ],
    action: {
      label: "Open Customer Portal",
      href: invoiceUrl,
    },
    notes: [
      invoice.status === "paid"
        ? "Keep this receipt for your records."
        : "If payment is still required, complete it from the invoice or wallet section of the customer portal.",
    ],
    attachments: attachmentPath
      ? [
          {
            filename: `${invoice.invoiceNumber}.pdf`,
            path: attachmentPath,
            contentType: "application/pdf",
          },
        ]
      : [],
  });
}

export async function sendServiceAccessNotification({ customer, subscription, planName, access }) {
  return sendTransactionalEmail({
    to: getCustomerEmail(customer),
    subject: "Your ElevenOrbits service access is ready",
    title: "Your service access is ready",
    preheader: "Your ElevenOrbits provisioning details have been added to your customer portal.",
    badge: "Access Details",
    intro: `Provisioning details for ${planName || "your ElevenOrbits service"} have been assigned by the ElevenOrbits team. Keep these details private and store them securely.`,
    rows: [
      { label: "Customer", value: getCustomerName(customer) },
      { label: "Service", value: planName || "Managed Service" },
      { label: "Subscription", value: subscription?._id ? String(subscription._id) : "" },
      { label: "Username", value: access?.username || "" },
      { label: "Password", value: access?.password || "" },
      { label: "IP Address", value: access?.ipAddress || "" },
      ...(access?.sharedDetails || []).map((item) => ({ label: item.label, value: item.value })),
    ],
    action: {
      label: "Open Customer Portal",
      href: `${env.appUrl}/portal/apps`,
    },
    notes: [
      "Do not forward this email to anyone who should not have access to the service.",
      "If any detail looks incorrect, contact support before using the credentials.",
    ],
  });
}

export async function sendWalletTopupNotification({ customer, amount, reference }) {
  return sendTransactionalEmail({
    to: getCustomerEmail(customer),
    subject: "Your ElevenOrbits wallet top-up is complete",
    title: "Wallet top-up complete",
    preheader: "Your ElevenOrbits wallet balance has been updated.",
    badge: "Wallet Funding",
    intro: "Your wallet top-up has been confirmed and the balance is available for eligible orders, invoices, and subscription renewals.",
    rows: [
      { label: "Customer", value: getCustomerName(customer) },
      { label: "Amount", value: formatMoney(amount, env.stripeCurrency.toUpperCase()) },
      { label: "Reference", value: reference || "Stripe payment" },
    ],
    action: {
      label: "Open Wallet",
      href: `${env.appUrl}/portal/payments`,
    },
    notes: ["Wallet balance changes are also visible in your customer portal payment activity."],
  });
}

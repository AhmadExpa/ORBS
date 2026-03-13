import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import { env } from "../config/env.js";
import { generateInvoiceNumber } from "../utils/invoice-number.js";
import { toPublicFileUrl } from "./storage-service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const companyLogoPath = path.resolve(__dirname, "../public/invoice.png");

const palette = {
  page: "#f8fafc",
  card: "#ffffff",
  border: "#d7e1ec",
  header: "#0f172a",
  text: "#0f172a",
  muted: "#64748b",
  subtle: "#cbd5e1",
  tableHeader: "#e2e8f0",
};

export async function nextInvoiceNumber(InvoiceModel) {
  const count = await InvoiceModel.countDocuments();
  return generateInvoiceNumber(count + 1);
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

function humanizeValue(value, fallback = "Not provided") {
  if (!value) {
    return fallback;
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatBillingCycle(billingCycle) {
  if (!billingCycle) {
    return "Monthly";
  }

  const labels = {
    monthly: "Monthly",
    yearly: "Yearly",
    contact_sales: "Contact Sales",
  };

  return labels[billingCycle] || humanizeValue(billingCycle, "Monthly");
}

function formatPaymentMethodLabel(paymentMethodType, paymentReferenceCode) {
  let resolvedType = paymentMethodType || "";

  if (!resolvedType && String(paymentReferenceCode || "").startsWith("wallet_balance_")) {
    resolvedType = "wallet_balance";
  }

  const labels = {
    manual_qr: "Manual QR Transfer",
    manual_link: "Manual Payment Link",
    wallet_balance: "Wallet Balance",
    pending_confirmation: "Pending Customer Confirmation",
  };

  return labels[resolvedType] || humanizeValue(resolvedType, "Pending");
}

function formatAddress(customer) {
  const structuredAddress = [
    customer?.billingAddress?.line1,
    customer?.billingAddress?.line2,
    customer?.billingAddress?.city,
    customer?.billingAddress?.state,
    customer?.billingAddress?.postalCode,
    customer?.billingAddress?.country,
  ].filter(Boolean);

  if (structuredAddress.length) {
    return structuredAddress.join(", ");
  }

  if (customer?.address) {
    return String(customer.address);
  }

  return "Not provided";
}

function normalizeLineItems(invoice, planName) {
  const items =
    invoice?.lineItems?.length > 0
      ? invoice.lineItems
      : [
          {
            label: planName || "Managed Service",
            amount: invoice?.amount || 0,
            quantity: 1,
          },
        ];

  return items.map((item) => {
    const quantity = Math.max(Number(item.quantity || 1), 1);
    const amount = Number(item.amount || 0);

    return {
      label: item.label || planName || "Managed Service",
      quantity,
      amount,
      unitAmount: quantity > 0 ? amount / quantity : amount,
    };
  });
}

function drawOutlinedCard(doc, x, y, width, height) {
  doc.save();
  doc.fillColor(palette.card);
  doc.roundedRect(x, y, width, height, 16).fill();
  doc.strokeColor(palette.border).lineWidth(1);
  doc.roundedRect(x, y, width, height, 16).stroke();
  doc.restore();
}

function drawKeyValue(doc, { x, y, width, label, value }) {
  doc.font("Helvetica-Bold").fontSize(9).fillColor(palette.muted).text(label.toUpperCase(), x, y, { width });
  doc.font("Helvetica").fontSize(11).fillColor(palette.text).text(value, x, y + 12, { width });
}

function drawStatusBadge(doc, status, x, y) {
  const tone = {
    paid: { background: "#dcfce7", text: "#166534" },
    pending: { background: "#fef3c7", text: "#92400e" },
    rejected: { background: "#fee2e2", text: "#b91c1c" },
    void: { background: "#e2e8f0", text: "#475569" },
  }[status] || { background: "#e2e8f0", text: "#334155" };

  doc.save();
  doc.font("Helvetica-Bold").fontSize(10);
  const label = humanizeValue(status || "pending", "Pending");
  const badgeWidth = Math.max(doc.widthOfString(label) + 24, 84);

  doc.fillColor(tone.background);
  doc.roundedRect(x - badgeWidth, y, badgeWidth, 24, 12).fill();
  doc.fillColor(tone.text).text(label, x - badgeWidth, y + 7, {
    width: badgeWidth,
    align: "center",
  });
  doc.restore();
}

export async function generateInvoicePdf({ invoice, customer, planName, supportEmail }) {
  fs.mkdirSync(env.invoiceDir, { recursive: true });

  const fileName = `${invoice.invoiceNumber}.pdf`;
  const filePath = path.join(env.invoiceDir, fileName);
  const fileUrl = toPublicFileUrl(`/files/invoices/${fileName}`);

  const normalizedItems = normalizeLineItems(invoice, planName);
  const subtotal = normalizedItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const customerAddress = formatAddress(customer);
  const customerPhone = customer?.phone || "Not provided";
  const customerName = customer?.name || customer?.email || "Customer";
  const paymentMethod = formatPaymentMethodLabel(invoice?.paymentMethodType, invoice?.paymentReferenceCode);
  const pageMargin = 44;

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      info: {
        Title: `Invoice ${invoice.invoiceNumber}`,
        Author: "ElevenOrbits",
      },
    });
    const stream = fs.createWriteStream(filePath);

    stream.on("finish", resolve);
    stream.on("error", reject);
    doc.on("error", reject);
    doc.pipe(stream);

    const contentWidth = doc.page.width - pageMargin * 2;
    let cursorY = pageMargin;

    doc.rect(0, 0, doc.page.width, doc.page.height).fill(palette.page);

    doc.save();
    doc.fillColor(palette.header);
    doc.roundedRect(pageMargin, cursorY, contentWidth, 118, 24).fill();

    const logoExists = fs.existsSync(companyLogoPath);
    if (logoExists) {
      doc.image(companyLogoPath, pageMargin + 20, cursorY + 22, {
        fit: [66, 66],
        align: "left",
        valign: "center",
      });
    }

    const brandX = pageMargin + (logoExists ? 102 : 24);
    doc.font("Helvetica-Bold").fontSize(24).fillColor("#ffffff").text("ElevenOrbits", brandX, cursorY + 26, {
      width: 250,
    });
    doc.font("Helvetica").fontSize(11).fillColor("#cbd5e1").text("Professional service invoice", brandX, cursorY + 56, {
      width: 250,
    });
    doc.text(`Support: ${supportEmail}`, brandX, cursorY + 74, { width: 250 });

    doc.font("Helvetica-Bold").fontSize(13).fillColor("#bfdbfe").text("INVOICE", pageMargin, cursorY + 28, {
      width: contentWidth - 20,
      align: "right",
    });
    doc.font("Helvetica-Bold").fontSize(21).fillColor("#ffffff").text(invoice.invoiceNumber, pageMargin, cursorY + 46, {
      width: contentWidth - 20,
      align: "right",
    });
    drawStatusBadge(doc, invoice.status, pageMargin + contentWidth - 18, cursorY + 82);
    doc.restore();

    cursorY += 138;

    const cardGap = 18;
    const cardWidth = (contentWidth - cardGap) / 2;
    const billToX = pageMargin;
    const summaryX = billToX + cardWidth + cardGap;
    const addressHeight = doc.heightOfString(customerAddress, {
      width: cardWidth - 36,
      align: "left",
    });
    const cardHeight = Math.max(220, 148 + addressHeight);

    drawOutlinedCard(doc, billToX, cursorY, cardWidth, cardHeight);
    drawOutlinedCard(doc, summaryX, cursorY, cardWidth, cardHeight);

    doc.font("Helvetica-Bold").fontSize(11).fillColor(palette.text).text("Bill To", billToX + 18, cursorY + 18);
    drawKeyValue(doc, {
      x: billToX + 18,
      y: cursorY + 46,
      width: cardWidth - 36,
      label: "Username",
      value: customerName,
    });
    drawKeyValue(doc, {
      x: billToX + 18,
      y: cursorY + 84,
      width: cardWidth - 36,
      label: "Email",
      value: customer?.email || "Not provided",
    });
    drawKeyValue(doc, {
      x: billToX + 18,
      y: cursorY + 122,
      width: cardWidth - 36,
      label: "Phone Number",
      value: customerPhone,
    });
    doc.font("Helvetica-Bold").fontSize(9).fillColor(palette.muted).text("ADDRESS", billToX + 18, cursorY + 160, {
      width: cardWidth - 36,
    });
    doc.font("Helvetica").fontSize(11).fillColor(palette.text).text(customerAddress, billToX + 18, cursorY + 172, {
      width: cardWidth - 36,
    });

    doc.font("Helvetica-Bold").fontSize(11).fillColor(palette.text).text("Invoice Details", summaryX + 18, cursorY + 18);
    const summaryRows = [
      ["Service", planName || "Managed Service"],
      ["Billing Cycle", formatBillingCycle(invoice.billingCycle)],
      ["Issued On", formatDate(invoice.issuedAt)],
      ["Paid On", invoice.status === "paid" ? formatDate(invoice.paidAt) : "Pending"],
      ["Payment Method", paymentMethod],
      ["Payment Reference", invoice.paymentReferenceCode || "Pending"],
      ["Invoice Total", formatMoney(invoice.amount, invoice.currency)],
    ];

    summaryRows.forEach(([label, value], index) => {
      drawKeyValue(doc, {
        x: summaryX + 18,
        y: cursorY + 46 + index * 24,
        width: cardWidth - 36,
        label,
        value,
      });
    });

    cursorY += cardHeight + 24;

    doc.font("Helvetica-Bold").fontSize(14).fillColor(palette.text).text("Invoice Items", pageMargin, cursorY);
    cursorY += 18;

    const tableColumns = {
      item: pageMargin + 18,
      qty: pageMargin + contentWidth - 190,
      rate: pageMargin + contentWidth - 132,
      amount: pageMargin + contentWidth - 62,
    };

    doc.fillColor(palette.tableHeader);
    doc.roundedRect(pageMargin, cursorY, contentWidth, 34, 12).fill();
    doc.font("Helvetica-Bold").fontSize(10).fillColor(palette.text).text("Service", tableColumns.item, cursorY + 11, {
      width: contentWidth - 260,
    });
    doc.text("Qty", tableColumns.qty, cursorY + 11, { width: 28, align: "right" });
    doc.text("Rate", tableColumns.rate, cursorY + 11, { width: 56, align: "right" });
    doc.text("Amount", tableColumns.amount, cursorY + 11, { width: 46, align: "right" });
    cursorY += 42;

    normalizedItems.forEach((item) => {
      doc.strokeColor(palette.border).lineWidth(1);
      doc.moveTo(pageMargin, cursorY + 30).lineTo(pageMargin + contentWidth, cursorY + 30).stroke();
      doc.font("Helvetica").fontSize(11).fillColor(palette.text).text(item.label, tableColumns.item, cursorY + 6, {
        width: contentWidth - 260,
      });
      doc.text(String(item.quantity), tableColumns.qty, cursorY + 6, {
        width: 28,
        align: "right",
      });
      doc.text(formatMoney(item.unitAmount, invoice.currency), tableColumns.rate - 6, cursorY + 6, {
        width: 62,
        align: "right",
      });
      doc.text(formatMoney(item.amount, invoice.currency), tableColumns.amount - 6, cursorY + 6, {
        width: 52,
        align: "right",
      });
      cursorY += 34;
    });

    cursorY += 18;

    const noteWidth = contentWidth - 228;
    doc.font("Helvetica-Bold").fontSize(10).fillColor(palette.muted).text("PAYMENT NOTES", pageMargin, cursorY + 8, {
      width: noteWidth,
    });
    doc.font("Helvetica").fontSize(11).fillColor(palette.text).text(
      invoice.status === "paid"
        ? `Payment has been verified through ${paymentMethod}.`
        : `Payment is currently marked as ${humanizeValue(invoice.status, "Pending")}. Reference ${invoice.paymentReferenceCode || "will appear after submission"}.`,
      pageMargin,
      cursorY + 24,
      {
        width: noteWidth,
      },
    );

    const totalsX = pageMargin + contentWidth - 210;
    drawOutlinedCard(doc, totalsX, cursorY, 210, 96);
    drawKeyValue(doc, {
      x: totalsX + 18,
      y: cursorY + 16,
      width: 174,
      label: "Subtotal",
      value: formatMoney(subtotal, invoice.currency),
    });
    drawKeyValue(doc, {
      x: totalsX + 18,
      y: cursorY + 50,
      width: 174,
      label: invoice.status === "paid" ? "Amount Paid" : "Amount Due",
      value: formatMoney(invoice.amount, invoice.currency),
    });

    const footerY = doc.page.height - 54;
    doc.strokeColor(palette.subtle).lineWidth(1);
    doc.moveTo(pageMargin, footerY - 12).lineTo(pageMargin + contentWidth, footerY - 12).stroke();
    doc.font("Helvetica").fontSize(10).fillColor(palette.muted).text(
      `Questions about this invoice? Contact ${supportEmail}.`,
      pageMargin,
      footerY,
      {
        width: contentWidth,
        align: "center",
      },
    );

    doc.end();
  });

  return {
    pdfPath: filePath,
    pdfUrl: fileUrl,
  };
}

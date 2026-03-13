export function generateInvoiceNumber(sequence) {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `EO-${yearMonth}-${String(sequence).padStart(4, "0")}`;
}


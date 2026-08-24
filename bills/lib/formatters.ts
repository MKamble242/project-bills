/**
 * Format currency in Indian Rupees
 * Returns format like: ₹5,000
 */
export function formatCurrency(amount: number | string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

/**
 * Format date in DD/MM/YYYY format (Indian standard)
 * Returns format like: 24/08/2026
 */
export function formatDateIndian(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Format date for display with short month name (e.g., "24 Aug 2026")
 * Useful for readable invoice dates
 */
export function formatDateReadable(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Format date and time together for metadata display
 */
export function formatDateTimeShort(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

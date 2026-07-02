const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const dateTime = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const formatINR = (n: number) => inr.format(n);
export const formatDate = (d: string | Date | null | undefined) => !d ? "N/A" : date.format(typeof d === "string" ? new Date(d) : d);
export const formatDateTime = (d: string | Date | null | undefined) => !d ? "N/A" : dateTime.format(typeof d === "string" ? new Date(d) : d);
export const formatPercent = (v: number, digits = 1) => `${v.toFixed(digits)}%`;
export const formatBytes = (bytes: number) => { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MB`; };

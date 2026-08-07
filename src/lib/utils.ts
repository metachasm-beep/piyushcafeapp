import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge tailwind classes safely.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// Utility helpers shared across the app
// ============================================================

/**
 * Format a number as Indian Rupee currency string.
 * e.g. 1234 → "₹1,234"
 */
export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Generate a v4-style UUID using the Web Crypto API.
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Return a relative time string from an ISO date string.
 * e.g. "3 minutes ago"
 */
export function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Deep clone a plain object (uses structuredClone where available).
 */
export function deepClone<T>(obj: T): T {
  return structuredClone(obj);
}

/**
 * Slugify a string for use in URLs.
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

/**
 * Get or create a persistent customer session ID stored in localStorage.
 */
export function getOrCreateSession(): string {
  if (typeof localStorage === 'undefined') return generateUUID();
  let session = localStorage.getItem('gf_session_id');
  if (!session) {
    session = generateUUID();
    localStorage.setItem('gf_session_id', session);
  }
  return session;
}

/**
 * Dietary tag display metadata.
 */
export const DIETARY_META: Record<
  string,
  { label: string; color: string; bg: string; emoji: string }
> = {
  veg:          { label: 'Veg',        color: '#16a34a', bg: '#dcfce7', emoji: '🟢' },
  vegan:        { label: 'Vegan',      color: '#15803d', bg: '#bbf7d0', emoji: '🌿' },
  gluten_free:  { label: 'GF',         color: '#d97706', bg: '#fef3c7', emoji: '🌾' },
  contains_nuts:{ label: 'Nuts',       color: '#b45309', bg: '#fde68a', emoji: '🥜' },
  dairy_free:   { label: 'Dairy-free', color: '#0284c7', bg: '#e0f2fe', emoji: '🥛' },
  spicy:        { label: 'Spicy',      color: '#dc2626', bg: '#fee2e2', emoji: '🌶️' }
};

/**
 * Order status display metadata.
 */
export const ORDER_STATUS_META: Record<
  string,
  { label: string; color: string; bg: string; step: number }
> = {
  pending:   { label: 'Order Placed',  color: '#f97316', bg: '#fff7ed', step: 0 },
  preparing: { label: 'Preparing',     color: '#8b5cf6', bg: '#f5f3ff', step: 1 },
  ready:     { label: 'Ready!',        color: '#10b981', bg: '#ecfdf5', step: 2 },
  served:    { label: 'Served',        color: '#6366f1', bg: '#eef2ff', step: 3 },
  paid:      { label: 'Paid',          color: '#64748b', bg: '#f8fafc', step: 4 },
  cancelled: { label: 'Cancelled',     color: '#ef4444', bg: '#fef2f2', step: -1 }
};

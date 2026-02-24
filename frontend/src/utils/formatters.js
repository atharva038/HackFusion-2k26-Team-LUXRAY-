/**
 * Frontend utility helpers
 */

/** Format a Date object to a readable time string */
export function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Truncate text to a max length */
export function truncate(str, maxLen = 80) {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

/** Capitalize first letter */
export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

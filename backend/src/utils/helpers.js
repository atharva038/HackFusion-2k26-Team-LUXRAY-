/**
 * Generic helper utilities for the backend.
 */

/** Wrap an async Express handler with error catching */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/** Generate a random alphanumeric ID */
function generateId(prefix = 'ID', length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = prefix + '-';
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

module.exports = { asyncHandler, generateId };

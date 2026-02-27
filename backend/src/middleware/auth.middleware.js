import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set.');

/**
 * Verifies the JWT from the Authorization header and attaches req.user.
 */
export const protect = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer')) {
    return res.status(401).json({ error: 'Not authenticated. Please log in.' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch (err) {
    logger.warn('Invalid JWT:', err.message);
    return res.status(401).json({ error: 'Token is invalid or expired. Please log in again.' });
  }
};

/**
 * Restricts access to specified roles.
 * Usage: restrictTo('admin', 'pharmacist')
 */
export const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Access denied. Required roles: ${roles.join(', ')}.` });
  }
  next();
};

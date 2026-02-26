import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'pharmacy_jwt_secret_dev';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

const signToken = (userId, role) =>
  jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

const sendAuthResponse = (res, user, statusCode = 200) => {
  const token = signToken(user._id, user.role);
  res.status(statusCode).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      age: user.age,
      gender: user.gender,
    },
  });
};

// ─── POST /api/auth/register ─────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, age, gender, role } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required.' });

    // Prevent self-promoting to admin/pharmacist via the public registration
    const safeRole = role === 'customer' ? 'customer' : 'customer';

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(409).json({ error: 'An account with this email already exists.' });

    const user = await User.create({ name, email, password, phone, age, gender, role: safeRole });

    logger.info(`New customer registered: ${email}`);
    sendAuthResponse(res, user, 201);
  } catch (err) {
    logger.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    // Explicitly select password back since it's select: false
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user)
      return res.status(401).json({ error: 'Invalid email or password.' });

    // Guard: account exists but was seeded without a password (old insertMany records)
    if (!user.password)
      return res.status(401).json({ error: 'This account has no password set. Please run the seed or register again.' });

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch)
      return res.status(401).json({ error: 'Invalid email or password.' });

    logger.info(`User logged in: ${email} (${user.role})`);
    sendAuthResponse(res, user);
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
};

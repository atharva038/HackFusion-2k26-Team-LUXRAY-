const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost',
  'http://127.0.0.1',
  'http://localhost:5173',
  'http://localhost:3000',
];

const VERCEL_PROJECT_KEYWORD = 'hack-fusion-2k26';
const IPV4_ON_3000_REGEX = /^https?:\/\/(?:\d{1,3}\.){3}\d{1,3}:3000$/;

const normalizeOrigin = (origin) => origin.replace(/\/$/, '');

const parseOriginList = (value) => {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(normalizeOrigin);
};

const ENV_ALLOWED_ORIGINS = parseOriginList([
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGINS,
].filter(Boolean).join(','));

const allowedOrigins = new Set([...DEFAULT_ALLOWED_ORIGINS, ...ENV_ALLOWED_ORIGINS].map(normalizeOrigin));

export const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  const normalizedOrigin = normalizeOrigin(origin);

  if (normalizedOrigin.includes(VERCEL_PROJECT_KEYWORD) && normalizedOrigin.includes('vercel.app')) {
    return true;
  }

  // Allow direct VPS access when frontend is exposed as http://<ip>:3000.
  if (IPV4_ON_3000_REGEX.test(normalizedOrigin)) {
    return true;
  }

  return allowedOrigins.has(normalizedOrigin);
};

export const corsOriginHandler = (origin, callback) => {
  if (isAllowedOrigin(origin)) {
    return callback(null, true);
  }

  return callback(new Error(`Not allowed by CORS: ${origin}`));
};

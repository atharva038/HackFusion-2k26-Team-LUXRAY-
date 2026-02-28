---
sidebar_position: 2
title: Production Deployment
---

# Production Deployment

MediSage is deployed with:
- **Frontend** → [Vercel](https://vercel.com)
- **Backend** → [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform) or [Render](https://render.com)
- **Domain** → [medisage.me](https://medisage.me)

---

## Frontend (Vercel)

### Steps

1. Push your code to GitHub
2. Connect repo to Vercel
3. Set build settings:
   - **Framework:** Vite
   - **Root directory:** `frontend`
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. Add environment variables in Vercel dashboard:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   VITE_SOCKET_URL=https://your-backend.onrender.com
   ```
5. Deploy

### CORS on Backend

Ensure the backend's CORS whitelist includes your Vercel URL:

```javascript
const allowedOrigins = [
  'https://your-project.vercel.app',
  'https://medisage.me',
  // Vercel preview deployments match pattern:
  /^https:\/\/[\w-]+-your-org\.vercel\.app$/,
];
```

---

## Backend (Render / DigitalOcean)

### Steps

1. Connect repo to Render or DigitalOcean
2. Set root directory: `backend`
3. Start command: `npm run start`
4. Set all environment variables (see [Environment Variables](./environment-variables))
5. Deploy

### Health Check

Render/DigitalOcean will ping `GET /api/health` (or any route that returns 200). The Express app returns `200` for all unmatched GET requests on the root.

---

## Socket.IO in Production

Socket.IO requires sticky sessions if running multiple backend instances. Configure via:

- **Render:** Deploy a single instance (no load balancer needed)
- **DigitalOcean:** Use a single-container deployment or enable session affinity
- **Redis Adapter:** For multi-instance, add `@socket.io/redis-adapter`:
  ```javascript
  import { createAdapter } from '@socket.io/redis-adapter';
  io.adapter(createAdapter(pubClient, subClient));
  ```

---

## Razorpay Webhook

In the Razorpay dashboard:
1. Go to **Settings → Webhooks**
2. Add endpoint: `https://your-backend.com/api/payment/webhook`
3. Select events: `payment.captured`, `payment.failed`
4. Copy the webhook secret → set as `RAZORPAY_WEBHOOK_SECRET`

---

## Cloudinary Configuration

Create two folders in Cloudinary dashboard (or they auto-create on first upload):
- `prescriptions` — prescription images
- `session_recordings` — video recordings

Set upload presets if needed (unsigned uploads are not used — all uploads go through the backend).

---

## Security Checklist for Production

- [ ] `NODE_ENV=production` set
- [ ] `JWT_SECRET` is at least 32 random characters
- [ ] MongoDB URI uses authentication (`user:pass@host`)
- [ ] Redis is password-protected (`rediss://`)
- [ ] HTTPS enforced (Vercel and Render do this automatically)
- [ ] Razorpay webhook secret is set and verified
- [ ] CORS whitelist only contains known origins
- [ ] Rate limiting enabled (Redis-backed)
- [ ] `.env` is never committed to git (in `.gitignore`)

---

## Docs Site Deployment

This documentation site can be deployed to **GitHub Pages** or **Netlify**:

```bash
cd docs
npm run build      # Builds to docs/build/
```

For GitHub Pages:
```bash
npm run deploy     # Requires GIT_USER and SSH access configured
```

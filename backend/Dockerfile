FROM node:20-alpine

# Install dumb-init for proper PID 1 signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts

# Copy application source
COPY src/ ./src/

EXPOSE 5000

ENV NODE_ENV=production

# Use dumb-init so signals (SIGTERM etc.) propagate correctly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/app.js"]

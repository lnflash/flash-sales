# Use multi-stage build for efficiency
# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy the rest of the code
COPY . .

# Ensure public directory exists
RUN mkdir -p public

# Build the application
RUN npm run build

# Stage 2: Run the application
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Create public directory
RUN mkdir -p public

# Install only production dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json* ./
RUN npm ci --only=production

# Copy next.config.js from builder
COPY --from=builder /app/next.config.js ./

# Copy the build output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Create a non-root user to run the app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

USER nextjs

# Expose the port
EXPOSE 3000

# Set the start command
CMD ["npm", "start"]
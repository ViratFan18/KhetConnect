# Multi-stage Dockerfile for React + Vite frontend
# Stage 1: Build with Node
FROM node:20-alpine as builder

WORKDIR /build

# Copy package.json and install dependencies (cacheable layer)
COPY package*.json ./
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 2: Runtime with Nginx
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user for Nginx
RUN adduser -D -g 'www' www

# Copy built application from builder stage
COPY --from=builder --chown=www:www /build/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

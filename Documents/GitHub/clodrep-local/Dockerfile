FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    bash \
    curl \
    git \
    python3 \
    py3-pip \
    docker-cli \
    tesseract-ocr

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S clodrep -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/
COPY bin/ ./bin/

# Build application
RUN npm run build

# Change ownership to app user
RUN chown -R clodrep:nodejs /app
USER clodrep

# Expose bridge port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Default command
CMD ["node", "dist/index.js"]
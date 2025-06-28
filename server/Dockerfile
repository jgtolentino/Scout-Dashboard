FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy TypeScript config and source
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm install -g typescript
RUN npm run build

# Remove dev dependencies and source
RUN rm -rf src tsconfig.json

EXPOSE 5000

CMD ["npm", "start"]
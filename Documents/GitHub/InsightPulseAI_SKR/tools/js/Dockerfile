FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Create config directory
RUN mkdir -p /root/.pulser

# Set executable permissions
RUN chmod +x index.js

# Set environment variables
ENV NODE_ENV=production

# Set the entrypoint to the CLI
ENTRYPOINT ["node", "index.js"]
FROM node:20-alpine
WORKDIR /app

# 1. Copy package files first
COPY package*.json ./

# 2. Install dependencies (Clean install)
RUN npm install

# 3. Copy application files
COPY . .

# 4. Force Node to find modules in the default location
ENV NODE_PATH=/app/node_modules

# 5. Start the app
CMD ["node", "main.js"]
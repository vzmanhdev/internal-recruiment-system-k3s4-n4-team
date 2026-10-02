FROM node:20-alpine

WORKDIR /app

# Copy package descriptors & install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy application source code
COPY . .

# Set API Endpoint for build time
ARG NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NODE_ENV=production

# Build Next.js application
RUN npm run build

# Expose Next.js server port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "start"]

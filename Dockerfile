# Use Node 20 alpine as builder
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Build the application
RUN npm run build

# Use Nginx for serving lightweight static files
FROM nginx:alpine

# Copy built application to Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Create custom nginx config to support SPA routing on fallback and include security headers
RUN echo 'server { \
    listen 8080; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Cache static assets \
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico)$ { \
        expires 1y; \
        add_header Cache-Control "public, no-transform"; \
    } \
    \
    add_header X-Frame-Options "DENY"; \
    add_header X-XSS-Protection "1; mode=block"; \
    add_header X-Content-Type-Options "nosniff"; \
    add_header Content-Security-Policy "default-src '"'self'"'; script-src '"'self'"' '"'unsafe-inline'"' https://apis.google.com https://www.googletagmanager.com; style-src '"'self'"' '"'unsafe-inline'"' https://fonts.googleapis.com; font-src '"'self'"' https://fonts.gstatic.com; img-src '"'self'"' data: https://lh3.googleusercontent.com; connect-src '"'self'"' https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com; frame-src '"'self'"' https://*.firebaseapp.com"; \
}' > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

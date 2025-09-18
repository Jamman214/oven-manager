# --- Stage 1: The "Builder" ---
# Use a Node.js image to build the application
FROM arm32v6/node:18-alpine AS builder

# Set the working directory for the build
WORKDIR /app

# Copy package.json and the lock file
COPY frontend/package*.json ./

# Install dependencies securely and efficiently
RUN npm ci

# Copy the rest of the application source code
COPY frontend/. .

# Run the build command to generate static files
RUN npm run build


# --- Stage 2: The "Final Image" ---
# Use a lightweight Nginx server to host the static files
FROM arm32v6/nginx:alpine

# Copy the built assets from the "builder" stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Optional: Copy a custom Nginx configuration file
# This is highly recommended for Single-Page Applications (SPAs)
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the web server
EXPOSE 80

# The default Nginx command will start the server
CMD ["nginx", "-g", "daemon off;"]
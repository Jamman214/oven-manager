# Base image optimized for Raspberry Pi Zero W (ARMv6)
FROM arm32v6/alpine:latest

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Install runtime dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    nginx \
    py3-flask \
    py3-requests \
    py3-jinja2 \
    && ln -sf python3 /usr/bin/python

# Set the working directory
WORKDIR /app

# Copy Python requirements first for better caching
COPY backend/requirements.txt /app/backend/requirements.txt

# Install remaining Python dependencies
# Alpine packages are pre-compiled for ARM, avoiding compilation issues
RUN pip3 install --no-cache-dir --break-system-packages \
    --find-links https://www.piwheels.org/simple/ \
    -r backend/requirements.txt

# Copy the rest of the backend code
COPY backend/ /app/backend/

# Copy the pre-built React app to nginx serving directory
COPY frontend/dist/ /usr/share/nginx/html/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create nginx run directory
RUN mkdir -p /run/nginx

# Expose ports
EXPOSE 5000 80

# Run entrypoint
ENTRYPOINT ["/entrypoint.sh"]
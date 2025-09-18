# Base image
FROM ubuntu:20.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && \
    apt-get install -y python3 python3-pip nginx curl git

RUN curl -sL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Install Vite (if using npm)
RUN npm install -g vite

# Set the working directory for the React app and server
WORKDIR /app

# Copy the application code
COPY . /app

# Install Python dependencies (for Flask)
RUN pip3 install -r backend/requirements.txt

# Build React app using Vite
WORKDIR /app/frontend
RUN npm install && npm run build

# Configure Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Expose Flask server and Nginx ports
EXPOSE 5000 80

# Set entrypoint script for running both Flask and Nginx
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Run entrypoint
ENTRYPOINT ["/entrypoint.sh"]
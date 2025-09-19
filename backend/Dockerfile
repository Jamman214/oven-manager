# Start from a generic and stable ARMv6 OS image
FROM alpine:latest

# Install Python, Pip, and Git (Gunicorn might need it)
RUN apk add --no-cache python3 py3-pip git

# Set the working directory
WORKDIR /app

# Copy the requirements file from the backend subfolder
COPY backend/requirements.txt .

# Install dependencies using pip
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Copy the application code from the backend subfolder
COPY backend/ .

# Copy the entrypoint script, and make it executable
COPY backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set the entrypoint script as the command to run
ENTRYPOINT ["/entrypoint.sh"]
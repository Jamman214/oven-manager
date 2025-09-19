# Start from a generic and stable ARMv6 OS image
FROM alpine:latest

# Install Python and Pip using Alpine's package manager
RUN apk add --no-cache python3 py3-pip gcc musl-dev python3-dev

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file
COPY scripts/requirements.txt .

# Install dependencies using pip
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Copy your worker script(s) into the container
COPY scripts/. .

# Define the default command to run when the container starts
CMD ["python3", "controller.py"]
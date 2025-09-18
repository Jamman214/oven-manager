#!/bin/bash

# Start Flask server in the background
cd /app/backend
python3 app.py &

# Start Nginx
nginx -g 'daemon off;'
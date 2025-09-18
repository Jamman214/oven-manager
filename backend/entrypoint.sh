#!/bin/sh

# The path to the database file inside the container
DB_FILE="/app/data/temperatures_and_presets.db"

# Check if the database file does not exist
if [ ! -f "$DB_FILE" ]; then
    echo "Database not found. Initializing..."
    flask init-db
    echo "Database initialized."
else
    echo "Database already exists."
fi

# Start the main application (Gunicorn)
exec gunicorn --bind 0.0.0.0:5000 app:app
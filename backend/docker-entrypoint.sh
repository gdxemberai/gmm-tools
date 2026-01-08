#!/bin/bash
# Docker entrypoint script for backend
# Initializes database and starts the application

set -e

echo "Waiting for PostgreSQL to be ready..."
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if python -c "import asyncpg; import asyncio; asyncio.run(asyncpg.connect('postgresql://admin:admin123@gmm-postgres:5432/sports_cards', timeout=5))" 2>/dev/null; then
        echo "PostgreSQL is ready!"
        break
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo "ERROR: PostgreSQL failed to become ready after $MAX_ATTEMPTS attempts (60 seconds)"
        exit 1
    fi
    
    echo "PostgreSQL is unavailable - sleeping (attempt $ATTEMPT/$MAX_ATTEMPTS)"
    sleep 2
done

echo "Initializing database..."
python -m app.init_db || echo "Database already initialized"

echo "Seeding database with sample data..."
python seed_db.py || echo "Database already seeded or seeding failed"

echo "Starting application..."
exec "$@"

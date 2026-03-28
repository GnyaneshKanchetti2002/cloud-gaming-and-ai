FROM python:3.11-slim

WORKDIR /app

# Install compilation libraries for psycopg2 and auth security libraries
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Copy strictly required environment setups first
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Local hot-reloading happens through docker-compose volumes, but copy as fallback
COPY . .

# Run auto-migrations directly against the db container, then boot the server
CMD ["sh", "-c", "alembic revision --autogenerate -m 'Init DB' && alembic upgrade head && uvicorn api.main:app --host 0.0.0.0 --port 8000"]

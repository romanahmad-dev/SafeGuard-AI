# Use official lightweight Python base layer
FROM python:3.10-slim

# Set system environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=3000

# Set workspace directory
WORKDIR /app

# Install basic system library packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy python dependencies manifest
COPY requirements.txt .

# Install dependencies using pip caching optimization
RUN pip install --no-cache-dir -r requirements.txt

# Copy overall code structures to root container
COPY . .

# Expose virtual container port matching deployment expectations
EXPOSE 3000

# Boot gateway server
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}"]

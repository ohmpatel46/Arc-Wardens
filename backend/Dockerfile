FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create the database file if it doesn't exist (it will still be ephemeral on Render free tier)
# We do this so the app doesn't crash on startup looking for a file that isn't created yet
RUN touch campaigns.db

# Expose the internal port
EXPOSE 5000

# Command to run the application
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "5000"]

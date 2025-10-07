# Redis Setup Guide

## Option 1: Skip Redis (Recommended for Development)
The application will work without Redis in development mode. No setup required.

## Option 2: Install Redis Locally (Windows)

### Using Chocolatey (Recommended)
```bash
# Install Chocolatey if not installed
# Run PowerShell as Administrator and execute:
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Redis
choco install redis-64

# Start Redis
redis-server
```

### Using WSL (Windows Subsystem for Linux)
```bash
# Install WSL if not installed
wsl --install

# In WSL terminal:
sudo apt update
sudo apt install redis-server

# Start Redis
sudo service redis-server start

# Test Redis
redis-cli ping
```

### Using Docker (Easiest)
```bash
# Install Docker Desktop from https://www.docker.com/products/docker-desktop

# Run Redis container
docker run -d --name redis-meettime -p 6379:6379 redis:alpine

# Stop Redis
docker stop redis-meettime

# Start Redis again
docker start redis-meettime
```

## Option 3: Use Redis Cloud (Free Tier)
1. Go to https://redis.com/try-free/
2. Create a free account
3. Create a new database
4. Copy the connection URL
5. Update `server/.env` file:
   ```
   REDIS_URL=your_redis_cloud_url_here
   ```

## Verify Redis Connection
After setting up Redis, restart the backend server. You should see:
```
Redis client connected
Redis client ready
```

If you see Redis connection errors, the app will continue to work without Redis (with reduced performance for large meetings).
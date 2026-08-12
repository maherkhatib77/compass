# Gunicorn configuration file for Matspanet application
# Note: For FastAPI, use Uvicorn instead. This file is kept for reference.
# Run with: uvicorn main:app --host 127.0.0.1 --port 8000 --workers 4

import multiprocessing

# Server socket
bind = "127.0.0.1:8000"  # Bind to localhost only (Nginx will proxy)
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1  # Recommended formula
worker_class = "uvicorn.workers.UvicornWorker"  # Use Uvicorn worker for ASGI
worker_connections = 1000
timeout = 30
keepalive = 2

# Process naming
proc_name = "matspanet"

# Server mechanics
daemon = False
pidfile = "/workspace/gunicorn.pid"
umask = 0
user = None
group = None
tmp_upload_dir = None

# Logging
errorlog = "/workspace/logs/gunicorn_error.log"
accesslog = "/workspace/logs/gunicorn_access.log"
loglevel = "info"

# Process management
graceful_timeout = 30
max_requests = 1000
max_requests_jitter = 50

# SSL (if needed directly, otherwise Nginx handles it)
keyfile = None
certfile = None

# When using this config with Uvicorn worker, run:
# gunicorn --config gunicorn_config.py main:app

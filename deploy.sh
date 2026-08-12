#!/bin/bash
# Matspanet Deployment Script
# This script sets up and starts the Matspanet application with Nginx and Uvicorn

set -e

echo "=========================================="
echo "Matspanet Deployment Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Step 1: Create logs directory
print_info "Creating logs directory..."
mkdir -p /workspace/logs
print_success "Logs directory created"

# Step 2: Stop any existing processes
print_info "Stopping existing processes..."
pkill -f uvicorn 2>/dev/null || true
pkill -f gunicorn 2>/dev/null || true
sleep 1
print_success "Existing processes stopped"

# Step 3: Start Uvicorn with Gunicorn
print_info "Starting Uvicorn workers with Gunicorn..."
cd /workspace
nohup gunicorn --config gunicorn_config.py main:app > /workspace/logs/gunicorn_stdout.log 2>&1 &
GUNICORN_PID=$!
echo $GUNICORN_PID > /workspace/gunicorn.pid
sleep 3

if ps -p $GUNICORN_PID > /dev/null 2>&1; then
    print_success "Gunicorn started (PID: $GUNICORN_PID)"
else
    print_error "Failed to start Gunicorn"
    cat /workspace/logs/gunicorn_error.log
    exit 1
fi

# Step 4: Test Nginx configuration
print_info "Testing Nginx configuration..."
if nginx -t > /dev/null 2>&1; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration test failed"
    nginx -t
    exit 1
fi

# Step 5: Restart Nginx
print_info "Restarting Nginx..."
nginx -s reload 2>/dev/null || service nginx restart 2>/dev/null || nginx
sleep 2
print_success "Nginx restarted"

# Step 6: Verify services
print_info "Verifying services..."
sleep 2

# Check if Uvicorn/Gunicorn is running
if pgrep -f "gunicorn.*main:app" > /dev/null; then
    print_success "Application server is running"
    ps aux | grep "gunicorn.*main:app" | grep -v grep | head -3
else
    print_error "Application server is not running"
    exit 1
fi

# Check if Nginx is running
if pgrep -f "nginx" > /dev/null; then
    print_success "Nginx is running"
    ps aux | grep "nginx" | grep -v grep | head -2
else
    print_error "Nginx is not running"
    exit 1
fi

# Step 7: Test endpoint
print_info "Testing application endpoint..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null)
if [ "$RESPONSE" == "200" ]; then
    print_success "Application is responding (HTTP $RESPONSE)"
else
    print_info "Application responded with HTTP $RESPONSE"
fi

echo ""
echo "=========================================="
print_success "Deployment completed successfully!"
echo "=========================================="
echo ""
echo "Application URLs:"
echo "  - Main site: http://localhost/"
echo "  - API docs:  http://localhost/docs"
echo "  - Health:    http://localhost/health (if available)"
echo ""
echo "Log files:"
echo "  - Application: /workspace/logs/gunicorn_error.log"
echo "  - Access:      /workspace/logs/gunicorn_access.log"
echo "  - Nginx:       /workspace/logs/nginx_error.log"
echo ""
echo "To stop the application:"
echo "  pkill -f gunicorn"
echo ""
echo "To view logs:"
echo "  tail -f /workspace/logs/gunicorn_error.log"
echo "  tail -f /workspace/logs/nginx_error.log"
echo ""

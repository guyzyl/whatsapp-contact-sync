#!/bin/sh

# Health check script for Docker container
# Checks both web frontend and server backend

# Check web frontend
if ! curl -f http://localhost:80/health.json >/dev/null 2>&1; then
	echo "Web health check failed"
	exit 1
fi

# Check server backend
if ! curl -f http://localhost:8080/health >/dev/null 2>&1; then
	echo "Server health check failed"
	exit 1
fi

echo "All health checks passed"
exit 0

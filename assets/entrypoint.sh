#!/bin/sh

node build/server/main.js &

# Wait for the server to start
while ! nc -z 0.0.0.0 8080; do
  sleep 0.1
done

echo "Starting Nginx server"
nginx &
echo "Nginx server started, listening on port 80"

# Crash container if node failes
wait %1

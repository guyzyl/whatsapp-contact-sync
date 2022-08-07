#!/bin/sh

npm run prod &

# Wait for the server to start
while ! nc -z localhost 8080; do
  sleep 0.1
done

nginx &

# Crach container if node failes
wait %1

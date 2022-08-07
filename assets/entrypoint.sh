#!/bin/sh

while true; do npm run prod && break; done &
nginx

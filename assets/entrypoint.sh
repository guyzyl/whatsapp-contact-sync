#!/bin/bash

# Turn on bash's job control
set -m

npm run serve &
nginx

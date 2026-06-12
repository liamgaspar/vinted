#!/usr/bin/env bash
#
# deploy.sh — rebuild the app on the server (pull latest code + build static files)
#
# Run this ON THE SERVER, from the repository root.
# Usage:  ./deploy.sh
#
# What it does, step by step:
#   1. pull the latest code from the remote   (git pull)
#   2. install exact frontend dependencies    (npm ci)
#   3. compile the app into static files       (npm run build -> client/dist/)
#
# A static web server (e.g. nginx) then serves client/dist/.

set -e  # stop at the first error (don't deploy on top of a broken build)

echo "==> 1/3  Pulling latest code (git pull)"
git pull origin main

echo "==> 2/3  Installing dependencies (npm ci)"
cd client
npm ci

echo "==> 3/3  Building the app (npm run build)"
npm run build

echo ""
echo "Done. Static files are in: $(pwd)/dist"

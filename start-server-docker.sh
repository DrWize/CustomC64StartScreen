#!/usr/bin/env bash
# Start C64 Boot Screen Editor with Docker
# Usage: ./start-server-docker.sh [port]
#
# Requires: Docker installed and running
#
# This is the recommended way to run the editor, as it provides
# consistent behavior across all platforms and enables the font
# library to scan the fonts/ directory.

PORT="${1:-8064}"

if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not in PATH"
    echo "Install Docker from https://www.docker.com/"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "Error: Docker daemon is not running"
    echo "Start Docker and try again"
    exit 1
fi

echo "C64 Boot Screen Editor - Docker"
echo "================================"
echo ""
echo "Building image..."

# Build the Docker image
docker build -t c64boot-editor . -q

if [ $? -ne 0 ]; then
    echo "Error: Failed to build Docker image"
    exit 1
fi

echo "Starting container on port $PORT..."
echo "Open http://localhost:$PORT in your browser"
echo "Press Ctrl+C to stop"
echo ""

# Run with volume mounts for fonts and kernal directories
docker run --rm -it \
    -p "$PORT:8064" \
    -v "$(pwd)/fonts:/usr/local/apache2/htdocs/fonts:ro" \
    -v "$(pwd)/kernal:/usr/local/apache2/htdocs/kernal:ro" \
    --name c64boot-editor \
    c64boot-editor

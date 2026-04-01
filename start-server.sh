#!/usr/bin/env bash
# Start a local web server for C64 Boot Screen Editor
# Usage: ./serve.sh [port]

PORT="${1:-8064}"

echo "C64 Boot Screen Editor"
echo "Open http://localhost:$PORT"
echo "Press Ctrl+C to stop"
echo ""

python3 -m http.server "$PORT" -d "$(dirname "$0")" 2>/dev/null || \
python -m http.server "$PORT" -d "$(dirname "$0")"

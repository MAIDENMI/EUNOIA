#!/bin/bash

# Start script for Modular TalkingHead
# This starts a simple HTTP server to serve the modular version

echo "🚀 Starting Modular TalkingHead Server..."
echo ""
echo "📁 Directory: $(pwd)"
echo "🌐 URL: http://localhost:8000/index-modular.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Try different server options in order of preference
if command -v python3 &> /dev/null; then
    echo "✅ Using Python 3"
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "✅ Using Python"
    python -m SimpleHTTPServer 8000
elif command -v php &> /dev/null; then
    echo "✅ Using PHP"
    php -S localhost:8000
elif command -v npx &> /dev/null; then
    echo "✅ Using Node.js http-server"
    npx http-server -p 8000 -c-1
else
    echo "❌ Error: No suitable HTTP server found!"
    echo ""
    echo "Please install one of the following:"
    echo "  - Python 3: brew install python3"
    echo "  - PHP: brew install php"
    echo "  - Node.js: brew install node"
    exit 1
fi






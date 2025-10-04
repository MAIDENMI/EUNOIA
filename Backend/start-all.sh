#!/bin/bash

# Start both Python and Node.js services concurrently

echo "🌿 Starting Mind+Motion Backend Services"
echo "========================================"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start Python service
echo "Starting Python AI Service on port 8000..."
cd python-service
source venv/bin/activate
python main.py &
PYTHON_PID=$!
cd ..

# Wait a bit for Python to start
sleep 2

# Start Node.js service
echo "Starting Node.js Real-time Service on port 8001..."
cd node-service
npm run dev &
NODE_PID=$!
cd ..

echo ""
echo "========================================"
echo "✓ Services started!"
echo "  Python AI Service: http://localhost:8000"
echo "  Node.js Service: http://localhost:8001"
echo ""
echo "Press Ctrl+C to stop all services"
echo "========================================"

# Wait for both processes
wait

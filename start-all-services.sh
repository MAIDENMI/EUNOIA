#!/bin/bash

# Complete startup script for EUNOIA project
# Starts: Frontend (3000), Python AI (8000), Node Voice (8001), TalkingHead (8080)

echo "🌿 Starting EUNOIA - Complete System"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Check if port is in use
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# 1. Start Python AI Service (Port 8000)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Starting Python AI Service (Port 8000)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd Backend/python-service

if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found. Creating...${NC}"
    python3 -m venv venv
fi

if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found in Backend/python-service${NC}"
    echo "   Please create .env with your GEMINI_API_KEY"
    echo "   Example: GEMINI_API_KEY=your_key_here"
    cd ../..
    exit 1
fi

source venv/bin/activate
echo -e "${GREEN}✅ Starting Python service...${NC}"
python main.py &
PYTHON_PID=$!
cd ../..

sleep 2

# 2. Start Node Voice Service (Port 8001)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Starting Node Voice Service (Port 8001)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd Backend/node-service

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependencies not installed. Running npm install...${NC}"
    npm install
fi

if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found in Backend/node-service${NC}"
    echo "   Please create .env with your ELEVENLABS_API_KEY"
    echo "   Example: ELEVENLABS_API_KEY=your_key_here"
    cd ../..
    cleanup
fi

echo -e "${GREEN}✅ Starting Node service...${NC}"
npm start &
NODE_PID=$!
cd ../..

sleep 2

# 3. Start TalkingHead Service (Port 8080)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Starting TalkingHead Service (Port 8080)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd Backend/talkinghead

if check_port 8080; then
    echo -e "${YELLOW}⚠️  Port 8080 already in use. Skipping TalkingHead startup.${NC}"
else
    echo -e "${GREEN}✅ Starting TalkingHead server...${NC}"
    python3 -m http.server 8080 > /dev/null 2>&1 &
    TALKING_PID=$!
fi
cd ../..

sleep 1

# 4. Frontend (should already be running on 3000)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Checking Frontend (Port 3000)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if check_port 3000; then
    echo -e "${GREEN}✅ Frontend already running on port 3000${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend not running. Start with: cd frontend && npm run dev${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ All Services Started!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}🌐 Frontend:${NC}        http://localhost:3000"
echo -e "${GREEN}🤖 Python AI:${NC}       http://localhost:8000"
echo -e "${GREEN}🎤 Node Voice:${NC}      http://localhost:8001"
echo -e "${GREEN}👤 TalkingHead:${NC}     http://localhost:8080"
echo ""
echo "📍 Access the call page: http://localhost:3000/call"
echo ""
echo "Press Ctrl+C to stop all services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Wait for all processes
wait

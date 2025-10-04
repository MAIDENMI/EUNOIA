#!/bin/bash

echo "🌿 Mind+Motion Backend Setup"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python
echo -e "${BLUE}Checking Python...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓ $PYTHON_VERSION${NC}"
else
    echo -e "${YELLOW}⚠ Python 3 not found. Please install Python 3.9+${NC}"
    exit 1
fi

# Check Node.js
echo -e "${BLUE}Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js $NODE_VERSION${NC}"
else
    echo -e "${YELLOW}⚠ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

echo ""
echo "=============================="
echo -e "${BLUE}Setting up Python Service...${NC}"
echo "=============================="
cd python-service

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${GREEN}✓ Virtual environment exists${NC}"
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo -e "${GREEN}✓ Python dependencies installed${NC}"

# Create .env if doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠ Created .env file - Please add your GEMINI_API_KEY${NC}"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

deactivate
cd ..

echo ""
echo "=============================="
echo -e "${BLUE}Setting up Node.js Service...${NC}"
echo "=============================="
cd node-service

# Install Node dependencies
echo "Installing Node.js dependencies..."
npm install --silent
echo -e "${GREEN}✓ Node.js dependencies installed${NC}"

# Create .env if doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠ Created .env file - Please add your ELEVENLABS_API_KEY${NC}"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

cd ..

echo ""
echo "=============================="
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo "=============================="
echo ""
echo "Next steps:"
echo "1. Add your API keys to the .env files:"
echo "   - Backend/python-service/.env (GEMINI_API_KEY)"
echo "   - Backend/node-service/.env (ELEVENLABS_API_KEY)"
echo ""
echo "2. Start the services:"
echo "   Terminal 1: cd Backend/python-service && source venv/bin/activate && python main.py"
echo "   Terminal 2: cd Backend/node-service && npm run dev"
echo ""
echo "3. Python service will run on http://localhost:8000"
echo "   Node.js service will run on http://localhost:8001"
echo ""

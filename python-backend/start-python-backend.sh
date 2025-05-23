#!/bin/bash

# Green Genesis Python Backend Startup Script
# This script starts the FastAPI Python backend on port 8000

set -e

echo "🐍 Starting Green Genesis Python Backend..."
echo "============================================="

# Check if Python 3.8+ is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "✅ Python version: $PYTHON_VERSION"

# Navigate to Python backend directory
cd python-backend

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

# Check if .env file exists
if [ ! -f "../.env" ]; then
    echo "⚠️ Warning: .env file not found - using default configuration"
else
    echo "✅ Environment configuration loaded"
fi

# Start the FastAPI server
echo "🚀 Starting FastAPI server on port 8000..."
echo "📊 API Documentation: http://localhost:8000/py-docs"
echo "🔌 WebSocket endpoint: ws://localhost:8000/py-ws"
echo "💚 Health check: http://localhost:8000/py-health"
echo ""

# Use uvicorn to run the server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --log-level info
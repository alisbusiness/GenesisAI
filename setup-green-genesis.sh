#!/bin/bash

# Green Genesis - Automated Setup Script
# This script will set up everything you need for your competition demo

set -e  # Exit on any error

echo "🌱 GREEN GENESIS - AUTOMATED SETUP STARTING 🌱"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on Raspberry Pi
check_raspberry_pi() {
    log_step "Checking if running on Raspberry Pi..."
    if [[ -f /proc/device-tree/model ]] && grep -q "Raspberry Pi" /proc/device-tree/model; then
        log_info "✅ Running on Raspberry Pi"
        export IS_RASPBERRY_PI=true
    else
        log_info "ℹ️ Not running on Raspberry Pi - skipping Pi-specific setup"
        export IS_RASPBERRY_PI=false
    fi
}

# Update system packages
update_system() {
    log_step "Updating system packages..."
    sudo apt update -y
    sudo apt upgrade -y
    log_info "✅ System updated"
}

# Install Node.js 20
install_nodejs() {
    log_step "Installing Node.js 20..."
    
    # Check if Node.js 20 is already installed
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ "$NODE_VERSION" -ge "20" ]]; then
            log_info "✅ Node.js $NODE_VERSION already installed"
            return
        fi
    fi
    
    # Install Node.js 20 via NodeSource
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    log_info "✅ Node.js $(node --version) installed"
}

# Install PostgreSQL
install_postgresql() {
    log_step "Installing PostgreSQL..."
    
    if command -v psql &> /dev/null; then
        log_info "✅ PostgreSQL already installed"
        return
    fi
    
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    log_info "✅ PostgreSQL installed and started"
}

# Setup PostgreSQL database
setup_database() {
    log_step "Setting up Green Genesis database..."
    
    # Create database user and database
    sudo -u postgres psql -c "CREATE USER greengenesis WITH PASSWORD 'greengenesis2024';" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE DATABASE greengenesis OWNER greengenesis;" 2>/dev/null || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE greengenesis TO greengenesis;" 2>/dev/null || true
    
    # Set environment variable
    export DATABASE_URL="postgresql://greengenesis:greengenesis2024@localhost:5432/greengenesis"
    echo "export DATABASE_URL=\"$DATABASE_URL\"" >> ~/.bashrc
    
    log_info "✅ Database 'greengenesis' created"
}

# Install camera dependencies (Raspberry Pi only)
install_camera_deps() {
    if [[ "$IS_RASPBERRY_PI" == "true" ]]; then
        log_step "Installing camera dependencies..."
        
        # Enable camera interface
        sudo raspi-config nonint do_camera 0
        
        # Install camera libraries
        sudo apt install -y python3-picamera2 python3-opencv
        
        # Install fswebcam for command-line camera capture
        sudo apt install -y fswebcam
        
        log_info "✅ Camera dependencies installed"
    fi
}

# Install project dependencies
install_project_deps() {
    log_step "Installing project dependencies..."
    
    # Install npm dependencies
    npm install
    
    log_info "✅ Project dependencies installed"
}

# Setup database schema
setup_schema() {
    log_step "Setting up database schema..."
    
    # Push database schema
    npm run db:push
    
    log_info "✅ Database schema created"
}

# Seed initial data
seed_database() {
    log_step "Seeding database with initial data..."
    
    # Run database seeding
    npm run seed
    
    log_info "✅ Database seeded with:"
    log_info "   - Admin user: Infomatrix / Infomatrix2025MKA"
    log_info "   - 10 plant species"
    log_info "   - 4 actuator configurations"
    log_info "   - Current plant set to Tomato"
}

# Create camera capture script (Raspberry Pi only)
create_camera_script() {
    if [[ "$IS_RASPBERRY_PI" == "true" ]]; then
        log_step "Creating camera capture script..."
        
        cat > camera-capture.py << 'EOF'
#!/usr/bin/env python3
"""
Green Genesis Camera Capture Script
Captures photos from Raspberry Pi camera for plant analysis
"""

import os
import sys
from datetime import datetime
from picamera2 import Picamera2
import base64

def capture_photo():
    try:
        # Initialize camera
        picam2 = Picamera2()
        
        # Configure camera
        config = picam2.create_still_configuration(
            main={"size": (1920, 1080)},
            lores={"size": (640, 480)},
            display="lores"
        )
        picam2.configure(config)
        
        # Start camera
        picam2.start()
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"plant_photo_{timestamp}.jpg"
        
        # Capture image
        picam2.capture_file(filename)
        
        # Stop camera
        picam2.stop()
        
        print(f"Photo captured: {filename}")
        
        # Convert to base64 for AI analysis
        with open(filename, "rb") as image_file:
            base64_string = base64.b64encode(image_file.read()).decode()
            print(f"Base64 length: {len(base64_string)}")
        
        return filename, base64_string
        
    except Exception as e:
        print(f"Error capturing photo: {e}")
        return None, None

if __name__ == "__main__":
    capture_photo()
EOF

        chmod +x camera-capture.py
        log_info "✅ Camera capture script created"
    fi
}

# Create startup script
create_startup_script() {
    log_step "Creating startup script..."
    
    cat > start-green-genesis.sh << 'EOF'
#!/bin/bash

echo "🌱 Starting Green Genesis Platform..."

# Set environment variables
export NODE_ENV=development
export DATABASE_URL="postgresql://greengenesis:greengenesis2024@localhost:5432/greengenesis"

# Start PostgreSQL if not running
sudo systemctl start postgresql

# Start the application
npm run dev
EOF

    chmod +x start-green-genesis.sh
    log_info "✅ Startup script created: ./start-green-genesis.sh"
}

# Create competition demo script
create_demo_script() {
    log_step "Creating competition demo script..."
    
    cat > demo-green-genesis.sh << 'EOF'
#!/bin/bash

echo "🏆 GREEN GENESIS - COMPETITION DEMO SETUP 🏆"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🌱 DEMO FEATURES READY:${NC}"
echo "✅ Real-time sensor monitoring"
echo "✅ AI-powered plant health analysis"
echo "✅ Camera-integrated plant chat"
echo "✅ Automated actuator control"
echo "✅ Weather integration"
echo "✅ Predictive alerts"
echo ""

echo -e "${BLUE}📋 DEMO CHECKLIST:${NC}"
echo "1. Admin login: Infomatrix / Infomatrix2025MKA"
echo "2. Current plant: Tomato (pre-configured)"
echo "3. Sensor data: Live simulation running"
echo "4. Plant chat: Ask questions with automatic camera capture"
echo "5. Actuator panel: Toggle pump, ventilation, lighting, fan"
echo ""

echo -e "${YELLOW}🚀 STARTING DEMO PLATFORM...${NC}"
./start-green-genesis.sh
EOF

    chmod +x demo-green-genesis.sh
    log_info "✅ Demo script created: ./demo-green-genesis.sh"
}

# Create system service (optional)
create_service() {
    log_step "Creating systemd service..."
    
    CURRENT_DIR=$(pwd)
    USER=$(whoami)
    
    sudo tee /etc/systemd/system/green-genesis.service > /dev/null << EOF
[Unit]
Description=Green Genesis AI Farming Platform
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$CURRENT_DIR
Environment=NODE_ENV=production
Environment=DATABASE_URL=postgresql://greengenesis:greengenesis2024@localhost:5432/greengenesis
ExecStart=/usr/bin/npm run dev
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    log_info "✅ System service created (optional - use 'sudo systemctl start green-genesis')"
}

# Check API keys
check_api_keys() {
    log_step "Checking API keys..."
    
    if [[ -z "$OPENAI_API_KEY" ]]; then
        log_warning "⚠️ OPENAI_API_KEY not set - AI features will be limited"
        echo "   Set it with: export OPENAI_API_KEY=your_key_here"
    else
        log_info "✅ OpenAI API key found"
    fi
    
    if [[ -z "$OPENWEATHER_API_KEY" ]]; then
        log_warning "⚠️ OPENWEATHER_API_KEY not set - weather features will be limited"
        echo "   Set it with: export OPENWEATHER_API_KEY=your_key_here"
    else
        log_info "✅ OpenWeather API key found"
    fi
}

# Python backend setup
setup_python_backend() {
    log_step "Setting up Python backend..."
    
    # Check Python 3.8+
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
        log_info "✅ Python version: $PYTHON_VERSION"
        
        # Create Python virtual environment
        if [ ! -d "python-backend/venv" ]; then
            log_info "📦 Creating Python virtual environment..."
            cd python-backend
            python3 -m venv venv
            source venv/bin/activate
            pip install --quiet --upgrade pip
            pip install --quiet -r requirements.txt
            cd ..
            log_info "✅ Python backend dependencies installed"
        else
            log_info "✅ Python virtual environment already exists"
        fi
    else
        log_warning "Python 3 not found - Python backend features will be limited"
    fi
}

# Final setup summary
show_summary() {
    echo ""
    echo "🎉 GREEN GENESIS SETUP COMPLETE! 🎉"
    echo "==================================="
    echo ""
    echo -e "${GREEN}🚀 QUICK START OPTIONS:${NC}"
    echo "1. Node.js Only: ${BLUE}./start-green-genesis.sh${NC}"
    echo "2. With Python AI: ${BLUE}./python-backend/start-python-backend.sh${NC} (in separate terminal)"
    echo "3. Web Dashboard: ${BLUE}http://localhost:5000${NC}"
    echo "4. Python API Docs: ${BLUE}http://localhost:8000/py-docs${NC}"
    echo "5. Admin login: ${BLUE}Infomatrix / Infomatrix2025MKA${NC}"
    echo ""
    echo -e "${GREEN}📸 CAMERA FEATURES:${NC}"
    if [[ "$IS_RASPBERRY_PI" == "true" ]]; then
        echo "✅ Raspberry Pi camera ready"
        echo "✅ Auto-capture on plant questions"
    else
        echo "ℹ️ Camera simulation mode (no Pi detected)"
    fi
    echo ""
    echo -e "${GREEN}💡 COMPETITION TIPS:${NC}"
    echo "• Chat with plants: 'How are you feeling today?'"
    echo "• Toggle actuators to show automation"
    echo "• Demonstrate real-time sensor monitoring"
    echo "• Show AI health analysis results"
    echo ""
    echo -e "${YELLOW}🔑 API Keys (set these for full features):${NC}"
    echo "export OPENAI_API_KEY=your_openai_key"
    echo "export OPENWEATHER_API_KEY=your_weather_key"
    echo ""
    echo "🏆 Good luck with your competition! 🏆"
}

# Main execution
main() {
    echo "Starting automated setup..."
    echo ""
    
    check_raspberry_pi
    update_system
    install_nodejs
    install_postgresql
    setup_database
    install_camera_deps
    install_project_deps
    setup_schema
    seed_database
    create_camera_script
    create_startup_script
    create_demo_script
    create_service
    check_api_keys
    setup_python_backend
    show_summary
}

# Run main function
main "$@"
#!/bin/bash
# Green Genesis - Competition Ready Startup Script
# ===============================================

echo "🌱 Green Genesis AI Precision Farming Platform"
echo "=============================================="
echo

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ "$2" = "OK" ]; then
        echo -e "${GREEN}✓${NC} $1"
    elif [ "$2" = "WARN" ]; then
        echo -e "${YELLOW}⚠${NC} $1"
    elif [ "$2" = "ERROR" ]; then
        echo -e "${RED}✗${NC} $1"
    else
        echo -e "${BLUE}ℹ${NC} $1"
    fi
}

# Check if running as correct user
if [ "$USER" != "pi" ]; then
    print_status "Please run as user 'pi'" "ERROR"
    exit 1
fi

# Navigate to project directory
cd /home/pi/green-genesis 2>/dev/null || {
    print_status "Green Genesis directory not found. Please install first." "ERROR"
    exit 1
}

print_status "Starting Green Genesis platform..." "INFO"
echo

# Step 1: System checks
print_status "Performing system checks..." "INFO"

# Check Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    print_status "Node.js $NODE_VERSION installed" "OK"
else
    print_status "Node.js not found - please install Node.js 20" "ERROR"
    exit 1
fi

# Check PostgreSQL
if systemctl is-active --quiet postgresql; then
    print_status "PostgreSQL service running" "OK"
else
    print_status "Starting PostgreSQL..." "WARN"
    sudo systemctl start postgresql
    sleep 2
    if systemctl is-active --quiet postgresql; then
        print_status "PostgreSQL started successfully" "OK"
    else
        print_status "Failed to start PostgreSQL" "ERROR"
        exit 1
    fi
fi

# Check database connection
if psql -h localhost -U greengenesis -d greengenesis -c "SELECT 1;" >/dev/null 2>&1; then
    print_status "Database connection successful" "OK"
else
    print_status "Database connection failed - check credentials" "ERROR"
    echo "  Run: psql -h localhost -U greengenesis -d greengenesis"
    exit 1
fi

# Step 2: Hardware checks
print_status "Checking hardware..." "INFO"

# Check GPIO access
if [ -r /dev/gpiomem ]; then
    print_status "GPIO access available" "OK"
else
    print_status "GPIO access limited - run: sudo usermod -a -G gpio pi" "WARN"
fi

# Check Arduino connection
if ls /dev/ttyACM* >/dev/null 2>&1; then
    ARDUINO_PORT=$(ls /dev/ttyACM* | head -1)
    print_status "Arduino detected at $ARDUINO_PORT" "OK"
elif ls /dev/ttyUSB* >/dev/null 2>&1; then
    ARDUINO_PORT=$(ls /dev/ttyUSB* | head -1)
    print_status "Arduino detected at $ARDUINO_PORT" "OK"
else
    print_status "Arduino not detected (simulation mode will be used)" "WARN"
fi

# Check serial permissions
if groups | grep -q dialout; then
    print_status "Serial port permissions OK" "OK"
else
    print_status "Add user to dialout group: sudo usermod -a -G dialout pi" "WARN"
fi

# Step 3: Application setup
print_status "Setting up application..." "INFO"

# Check environment file
if [ -f .env ]; then
    print_status "Environment file found" "OK"
    
    # Check for OpenAI API key
    if grep -q "OPENAI_API_KEY=sk-" .env; then
        print_status "OpenAI API key configured" "OK"
    else
        print_status "OpenAI API key not configured - AI features limited" "WARN"
        echo "  Add your OpenAI API key to .env file for full AI capabilities"
    fi
    
    # Check for Weather API key
    if grep -q "OPENWEATHER_API_KEY=" .env && ! grep -q "OPENWEATHER_API_KEY=your-" .env; then
        print_status "Weather API configured" "OK"
    else
        print_status "Weather API not configured - using simulation" "WARN"
    fi
else
    print_status "Creating default environment file..." "WARN"
    cat > .env << 'EOF'
# Green Genesis Environment Configuration
DATABASE_URL=postgresql://greengenesis:SecurePassword123!@localhost:5432/greengenesis
PGHOST=localhost
PGPORT=5432
PGUSER=greengenesis
PGPASSWORD=SecurePassword123!
PGDATABASE=greengenesis

# API Keys (add your actual keys)
OPENAI_API_KEY=your-openai-api-key-here
OPENWEATHER_API_KEY=your-openweather-api-key-here

# Hardware
SERIAL_PORT=/dev/ttyACM0
SERIAL_BAUD_RATE=9600

# Application
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
EOF
    chmod 600 .env
    print_status "Environment file created - please add your API keys" "WARN"
fi

# Check if dependencies are installed
if [ -d node_modules ]; then
    print_status "Dependencies installed" "OK"
else
    print_status "Installing dependencies..." "INFO"
    npm install
    if [ $? -eq 0 ]; then
        print_status "Dependencies installed successfully" "OK"
    else
        print_status "Failed to install dependencies" "ERROR"
        exit 1
    fi
fi

# Step 4: Database initialization
print_status "Initializing database..." "INFO"

# Check if database is seeded
PLANT_COUNT=$(psql -h localhost -U greengenesis -d greengenesis -t -c "SELECT COUNT(*) FROM plant_species;" 2>/dev/null | xargs)
if [ "$PLANT_COUNT" -gt 0 ] 2>/dev/null; then
    print_status "Database already seeded ($PLANT_COUNT plant species)" "OK"
else
    print_status "Seeding database..." "INFO"
    npm run db:push >/dev/null 2>&1
    npm run seed >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_status "Database seeded successfully" "OK"
    else
        print_status "Database seeding failed" "ERROR"
        exit 1
    fi
fi

# Step 5: Start application
print_status "Starting Green Genesis application..." "INFO"

# Kill any existing process on port 5000
if lsof -ti:5000 >/dev/null 2>&1; then
    print_status "Stopping existing application..." "WARN"
    kill $(lsof -ti:5000) 2>/dev/null
    sleep 2
fi

# Start the application
if [ "$1" = "--production" ]; then
    print_status "Starting in production mode with systemd..." "INFO"
    sudo systemctl enable green-genesis >/dev/null 2>&1
    sudo systemctl start green-genesis
    
    # Wait for service to start
    sleep 5
    
    if systemctl is-active --quiet green-genesis; then
        print_status "Production service started successfully" "OK"
    else
        print_status "Production service failed to start" "ERROR"
        echo "Check logs: sudo journalctl -u green-genesis -f"
        exit 1
    fi
else
    print_status "Starting in development mode..." "INFO"
    
    # Start in background
    npm run dev > /tmp/green-genesis.log 2>&1 &
    APP_PID=$!
    
    # Wait for application to start
    echo -n "Waiting for application to start"
    for i in {1..30}; do
        if curl -s http://localhost:5000/api/health >/dev/null 2>&1; then
            break
        fi
        echo -n "."
        sleep 1
    done
    echo
    
    if curl -s http://localhost:5000/api/health >/dev/null 2>&1; then
        print_status "Development server started successfully (PID: $APP_PID)" "OK"
        echo $APP_PID > /tmp/green-genesis.pid
    else
        print_status "Application failed to start" "ERROR"
        echo "Check logs: tail -f /tmp/green-genesis.log"
        exit 1
    fi
fi

# Step 6: Final verification
print_status "Performing final checks..." "INFO"

# Check API health
if curl -s http://localhost:5000/api/health >/dev/null 2>&1; then
    print_status "API endpoint responding" "OK"
else
    print_status "API endpoint not responding" "ERROR"
    exit 1
fi

# Get system info
IP_ADDRESS=$(hostname -I | awk '{print $1}')
TEMPERATURE=$(vcgencmd measure_temp 2>/dev/null | cut -d'=' -f2 || echo "N/A")
MEMORY_USAGE=$(free -h | grep Mem | awk '{print $3"/"$2}')
DISK_USAGE=$(df -h / | tail -1 | awk '{print $3"/"$2" ("$5")"}')

echo
print_status "🎉 Green Genesis is ready for competition!" "OK"
echo
echo "═══════════════════════════════════════════════════════"
echo "🌐 Web Interface:  http://$IP_ADDRESS:5000"
echo "🔐 Admin Login:    Infomatrix / Infomatrix2025MKA"
echo "📡 SSH Access:     ssh pi@$IP_ADDRESS"
echo "🌡️  CPU Temp:      $TEMPERATURE"
echo "💾 Memory:         $MEMORY_USAGE"
echo "💽 Disk:          $DISK_USAGE"
echo "═══════════════════════════════════════════════════════"
echo
echo "🚀 Competition Features Ready:"
echo "   ✓ Real-time sensor monitoring"
echo "   ✓ AI plant health analysis (GPT-4.1)"
echo "   ✓ Intelligent chat assistant"
echo "   ✓ Predictive alert system"
echo "   ✓ Actuator control dashboard"
echo "   ✓ Weather integration"
echo
echo "📋 Quick Commands:"
echo "   View logs:        tail -f /tmp/green-genesis.log"
if [ "$1" = "--production" ]; then
echo "   Restart:          sudo systemctl restart green-genesis"
echo "   Stop:             sudo systemctl stop green-genesis"
echo "   Service logs:     sudo journalctl -u green-genesis -f"
else
echo "   Stop server:      kill \$(cat /tmp/green-genesis.pid)"
echo "   Restart:          ./start-green-genesis.sh"
fi
echo "   Health check:     curl http://localhost:5000/api/health"
echo "   Database:         psql -h localhost -U greengenesis -d greengenesis"
echo
echo "🏆 Ready for demonstration! Good luck with your competition!"
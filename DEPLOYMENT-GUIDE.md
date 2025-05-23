# Green Genesis - Complete Deployment Guide for Competition

## 🏆 AI-Powered Precision Farming Platform - Production Ready Setup

This comprehensive guide provides everything needed to deploy Green Genesis on Raspberry Pi OS 64-bit for competition demonstrations and real-world use.

---

## 📋 Quick Start Overview

Green Genesis is a complete precision farming platform featuring:
- **Real-time IoT sensor monitoring** with Arduino integration
- **AI-powered plant health analysis** using GPT-4.1 vision
- **Intelligent chat assistant** for farming guidance
- **Predictive alerts system** with weather integration
- **Automated actuator control** for irrigation, ventilation, and lighting
- **Professional web dashboard** with responsive design

---

## 🔧 Environment Configuration (.env)

### Complete .env Template

Create `.env` file in your project root with the following configuration:

```env
# ===========================================
# GREEN GENESIS ENVIRONMENT CONFIGURATION
# ===========================================

# Database Configuration
# ----------------------
DATABASE_URL=postgresql://greengenesis:SecurePassword123!@localhost:5432/greengenesis
PGHOST=localhost
PGPORT=5432
PGUSER=greengenesis
PGPASSWORD=SecurePassword123!
PGDATABASE=greengenesis

# AI & Machine Learning Services
# ------------------------------
# OpenAI API for plant health analysis and chat assistant
OPENAI_API_KEY=sk-your-openai-api-key-here

# Weather Integration (Optional)
# -----------------------------
# OpenWeatherMap API for environmental optimization
OPENWEATHER_API_KEY=your-openweather-api-key-here

# Location Settings for Weather
LOCATION_LAT=40.7128
LOCATION_LON=-74.0060
LOCATION_CITY=New York

# Hardware Configuration
# ---------------------
# Arduino/Serial Communication
SERIAL_PORT=/dev/ttyACM0
SERIAL_BAUD_RATE=9600

# GPIO Pin Assignments (for Raspberry Pi)
GPIO_PUMP_PIN=18
GPIO_FAN_PIN=19
GPIO_LIGHT_PIN=20
GPIO_VENT_PIN=21

# Application Settings
# -------------------
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Security Settings
# ----------------
# Session secret for authentication
SESSION_SECRET=your-secure-session-secret-here

# Admin Credentials (Change these!)
ADMIN_USERNAME=Infomatrix
ADMIN_PASSWORD=Infomatrix2025MKA

# Alert System Configuration
# --------------------------
ALERT_CHECK_INTERVAL=120000
WEATHER_CHECK_INTERVAL=1800000
SENSOR_DATA_INTERVAL=30000

# Logging Configuration
# --------------------
LOG_LEVEL=info
LOG_FILE=/var/log/green-genesis/app.log

# Performance Settings
# -------------------
MAX_CONNECTIONS=100
POOL_SIZE=10
QUERY_TIMEOUT=30000

# Sensor Calibration Values
# -------------------------
# Soil Moisture Sensor (0-1023 raw values)
SOIL_DRY_VALUE=800
SOIL_WET_VALUE=300

# Light Sensor (0-1023 raw values)
LIGHT_DARK_VALUE=50
LIGHT_BRIGHT_VALUE=900

# CO2 Sensor (ppm mapping)
CO2_MIN_PPM=400
CO2_MAX_PPM=2000

# Temperature & Humidity Offsets
TEMP_OFFSET=0.0
HUMIDITY_OFFSET=0.0

# Backup and Maintenance
# ---------------------
BACKUP_RETENTION_DAYS=7
MAINTENANCE_HOUR=3
AUTO_RESTART_ENABLED=true
```

### Environment Variables Explanation

#### Database Settings
- `DATABASE_URL`: Complete PostgreSQL connection string
- `PG*` variables: Individual database connection parameters

#### AI Integration
- `OPENAI_API_KEY`: Required for plant health analysis and chat features
- Get from: https://platform.openai.com/api-keys

#### Weather Integration
- `OPENWEATHER_API_KEY`: Optional for weather-based recommendations
- Get from: https://openweathermap.org/api

#### Hardware Configuration
- `SERIAL_PORT`: Arduino connection path (usually `/dev/ttyACM0`)
- `GPIO_*_PIN`: Raspberry Pi GPIO pins for actuator control

#### Performance Tuning
- `MAX_CONNECTIONS`: Maximum concurrent database connections
- `POOL_SIZE`: Database connection pool size
- `QUERY_TIMEOUT`: Database query timeout in milliseconds

---

## 🍓 Raspberry Pi OS 64-bit Setup

### Step 1: System Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential development tools
sudo apt install -y git curl wget vim build-essential python3-dev

# Install hardware interface tools
sudo apt install -y i2c-tools python3-rpi.gpio python3-serial

# Enable hardware interfaces
sudo raspi-config
# Navigate to: Interface Options
# Enable: Serial Port, I2C, SPI, GPIO
```

### Step 2: Node.js Installation

```bash
# Install Node.js 20 LTS (recommended for production)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x

# Install global tools
sudo npm install -g pm2 npm-check-updates
```

### Step 3: PostgreSQL Database Setup

```bash
# Install PostgreSQL 15
sudo apt install -y postgresql-15 postgresql-contrib-15

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE USER greengenesis WITH PASSWORD 'SecurePassword123!';
CREATE DATABASE greengenesis OWNER greengenesis;
GRANT ALL PRIVILEGES ON DATABASE greengenesis TO greengenesis;
ALTER USER greengenesis CREATEDB;
\q
EOF

# Test connection
psql -h localhost -U greengenesis -d greengenesis -c "SELECT version();"
```

### Step 4: User Permissions

```bash
# Add user to required groups
sudo usermod -a -G dialout,gpio,i2c,spi $USER

# Create application directory
mkdir -p /home/pi/green-genesis
cd /home/pi/green-genesis

# Set proper permissions
sudo chown -R pi:pi /home/pi/green-genesis
```

---

## 🚀 Application Deployment

### Step 1: Download and Setup

```bash
# Clone repository (replace with your actual repository)
git clone https://github.com/your-username/green-genesis.git /home/pi/green-genesis
cd /home/pi/green-genesis

# Install dependencies
npm install

# Install Raspberry Pi specific packages
npm install serialport@latest rpi-gpio
```

### Step 2: Environment Configuration

```bash
# Create .env file with your configuration
nano .env

# Copy the complete .env template from above
# Replace placeholder values with your actual keys and settings

# Secure the environment file
chmod 600 .env
chown pi:pi .env
```

### Step 3: Database Initialization

```bash
# Initialize database schema
npm run db:push

# Seed initial data (creates admin user and plant species)
npm run seed

# Verify database setup
psql -h localhost -U greengenesis -d greengenesis -c "SELECT COUNT(*) FROM plant_species;"
```

### Step 4: Build Application

```bash
# Build for production
npm run build

# Verify build
ls -la dist/
```

---

## ⚙️ Production Service Setup

### Step 1: Create Systemd Service

```bash
# Create service file
sudo tee /etc/systemd/system/green-genesis.service << EOF
[Unit]
Description=Green Genesis AI Precision Farming Platform
Documentation=https://github.com/your-repo/green-genesis
After=network.target postgresql.service
Wants=postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=pi
Group=pi
WorkingDirectory=/home/pi/green-genesis
Environment=NODE_ENV=production
Environment=PATH=/usr/bin:/usr/local/bin
EnvironmentFile=/home/pi/green-genesis/.env
ExecStart=/usr/bin/npm start
ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=10
TimeoutStopSec=30
KillMode=mixed
KillSignal=SIGINT

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/home/pi/green-genesis
ReadWritePaths=/var/log/green-genesis
PrivateDevices=false
DeviceAllow=/dev/ttyACM* rw
DeviceAllow=/dev/gpiomem rw

# Resource limits
LimitNOFILE=65536
MemoryMax=1G
CPUQuota=80%

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=green-genesis

[Install]
WantedBy=multi-user.target
EOF
```

### Step 2: Enable and Start Service

```bash
# Create log directory
sudo mkdir -p /var/log/green-genesis
sudo chown pi:pi /var/log/green-genesis

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable green-genesis

# Start the service
sudo systemctl start green-genesis

# Check status
sudo systemctl status green-genesis

# View logs
sudo journalctl -u green-genesis -f
```

### Step 3: PM2 Alternative Setup (Optional)

```bash
# Start with PM2 for development
pm2 start npm --name "green-genesis" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
# Follow the generated command

# Monitor with PM2
pm2 monit
```

---

## 🔌 Hardware Integration

### Arduino Sensor Code

Create `greenhouse_sensors.ino` for Arduino:

```cpp
#include <DHT.h>
#include <ArduinoJson.h>

// Sensor pin definitions
#define DHT_PIN 2
#define DHT_TYPE DHT22
#define SOIL_MOISTURE_PIN A0
#define CO2_PIN A1
#define LIGHT_PIN A2

// Initialize sensors
DHT dht(DHT_PIN, DHT_TYPE);

// Calibration values (adjust based on your sensors)
const int SOIL_DRY = 800;
const int SOIL_WET = 300;
const int LIGHT_DARK = 50;
const int LIGHT_BRIGHT = 900;

void setup() {
  Serial.begin(9600);
  dht.begin();
  
  // Initialize pins
  pinMode(SOIL_MOISTURE_PIN, INPUT);
  pinMode(CO2_PIN, INPUT);
  pinMode(LIGHT_PIN, INPUT);
  
  delay(2000);
  Serial.println("{\"type\":\"status\",\"message\":\"Green Genesis Sensor Node Ready\"}");
}

void loop() {
  // Read sensors
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  int soilRaw = analogRead(SOIL_MOISTURE_PIN);
  int co2Raw = analogRead(CO2_PIN);
  int lightRaw = analogRead(LIGHT_PIN);
  
  // Convert to useful values
  float soilMoisture = map(soilRaw, SOIL_DRY, SOIL_WET, 0, 100) / 100.0;
  soilMoisture = constrain(soilMoisture, 0.0, 1.0);
  
  int co2Level = map(co2Raw, 0, 1023, 400, 2000);
  int lightLevel = map(lightRaw, LIGHT_DARK, LIGHT_BRIGHT, 0, 1000);
  lightLevel = constrain(lightLevel, 0, 1000);
  
  // Create JSON message
  if (!isnan(temperature) && !isnan(humidity)) {
    StaticJsonDocument<200> doc;
    doc["type"] = "telemetry";
    
    JsonObject data = doc.createNestedObject("data");
    data["temperature"] = round(temperature * 10) / 10.0;
    data["humidity"] = round(humidity);
    data["soilMoisture"] = round(soilMoisture * 100) / 100.0;
    data["co2Level"] = co2Level;
    data["lightLevel"] = lightLevel;
    
    serializeJson(doc, Serial);
    Serial.println();
  }
  
  // Check for commands from Raspberry Pi
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    handleCommand(command);
  }
  
  delay(30000); // Send data every 30 seconds
}

void handleCommand(String command) {
  StaticJsonDocument<100> doc;
  deserializeJson(doc, command);
  
  String type = doc["type"];
  
  if (type == "ping") {
    Serial.println("{\"type\":\"pong\",\"timestamp\":\"" + String(millis()) + "\"}");
  } else if (type == "calibrate") {
    // Calibration mode
    Serial.println("{\"type\":\"calibration\",\"soil\":" + String(analogRead(SOIL_MOISTURE_PIN)) + 
                   ",\"light\":" + String(analogRead(LIGHT_PIN)) + "}");
  }
}
```

### Wiring Diagram for Competition Setup

```
Raspberry Pi 4 Model B → Arduino Uno
====================================

Power:
- Pi 5V → Arduino 5V (if powered via GPIO)
- Pi GND → Arduino GND

Communication:
- Pi USB → Arduino USB (preferred)
- Or Pi GPIO 14 (TX) → Arduino Pin 0 (RX)
- Or Pi GPIO 15 (RX) → Arduino Pin 1 (TX)

Arduino → Sensors
=================

DHT22 Temperature/Humidity:
- Pin 1 (VCC) → 5V
- Pin 2 (Data) → Arduino Pin 2
- Pin 3 (NC) → Not connected
- Pin 4 (GND) → GND
- 10kΩ resistor between Pin 1 and Pin 2

Capacitive Soil Moisture:
- VCC → 5V
- GND → GND
- AOUT → Arduino A0

MQ-135 CO2 Sensor:
- VCC → 5V
- GND → GND
- AOUT → Arduino A1
- DOUT → Not used

Light Sensor (LDR):
- One end → 5V
- Other end → Arduino A2 + 10kΩ resistor to GND

Actuators (Optional):
4-Channel Relay Module:
- VCC → 5V
- GND → GND
- IN1 → Raspberry Pi GPIO 18 (Pump)
- IN2 → Raspberry Pi GPIO 19 (Fan)
- IN3 → Raspberry Pi GPIO 20 (Light)
- IN4 → Raspberry Pi GPIO 21 (Vent)
```

---

## 🌐 Network & Security Configuration

### Firewall Setup

```bash
# Install and configure UFW
sudo apt install -y ufw

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (change port if modified)
sudo ufw allow 22/tcp

# Allow Green Genesis web interface
sudo ufw allow 5000/tcp

# Allow PostgreSQL (if accessing remotely)
sudo ufw allow from 192.168.1.0/24 to any port 5432

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status numbered
```

### SSL/HTTPS Setup (Optional)

```bash
# Install certbot for Let's Encrypt
sudo apt install -y certbot

# Generate self-signed certificate for local use
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/green-genesis.key \
  -out /etc/ssl/certs/green-genesis.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=green-genesis.local"

# Set proper permissions
sudo chmod 600 /etc/ssl/private/green-genesis.key
sudo chmod 644 /etc/ssl/certs/green-genesis.crt
```

### Static IP Configuration

```bash
# Edit network configuration
sudo nano /etc/dhcpcd.conf

# Add at the end:
interface eth0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=8.8.8.8 1.1.1.1

# For Wi-Fi, add:
interface wlan0
static ip_address=192.168.1.101/24
static routers=192.168.1.1
static domain_name_servers=8.8.8.8 1.1.1.1
```

---

## 📊 Monitoring & Maintenance

### Health Check Script

```bash
# Create monitoring script
sudo tee /usr/local/bin/green-genesis-health.sh << 'EOF'
#!/bin/bash

LOG_FILE="/var/log/green-genesis/health-check.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Green Genesis Health Check" >> $LOG_FILE

# Check service status
if systemctl is-active --quiet green-genesis; then
    echo "[$DATE] ✓ Service: Running" >> $LOG_FILE
    SERVICE_STATUS="RUNNING"
else
    echo "[$DATE] ✗ Service: Stopped" >> $LOG_FILE
    SERVICE_STATUS="STOPPED"
    sudo systemctl restart green-genesis
fi

# Check database connectivity
if psql -h localhost -U greengenesis -d greengenesis -c "SELECT 1;" > /dev/null 2>&1; then
    echo "[$DATE] ✓ Database: Connected" >> $LOG_FILE
    DB_STATUS="CONNECTED"
else
    echo "[$DATE] ✗ Database: Failed" >> $LOG_FILE
    DB_STATUS="FAILED"
fi

# Check API endpoint
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "[$DATE] ✓ API: Responding" >> $LOG_FILE
    API_STATUS="RESPONDING"
else
    echo "[$DATE] ✗ API: Not responding" >> $LOG_FILE
    API_STATUS="FAILED"
fi

# Check Arduino connection
if ls /dev/ttyACM* > /dev/null 2>&1; then
    echo "[$DATE] ✓ Arduino: Connected" >> $LOG_FILE
    ARDUINO_STATUS="CONNECTED"
else
    echo "[$DATE] ✗ Arduino: Not detected" >> $LOG_FILE
    ARDUINO_STATUS="DISCONNECTED"
fi

# System resources
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
TEMPERATURE=$(vcgencmd measure_temp | cut -d'=' -f2)

echo "[$DATE] System: CPU:${CPU_USAGE}% MEM:${MEMORY_USAGE}% DISK:${DISK_USAGE}% TEMP:${TEMPERATURE}" >> $LOG_FILE

# Send status to application if needed
if [ "$SERVICE_STATUS" = "RUNNING" ] && [ "$API_STATUS" = "RESPONDING" ]; then
    curl -s -X POST http://localhost:5000/api/system/health \
         -H "Content-Type: application/json" \
         -d "{
           \"timestamp\": \"$DATE\",
           \"service\": \"$SERVICE_STATUS\",
           \"database\": \"$DB_STATUS\",
           \"api\": \"$API_STATUS\",
           \"arduino\": \"$ARDUINO_STATUS\",
           \"cpu\": $CPU_USAGE,
           \"memory\": $MEMORY_USAGE,
           \"disk\": $DISK_USAGE,
           \"temperature\": \"$TEMPERATURE\"
         }" > /dev/null 2>&1
fi

echo "[$DATE] Health check completed" >> $LOG_FILE
EOF

# Make executable
sudo chmod +x /usr/local/bin/green-genesis-health.sh
```

### Backup Script

```bash
# Create backup script
sudo tee /usr/local/bin/green-genesis-backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/home/pi/backups/green-genesis"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/green-genesis/backup.log"

echo "$(date) Starting backup..." >> $LOG_FILE

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
echo "$(date) Backing up database..." >> $LOG_FILE
pg_dump -h localhost -U greengenesis greengenesis | gzip > $BACKUP_DIR/database_$DATE.sql.gz

# Backup application files
echo "$(date) Backing up application..." >> $LOG_FILE
tar -czf $BACKUP_DIR/application_$DATE.tar.gz \
    -C /home/pi/green-genesis \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=.git \
    .

# Backup configuration
echo "$(date) Backing up configuration..." >> $LOG_FILE
cp /home/pi/green-genesis/.env $BACKUP_DIR/env_$DATE.backup

# Remove old backups (keep last 7 days)
find $BACKUP_DIR -type f -mtime +7 -delete

echo "$(date) Backup completed" >> $LOG_FILE
EOF

# Make executable
sudo chmod +x /usr/local/bin/green-genesis-backup.sh
```

### Cron Jobs Setup

```bash
# Edit crontab
crontab -e

# Add these lines:
# Health check every 5 minutes
*/5 * * * * /usr/local/bin/green-genesis-health.sh

# Daily backup at 2 AM
0 2 * * * /usr/local/bin/green-genesis-backup.sh

# Weekly log rotation at 3 AM on Sundays
0 3 * * 0 /usr/sbin/logrotate /etc/logrotate.d/green-genesis

# Monthly system update at 4 AM on 1st day
0 4 1 * * /usr/bin/apt update && /usr/bin/apt upgrade -y
```

---

## 🎯 Competition Demonstration Setup

### Demo Script

```bash
# Create demonstration script
tee /home/pi/demo.sh << 'EOF'
#!/bin/bash

echo "Green Genesis Competition Demonstration"
echo "======================================"

# Check system status
echo "1. System Status Check..."
systemctl status green-genesis --no-pager
echo

# Show live sensor data
echo "2. Live Sensor Data (30 seconds)..."
timeout 30 journalctl -u green-genesis -f | grep "Simulated sensor data"
echo

# Demonstrate API endpoints
echo "3. API Demonstration..."
echo "Health Status:"
curl -s http://localhost:5000/api/health | jq .
echo

echo "Plant Species:"
curl -s http://localhost:5000/api/plants/species | jq '.[0]'
echo

echo "Latest Telemetry:"
curl -s http://localhost:5000/api/telemetry/history?limit=1 | jq '.[0]'
echo

# Show database content
echo "4. Database Content..."
psql -h localhost -U greengenesis -d greengenesis -c "
SELECT 
    'Plant Species' as table_name, 
    COUNT(*) as records 
FROM plant_species
UNION ALL
SELECT 
    'Telemetry Data', 
    COUNT(*) 
FROM telemetry_data
UNION ALL
SELECT 
    'AI Analyses', 
    COUNT(*) 
FROM ai_analyses;
"

echo
echo "5. Web Interface Available at: http://$(hostname -I | awk '{print $1}'):5000"
echo "   Login: Infomatrix / Infomatrix2025MKA"
echo
echo "Demonstration complete!"
EOF

chmod +x /home/pi/demo.sh
```

### Quick Competition Checklist

```bash
# Create checklist script
tee /home/pi/competition-checklist.sh << 'EOF'
#!/bin/bash

echo "Green Genesis Competition Checklist"
echo "=================================="

# Service status
systemctl is-active --quiet green-genesis && echo "✓ Application service running" || echo "✗ Application service failed"

# Database status
systemctl is-active --quiet postgresql && echo "✓ Database service running" || echo "✗ Database service failed"

# Database connectivity
psql -h localhost -U greengenesis -d greengenesis -c "SELECT 1;" > /dev/null 2>&1 && echo "✓ Database connection" || echo "✗ Database connection failed"

# API response
curl -s http://localhost:5000/api/health > /dev/null && echo "✓ API responding" || echo "✗ API not responding"

# Arduino connection
test -c /dev/ttyACM0 && echo "✓ Arduino connected" || echo "✗ Arduino not detected"

# GPIO access
test -r /dev/gpiomem && echo "✓ GPIO access available" || echo "✗ GPIO access denied"

# Network connectivity
ping -c 1 8.8.8.8 > /dev/null 2>&1 && echo "✓ Internet connection" || echo "✗ Internet connection failed"

# File permissions
test -r /home/pi/green-genesis/.env && echo "✓ Environment file readable" || echo "✗ Environment file issues"

# Log file access
test -w /var/log/green-genesis && echo "✓ Log directory writable" || echo "✗ Log directory issues"

# Port availability
netstat -tlnp | grep :5000 > /dev/null && echo "✓ Port 5000 listening" || echo "✗ Port 5000 not available"

echo
echo "System Resources:"
echo "CPU Temperature: $(vcgencmd measure_temp)"
echo "Memory Usage: $(free -h | grep Mem | awk '{print $3"/"$2}')"
echo "Disk Usage: $(df -h / | tail -1 | awk '{print $3"/"$2" ("$5")"}')"

echo
echo "Quick Access:"
echo "Web Interface: http://$(hostname -I | awk '{print $1}'):5000"
echo "SSH Access: ssh pi@$(hostname -I | awk '{print $1}')"
echo "View Logs: sudo journalctl -u green-genesis -f"
echo "Restart Service: sudo systemctl restart green-genesis"
EOF

chmod +x /home/pi/competition-checklist.sh
```

---

## 🚀 Competition Day Quick Start

### 1. Power On Sequence
```bash
# 1. Power on Raspberry Pi
# 2. Wait for boot (green LED stops flashing)
# 3. Connect Arduino via USB
# 4. Run checklist
/home/pi/competition-checklist.sh
```

### 2. Demonstration Flow
```bash
# Run demo script
/home/pi/demo.sh

# Access web interface
# Open browser to: http://[pi-ip-address]:5000
# Login: Infomatrix / Infomatrix2025MKA
```

### 3. Troubleshooting Commands
```bash
# Restart application
sudo systemctl restart green-genesis

# Check logs
sudo journalctl -u green-genesis -f

# Check Arduino
ls -la /dev/ttyACM*

# Test database
psql -h localhost -U greengenesis -d greengenesis -c "SELECT COUNT(*) FROM plant_species;"
```

---

## 📞 Support & Resources

### Log Locations
- **Application Logs**: `sudo journalctl -u green-genesis -f`
- **Health Check Logs**: `/var/log/green-genesis/health-check.log`
- **Backup Logs**: `/var/log/green-genesis/backup.log`
- **System Logs**: `/var/log/syslog`

### Common Issues & Solutions
- **Arduino not detected**: Check USB connection, verify user in dialout group
- **Database connection failed**: Verify PostgreSQL service, check credentials
- **API not responding**: Check service status, verify port 5000 not blocked
- **GPIO access denied**: Verify user in gpio group, check /dev/gpiomem permissions

### Performance Monitoring
```bash
# Real-time system monitor
htop

# Network connections
netstat -tlnp

# Disk usage
df -h

# Memory usage
free -h

# Temperature
vcgencmd measure_temp
```

---

**🏆 Your Green Genesis platform is now ready for competition demonstration! The system provides real-time IoT monitoring, AI-powered plant analysis, and intelligent farming automation - all running on Raspberry Pi with professional-grade reliability!** 🌱🚀
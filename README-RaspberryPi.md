# Green Genesis - Raspberry Pi OS 64-bit Complete Setup Guide

## 🌱 AI-Powered Precision Farming Platform for Raspberry Pi

This comprehensive guide will help you deploy the complete Green Genesis platform on Raspberry Pi OS 64-bit with full hardware integration, sensor monitoring, and AI capabilities.

---

## 📋 Hardware Requirements

### Essential Raspberry Pi Components
- **Raspberry Pi 4 Model B** (4GB RAM minimum, 8GB recommended)
- **MicroSD Card**: 32GB Class 10 or faster
- **Power Supply**: Official Raspberry Pi USB-C (5.1V, 3A)
- **Case with Cooling**: Fan or heatsinks recommended
- **Ethernet Cable** or reliable Wi-Fi connection

### Sensor Hardware Setup
- **Arduino Uno R3** or Arduino Nano
- **DHT22**: Temperature & humidity sensor
- **Capacitive Soil Moisture Sensor**: For accurate readings
- **MQ-135**: CO2 and air quality monitoring
- **LDR (Light Sensor)**: For light level detection
- **Breadboard & Jumper Wires**: For connections
- **USB Cable**: Arduino to Raspberry Pi connection

### Actuator Hardware (Optional)
- **4-Channel Relay Module**: For controlling devices
- **Water Pump**: 12V DC for irrigation
- **Exhaust Fan**: 12V DC for ventilation
- **LED Grow Lights**: For supplemental lighting
- **12V Power Supply**: For powering actuators

---

## 🔧 Raspberry Pi OS Installation & Setup

### Step 1: Install Raspberry Pi OS 64-bit

```bash
# Use Raspberry Pi Imager to flash OS to SD card
# Select: Raspberry Pi OS (64-bit) with desktop

# First boot - update everything
sudo apt update && sudo apt upgrade -y

# Install essential development tools
sudo apt install -y git curl wget vim build-essential python3-dev
```

### Step 2: Enable Hardware Interfaces

```bash
# Open configuration tool
sudo raspi-config

# Navigate through these options:
# Interface Options → Serial Port
# - Would you like a login shell to be accessible over serial? → NO
# - Would you like the serial port hardware to be enabled? → YES

# Interface Options → I2C → YES
# Interface Options → SPI → YES

# Reboot to apply changes
sudo reboot
```

### Step 3: Configure Serial Communication

```bash
# Check available serial ports
ls -la /dev/tty*

# Add your user to the dialout group for serial access
sudo usermod -a -G dialout $USER

# Add to gpio group for hardware control
sudo usermod -a -G gpio $USER

# Apply group changes
sudo reboot
```

---

## 🗄️ Database Setup (PostgreSQL)

### Install and Configure PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable the service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql

# In PostgreSQL shell, run these commands:
CREATE USER greengenesis WITH PASSWORD 'SecurePassword123!';
CREATE DATABASE greengenesis OWNER greengenesis;
GRANT ALL PRIVILEGES ON DATABASE greengenesis TO greengenesis;
\q

# Test the connection
psql -h localhost -U greengenesis -d greengenesis
```

### Configure Remote Access (Optional)

```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/15/main/postgresql.conf

# Find and change:
listen_addresses = '*'

# Edit authentication file
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Add this line for local network access:
host    all    greengenesis    192.168.1.0/24    md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## 🟢 Node.js Installation

### Install Node.js 20 LTS

```bash
# Download and install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x

# Install PM2 for process management
sudo npm install -g pm2

# Configure PM2 to start on boot
pm2 startup
# Run the command that PM2 outputs

pm2 save
```

---

## 🔌 Arduino Hardware Setup

### Arduino Code for Sensors

Create this code file `greenhouse_sensors.ino`:

```cpp
#include <DHT.h>

// Pin definitions
#define DHT_PIN 2
#define DHT_TYPE DHT22
#define SOIL_MOISTURE_PIN A0
#define CO2_PIN A1
#define LIGHT_PIN A2

DHT dht(DHT_PIN, DHT_TYPE);

void setup() {
  Serial.begin(9600);
  dht.begin();
  
  // Initialize analog pins
  pinMode(SOIL_MOISTURE_PIN, INPUT);
  pinMode(CO2_PIN, INPUT);
  pinMode(LIGHT_PIN, INPUT);
  
  delay(2000);
  Serial.println("Green Genesis Sensor Node Ready");
}

void loop() {
  // Read temperature and humidity
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  // Read analog sensors
  int soilRaw = analogRead(SOIL_MOISTURE_PIN);
  int co2Raw = analogRead(CO2_PIN);
  int lightRaw = analogRead(LIGHT_PIN);
  
  // Convert readings to useful values
  float soilMoisture = map(soilRaw, 1023, 0, 0, 100) / 100.0; // Invert for capacitive sensor
  int co2Level = map(co2Raw, 0, 1023, 400, 2000); // Calibrate for your sensor
  int lightLevel = map(lightRaw, 0, 1023, 0, 1000); // Approximate lux
  
  // Send data if valid
  if (!isnan(temperature) && !isnan(humidity)) {
    Serial.print("{\"type\":\"telemetry\",\"data\":{");
    Serial.print("\"temperature\":");
    Serial.print(temperature, 1);
    Serial.print(",\"humidity\":");
    Serial.print(humidity, 0);
    Serial.print(",\"soilMoisture\":");
    Serial.print(soilMoisture, 2);
    Serial.print(",\"co2Level\":");
    Serial.print(co2Level);
    Serial.print(",\"lightLevel\":");
    Serial.print(lightLevel);
    Serial.println("}}");
  }
  
  delay(30000); // Send every 30 seconds
}
```

### Wiring Diagram

```
Arduino Connections:
===================
5V     → DHT22 VCC, Soil Sensor VCC
GND    → All GND connections
Pin 2  → DHT22 Data Pin
A0     → Soil Moisture Signal
A1     → MQ-135 Signal  
A2     → LDR Signal

DHT22:
Pin 1 (VCC) → 5V
Pin 2 (Data) → Pin 2 (+ 10kΩ pullup resistor to 5V)
Pin 4 (GND) → GND

Soil Moisture:
VCC → 5V
GND → GND  
AOUT → A0

Light Sensor (LDR):
One end → 5V
Other end → A2 + 10kΩ resistor to GND
```

---

## 🚀 Green Genesis Platform Installation

### Clone and Setup

```bash
# Navigate to home directory
cd ~

# Clone your project (replace with actual repository)
git clone https://github.com/your-username/green-genesis.git
cd green-genesis

# Install all dependencies
npm install

# Install additional Raspberry Pi specific packages
npm install serialport@latest
```

### Environment Configuration

```bash
# Create environment file
nano .env
```

Add this configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://greengenesis:SecurePassword123!@localhost:5432/greengenesis
PGHOST=localhost
PGPORT=5432
PGUSER=greengenesis
PGPASSWORD=SecurePassword123!
PGDATABASE=greengenesis

# OpenAI API Key (for AI features)
OPENAI_API_KEY=your_openai_api_key_here

# Weather API Key (optional - for weather integration)
OPENWEATHER_API_KEY=your_weather_api_key_here

# Serial Port Configuration  
SERIAL_PORT=/dev/ttyACM0
SERIAL_BAUD_RATE=9600

# Application Settings
NODE_ENV=production
PORT=5000

# Location Settings (for weather)
LOCATION_LAT=40.7128
LOCATION_LON=-74.0060
LOCATION_CITY=New York
```

```bash
# Secure the environment file
chmod 600 .env
```

### Initialize Database

```bash
# Push database schema
npm run db:push

# Seed initial data (creates admin user and plant species)
npx tsx server/seed.ts
```

---

## ⚙️ System Service Configuration

### Create Systemd Service

```bash
# Create service file
sudo nano /etc/systemd/system/green-genesis.service
```

Add this configuration:

```ini
[Unit]
Description=Green Genesis AI Farming Platform
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/green-genesis
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
KillSignal=SIGINT

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/home/pi/green-genesis

# Logging
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=green-genesis

[Install]
WantedBy=multi-user.target
```

### Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable auto-start on boot
sudo systemctl enable green-genesis

# Start the service
sudo systemctl start green-genesis

# Check status
sudo systemctl status green-genesis

# View live logs
sudo journalctl -u green-genesis -f
```

---

## 🌐 Network & Security Setup

### Configure Firewall

```bash
# Install UFW firewall
sudo apt install -y ufw

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow necessary ports
sudo ufw allow ssh
sudo ufw allow 5000/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Optional: Static IP Configuration

```bash
# Edit network configuration
sudo nano /etc/dhcpcd.conf

# Add at the end:
interface eth0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=8.8.8.8 1.1.1.1

# For Wi-Fi, use wlan0 instead of eth0
```

---

## 🔧 Hardware Testing & Calibration

### Test Arduino Connection

```bash
# Check if Arduino is detected
ls -la /dev/ttyACM*

# Install screen for serial monitoring
sudo apt install -y screen

# Monitor Arduino output
screen /dev/ttyACM0 9600

# You should see JSON data streaming
# Press Ctrl+A then K to exit
```

### Sensor Calibration Script

```bash
# Create calibration helper
nano calibrate_sensors.sh
```

```bash
#!/bin/bash
echo "Green Genesis Sensor Calibration"
echo "================================"

echo "1. Soil Moisture Calibration:"
echo "   - Place sensor in completely dry soil"
echo "   - Note the value, update DRY_VALUE in Arduino code"
echo "   - Place sensor in saturated soil"  
echo "   - Note the value, update WET_VALUE in Arduino code"
echo

echo "2. Light Sensor Calibration:"
echo "   - Cover sensor completely (darkness)"
echo "   - Note the value for DARK_VALUE" 
echo "   - Expose to bright light"
echo "   - Note the value for BRIGHT_VALUE"
echo

echo "3. CO2 Sensor Calibration:"
echo "   - Let sensor warm up for 24 hours"
echo "   - Calibrate in fresh outdoor air (≈400ppm)"
echo "   - Adjust mapping in Arduino code"

chmod +x calibrate_sensors.sh
```

---

## 📊 Monitoring & Maintenance

### System Monitoring Script

```bash
# Create monitoring script
nano system_status.sh
```

```bash
#!/bin/bash
echo "=== Green Genesis System Status ==="
date
echo

# Service status
echo "Services:"
systemctl is-active --quiet green-genesis && echo "✓ Green Genesis: Running" || echo "✗ Green Genesis: Stopped"
systemctl is-active --quiet postgresql && echo "✓ PostgreSQL: Running" || echo "✗ PostgreSQL: Stopped"

# System health
echo
echo "System Health:"
echo "Temperature: $(vcgencmd measure_temp)"
echo "Memory: $(free -h | grep Mem | awk '{print $3"/"$2}')"  
echo "Disk: $(df -h / | tail -1 | awk '{print $3"/"$2" ("$5")"}')"

# Hardware status
echo
echo "Hardware:"
test -c /dev/ttyACM0 && echo "✓ Arduino: Connected" || echo "✗ Arduino: Not detected"

# Network status  
echo
echo "Network:"
ping -c 1 8.8.8.8 >/dev/null 2>&1 && echo "✓ Internet: Connected" || echo "✗ Internet: Down"
echo
```

```bash
chmod +x system_status.sh
```

### Automated Backup

```bash
# Create backup script
nano backup_data.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/pi/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
echo "Backing up database..."
pg_dump -h localhost -U greengenesis greengenesis > $BACKUP_DIR/db_$DATE.sql

# Backup configuration
echo "Backing up config..."
tar -czf $BACKUP_DIR/config_$DATE.tar.gz .env package.json

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR"
```

```bash
chmod +x backup_data.sh
```

### Setup Automatic Tasks

```bash
# Edit crontab
crontab -e

# Add these scheduled tasks:
# System status check every hour
0 * * * * /home/pi/system_status.sh >> /home/pi/logs/status.log 2>&1

# Daily backup at 2 AM
0 2 * * * /home/pi/backup_data.sh >> /home/pi/logs/backup.log 2>&1

# Create logs directory
mkdir -p /home/pi/logs
```

---

## 🔍 Troubleshooting Guide

### Common Issues & Solutions

#### Arduino Not Detected
```bash
# Check USB connection
lsusb

# Check serial permissions
ls -la /dev/ttyACM* /dev/ttyUSB*

# Add user to dialout group
sudo usermod -a -G dialout $USER
sudo reboot
```

#### Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection manually
psql -h localhost -U greengenesis -d greengenesis

# Check if database exists
sudo -u postgres psql -l
```

#### Service Won't Start
```bash
# Check detailed logs
sudo journalctl -u green-genesis -n 50

# Check file permissions
sudo chown -R pi:pi /home/pi/green-genesis

# Verify environment file
cat .env
```

#### GPIO Access Denied
```bash
# Add to gpio group
sudo usermod -a -G gpio $USER

# Check GPIO device permissions
ls -la /dev/gpiomem

# Reboot to apply group changes
sudo reboot
```

---

## 🎯 Performance Optimization

### Memory Optimization
```bash
# Increase swap space for better performance
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Change CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### CPU Performance
```bash
# Set CPU to performance mode
echo 'performance' | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Make permanent by adding to /etc/rc.local:
sudo nano /etc/rc.local
# Add before "exit 0":
# echo 'performance' > /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

### GPU Memory (Headless Mode)
```bash
# Reduce GPU memory for headless operation
sudo raspi-config
# Advanced Options → Memory Split → 16
```

---

## 🚀 Final Testing & Deployment

### Complete System Test

```bash
# Create comprehensive test
nano final_system_test.sh
```

```bash
#!/bin/bash
echo "=== Green Genesis Final System Test ==="
echo

# Test 1: Services
echo "1. Testing Services..."
systemctl is-active --quiet green-genesis && echo "✓ Application service" || echo "✗ Application service FAILED"
systemctl is-active --quiet postgresql && echo "✓ Database service" || echo "✗ Database service FAILED"

# Test 2: Database
echo
echo "2. Testing Database..."
psql -h localhost -U greengenesis -d greengenesis -c "SELECT COUNT(*) FROM plant_species;" >/dev/null 2>&1 && echo "✓ Database connection" || echo "✗ Database FAILED"

# Test 3: Web Interface
echo
echo "3. Testing Web Interface..."
curl -s http://localhost:5000/api/health >/dev/null && echo "✓ API responding" || echo "✗ API FAILED"

# Test 4: Hardware
echo
echo "4. Testing Hardware..."
test -c /dev/ttyACM0 && echo "✓ Arduino detected" || echo "✗ Arduino not found"
test -r /dev/gpiomem && echo "✓ GPIO access" || echo "✗ GPIO access FAILED"

# Test 5: Network
echo
echo "5. Testing Network..."
ping -c 1 8.8.8.8 >/dev/null 2>&1 && echo "✓ Internet connection" || echo "✗ Internet FAILED"

echo
echo "=== Test Complete ==="
echo "If any tests show ✗, check the troubleshooting section"
```

```bash
chmod +x final_system_test.sh
./final_system_test.sh
```

---

## 🌟 Getting Started

### Access Your Platform

1. **Open web browser** and navigate to: `http://your-raspberry-pi-ip:5000`
2. **Login with admin credentials**: 
   - Username: `Infomatrix`
   - Password: `Infomatrix2025MKA`
3. **Dashboard**: Monitor real-time sensor data and plant health
4. **Plant Health**: Upload plant images for AI analysis
5. **Admin Panel**: Configure plant species and actuator controls

### Adding API Keys for Enhanced Features

Your platform supports these optional integrations:

- **OpenAI API**: For AI plant health analysis and chat assistance
- **OpenWeatherMap API**: For weather-based growing recommendations

To add these, edit your `.env` file:
```bash
nano .env
# Add your API keys and restart the service
sudo systemctl restart green-genesis
```

---

## 📚 Additional Resources

### Log Locations
- **Application logs**: `sudo journalctl -u green-genesis -f`
- **System status**: `/home/pi/logs/status.log`
- **Backup logs**: `/home/pi/logs/backup.log`

### Useful Commands
```bash
# View real-time sensor data
sudo journalctl -u green-genesis -f | grep "Simulated sensor data"

# Restart application
sudo systemctl restart green-genesis

# Check system resources
htop

# Monitor database connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

### Support
For technical issues or feature requests, check the troubleshooting section or review the application logs for detailed error information.

---

**🎉 Congratulations! Your Raspberry Pi is now running a complete AI-powered precision farming platform!**

Monitor your plants, analyze their health with AI, and optimize growing conditions automatically. Your smart greenhouse is ready to help you grow healthier crops with data-driven insights! 🌱🚀
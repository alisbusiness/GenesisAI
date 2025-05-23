# Green Genesis Python Backend

## Advanced AI-Powered Plant Health Monitoring System

This Python backend provides enhanced AI capabilities and machine learning features for the Green Genesis plant monitoring system. It runs alongside the existing Node.js backend to provide specialized services.

## Features

### 🤖 Advanced AI Analysis
- **Computer Vision**: Plant image analysis using OpenAI GPT-4 Vision
- **Machine Learning**: Predictive health scoring with scikit-learn models
- **Natural Language Processing**: AI-powered plant care recommendations
- **Trend Analysis**: Future condition predictions based on historical data

### 📊 Enhanced Data Processing
- **Real-time Analytics**: Continuous sensor data analysis
- **Automated Alerts**: Intelligent threshold monitoring
- **Predictive Modeling**: Future growth and health forecasting
- **Data Quality Monitoring**: Sensor validation and anomaly detection

### 🔧 Hardware Integration
- **Serial Communication**: Direct Arduino sensor integration
- **Actuator Control**: Automated plant care system control
- **Real-time Streaming**: WebSocket-based live data updates
- **Background Tasks**: Scheduled automated plant care routines

### 🌐 API Services
- **RESTful API**: Comprehensive plant health endpoints
- **WebSocket Support**: Real-time bidirectional communication
- **OpenAPI Documentation**: Interactive API documentation
- **Health Monitoring**: System diagnostics and status reporting

## Quick Start

### Prerequisites
- Python 3.8 or higher
- PostgreSQL database (shared with Node.js backend)
- OpenAI API key (for AI features)

### Installation

1. **Start the Python Backend**:
   ```bash
   ./python-backend/start-python-backend.sh
   ```

2. **Verify Installation**:
   - API Documentation: http://localhost:8000/py-docs
   - Health Check: http://localhost:8000/py-health
   - WebSocket: ws://localhost:8000/py-ws

### Configuration

The Python backend uses the same `.env` file as the Node.js backend:

```env
# Database (shared with Node.js backend)
DATABASE_URL=postgresql://greengenesis:SecurePassword123!@localhost:5432/greengenesis

# AI Services
OPENAI_API_KEY=your-openai-api-key-here
OPENWEATHER_API_KEY=your-openweather-api-key-here

# Hardware
SERIAL_PORT=/dev/ttyACM0
SERIAL_BAUDRATE=9600
```

## API Endpoints

### Health & Status
- `GET /py-health` - Quick health check
- `GET /py-api/health` - Detailed system status
- `GET /py-api/system/status` - Comprehensive diagnostics

### Sensor Data
- `GET /py-api/telemetry/latest` - Latest sensor reading
- `GET /py-api/telemetry/history` - Historical data (up to 1 week)

### AI Analysis
- `POST /py-api/analysis/health` - Comprehensive plant health analysis
- `GET /py-api/analysis/auto` - Automatic analysis from latest data
- `POST /py-api/predictions/forecast` - Future condition predictions

### Hardware Control
- `POST /py-api/actuators/command` - Send commands to hardware
- `GET /py-api/diagnostics/sensor-test` - Test sensor connections

### Alerts & Monitoring
- `GET /py-api/alerts/active` - Current active alerts
- `POST /py-api/alerts/acknowledge/{id}` - Acknowledge alerts

## Architecture

### Services Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Service    │    │ Sensor Service  │    │   Scheduler     │
│                 │    │                 │    │                 │
│ • GPT-4 Vision  │    │ • Serial Comm   │    │ • Auto Analysis │
│ • ML Models     │    │ • Data Buffer   │    │ • Alert Checks  │
│ • Predictions   │    │ • Hardware Ctrl │    │ • Maintenance   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  FastAPI Core   │
                    │                 │
                    │ • REST API      │
                    │ • WebSocket     │
                    │ • Database      │
                    └─────────────────┘
```

### Data Flow
1. **Sensor Collection**: Arduino → Serial → Python Service
2. **AI Processing**: Sensor Data → ML Models → Health Analysis
3. **Real-time Updates**: Analysis → WebSocket → Frontend
4. **Automated Actions**: Alerts → Scheduler → Hardware Control

## Development

### Running in Development
```bash
cd python-backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Project Structure
```
python-backend/
├── app/
│   ├── api/           # API routes and endpoints
│   ├── core/          # Configuration and database
│   ├── models/        # SQLAlchemy database models
│   ├── schemas/       # Pydantic request/response models
│   ├── services/      # Business logic services
│   └── utils/         # Helper utilities
├── requirements.txt   # Python dependencies
└── start-python-backend.sh  # Startup script
```

### Adding New Features

1. **New API Endpoint**: Add to `app/api/routes.py`
2. **New Service**: Create in `app/services/`
3. **New Model**: Add to `app/models/`
4. **New Schema**: Add to `app/schemas/`

## Integration with Node.js Backend

The Python backend is designed to complement the existing Node.js system:

### Shared Resources
- **Database**: Both backends use the same PostgreSQL database
- **Environment**: Shared `.env` configuration file
- **Hardware**: Coordinated Arduino sensor access

### Service Separation
- **Node.js**: Web interface, user management, basic CRUD
- **Python**: AI analysis, machine learning, advanced processing

### Communication
- **Direct Database**: Shared data storage
- **WebSocket Broadcasting**: Real-time updates to frontend
- **Independent APIs**: Each backend provides specialized endpoints

## Monitoring & Maintenance

### Automated Tasks
- **Health Analysis**: Every 10 minutes
- **Alert Monitoring**: Every 5 minutes
- **Predictive Analysis**: Every hour
- **System Health Check**: Every 30 minutes
- **Data Cleanup**: Daily at 2 AM

### Performance Monitoring
- Monitor memory usage and processing time
- Track API response times
- Monitor WebSocket connection stability
- Validate sensor data quality

## Troubleshooting

### Common Issues

**Python Backend Won't Start**
```bash
# Check Python version
python3 --version

# Recreate virtual environment
rm -rf python-backend/venv
python3 -m venv python-backend/venv
source python-backend/venv/bin/activate
pip install -r python-backend/requirements.txt
```

**AI Features Not Working**
- Verify OpenAI API key in `.env` file
- Check API key permissions and credits
- Monitor API rate limits

**Sensor Connection Issues**
- Check Arduino USB connection
- Verify serial port permissions: `sudo usermod -a -G dialout $USER`
- Test with: `ls -la /dev/ttyACM*`

### Logs and Debugging
- Application logs: Check console output
- API documentation: http://localhost:8000/py-docs
- Health endpoint: http://localhost:8000/py-health

## Contributing

When adding new features:
1. Follow FastAPI best practices
2. Add proper type hints
3. Include error handling
4. Update API documentation
5. Test with real sensor data
6. Coordinate with Node.js backend changes
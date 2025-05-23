# Green Genesis - Dual Backend Architecture

## System Overview

Green Genesis now features a **dual backend architecture** combining Node.js and Python services for optimal performance and specialized capabilities.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React + TypeScript)              │
│  • Real-time Dashboard  • Plant Health UI  • Admin Panel       │
└─────────────────────┬───────────────────────┬───────────────────┘
                      │                       │
              ┌───────▼───────┐       ┌───────▼───────┐
              │  Node.js      │       │  Python       │
              │  Backend      │       │  Backend      │
              │  Port: 5000   │       │  Port: 8000   │
              └───────┬───────┘       └───────┬───────┘
                      │                       │
                      └───────────┬───────────┘
                                  │
                      ┌───────────▼───────────┐
                      │   PostgreSQL DB       │
                      │   Shared Database     │
                      └───────────────────────┘
```

## Backend Responsibilities

### Node.js Backend (Port 5000)
**Primary Focus**: Web application, user management, real-time UI

#### Core Features:
- **Web Dashboard**: React frontend serving and routing
- **User Authentication**: Admin login and session management  
- **Basic CRUD Operations**: Plant species, settings, telemetry
- **WebSocket Server**: Real-time data streaming to frontend
- **Arduino Integration**: Serial communication and sensor data collection
- **Database Management**: Drizzle ORM with PostgreSQL

#### API Endpoints:
- `/api/health` - System health status
- `/api/telemetry/*` - Sensor data endpoints
- `/api/actuators/*` - Hardware control
- `/api/chat/*` - Basic chat functionality
- `/api/analysis/*` - Simple health analysis

### Python Backend (Port 8000)  
**Primary Focus**: Advanced AI, machine learning, and data science

#### Core Features:
- **Advanced AI Analysis**: OpenAI GPT-4 Vision for plant image analysis
- **Machine Learning**: Scikit-learn models for predictive health scoring
- **Predictive Analytics**: Future condition forecasting and trend analysis
- **Automated Intelligence**: Smart scheduling and decision making
- **Enhanced WebSocket**: Specialized real-time AI updates
- **Background Processing**: Automated plant care routines

#### API Endpoints:
- `/py-api/analysis/health` - Comprehensive AI plant analysis
- `/py-api/predictions/forecast` - Future condition predictions
- `/py-api/telemetry/history` - Advanced historical data analysis
- `/py-api/actuators/command` - Intelligent hardware control
- `/py-api/system/status` - Detailed system diagnostics

## Data Flow Architecture

### Sensor Data Collection
```
Arduino Sensors → Serial Connection → Node.js Service → PostgreSQL
                                   ↘
                                   Python Service → AI Analysis → ML Models
```

### AI Analysis Pipeline
```
Sensor Data → Python AI Service → GPT-4 Vision → Health Analysis
           ↘                   ↗
           Machine Learning Models → Predictive Scoring → Recommendations
```

### Real-time Updates
```
Data Changes → WebSocket Broadcasting → Frontend Updates
            ↗                      ↗
Node.js WebSocket              Python WebSocket
(Basic Updates)                (AI Updates)
```

## Service Communication

### Shared Resources
- **Database**: Single PostgreSQL instance shared between both backends
- **Environment Variables**: Common `.env` configuration file
- **Hardware Access**: Coordinated Arduino sensor management

### Independent Services
- **Separate Ports**: Node.js (5000), Python (8000)
- **Specialized APIs**: Each backend focuses on its strengths
- **Independent Scaling**: Services can be scaled independently

### Data Synchronization
- **Real-time Database Sync**: Both services read/write to shared database
- **WebSocket Coordination**: Cross-service real-time updates
- **Event-driven Updates**: Database triggers ensure data consistency

## AI & Machine Learning Features

### OpenAI Integration
- **GPT-4 Vision**: Plant image analysis and visual health assessment
- **Natural Language**: Intelligent chat responses and recommendations
- **Contextual Analysis**: Environmental data-driven insights

### Machine Learning Models
- **Health Scoring**: Random Forest models for plant health prediction
- **Growth Analysis**: Predictive models for growth rate assessment
- **Anomaly Detection**: Automated identification of unusual conditions
- **Trend Analysis**: Time series analysis for condition forecasting

### Automated Intelligence
- **Smart Scheduling**: AI-driven maintenance and care routines
- **Predictive Alerts**: Early warning system for potential issues
- **Adaptive Control**: Hardware adjustments based on AI recommendations

## Hardware Integration

### Arduino Communication
```
Arduino → USB Serial → Python Service (Primary) → Database
                    ↘
                    Node.js Service (Backup) → WebSocket Updates
```

### Actuator Control
- **Coordinated Access**: Both backends can control hardware
- **Priority System**: Python AI has higher priority for automated actions
- **Safety Mechanisms**: Prevent conflicting commands

## Performance & Scalability

### Load Distribution
- **Node.js**: Handles web traffic and basic API requests
- **Python**: Processes CPU-intensive AI and ML operations
- **Database**: Optimized queries with proper indexing

### Caching Strategy
- **Node.js**: In-memory caching for frequently accessed data
- **Python**: ML model caching and prediction result storage
- **Database**: Connection pooling and query optimization

### Background Processing
- **Python Scheduler**: Automated analysis every 10 minutes
- **Alert System**: Environmental monitoring every 5 minutes
- **Data Cleanup**: Daily maintenance routines

## Development Workflow

### Starting Both Backends

**Option 1 - Node.js Only:**
```bash
npm run dev
# Access at http://localhost:5000
```

**Option 2 - Full AI Features:**
```bash
# Terminal 1: Node.js Backend
npm run dev

# Terminal 2: Python Backend  
./python-backend/start-python-backend.sh
```

### API Documentation
- **Node.js API**: Available at application runtime
- **Python API**: Interactive docs at http://localhost:8000/py-docs
- **Health Checks**: 
  - Node.js: http://localhost:5000/api/health
  - Python: http://localhost:8000/py-health

### Testing Integration
```bash
# Test Node.js backend
curl http://localhost:5000/api/health

# Test Python backend
curl http://localhost:8000/py-health

# Test WebSocket connections
wscat -c ws://localhost:5000  # Node.js WebSocket
wscat -c ws://localhost:8000/py-ws  # Python WebSocket
```

## Deployment Strategies

### Development Environment
- **Local Development**: Both backends running on localhost
- **Hot Reload**: Node.js (Vite) and Python (uvicorn --reload)
- **Shared Database**: Single PostgreSQL instance

### Production Deployment
- **Container Orchestration**: Docker Compose with separate containers
- **Load Balancing**: Nginx proxy for routing requests
- **Database Clustering**: PostgreSQL high availability setup
- **Service Monitoring**: Health checks and automatic restart

### Raspberry Pi Deployment
- **Resource Management**: Python backend for AI processing
- **Hardware Access**: Direct GPIO and serial port management
- **Process Management**: PM2 for Node.js, systemd for Python

## Benefits of Dual Backend Architecture

### Performance Advantages
- **Specialized Processing**: Each backend optimized for its purpose
- **Parallel Processing**: Simultaneous handling of different request types
- **Resource Isolation**: Heavy AI processing doesn't affect web performance

### Scalability Benefits
- **Independent Scaling**: Scale AI services separately from web services
- **Technology Optimization**: Use best tools for each specific task
- **Future Expansion**: Easy to add new specialized services

### Development Benefits
- **Team Specialization**: Different teams can work on different backends
- **Technology Choice**: Use optimal language for each feature
- **Maintenance Isolation**: Issues in one backend don't affect the other

## Monitoring & Maintenance

### Health Monitoring
- **Cross-service Health Checks**: Each backend monitors the other
- **Database Connection Monitoring**: Shared resource status tracking
- **Performance Metrics**: Response times and resource usage

### Logging Strategy
- **Centralized Logging**: Aggregated logs from both services
- **Service Identification**: Clear labeling of log sources
- **Error Correlation**: Track issues across both backends

### Backup & Recovery
- **Database Backups**: Shared PostgreSQL backup strategy
- **Configuration Backups**: Environment and service configurations
- **Service Recovery**: Independent restart capabilities

This dual backend architecture provides the foundation for a highly scalable, intelligent plant monitoring system that combines the best of both Node.js and Python ecosystems.
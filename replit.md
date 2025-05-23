# Green Genesis - AI-Powered Precision Farming Platform

## Overview

Green Genesis is a comprehensive precision farming platform that combines IoT sensors, AI-powered plant health analysis, and automated control systems to optimize crop production. The system provides real-time monitoring of environmental conditions, intelligent plant health assessment using computer vision, and automated actuator control for optimal growing conditions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a full-stack architecture with clear separation between frontend, backend, and data layers:

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket connection for live updates

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful APIs with real-time WebSocket support
- **Development**: Hot reload with Vite middleware in development

## Key Components

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema**: Centralized schema definition in `shared/schema.ts`
- **Tables**: admins, plant_species, current_plant, telemetry_data, actuators, actuator_logs, ai_analyses, chat_messages, settings

### Authentication System
- **Method**: Basic authentication with bcrypt password hashing
- **Tokens**: Base64 encoded username:password for admin sessions
- **Storage**: Local storage for client-side token persistence

### AI Integration
- **Service**: OpenAI GPT-4o for plant health analysis and chat assistance
- **Features**: Image analysis for plant health assessment, conversational AI for farming guidance
- **Analysis**: Comprehensive health scoring, issue detection, and recommendation generation

### IoT Communication
- **Protocol**: Serial communication with Arduino devices
- **Data**: Real-time telemetry (temperature, humidity, soil moisture, CO2, light levels)
- **Control**: Bidirectional communication for actuator control

### Real-time Features
- **WebSocket Server**: Custom WebSocket implementation for live updates
- **Channels**: Telemetry updates, AI analysis results, actuator state changes
- **Client Updates**: Automatic UI refresh with new sensor data and analysis

## Data Flow

1. **Sensor Data Collection**: Arduino devices collect environmental data and send via serial communication
2. **Data Processing**: Server receives, validates, and stores telemetry data in PostgreSQL
3. **Real-time Distribution**: WebSocket broadcasts updates to connected clients
4. **AI Analysis**: Plant images are analyzed using OpenAI's vision capabilities
5. **Automated Control**: System can automatically adjust actuators based on plant species requirements
6. **User Interaction**: Admin panel allows manual control and configuration

## External Dependencies

### Core Technologies
- **Database**: PostgreSQL with Neon serverless hosting
- **AI Service**: OpenAI API for GPT-4o model access
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Charts**: Recharts for data visualization
- **Serial Communication**: Node.js SerialPort for Arduino integration

### Development Tools
- **Build System**: Vite for frontend bundling and development server
- **Type Checking**: TypeScript with strict configuration
- **Database Migration**: Drizzle Kit for schema management
- **Styling**: PostCSS with Tailwind CSS

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with hot reload
- **Database**: PostgreSQL 16 with automatic provisioning
- **Port Configuration**: Frontend on port 5000, mapped to external port 80
- **Module System**: ES modules throughout the application

### Production Build
- **Frontend**: Vite build process generating static assets
- **Backend**: esbuild bundling for Node.js production deployment
- **Database**: Environment variable configuration for database URL
- **Deployment Target**: Replit autoscale infrastructure

### Configuration Management
- **Environment Variables**: Database URL, OpenAI API key, serial port configuration
- **Build Scripts**: Separate development and production build processes
- **Asset Management**: Static file serving with proper caching headers

The architecture emphasizes modularity, type safety, and real-time capabilities while maintaining clear separation of concerns between the frontend dashboard, backend API, AI services, and IoT device communication.
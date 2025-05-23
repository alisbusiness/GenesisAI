import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { 
  Thermometer, 
  Droplets, 
  Sprout, 
  Wind, 
  Camera, 
  Settings,
  Brain,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import CameraViewer from "@/components/CameraViewer";
import SensorChart from "@/components/SensorChart";
import HealthCard from "@/components/HealthCard";
import ActuatorPanel from "@/components/ActuatorPanel";
import AnalysisChat from "@/components/AnalysisChat";
import { useWebSocket } from "@/hooks/useWebSocket";

interface TelemetryData {
  id: number;
  timestamp: string;
  temperature: string;
  humidity: string;
  soilMoisture: string;
  co2Level: number;
  lightLevel?: string;
}

interface HealthData {
  status: string;
  telemetry: TelemetryData;
  analysis: any;
  currentPlant: any;
  timestamp: string;
}

export default function PublicDashboard() {
  const [lastUpdate, setLastUpdate] = useState<string>("Just now");

  // WebSocket connection for real-time updates
  const { isConnected, lastMessage } = useWebSocket('ws://localhost:5000/ws');

  // Fetch initial health data
  const { data: healthData, isLoading, refetch } = useQuery<HealthData>({
    queryKey: ['/api/health'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Handle WebSocket messages
  useState(() => {
    if (lastMessage) {
      const message = JSON.parse(lastMessage);
      if (message.type === 'telemetry_update') {
        setLastUpdate("Just now");
        refetch();
      }
    }
  }, [lastMessage, refetch]);

  const telemetry = healthData?.telemetry;
  const analysis = healthData?.analysis;
  const currentPlant = healthData?.currentPlant;

  const getSensorStatus = (value: number, min: number, max: number) => {
    if (value >= min && value <= max) return "optimal";
    if (value < min * 0.8 || value > max * 1.2) return "critical";
    return "warning";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "optimal": return "text-green-600 bg-green-50 border-green-200";
      case "warning": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "critical": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "optimal": return <CheckCircle className="h-4 w-4" />;
      case "warning": return <AlertTriangle className="h-4 w-4" />;
      case "critical": return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-green-600 rounded-lg p-2">
                <Sprout className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Green Genesis</h1>
                <p className="text-sm text-slate-600">AI-Powered Precision Farming</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex space-x-4">
                <Link href="/" className="text-green-600 font-medium">Dashboard</Link>
                <Link href="/health" className="text-slate-600 hover:text-slate-900">Plant Health</Link>
              </div>
              
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                isConnected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`} />
                <span>{isConnected ? 'Live' : 'Offline'}</span>
              </div>
              
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Real-Time Farm Monitor</h2>
              <p className="text-slate-600">Last updated: {lastUpdate}</p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={() => refetch()} variant="outline">
                <Brain className="h-4 w-4 mr-2" />
                Analyze Now
              </Button>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Camera and Plant Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Camera Feed */}
            <CameraViewer analysis={analysis} />

            {/* Current Plant */}
            {currentPlant && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sprout className="h-5 w-5 text-green-600" />
                    <span>Current Plant Profile</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">
                        {currentPlant.species?.name || 'Unknown Plant'}
                      </h4>
                      <p className="text-sm text-slate-600 mb-2">
                        {currentPlant.species?.variety || 'Standard variety'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Planted: {new Date(currentPlant.plantedDate).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {currentPlant.species?.idealRanges && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Temperature</span>
                          <span className="font-medium">
                            {currentPlant.species.idealRanges.temp?.[0]}°C - {currentPlant.species.idealRanges.temp?.[1]}°C
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Humidity</span>
                          <span className="font-medium">
                            {currentPlant.species.idealRanges.humidity?.[0]}% - {currentPlant.species.idealRanges.humidity?.[1]}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Soil Moisture</span>
                          <span className="font-medium">
                            {currentPlant.species.idealRanges.soilMoisture?.[0]} - {currentPlant.species.idealRanges.soilMoisture?.[1]}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sensor Charts */}
            <SensorChart />
          </div>

          {/* Right Column - Sensors and Controls */}
          <div className="space-y-8">
            {/* Real-time Sensors */}
            {telemetry && (
              <div className="grid grid-cols-1 gap-4">
                {/* Temperature */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-red-100 p-2 rounded-lg">
                          <Thermometer className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">Temperature</h4>
                          <p className="text-sm text-slate-500">Current Reading</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(getSensorStatus(parseFloat(telemetry.temperature), 18, 27))}>
                        {getStatusIcon(getSensorStatus(parseFloat(telemetry.temperature), 18, 27))}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-slate-900">
                          {parseFloat(telemetry.temperature).toFixed(1)}
                        </span>
                        <span className="text-slate-500">°C</span>
                      </div>
                      <div className="text-sm text-slate-500">
                        Optimal: 18-27°C
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Humidity */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Droplets className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">Humidity</h4>
                          <p className="text-sm text-slate-500">Air Moisture</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(getSensorStatus(parseFloat(telemetry.humidity), 60, 80))}>
                        {getStatusIcon(getSensorStatus(parseFloat(telemetry.humidity), 60, 80))}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-slate-900">
                          {parseFloat(telemetry.humidity).toFixed(0)}
                        </span>
                        <span className="text-slate-500">%</span>
                      </div>
                      <div className="text-sm text-slate-500">
                        Optimal: 60-80%
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Soil Moisture */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-amber-100 p-2 rounded-lg">
                          <Sprout className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">Soil Moisture</h4>
                          <p className="text-sm text-slate-500">Root Zone</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(getSensorStatus(parseFloat(telemetry.soilMoisture), 0.6, 0.8))}>
                        {getStatusIcon(getSensorStatus(parseFloat(telemetry.soilMoisture), 0.6, 0.8))}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-slate-900">
                          {parseFloat(telemetry.soilMoisture).toFixed(2)}
                        </span>
                        <span className="text-slate-500">ratio</span>
                      </div>
                      <div className="text-sm text-slate-500">
                        Optimal: 0.6-0.8
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* CO2 Level */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Wind className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">CO₂ Level</h4>
                          <p className="text-sm text-slate-500">Air Quality</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(getSensorStatus(telemetry.co2Level, 400, 800))}>
                        {getStatusIcon(getSensorStatus(telemetry.co2Level, 400, 800))}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-slate-900">
                          {telemetry.co2Level}
                        </span>
                        <span className="text-slate-500">ppm</span>
                      </div>
                      <div className="text-sm text-slate-500">
                        Optimal: 400-800ppm
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Actuator Controls */}
            <ActuatorPanel />

            {/* AI Health Analysis */}
            <HealthCard analysis={analysis} />
          </div>
        </div>

        <Separator className="my-8" />

        {/* AI Chat Assistant */}
        <AnalysisChat />
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertTriangle, Bell, Cloud, Info, CheckCircle, X } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { useWebSocket } from '../hooks/useWebSocket';

interface AlertData {
  id: string;
  type: 'warning' | 'critical' | 'info' | 'prediction';
  title: string;
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  category: 'temperature' | 'humidity' | 'moisture' | 'co2' | 'weather' | 'system';
  actionRequired: boolean;
  recommendations: string[];
}

interface WeatherData {
  available: boolean;
  temperature?: number;
  humidity?: number;
  description?: string;
  message?: string;
}

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  
  const { data: alertsData } = useQuery({
    queryKey: ['/api/alerts'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: weatherData } = useQuery({
    queryKey: ['/api/weather'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // WebSocket for real-time alerts
  const { lastMessage } = useWebSocket(
    `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`
  );

  useEffect(() => {
    if (alertsData) {
      setAlerts(alertsData);
    }
  }, [alertsData]);

  useEffect(() => {
    if (weatherData) {
      setWeather(weatherData);
    }
  }, [weatherData]);

  useEffect(() => {
    if (lastMessage) {
      try {
        const message = JSON.parse(lastMessage);
        if (message.type === 'new_alerts') {
          setAlerts(prev => [...message.data, ...prev.slice(0, 19)]);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage]);

  const getAlertIcon = (type: string, severity: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'prediction':
        return <Bell className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const clearAlerts = async () => {
    try {
      await fetch('/api/alerts/clear', {
        method: 'POST',
        headers: {
          'Authorization': localStorage.getItem('authToken') || '',
        },
      });
      setAlerts([]);
    } catch (error) {
      console.error('Error clearing alerts:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Weather Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Weather Conditions
          </CardTitle>
          <CardDescription>
            Real-time weather data for environmental monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          {weather?.available && weather.temperature ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{weather.temperature}°C</div>
                <div className="text-sm text-muted-foreground">Temperature</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{weather.humidity}%</div>
                <div className="text-sm text-muted-foreground">Humidity</div>
              </div>
              <div className="text-center col-span-2 md:col-span-1">
                <div className="text-sm font-medium capitalize">{weather.description}</div>
                <div className="text-xs text-muted-foreground">Conditions</div>
              </div>
            </div>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {weather?.message || 'Weather integration ready - add OpenWeatherMap API key for real-time data'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Alerts Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Smart Alerts & Predictions
              </CardTitle>
              <CardDescription>
                AI-powered monitoring with predictive threshold breach alerts
              </CardDescription>
            </div>
            {alerts.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearAlerts}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-green-700 mb-2">All Systems Normal</h3>
              <p className="text-sm text-muted-foreground">
                No alerts or warnings. Your plants are thriving! 🌱
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.slice(0, 10).map((alert) => (
                <div key={alert.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getAlertIcon(alert.type, alert.severity)}
                      <h4 className="font-medium">{alert.title}</h4>
                      <Badge variant={getSeverityColor(alert.severity) as any}>
                        {alert.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {alert.category}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTimestamp(alert.timestamp)}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {alert.message}
                  </p>
                  
                  {alert.recommendations.length > 0 && (
                    <div className="bg-muted/50 rounded p-3">
                      <h5 className="text-xs font-medium mb-2 text-muted-foreground">
                        RECOMMENDED ACTIONS:
                      </h5>
                      <ul className="text-sm space-y-1">
                        {alert.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
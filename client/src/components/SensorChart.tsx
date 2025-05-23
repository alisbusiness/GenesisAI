import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, BarChart3, Download } from "lucide-react";
import { useState } from "react";

interface TelemetryData {
  id: number;
  timestamp: string;
  temperature: string;
  humidity: string;
  soilMoisture: string;
  co2Level: number;
  lightLevel?: string;
}

export default function SensorChart() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  // Fetch telemetry history
  const { data: telemetryHistory, isLoading } = useQuery<TelemetryData[]>({
    queryKey: ['/api/telemetry/history', { limit: timeRange === '24h' ? 100 : timeRange === '7d' ? 500 : 1000 }],
  });

  // Transform data for chart
  const chartData = telemetryHistory?.map((data, index) => ({
    time: new Date(data.timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    temperature: parseFloat(data.temperature),
    humidity: parseFloat(data.humidity),
    soilMoisture: parseFloat(data.soilMoisture) * 100, // Convert to percentage for better visualization
    co2: data.co2Level,
    index: index,
  })).reverse() || [];

  // Get latest readings for summary
  const latestReading = telemetryHistory?.[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            <span>Sensor Trends</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              {(['24h', '7d', '30d'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className={timeRange === range ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {range}
                </Button>
              ))}
            </div>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 animate-pulse text-slate-400 mx-auto mb-2" />
              <p className="text-slate-500">Loading sensor data...</p>
            </div>
          </div>
        ) : chartData.length > 0 ? (
          <>
            {/* Individual Sensor Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Temperature Chart */}
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center">
                  <div className="w-3 h-3 bg-red-600 rounded-full mr-2" />
                  Temperature Trend
                </h3>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fecaca" />
                      <XAxis 
                        dataKey="time" 
                        stroke="#991b1b"
                        fontSize={11}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        stroke="#991b1b" 
                        fontSize={11}
                        domain={['dataMin - 2', 'dataMax + 2']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fef2f2', 
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                        }}
                        formatter={(value) => [`${value}°C`, 'Temperature']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="temperature" 
                        stroke="#dc2626" 
                        strokeWidth={3}
                        dot={{ fill: '#dc2626', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, fill: '#b91c1c' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-2">
                  <span className="text-2xl font-bold text-red-600">
                    {latestReading ? parseFloat(latestReading.temperature).toFixed(1) : '--'}°C
                  </span>
                  <p className="text-sm text-red-600">Current Temperature</p>
                </div>
              </div>

              {/* Humidity Chart */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-700 mb-3 flex items-center">
                  <div className="w-3 h-3 bg-blue-600 rounded-full mr-2" />
                  Humidity Trend
                </h3>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#bfdbfe" />
                      <XAxis 
                        dataKey="time" 
                        stroke="#1d4ed8"
                        fontSize={11}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        stroke="#1d4ed8" 
                        fontSize={11}
                        domain={[0, 100]}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#eff6ff', 
                          border: '1px solid #bfdbfe',
                          borderRadius: '6px',
                        }}
                        formatter={(value) => [`${value}%`, 'Humidity']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="humidity" 
                        stroke="#2563eb" 
                        strokeWidth={3}
                        dot={{ fill: '#2563eb', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, fill: '#1d4ed8' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {latestReading ? parseFloat(latestReading.humidity).toFixed(0) : '--'}%
                  </span>
                  <p className="text-sm text-blue-600">Current Humidity</p>
                </div>
              </div>

              {/* Soil Moisture Chart */}
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <h3 className="text-lg font-semibold text-amber-700 mb-3 flex items-center">
                  <div className="w-3 h-3 bg-amber-600 rounded-full mr-2" />
                  Soil Moisture Trend
                </h3>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" />
                      <XAxis 
                        dataKey="time" 
                        stroke="#d97706"
                        fontSize={11}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        stroke="#d97706" 
                        fontSize={11}
                        domain={[0, 100]}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fffbeb', 
                          border: '1px solid #fde68a',
                          borderRadius: '6px',
                        }}
                        formatter={(value) => [`${value}%`, 'Soil Moisture']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="soilMoisture" 
                        stroke="#f59e0b" 
                        strokeWidth={3}
                        dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, fill: '#d97706' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-2">
                  <span className="text-2xl font-bold text-amber-600">
                    {latestReading ? (parseFloat(latestReading.soilMoisture) * 100).toFixed(0) : '--'}%
                  </span>
                  <p className="text-sm text-amber-600">Current Soil Moisture</p>
                </div>
              </div>

              {/* CO2 Chart */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
                  <div className="w-3 h-3 bg-green-600 rounded-full mr-2" />
                  CO₂ Level Trend
                </h3>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#bbf7d0" />
                      <XAxis 
                        dataKey="time" 
                        stroke="#059669"
                        fontSize={11}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        stroke="#059669" 
                        fontSize={11}
                        domain={['dataMin - 50', 'dataMax + 50']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#f0fdf4', 
                          border: '1px solid #bbf7d0',
                          borderRadius: '6px',
                        }}
                        formatter={(value) => [`${value} ppm`, 'CO₂ Level']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="co2" 
                        stroke="#059669" 
                        strokeWidth={3}
                        dot={{ fill: '#059669', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, fill: '#047857' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-2">
                  <span className="text-2xl font-bold text-green-600">
                    {latestReading ? latestReading.co2Level : '--'} ppm
                  </span>
                  <p className="text-sm text-green-600">Current CO₂ Level</p>
                </div>
              </div>
            </div>

            {/* Current Values Summary */}
            {latestReading && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-600">
                    {parseFloat(latestReading.temperature).toFixed(1)}°C
                  </div>
                  <div className="text-sm text-slate-500">Temperature</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {parseFloat(latestReading.humidity).toFixed(0)}%
                  </div>
                  <div className="text-sm text-slate-500">Humidity</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-yellow-600">
                    {(parseFloat(latestReading.soilMoisture) * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-slate-500">Soil Moisture</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {latestReading.co2Level}ppm
                  </div>
                  <div className="text-sm text-slate-500">CO₂ Level</div>
                </div>
              </div>
            )}

            {/* Chart Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-600 rounded-full" />
                <span className="text-sm text-slate-600">Temperature</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full" />
                <span className="text-sm text-slate-600">Humidity</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-600 rounded-full" />
                <span className="text-sm text-slate-600">Soil Moisture</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-600 rounded-full" />
                <span className="text-sm text-slate-600">CO₂ Level</span>
              </div>
            </div>
          </>
        ) : (
          <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 mb-2">No sensor data available</p>
              <p className="text-sm text-slate-400">
                Start collecting data to see charts and trends
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

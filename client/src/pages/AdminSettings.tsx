import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Settings, 
  Sprout, 
  Droplets, 
  Thermometer, 
  Wind, 
  Lightbulb,
  Save,
  Power,
  AlertTriangle,
  User,
  LogOut
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface Actuator {
  id: number;
  name: string;
  displayName: string;
  isActive: boolean;
  autoMode: boolean;
  lastUpdated: string;
  settings?: any;
}

interface PlantSpecies {
  id: number;
  name: string;
  variety?: string;
  idealRanges: {
    temp: [number, number];
    humidity: [number, number];
    soilMoisture: [number, number];
    co2: [number, number];
  };
  description?: string;
}

interface Setting {
  id: number;
  key: string;
  value: string;
  description?: string;
  lastUpdated: string;
}

export default function AdminSettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [adminUser, setAdminUser] = useState<any>(null);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const user = localStorage.getItem('admin_user');
    
    if (!token || !user) {
      setLocation('/admin');
      return;
    }
    
    setAdminUser(JSON.parse(user));
  }, [setLocation]);

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  // Fetch actuators
  const { data: actuators, isLoading: actuatorsLoading } = useQuery<Actuator[]>({
    queryKey: ['/api/actuators'],
    enabled: !!adminUser,
  });

  // Fetch plant species
  const { data: plantSpecies } = useQuery<PlantSpecies[]>({
    queryKey: ['/api/plants/species'],
    enabled: !!adminUser,
  });

  // Fetch current plant
  const { data: currentPlant } = useQuery({
    queryKey: ['/api/plants/current'],
    enabled: !!adminUser,
  });

  // Fetch system settings
  const { data: settings } = useQuery<Setting[]>({
    queryKey: ['/api/admin/settings'],
    enabled: !!adminUser,
  });

  // Toggle actuator mutation
  const toggleActuatorMutation = useMutation({
    mutationFn: async (actuatorId: number) => {
      const response = await fetch(`/api/actuators/${actuatorId}/toggle`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle actuator');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/actuators'] });
      toast({
        title: "Actuator Updated",
        description: "Actuator state has been changed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle actuator",
        variant: "destructive",
      });
    },
  });

  // Change plant mutation
  const changePlantMutation = useMutation({
    mutationFn: async (speciesId: number) => {
      const response = await fetch('/api/plants/current', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ speciesId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to change plant species');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plants/current'] });
      toast({
        title: "Plant Species Changed",
        description: "Current plant species has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change plant species",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setLocation('/admin');
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  };

  const getActuatorIcon = (name: string) => {
    switch (name) {
      case 'pump': return <Droplets className="h-4 w-4" />;
      case 'vent': return <Wind className="h-4 w-4" />;
      case 'light': return <Lightbulb className="h-4 w-4" />;
      case 'fan': return <Wind className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getActuatorColor = (name: string) => {
    switch (name) {
      case 'pump': return 'text-blue-600';
      case 'vent': return 'text-gray-600';
      case 'light': return 'text-yellow-600';
      case 'fan': return 'text-cyan-600';
      default: return 'text-gray-600';
    }
  };

  if (!adminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="bg-green-600 rounded-lg p-2">
                  <Sprout className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">Green Genesis Admin</h1>
                  <p className="text-sm text-slate-600">System Configuration</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-slate-600" />
                <span className="text-sm text-slate-700">{adminUser.username}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="actuators" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="actuators">Actuator Control</TabsTrigger>
            <TabsTrigger value="plants">Plant Species</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
          </TabsList>

          {/* Actuator Control Tab */}
          <TabsContent value="actuators">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-green-600" />
                    <span>Actuator Controls</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {actuatorsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="animate-pulse">
                          <div className="h-16 bg-slate-200 rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {actuators?.map((actuator) => (
                        <div 
                          key={actuator.id}
                          className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              actuator.isActive ? 'bg-green-100' : 'bg-slate-100'
                            }`}>
                              <div className={getActuatorColor(actuator.name)}>
                                {getActuatorIcon(actuator.name)}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-slate-900">
                                {actuator.displayName}
                              </h4>
                              <div className="flex items-center space-x-2">
                                <Badge variant={actuator.isActive ? "default" : "secondary"}>
                                  {actuator.isActive ? "Active" : "Inactive"}
                                </Badge>
                                {actuator.autoMode && (
                                  <Badge variant="outline" className="text-xs">
                                    Auto Mode
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <Switch
                              checked={actuator.isActive}
                              onCheckedChange={() => toggleActuatorMutation.mutate(actuator.id)}
                              disabled={toggleActuatorMutation.isPending}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {actuators?.filter(a => a.isActive).length || 0}
                      </div>
                      <div className="text-sm text-green-700">Active Actuators</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {actuators?.filter(a => a.autoMode).length || 0}
                      </div>
                      <div className="text-sm text-blue-700">Auto Mode</div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900">Last Updated</h4>
                    {actuators?.map((actuator) => (
                      <div key={actuator.id} className="flex justify-between text-sm">
                        <span className="text-slate-600">{actuator.displayName}</span>
                        <span className="text-slate-500">
                          {new Date(actuator.lastUpdated).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Plant Species Tab */}
          <TabsContent value="plants">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sprout className="h-5 w-5 text-green-600" />
                    <span>Current Plant</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentPlant ? (
                    <div className="space-y-4">
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
                          <h5 className="font-medium text-slate-900">Optimal Conditions</h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-600">Temperature:</span>
                              <span>{currentPlant.species.idealRanges.temp?.[0]}°C - {currentPlant.species.idealRanges.temp?.[1]}°C</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Humidity:</span>
                              <span>{currentPlant.species.idealRanges.humidity?.[0]}% - {currentPlant.species.idealRanges.humidity?.[1]}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Soil Moisture:</span>
                              <span>{currentPlant.species.idealRanges.soilMoisture?.[0]} - {currentPlant.species.idealRanges.soilMoisture?.[1]}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">CO₂:</span>
                              <span>{currentPlant.species.idealRanges.co2?.[0]} - {currentPlant.species.idealRanges.co2?.[1]}ppm</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">No Plant Selected</h3>
                      <p className="text-slate-600">Select a plant species to start monitoring.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Change Plant Species</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="plant-select">Select Plant Species</Label>
                      <Select onValueChange={(value) => changePlantMutation.mutate(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a plant species" />
                        </SelectTrigger>
                        <SelectContent>
                          {plantSpecies?.map((species) => (
                            <SelectItem key={species.id} value={species.id.toString()}>
                              {species.name} {species.variety && `(${species.variety})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {changePlantMutation.isPending && (
                      <div className="text-sm text-blue-600">
                        Updating plant species...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Available Plant Species */}
            <Card>
              <CardHeader>
                <CardTitle>Available Plant Species</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plantSpecies?.map((species) => (
                    <div 
                      key={species.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        currentPlant?.speciesId === species.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => changePlantMutation.mutate(species.id)}
                    >
                      <h4 className="font-medium text-slate-900">{species.name}</h4>
                      {species.variety && (
                        <p className="text-sm text-slate-600">{species.variety}</p>
                      )}
                      {species.description && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                          {species.description}
                        </p>
                      )}
                      {currentPlant?.speciesId === species.id && (
                        <Badge className="mt-2 bg-green-600">Current</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  {settings ? (
                    <div className="space-y-4">
                      {settings.map((setting) => (
                        <div key={setting.id} className="space-y-2">
                          <Label htmlFor={setting.key}>{setting.key}</Label>
                          <Input
                            id={setting.key}
                            value={setting.value}
                            onChange={() => {}}
                            placeholder={setting.description}
                          />
                          <p className="text-xs text-slate-500">
                            Last updated: {new Date(setting.lastUpdated).toLocaleString()}
                          </p>
                        </div>
                      ))}
                      <Button className="w-full mt-4">
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Settings className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600">No system settings found.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">v1.0.0</div>
                      <div className="text-sm text-blue-700">Platform Version</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-lg font-bold text-green-600">Online</div>
                      <div className="text-sm text-green-700">System Status</div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-slate-900">Features</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Real-time sensor monitoring</li>
                      <li>• AI-powered plant health analysis</li>
                      <li>• Automated actuator control</li>
                      <li>• WebSocket live updates</li>
                      <li>• Arduino serial communication</li>
                      <li>• GPT-4 vision integration</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

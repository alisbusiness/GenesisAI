import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Droplets, 
  Wind, 
  Lightbulb, 
  Fan,
  Power,
  Clock,
  Activity,
  Lock
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

export default function ActuatorPanel() {
  const { toast } = useToast();

  // Check if user is authenticated as admin
  const isAdmin = !!localStorage.getItem('admin_token');

  // Fetch actuators
  const { data: actuators, isLoading } = useQuery<Actuator[]>({
    queryKey: ['/api/actuators'],
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  // Toggle actuator mutation (admin only)
  const toggleActuatorMutation = useMutation({
    mutationFn: async (actuatorId: number) => {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Admin authentication required');
      }

      const response = await fetch(`/api/actuators/${actuatorId}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Admin authentication required');
        }
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

  const getActuatorIcon = (name: string) => {
    switch (name) {
      case 'pump': return <Droplets className="h-4 w-4" />;
      case 'vent': return <Wind className="h-4 w-4" />;
      case 'light': return <Lightbulb className="h-4 w-4" />;
      case 'fan': return <Fan className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getActuatorColor = (name: string, isActive: boolean) => {
    if (!isActive) return "text-slate-400";
    
    switch (name) {
      case 'pump': return 'text-blue-600';
      case 'vent': return 'text-gray-600';
      case 'light': return 'text-yellow-600';
      case 'fan': return 'text-cyan-600';
      default: return 'text-slate-600';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-green-600" />
            <span>Actuator Controls</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-slate-600">Auto Mode</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-slate-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : actuators && actuators.length > 0 ? (
          <div className="space-y-4">
            {actuators.map((actuator) => (
              <div 
                key={actuator.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                  actuator.isActive ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    actuator.isActive ? 'bg-white shadow-sm' : 'bg-slate-100'
                  }`}>
                    <div className={getActuatorColor(actuator.name, actuator.isActive)}>
                      {getActuatorIcon(actuator.name)}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">
                      {actuator.displayName}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(actuator.isActive)}
                      >
                        <Activity className="h-3 w-3 mr-1" />
                        {actuator.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {actuator.autoMode && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          Auto
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Last Updated Time */}
                  <div className="text-xs text-slate-500 hidden sm:block">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {new Date(actuator.lastUpdated).toLocaleTimeString()}
                  </div>
                  
                  {/* Toggle Switch */}
                  {isAdmin ? (
                    <Switch
                      checked={actuator.isActive}
                      onCheckedChange={() => toggleActuatorMutation.mutate(actuator.id)}
                      disabled={toggleActuatorMutation.isPending}
                    />
                  ) : (
                    <div className="flex items-center space-x-2 text-slate-400">
                      <Lock className="h-4 w-4" />
                      <span className="text-xs">Admin Only</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Settings className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Actuators Found</h3>
            <p className="text-slate-600">No actuator devices are currently configured.</p>
          </div>
        )}

        {/* System Status Summary */}
        {actuators && actuators.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-xl font-bold text-green-600">
                  {actuators.filter(a => a.isActive).length}
                </div>
                <div className="text-sm text-green-700">Active</div>
              </div>
              <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-xl font-bold text-blue-600">
                  {actuators.filter(a => a.autoMode).length}
                </div>
                <div className="text-sm text-blue-700">Auto Mode</div>
              </div>
            </div>

            {/* Admin Access */}
            {!isAdmin ? (
              <Link href="/admin">
                <Button className="w-full bg-slate-900 hover:bg-slate-800" size="sm">
                  <Lock className="h-4 w-4 mr-2" />
                  Admin Login Required
                </Button>
              </Link>
            ) : (
              <Link href="/admin/settings">
                <Button variant="outline" className="w-full" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Advanced Settings
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

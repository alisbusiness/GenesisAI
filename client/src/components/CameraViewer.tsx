import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Maximize2, RefreshCw, Brain, Archive } from "lucide-react";

interface CameraViewerProps {
  analysis?: {
    id: number;
    timestamp: string;
    healthScore: number;
    summary: string;
    confidence: string;
  };
}

export default function CameraViewer({ analysis }: CameraViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCaptureImage = async () => {
    setIsCapturing(true);
    try {
      // This would interface with the camera API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate capture
      // In reality, this would trigger the /api/health/analyze endpoint
      console.log('Image captured and sent for analysis');
    } catch (error) {
      console.error('Failed to capture image:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="h-5 w-5 text-green-600" />
            <span>Live Camera Feed</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-slate-600">Live</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          {/* Camera Feed - Replace with actual camera stream */}
          <div className="relative bg-slate-900 aspect-video">
            <img 
              src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&h=450" 
              alt="Live greenhouse camera feed" 
              className="w-full h-full object-cover"
            />
            
            {/* Live indicator overlay */}
            <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-medium flex items-center space-x-2">
              <Archive className="h-3 w-3 animate-pulse" />
              <span>LIVE</span>
            </div>
            
            {/* Timestamp overlay */}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm">
              {new Date().toLocaleTimeString()}
            </div>
            
            {/* AI Analysis overlay */}
            {analysis && (
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 max-w-xs">
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-slate-900">AI Analysis</span>
                </div>
                <p className="text-sm text-slate-700 mb-2 line-clamp-2">
                  {analysis.summary}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {analysis.healthScore}% Healthy
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {(parseFloat(analysis.confidence) * 100).toFixed(0)}% confident
                  </span>
                </div>
              </div>
            )}
            
            {/* Plant detection boxes (simulated) */}
            <div className="absolute top-20 right-20 w-24 h-24 border-2 border-green-500 rounded">
              <div className="bg-green-500 text-white text-xs px-1 rounded">Tomato</div>
            </div>
            <div className="absolute bottom-20 left-20 w-20 h-20 border-2 border-blue-500 rounded">
              <div className="bg-blue-500 text-white text-xs px-1 rounded">Leaves</div>
            </div>
          </div>
        </div>
        
        {/* Camera Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                onClick={handleCaptureImage}
                disabled={isCapturing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isCapturing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 mr-2" />
                )}
                {isCapturing ? 'Analyzing...' : 'Capture & Analyze'}
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Feed
              </Button>
            </div>
            
            <div className="text-sm text-slate-500">
              Zone A - Main Growing Area
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

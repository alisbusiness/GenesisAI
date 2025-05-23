import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, Wifi, WifiOff, RefreshCw, Brain } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import plantImage from "@assets/image_1748001658153.png";

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
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraConnected, setCameraConnected] = useState(true);
  const { toast } = useToast();

  // Convert plant image to base64 for AI analysis
  const convertImageToBase64 = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        const base64 = dataURL.split(',')[1];
        resolve(base64);
      };
      img.onerror = reject;
      img.src = plantImage;
    });
  };

  // AI Analysis mutation
  const analyzeImageMutation = useMutation({
    mutationFn: async () => {
      const base64Image = await convertImageToBase64();
      const response = await apiRequest('POST', '/api/health/analyze', {
        imageData: base64Image,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/health/analyze'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/analysis/history'] });
      toast({
        title: "AI Analysis Complete",
        description: "Your plant has been analyzed successfully with AI vision.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze plant image",
        variant: "destructive",
      });
    },
  });

  const handleCapture = () => {
    setIsCapturing(true);
    // Simulate camera capture
    setTimeout(() => {
      setIsCapturing(false);
    }, 2000);
  };

  const handleAIAnalysis = () => {
    analyzeImageMutation.mutate();
  };

  return (
    <Card className="h-full">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="h-5 w-5 text-blue-600" />
            <span>Plant Camera Feed</span>
            <Badge variant={cameraConnected ? "default" : "destructive"} className="text-xs">
              {cameraConnected ? (
                <>
                  <Wifi className="h-3 w-3 mr-1" />
                  Live
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </>
              )}
            </Badge>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCapture}
              disabled={isCapturing}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              {isCapturing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAIAnalysis}
              disabled={analyzeImageMutation.isPending}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              {analyzeImageMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Brain className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="relative">
          {/* Camera Feed Display */}
          <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden relative">
            <img
              src={plantImage}
              alt="Plant Camera Feed"
              className="w-full h-full object-cover"
            />
            
            {/* Camera Status Overlay */}
            <div className="absolute top-2 left-2">
              <Badge variant={cameraConnected ? "default" : "destructive"} className="text-xs">
                {cameraConnected ? "🟢 LIVE" : "🔴 OFFLINE"}
              </Badge>
            </div>

            {/* Timestamp Overlay */}
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="text-xs bg-black/70 text-white">
                {new Date().toLocaleString()}
              </Badge>
            </div>

            {/* Capturing Overlay */}
            {isCapturing && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-2">
                  <Camera className="h-8 w-8 text-blue-600 animate-pulse" />
                  <span className="text-sm font-medium text-blue-600">Capturing...</span>
                </div>
              </div>
            )}
          </div>

          {/* Camera Info */}
          <div className="mt-3 text-center">
            <p className="text-sm text-slate-600">
              📸 Raspberry Pi Camera - Auto-capture enabled for plant chat
            </p>
            {analysis && (
              <p className="text-xs text-green-600 mt-1">
                Last analysis: Health {analysis.healthScore}% • {analysis.confidence} confidence
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
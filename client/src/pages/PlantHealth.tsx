import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { 
  ArrowLeft,
  Camera,
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  FileImage,
  Upload
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AiAnalysis {
  id: number;
  timestamp: string;
  imageUrl?: string;
  healthScore: number;
  summary: string;
  recommendations: Array<{
    title: string;
    description: string;
    priority: string;
  }>;
  issues: Array<{
    type: string;
    description: string;
    severity: string;
  }>;
  confidence: string;
}

export default function PlantHealth() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch latest AI analysis
  const { data: latestAnalysis, isLoading } = useQuery<AiAnalysis>({
    queryKey: ['/api/health/analyze'],
    select: (data: any) => data[0], // Get the latest analysis
  });

  // Fetch analysis history
  const { data: analysisHistory } = useQuery<AiAnalysis[]>({
    queryKey: ['/api/ai/analysis/history'],
  });

  // Analyze image mutation
  const analyzeImageMutation = useMutation({
    mutationFn: async (imageData: string) => {
      const response = await apiRequest('POST', '/api/health/analyze', {
        imageData,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/health/analyze'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/analysis/history'] });
      toast({
        title: "Analysis Complete",
        description: "Your plant has been analyzed successfully.",
      });
      setImageFile(null);
      setImagePreview(null);
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze image",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!imageFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64Data = result.split(',')[1]; // Remove data:image/... prefix
      analyzeImageMutation.mutate(base64Data);
    };
    reader.readAsDataURL(imageFile);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="ml-4">
              <h1 className="text-xl font-semibold text-slate-900">Plant Health Analysis</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image Upload and Analysis */}
          <div className="space-y-6">
            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="h-5 w-5 text-green-600" />
                  <span>Upload Plant Image</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img 
                        src={imagePreview} 
                        alt="Plant preview" 
                        className="max-w-full h-64 object-cover rounded-lg mx-auto"
                      />
                      <div className="flex space-x-2 justify-center">
                        <Button
                          onClick={handleAnalyzeImage}
                          disabled={analyzeImageMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Brain className="h-4 w-4 mr-2" />
                          {analyzeImageMutation.isPending ? 'Analyzing...' : 'Analyze with AI'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <FileImage className="h-12 w-12 text-slate-400 mx-auto" />
                      <div>
                        <h3 className="text-lg font-medium text-slate-900">Upload a plant image</h3>
                        <p className="text-slate-600">Get AI-powered health analysis and recommendations</p>
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="max-w-xs mx-auto"
                      />
                    </div>
                  )}
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">AI-Powered Analysis</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Our GPT-4 Vision model will analyze your plant for health issues, disease detection, 
                        growth assessment, and provide personalized care recommendations.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Latest Analysis Results */}
          <div className="space-y-6">
            {isLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-20 bg-slate-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ) : latestAnalysis ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-5 w-5 text-green-600" />
                      <span>Latest Analysis</span>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Health Score: {latestAnalysis.healthScore}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Health Score */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {latestAnalysis.healthScore}%
                    </div>
                    <p className="text-slate-600">Overall Plant Health</p>
                    <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${latestAnalysis.healthScore}%` }}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Summary */}
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">AI Summary</h4>
                    <p className="text-slate-700 text-sm leading-relaxed">
                      {latestAnalysis.summary}
                    </p>
                  </div>

                  {/* Issues */}
                  {latestAnalysis.issues && latestAnalysis.issues.length > 0 && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-3">Detected Issues</h4>
                      <div className="space-y-2">
                        {latestAnalysis.issues.map((issue, index) => (
                          <div 
                            key={index}
                            className={`p-3 rounded-lg border ${getSeverityColor(issue.severity)}`}
                          >
                            <div className="flex items-start space-x-2">
                              <AlertTriangle className="h-4 w-4 mt-0.5" />
                              <div>
                                <div className="font-medium text-sm">{issue.type}</div>
                                <div className="text-sm">{issue.description}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {latestAnalysis.recommendations && latestAnalysis.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-3">AI Recommendations</h4>
                      <div className="space-y-3">
                        {latestAnalysis.recommendations.map((rec, index) => (
                          <div 
                            key={index}
                            className={`p-3 rounded-lg border ${getPriorityColor(rec.priority)}`}
                          >
                            <div className="flex items-start space-x-2">
                              <TrendingUp className="h-4 w-4 mt-0.5" />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{rec.title}</div>
                                <div className="text-sm mt-1">{rec.description}</div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {rec.priority}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confidence & Timestamp */}
                  <Separator />
                  <div className="flex justify-between items-center text-sm text-slate-500">
                    <span>Confidence: {(parseFloat(latestAnalysis.confidence) * 100).toFixed(0)}%</span>
                    <span>
                      {new Date(latestAnalysis.timestamp).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Brain className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No Analysis Yet</h3>
                  <p className="text-slate-600">
                    Upload a plant image to get started with AI-powered health analysis.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Analysis History */}
        {analysisHistory && analysisHistory.length > 0 && (
          <>
            <Separator className="my-8" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Analysis History</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analysisHistory.map((analysis) => (
                  <Card key={analysis.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {analysis.healthScore}% Health
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(analysis.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-slate-700 mb-3 line-clamp-3">
                        {analysis.summary}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          Confidence: {(parseFloat(analysis.confidence) * 100).toFixed(0)}%
                        </span>
                        <div className="flex items-center space-x-1">
                          {analysis.issues?.length ? (
                            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                              {analysis.issues.length} issues
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              Healthy
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

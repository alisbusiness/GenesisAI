import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Zap
} from "lucide-react";

interface HealthCardProps {
  analysis?: {
    id: number;
    timestamp: string;
    healthScore: number;
    summary: string;
    recommendations?: Array<{
      title: string;
      description: string;
      priority: string;
    }>;
    issues?: Array<{
      type: string;
      description: string;
      severity: string;
    }>;
    confidence: string;
  };
}

export default function HealthCard({ analysis }: HealthCardProps) {
  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return "bg-green-50 border-green-200";
    if (score >= 60) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <CheckCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-green-600" />
            <span>AI Plant Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Brain className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No Analysis Available</h3>
          <p className="text-slate-600 mb-4">
            Capture a plant image to get AI-powered health insights.
          </p>
          <Button className="bg-green-600 hover:bg-green-700">
            <Brain className="h-4 w-4 mr-2" />
            Start Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-green-600" />
            <span>AI Plant Health</span>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            GPT-4 Vision
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Health Score */}
        <div className={`text-center p-4 rounded-lg border ${getHealthBgColor(analysis.healthScore)}`}>
          <div className={`text-3xl font-bold mb-2 ${getHealthColor(analysis.healthScore)}`}>
            {analysis.healthScore}%
          </div>
          <div className="text-sm text-slate-600 mb-3">Overall Plant Health</div>
          <Progress 
            value={analysis.healthScore} 
            className="w-full h-2"
          />
        </div>

        {/* AI Summary */}
        <div>
          <h4 className="flex items-center space-x-2 font-medium text-slate-900 mb-2">
            <Zap className="h-4 w-4 text-green-600" />
            <span>AI Assessment</span>
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg">
            {analysis.summary}
          </p>
        </div>

        {/* Issues */}
        {analysis.issues && analysis.issues.length > 0 && (
          <div>
            <h4 className="flex items-center space-x-2 font-medium text-slate-900 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span>Detected Issues</span>
            </h4>
            <div className="space-y-2">
              {analysis.issues.slice(0, 3).map((issue, index) => (
                <div 
                  key={index}
                  className="flex items-start space-x-2 p-3 bg-slate-50 rounded-lg"
                >
                  {getSeverityIcon(issue.severity)}
                  <div className="flex-1">
                    <div className="font-medium text-sm text-slate-900">{issue.type}</div>
                    <div className="text-sm text-slate-600">{issue.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div>
            <h4 className="flex items-center space-x-2 font-medium text-slate-900 mb-3">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>AI Recommendations</span>
            </h4>
            <div className="space-y-3">
              {analysis.recommendations.slice(0, 2).map((rec, index) => (
                <div 
                  key={index}
                  className="p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-sm text-slate-900">{rec.title}</div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(rec.priority)}`}
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-600">{rec.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Metadata */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-sm text-slate-500">
          <div className="flex items-center space-x-2">
            <Clock className="h-3 w-3" />
            <span>{new Date(analysis.timestamp).toLocaleString()}</span>
          </div>
          <div>
            Confidence: {(parseFloat(analysis.confidence) * 100).toFixed(0)}%
          </div>
        </div>

        {/* Action Button */}
        <Button className="w-full bg-green-600 hover:bg-green-700" size="sm">
          <Brain className="h-4 w-4 mr-2" />
          Run New Analysis
        </Button>
      </CardContent>
    </Card>
  );
}

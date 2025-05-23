import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, 
  User, 
  Send, 
  Camera, 
  Brain,
  MessageCircle,
  Trash2,
  Leaf
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: number;
  timestamp: string;
  message: string;
  response: string;
  isAdmin: boolean;
}

export default function AnalysisChat() {
  const [message, setMessage] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch chat history
  const { data: chatHistory } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/history'],
    refetchInterval: 3000, // Refetch every 3 seconds for real-time updates
  });

  // Clear chat mutation
  const clearChatMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/chat/clear');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/history'] });
      toast({
        title: "Chat cleared!",
        description: "Starting fresh conversation with your plant.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear chat. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Send message with camera snapshot mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      setIsCapturing(true);
      const response = await apiRequest('POST', '/api/chat/plant', {
        message: messageText,
        captureImage: true, // Automatically capture from camera
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/history'] });
      setMessage("");
      setIsCapturing(false);
      scrollToBottom();
      toast({
        title: "Question sent!",
        description: "Taking snapshot and analyzing with AI...",
      });
    },
    onError: (error: any) => {
      setIsCapturing(false);
      toast({
        title: "Chat Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const handleClearChat = () => {
    clearChatMutation.mutate();
  };

  const quickQuestions = [
    "How is my plant looking today?",
    "What can I do to help it grow better?",
    "Are there any health issues I should know about?",
    "What's the best care routine for this plant?",
    "How often should I water it?"
  ];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Leaf className="h-5 w-5 text-green-600" />
            <span>Plant Chat Assistant</span>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              📸 Camera Enabled
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {chatHistory?.length || 0} messages
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              disabled={clearChatMutation.isPending}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4">
        {/* Chat Messages */}
        <ScrollArea className="flex-1 mb-4 max-h-[400px]">
          <div className="space-y-4">
            {chatHistory && chatHistory.length > 0 ? (
              chatHistory.map((chat) => (
                <div key={chat.id} className="space-y-3">
                  {/* User Message */}
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 flex-1">
                      <p className="text-sm">{chat.message}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(chat.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Leaf className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 flex-1">
                      <p className="text-sm whitespace-pre-wrap">{chat.response}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <Camera className="h-8 w-8 text-green-300" />
                  <Leaf className="h-12 w-12 text-slate-300" />
                </div>
                <p className="text-slate-500">Chat with your plant using AI vision!</p>
                <p className="text-xs text-slate-400 mt-1">Each question automatically captures a photo for analysis.</p>
              </div>
            )}

            {/* Loading State with Camera Capture */}
            {(sendMessageMutation.isPending || isCapturing) && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Camera className="h-4 w-4 text-green-600 animate-pulse" />
                </div>
                <div className="bg-slate-100 rounded-lg p-3 flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="text-sm text-slate-500 ml-2">
                      {isCapturing ? "Capturing plant photo..." : "AI analyzing image..."}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Chat Input */}
        <form onSubmit={handleSendMessage} className="space-y-3">
          <div className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask your plant a question..."
              disabled={sendMessageMutation.isPending || isCapturing}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!message.trim() || sendMessageMutation.isPending || isCapturing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCapturing ? (
                <Camera className="h-4 w-4 animate-pulse" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Quick Questions */}
          <div>
            <p className="text-sm text-slate-600 mb-2">Ask your plant:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setMessage(question)}
                  disabled={sendMessageMutation.isPending || isCapturing}
                  className="text-xs hover:bg-green-50 hover:border-green-200"
                >
                  <Camera className="h-3 w-3 mr-1" />
                  {question}
                </Button>
              ))}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
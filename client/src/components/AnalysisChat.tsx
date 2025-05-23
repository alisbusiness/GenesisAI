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
  Mic, 
  Brain,
  MessageCircle,
  Zap
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
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch chat history
  const { data: chatHistory } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/history'],
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const response = await apiRequest('POST', '/api/chat', {
        message: messageText,
        isAdmin: false,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/history'] });
      setMessage("");
      scrollToBottom();
    },
    onError: (error: any) => {
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

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast({
          title: "Voice Recognition Error",
          description: "Could not process voice input. Please try again.",
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      toast({
        title: "Voice Input Not Supported",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive",
      });
    }
  };

  const quickQuestions = [
    "What's the optimal watering schedule?",
    "How can I improve plant growth?",
    "Are there any disease symptoms?",
    "What nutrients does my plant need?",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-green-600" />
            <span>AI Plant Assistant</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              GPT-4 Powered
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Messages */}
        <ScrollArea className="h-64 w-full border border-slate-200 rounded-lg p-4">
          <div className="space-y-4">
            {/* Welcome message */}
            {(!chatHistory || chatHistory.length === 0) && (
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                  <Brain className="h-4 w-4 text-green-600" />
                </div>
                <div className="bg-slate-100 rounded-lg p-3 flex-1">
                  <p className="text-sm text-slate-900">
                    Hello! I'm your AI farming assistant. I can help you analyze your plant health, 
                    recommend optimal growing conditions, and answer questions about your crops. 
                    What would you like to know?
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Just now</p>
                </div>
              </div>
            )}

            {/* Chat History */}
            {chatHistory?.slice().reverse().map((chat) => (
              <div key={chat.id} className="space-y-3">
                {/* User Message */}
                <div className="flex items-start space-x-3 justify-end">
                  <div className="bg-green-600 rounded-lg p-3 max-w-xs">
                    <p className="text-sm text-white">{chat.message}</p>
                    <p className="text-xs text-green-100 mt-1">
                      {new Date(chat.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="bg-slate-200 p-2 rounded-full flex-shrink-0">
                    <User className="h-4 w-4 text-slate-600" />
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                    <Brain className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="bg-slate-100 rounded-lg p-3 flex-1">
                    <p className="text-sm text-slate-900">{chat.response}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(chat.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {sendMessageMutation.isPending && (
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                  <Brain className="h-4 w-4 text-green-600 animate-pulse" />
                </div>
                <div className="bg-slate-100 rounded-lg p-3 flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="text-sm text-slate-500 ml-2">AI is thinking...</span>
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
              placeholder="Ask about your plants..."
              disabled={sendMessageMutation.isPending}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleVoiceInput}
              disabled={isListening || sendMessageMutation.isPending}
              className={isListening ? "bg-red-50 border-red-200" : ""}
            >
              <Mic className={`h-4 w-4 ${isListening ? 'text-red-600 animate-pulse' : ''}`} />
            </Button>
          </div>

          {/* Quick Questions */}
          <div>
            <p className="text-sm text-slate-600 mb-2">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setMessage(question)}
                  disabled={sendMessageMutation.isPending}
                  className="text-xs h-7"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        </form>

        {/* AI Features Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-3">
            <Zap className="h-4 w-4 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 text-sm">AI-Powered Assistance</h4>
              <p className="text-sm text-blue-700 mt-1">
                Get expert advice on plant care, disease diagnosis, environmental optimization, 
                and growth strategies powered by advanced AI.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

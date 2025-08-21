import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Send, 
  Settings, 
  Plus, 
  MessageSquare,
  Calendar,
  Mail,
  FileText,
  Github,
  Slack,
  Search,
  Zap,
  Bot
} from 'lucide-react';
import { useGuestAuth } from '@/hooks/useGuestAuth';
import { IntegrationsPanel } from '@/components/IntegrationsPanel';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  tools?: string[];
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isGuest, guestName, guestId } = useGuestAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Initialize with welcome message if no messages
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        content: `Hello${isGuest ? ` ${guestName}` : ''}! I'm Slashy, your AI assistant. I can help you with tasks across different applications. What would you like to do today?`,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isGuest, guestName, messages.length]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('chat-with-composio', {
        body: {
          message: userMessage.content,
          chatId: currentChatId,
          guestId: isGuest ? guestId : undefined,
          userId: !isGuest ? undefined : undefined, // TODO: Add user auth
          integrations: selectedIntegrations
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to get response');
      }

      const { response: aiResponse, chatId, tools = [] } = response.data;

      // Update current chat ID if it was created
      if (chatId && !currentChatId) {
        setCurrentChatId(chatId);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date(),
        tools: tools.length > 0 ? tools : undefined
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-screen bg-gradient-background">
      {/* Sidebar */}
      <div className="w-80 bg-card/20 backdrop-blur-sm border-r border-border/30 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Conversations</h2>
            <Button variant="outline" size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Active Chat */}
          <Card className="p-3 bg-primary/10 border-primary/20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">Current Chat</p>
                <p className="text-sm text-muted-foreground">Active conversation</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="p-6 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Quick Actions</h3>
          
          <div className="space-y-2">
            {[
              { icon: Mail, label: "Send Email", color: "text-red-400" },
              { icon: Calendar, label: "Schedule Meeting", color: "text-blue-400" },
              { icon: FileText, label: "Create Document", color: "text-green-400" },
              { icon: Github, label: "Check GitHub", color: "text-purple-400" }
            ].map(item => (
              <Button
                key={item.label}
                variant="ghost"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => setInputValue(item.label)}
              >
                <item.icon className={`w-4 h-4 mr-3 ${item.color}`} />
                <span>{item.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <header className="h-16 border-b border-border/30 bg-card/10 backdrop-blur-sm flex items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">S</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold">Slashy</h1>
              <p className="text-sm text-muted-foreground">
                {selectedIntegrations.length > 0 
                  ? `Connected to ${selectedIntegrations.length} app${selectedIntegrations.length === 1 ? '' : 's'}`
                  : 'AI Assistant'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Integrations
                  {selectedIntegrations.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedIntegrations.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px] sm:w-[500px]">
                <SheetHeader>
                  <SheetTitle>Manage Integrations</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <IntegrationsPanel 
                    selectedIntegrations={selectedIntegrations}
                    onIntegrationsChange={setSelectedIntegrations}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className="flex items-start space-x-3">
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    
                    <Card className={`p-4 ${message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-card/50 backdrop-blur-sm'
                    }`}>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">
                          {formatTime(message.timestamp)}
                        </div>
                        <div className="prose prose-sm max-w-none">
                          {message.content}
                        </div>
                        {message.tools && message.tools.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            <span className="text-xs text-muted-foreground mr-2">Used tools:</span>
                            {message.tools.map(tool => (
                              <Badge key={tool} variant="outline" className="text-xs">
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                    
                    {message.role === 'user' && (
                      <div className="w-8 h-8 bg-muted/50 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-sm font-medium">
                          {isGuest ? guestName?.[0]?.toUpperCase() || 'G' : 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                  <Card className="p-4 bg-card/50 backdrop-blur-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-primary/40 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </Card>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border/30 bg-card/10 backdrop-blur-sm p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="min-h-[60px] py-4 text-lg resize-none"
                  disabled={isLoading}
                />
              </div>
              
              <Button 
                onClick={sendMessage} 
                disabled={!inputValue.trim() || isLoading}
                size="lg"
                className="h-[60px] px-6"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            
            {selectedIntegrations.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-sm text-muted-foreground">Active integrations:</span>
                {selectedIntegrations.map(integration => (
                  <Badge key={integration} variant="secondary" className="text-xs">
                    {integration}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
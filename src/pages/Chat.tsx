import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Paperclip, Zap, Search, Mail, Calendar, FileText, Users } from "lucide-react";

export default function Chat() {
  const [message, setMessage] = useState("");

  const sidebarItems = [
    { icon: Zap, label: "Dashboard", active: false },
    { icon: Search, label: "Search", active: false },
    { icon: Zap, label: "Workflows", active: true },
  ];

  const categories = [
    "Featured", "Sales", "Marketing", "Engineering", 
    "HR", "Ops", "Productivity", "Personal"
  ];

  const integrationIcons = [
    { name: "Gmail", icon: "G", color: "bg-red-500" },
    { name: "Outlook", icon: "O", color: "bg-blue-600" },
    { name: "Slack", icon: "S", color: "bg-purple-600" },
    { name: "Notion", icon: "N", color: "bg-gray-700" },
    { name: "Calendar", icon: "C", color: "bg-blue-500" },
    { name: "HubSpot", icon: "H", color: "bg-orange-500" },
    { name: "GitHub", icon: "G", color: "bg-gray-900" },
    { name: "Zoom", icon: "Z", color: "bg-blue-600" },
    { name: "Trello", icon: "T", color: "bg-blue-500" },
    { name: "Airtable", icon: "A", color: "bg-yellow-600" },
    { name: "Linear", icon: "L", color: "bg-purple-600" },
    { name: "Figma", icon: "F", color: "bg-pink-500" }
  ];

  return (
    <div className="flex h-screen bg-gradient-background">
      {/* Sidebar */}
      <div className="w-16 bg-card/20 backdrop-blur-sm border-r border-border/30 flex flex-col items-center py-6 space-y-6">
        {/* Logo */}
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm"></div>
          </div>
        </div>

        {/* Sidebar Items */}
        <div className="flex flex-col space-y-4">
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              className={`p-3 rounded-lg transition-all ${
                item.active 
                  ? "bg-primary text-primary-foreground shadow-glow" 
                  : "text-muted-foreground hover:text-foreground hover:bg-card/30"
              }`}
            >
              <item.icon className="w-5 h-5" />
            </button>
          ))}
        </div>

        {/* Bottom Items */}
        <div className="flex-1 flex flex-col justify-end space-y-4">
          <button className="p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/30 transition-all">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/30 transition-all">
            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-primary-foreground">A</span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border/30 bg-card/10 backdrop-blur-sm flex items-center justify-between px-8">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold">Slashy</span>
          </div>
          
          <div className="flex items-center space-x-8">
            <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Workflows</span>
            <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Integrations</span>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-primary-foreground">A</span>
            </div>
          </div>
        </header>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col items-center justify-center px-8 py-16">
          <div className="max-w-4xl w-full text-center">
            {/* Main Heading */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
              Words to actions{" "}
              <span className="gradient-text-primary">in seconds</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-16 max-w-3xl mx-auto leading-relaxed">
              Slashy is your AI agent for Gmail, Calendar, Notion, and more
            </p>

            {/* Chat Input Container */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="bg-gradient-card border border-border/30 rounded-3xl shadow-card backdrop-blur-sm overflow-hidden">
                {/* Input Area */}
                <div className="p-8">
                  <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    
                    <div className="flex-1">
                      <Input
                        placeholder="How can Slashy help you today . . ."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="border-0 bg-transparent text-lg placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-4"
                      />
                    </div>
                    
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                      <Mic className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                
                {/* Connect Tools Section */}
                <div className="px-8 pb-8 pt-4 border-t border-border/30">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-sm text-muted-foreground font-medium">Connect your tools to Slashy</span>
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                      →
                    </Button>
                  </div>
                  
                  {/* Integration Icons Grid */}
                  <div className="grid grid-cols-12 gap-3 max-w-2xl mx-auto">
                    {integrationIcons.map((integration, index) => (
                      <div
                        key={integration.name}
                        className={`${integration.color} w-10 h-10 rounded-lg flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-lg`}
                        title={integration.name}
                      >
                        <span className="text-white text-sm font-bold">
                          {integration.icon}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category, index) => (
                <Button
                  key={category}
                  variant={index === 0 ? "default" : "ghost"}
                  size="sm"
                  className={`rounded-full px-6 py-3 transition-all font-medium ${
                    index === 0 
                      ? "bg-primary text-primary-foreground shadow-lg hover:shadow-glow" 
                      : "text-muted-foreground hover:text-foreground hover:bg-card/30 border border-border/30"
                  }`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
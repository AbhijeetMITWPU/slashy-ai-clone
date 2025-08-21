import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Paperclip } from "lucide-react";

export default function Chat() {
  const [message, setMessage] = useState("");

  const categories = [
    "Featured", "Sales", "Marketing", "Engineering", 
    "HR", "Ops", "Productivity", "Personal"
  ];

  const integrationIcons = [
    { name: "Gmail", color: "bg-red-500" },
    { name: "Outlook", color: "bg-blue-500" },
    { name: "Slack", color: "bg-purple-500" },
    { name: "Notion", color: "bg-gray-600" },
    { name: "Calendly", color: "bg-blue-400" },
    { name: "HubSpot", color: "bg-orange-500" },
    { name: "GitHub", color: "bg-gray-800" },
    { name: "Zoom", color: "bg-blue-600" },
    { name: "Trello", color: "bg-blue-500" },
    { name: "Airtable", color: "bg-yellow-500" },
    { name: "Linear", color: "bg-purple-600" },
    { name: "Figma", color: "bg-red-400" }
  ];

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="border-b border-border/20 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-primary rounded-sm"></div>
              <span className="text-xl font-semibold">Slashy</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <span className="text-muted-foreground">Workflows</span>
              <span className="text-muted-foreground">Integrations</span>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold">A</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Words to actions{" "}
            <span className="gradient-text-primary">in seconds</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-16 max-w-2xl mx-auto">
            Slashy is your AI agent for Gmail, Calendar, Notion, and more
          </p>

          {/* Chat Input */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="relative bg-gradient-card border border-border/30 rounded-2xl p-6 shadow-card backdrop-blur-sm">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <Paperclip className="h-5 w-5" />
                </Button>
                
                <div className="flex-1">
                  <Input
                    placeholder="How can Slashy help you today . . ."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="border-0 bg-transparent text-lg placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <Mic className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Connect Tools Section */}
              <div className="mt-6 pt-6 border-t border-border/30">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Connect your tools to Slashy</span>
                </div>
                
                {/* Integration Icons */}
                <div className="flex items-center justify-center space-x-3 overflow-x-auto pb-2">
                  {integrationIcons.map((integration, index) => (
                    <div
                      key={integration.name}
                      className={`w-8 h-8 ${integration.color} rounded-sm flex-shrink-0 flex items-center justify-center`}
                      title={integration.name}
                    >
                      <span className="text-white text-xs font-bold">
                        {integration.name.charAt(0)}
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
                variant={index === 0 ? "default" : "outline"}
                size="sm"
                className={`rounded-full px-6 py-2 transition-all ${
                  index === 0 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-card/30 backdrop-blur-sm border-border/50 hover:bg-card/50"
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
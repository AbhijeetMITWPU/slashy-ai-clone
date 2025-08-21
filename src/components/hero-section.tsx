import { Button } from "./ui/button";
import { Link } from "react-router-dom";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 py-20">
      <div className="absolute inset-0 bg-gradient-background opacity-90"></div>
      
      <div className="relative z-10 text-center max-w-5xl mx-auto">
        {/* Y Combinator Badge */}
        <div className="inline-flex items-center space-x-2 bg-card/50 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-border/50">
          <span className="text-sm text-muted-foreground">Backed by</span>
          <div className="w-6 h-6 bg-orange-500 rounded-sm flex items-center justify-center">
            <span className="text-white text-xs font-bold">Y</span>
          </div>
          <span className="text-sm font-medium">Combinator</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
          The AI for Work
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
          Slashy connects to all your tools to complete entire tasks.
        </p>

        {/* CTA Button */}
        <Button 
          variant="default" 
          size="lg" 
          className="mb-12 bg-white text-black hover:bg-gray-100 text-lg px-8 py-4 rounded-full shadow-glow"
          asChild
        >
          <Link to="/chat" className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-red-500 rounded-sm flex items-center justify-center">
              <span className="text-white text-xs font-bold">G</span>
            </div>
            <span>Start now</span>
          </Link>
        </Button>

        {/* Category Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {["Meetings", "Workflow", "Search", "Gmail", "Notion", "Leads"].map((category) => (
            <div
              key={category}
              className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-full px-4 py-2 text-sm font-medium hover:bg-card/50 transition-all cursor-pointer"
            >
              {category}
            </div>
          ))}
        </div>

        {/* Demo Card */}
        <div className="bg-gradient-card border border-border/30 rounded-2xl p-8 max-w-2xl mx-auto shadow-card backdrop-blur-sm">
          <div className="text-left">
            <h3 className="text-2xl font-semibold mb-6">
              Can you prepare me for my next meeting
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border/30">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">1 Calendar Events</span>
                  <span className="text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded">Complete</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border/30">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Web Search Results</span>
                  <span className="text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded">Complete</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border/30">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">People Enrichment</span>
                  <span className="text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded">Complete</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border/30">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Meeting Preparation - Charu Thomas (Enterprise Integration)</span>
                  <span className="text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded">Complete</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 mt-6">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
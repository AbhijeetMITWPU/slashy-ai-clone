import { Button } from "./button";
import { Link } from "react-router-dom";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-primary rounded-sm"></div>
              <span className="text-xl font-semibold">Slashy</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Use Cases
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Enterprise
            </a>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="secondary" size="sm">
              Book a demo
            </Button>
            <Button variant="default" size="sm" asChild>
              <Link to="/chat">Start now</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
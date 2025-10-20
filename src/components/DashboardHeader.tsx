import { Button } from "@/components/ui/button";
import { Sparkles, User, Settings } from "lucide-react";

const DashboardHeader = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Sora Studio</h1>
            <p className="text-xs text-muted-foreground">AI Video Generation</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="hero" size="icon">
            <User className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;

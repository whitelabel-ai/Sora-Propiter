import { Play, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VideoCardProps {
  id: string;
  prompt: string;
  thumbnailUrl: string;
  duration: string;
  resolution: string;
  createdAt: string;
  category: string;
  onClick: () => void;
}

const VideoCard = ({ 
  prompt, 
  thumbnailUrl, 
  duration, 
  resolution, 
  createdAt,
  category,
  onClick 
}: VideoCardProps) => {
  return (
    <div 
      onClick={onClick}
      className="group bg-card shadow-card rounded-lg overflow-hidden cursor-pointer transition-smooth hover:shadow-glow hover:scale-[1.02]"
    >
      <div className="relative aspect-video bg-secondary/50 overflow-hidden">
        <img 
          src={thumbnailUrl} 
          alt={prompt}
          className="w-full h-full object-cover transition-smooth group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth">
          <div className="w-12 h-12 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-6 h-6 text-primary-foreground ml-1" />
          </div>
        </div>
        <div className="absolute top-2 right-2 flex gap-2">
          <Badge variant="secondary" className="text-xs">
            {duration}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {resolution}
          </Badge>
        </div>
      </div>
      
      <div className="p-3 space-y-2">
        <p className="text-sm font-medium line-clamp-2">{prompt}</p>
        {category && (
          <Badge variant="outline" className="text-xs">
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Badge>
        )}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{createdAt}</p>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreVertical className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;

import { Play, Download, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoPreviewProps {
  videoUrl?: string;
  isGenerating: boolean;
  progress?: number;
}

const VideoPreview = ({ videoUrl, isGenerating, progress = 0 }: VideoPreviewProps) => {
  return (
    <div className="bg-card shadow-card rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Vista Previa</h2>
        {videoUrl && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="relative aspect-video bg-secondary/50 rounded-lg overflow-hidden">
        {isGenerating ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div className="absolute inset-0 blur-xl opacity-50 bg-primary animate-pulse" />
            </div>
            <div className="space-y-2 text-center">
              <p className="text-sm font-medium">Generando tu video...</p>
              <p className="text-xs text-muted-foreground">Esto puede tomar unos minutos</p>
              <div className="w-64 h-2 bg-secondary rounded-full overflow-hidden mx-auto">
                <div 
                  className="h-full gradient-primary transition-smooth"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{progress}%</p>
            </div>
          </div>
        ) : videoUrl ? (
          <div className="relative group">
            <video 
              src={videoUrl} 
              className="w-full h-full object-cover"
              controls
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
              <Button variant="gradient" size="lg" className="gap-2">
                <Play className="w-5 h-5" />
                Reproducir
              </Button>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="w-16 h-16 rounded-full gradient-glow flex items-center justify-center">
              <Play className="w-8 h-8" />
            </div>
            <p className="text-sm">Tu video aparecerá aquí</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPreview;

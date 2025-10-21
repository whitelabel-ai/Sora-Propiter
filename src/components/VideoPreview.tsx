import { Play, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface VideoPreviewProps {
  videoUrl?: string;
  isGenerating: boolean;
  progress?: number;
  prompt?: string;
}

const VideoPreview = ({ videoUrl, isGenerating, progress = 0, prompt }: VideoPreviewProps) => {
  const { toast } = useToast();

  const handleDownload = () => {
    if (!videoUrl) return;
    
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `sora-video-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Descargando video",
      description: "Tu video se está descargando.",
    });
  };

  return (
    <div className="bg-card shadow-card rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Vista Previa</h2>
        {videoUrl && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleDownload} title="Descargar video">
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
          <video 
            src={videoUrl} 
            className="w-full h-full object-cover"
            controls
            controlsList="nodownload"
            playsInline
          />
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

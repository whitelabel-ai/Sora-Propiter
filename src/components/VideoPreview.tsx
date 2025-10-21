import { Play, Download, Loader2, Trash2, Eye, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface VideoPreviewProps {
  videoUrl?: string;
  isGenerating: boolean;
  progress?: number;
  prompt?: string;
  onDelete?: () => void;
  onRegenerate?: () => void;
  onUpgrade?: () => void;
  canUpgrade?: boolean;
}

const VideoPreview = ({ 
  videoUrl, 
  isGenerating, 
  progress = 0, 
  prompt,
  onDelete,
  onRegenerate,
  onUpgrade,
  canUpgrade = false
}: VideoPreviewProps) => {
  const { toast } = useToast();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleDownload = async () => {
    if (!videoUrl) return;
    
    try {
      // Fetch the video as a blob
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch video');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `sora-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Video descargado",
        description: "Tu video se ha descargado exitosamente.",
      });
    } catch (error) {
      console.error('Error downloading video:', error);
      toast({
        title: "Error al descargar",
        description: "No se pudo descargar el video. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      toast({
        title: "Video eliminado",
        description: "El video ha sido eliminado correctamente.",
      });
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate();
      toast({
        title: "Regenerando video",
        description: "Se está generando una nueva versión del video.",
      });
    }
  };

  return (
    <>
      <div className="bg-card shadow-card rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Vista Previa</h2>
          {videoUrl && (
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleFullscreen} 
                title="Ver en pantalla completa"
                className="hover:bg-primary/10"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDownload} 
                title="Descargar video"
                className="hover:bg-green-500/10 hover:text-green-600"
              >
                <Download className="w-4 h-4" />
              </Button>
              {onRegenerate && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRegenerate} 
                  title="Regenerar video"
                  className="hover:bg-blue-500/10 hover:text-blue-600"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
              {canUpgrade && onUpgrade && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onUpgrade} 
                  title="Mejorar con Sora Pro"
                  className="hover:bg-purple-500/10 hover:text-purple-600"
                >
                  <Sparkles className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleDelete} 
                  title="Eliminar video"
                  className="hover:bg-red-500/10 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="relative min-h-[400px] bg-secondary/50 rounded-lg overflow-hidden flex items-center justify-center">
          {isGenerating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-background/95 backdrop-blur-md">
              {/* Animated loader icon */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-secondary animate-pulse shadow-lg flex items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-primary-foreground" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping"></div>
              </div>
              
              {/* Progress content */}
              <div className="space-y-4 text-center max-w-sm">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Generando tu video</h3>
                  <p className="text-sm text-muted-foreground">
                    Nuestros algoritmos están creando tu video personalizado...
                  </p>
                </div>
                
                {/* Enhanced progress bar */}
                <div className="space-y-3">
                  <div className="relative w-80 h-3 bg-secondary/50 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-primary via-primary/80 to-secondary rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                      style={{ width: `${Math.max(progress, 5)}%` }}
                    >
                      {/* Animated shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Progress text and percentage */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      {progress < 25 ? 'Iniciando...' : 
                       progress < 50 ? 'Procesando...' : 
                       progress < 75 ? 'Renderizando...' : 
                       progress < 95 ? 'Finalizando...' : 'Casi listo...'}
                    </span>
                    <span className="font-medium text-primary">{progress}%</span>
                  </div>
                </div>
                
                {/* Estimated time */}
                <p className="text-xs text-muted-foreground">
                  Tiempo estimado: {progress < 50 ? '2-3 minutos' : progress < 80 ? '1-2 minutos' : 'Menos de 1 minuto'}
                </p>
              </div>
            </div>
          ) : videoUrl ? (
            <video 
              src={videoUrl} 
              className="max-w-full max-h-[600px] object-contain rounded-lg shadow-lg"
              controls
              controlsList="nodownload"
              playsInline
              style={{
                filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.1))'
              }}
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

        {prompt && videoUrl && (
          <div className="bg-secondary/30 rounded-lg p-4 border-l-4 border-primary">
            <p className="text-xs text-muted-foreground mb-1">Prompt utilizado:</p>
            <p className="text-sm">{prompt}</p>
          </div>
        )}
      </div>

      {/* Modal de pantalla completa */}
      {isFullscreen && videoUrl && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={handleFullscreen}
        >
          <div className="relative max-w-full max-h-full">
            <video 
              src={videoUrl} 
              className="max-w-full max-h-full object-contain"
              controls
              autoPlay
              playsInline
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFullscreen}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoPreview;

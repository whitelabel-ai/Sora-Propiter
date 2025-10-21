import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, Download, Copy, ChevronDown, ChevronUp, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useVideoUrl } from '@/hooks/use-video-url';
import { useVideoError } from '@/hooks/use-video-error';
import { usePromptCollapse } from '@/hooks/use-prompt-collapse';

interface VideoPreviewProps {
  isOpen?: boolean;
  onClose: () => void;
  videoUrl?: string | null;
  prompt?: string;
  onDelete?: () => void;
  isGenerating?: boolean;
  progress?: number;
  onRegenerate?: () => void;
  onUpgrade?: () => void;
  isModal?: boolean;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ 
  isOpen = true, 
  onClose, 
  videoUrl, 
  prompt,
  onDelete,
  isGenerating = false,
  progress = 0,
  onRegenerate,
  onUpgrade,
  isModal = false
}) => {
  // Estados locales
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Custom hooks
  const { 
    url: processedVideoUrl,
    isLoading: isUrlLoading,
    error: urlError,
    refreshUrl 
  } = useVideoUrl(videoUrl);
  
  const { 
    error: videoError,
    hasError, 
    handleVideoError, 
    clearError 
  } = useVideoError();
  
  const { 
    isExpanded, 
    toggle
  } = usePromptCollapse(false);
  
  // Log para debugging
  useEffect(() => {
    console.log('VideoURL original:', videoUrl);
    console.log('VideoURL procesada:', processedVideoUrl);
  }, [videoUrl, processedVideoUrl]);

  /**
   * Descarga el video
   */
  const handleDownload = useCallback(async () => {
    if (!processedVideoUrl) {
      toast.error('No hay video para descargar');
      return;
    }

    try {
      const response = await fetch(processedVideoUrl);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Video descargado exitosamente');
    } catch (error) {
      console.error('Error al descargar video:', error);
      toast.error('Error al descargar el video');
    }
  }, [processedVideoUrl]);

  /**
   * Maneja la carga exitosa del video
   */
  const handleVideoLoad = useCallback(() => {
    console.log('Video cargado exitosamente:', processedVideoUrl);
    clearError();
  }, [processedVideoUrl, clearError]);

  /**
   * Maneja errores de carga del video
   */
  const handleVideoErrorEvent = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.target as HTMLVideoElement;
    let errorMessage = 'Error desconocido';
    
    if (video.error) {
      switch (video.error.code) {
        case video.error.MEDIA_ERR_ABORTED:
          errorMessage = 'Carga de video abortada por el usuario';
          break;
        case video.error.MEDIA_ERR_NETWORK:
          errorMessage = 'Error de red al cargar el video';
          break;
        case video.error.MEDIA_ERR_DECODE:
          errorMessage = 'Error al decodificar el video';
          break;
        case video.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Formato de video no soportado';
          break;
        default:
          errorMessage = `Error de video (código: ${video.error.code})`;
      }
    }
    
    // Logs detallados para debugging
    console.error('Error de video:', {
      videoUrl,
      errorCode: video.error?.code,
      errorMessage,
      networkState: video.networkState,
      readyState: video.readyState,
      currentSrc: video.currentSrc,
      videoElement: video
    });
    
    handleVideoError(event.nativeEvent);
    
    toast.error(errorMessage);
  }, [videoUrl, handleVideoError]);

  /**
   * Maneja el inicio de carga del video
   */
  const handleVideoLoadStart = useCallback(() => {
    console.log('Video load start');
    clearError();
  }, [clearError]);

  /**
   * Maneja cuando el video puede empezar a reproducirse
   */
  const handleVideoCanPlay = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    console.log('Video can play');
    // Reproducir automáticamente el video cuando esté listo
    const video = event.currentTarget;
    video.play().catch(error => {
      console.log('Autoplay prevented by browser:', error);
      // El navegador puede bloquear el autoplay, esto es normal
    });
  }, []);

  /**
   * Reintenta cargar el video
   */
  const retryVideoLoad = useCallback(async () => {
    console.log('Reintentando cargar video...');
    clearError();
    
    // Refrescar la URL del video
    await refreshUrl();
    
    // Forzar recarga del video
    const videoElements = document.querySelectorAll('video');
    videoElements.forEach(video => {
      video.load();
    });
  }, [clearError, refreshUrl]);

  /**
   * Copia el prompt al portapapeles
   */
  const handleCopyPrompt = useCallback(async () => {
    if (!prompt) {
      toast.error('No hay prompt para copiar');
      return;
    }

    try {
      await navigator.clipboard.writeText(prompt);
      toast.success('Prompt copiado al portapapeles');
    } catch (error) {
      console.error('Error al copiar prompt:', error);
      toast.error('Error al copiar el prompt');
    }
  }, [prompt]);



  /**
   * Alterna el modo pantalla completa
   */
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  /**
   * Maneja el cierre del modal
   */
  const handleClose = useCallback(() => {
    clearError();
    if (onClose) {
      onClose();
    }
  }, [clearError, onClose]);

  /**
   * Renderiza el componente de error
   */
  const renderError = () => {
    if (!hasError && !urlError) return null;

    const errorMessage = videoError?.message || urlError || 'Error desconocido';

    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-red-600">Error al cargar el video</h3>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
        </div>
        <Button onClick={retryVideoLoad} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </Button>
      </div>
    );
  };

  /**
   * Renderiza el componente de carga
   */
  const renderLoading = () => {
    if (!isUrlLoading) return null;

    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-secondary animate-pulse flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Cargando video...</p>
      </div>
    );
  };

  /**
   * Renderiza el elemento de video
   */
  const renderVideo = () => {
    if (hasError || urlError || isUrlLoading || !processedVideoUrl) return null;

    return (
      <video
        src={processedVideoUrl}
        controls
        autoPlay
        loop
        className="w-full h-full object-contain"
        onLoadStart={handleVideoLoadStart}
        onCanPlay={handleVideoCanPlay}
        onLoadedData={handleVideoLoad}
        onError={handleVideoErrorEvent}
        preload="metadata"
      >
        Tu navegador no soporta el elemento de video.
      </video>
    );
  };

  /**
   * Renderiza la sección del prompt
   */
  const renderPrompt = () => {
    if (!prompt?.trim()) return null;

    return (
      <div className="border-t pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <Button
            variant="modern-ghost"
            onClick={toggle}
            className="flex items-center gap-2 text-sm font-medium"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Ocultar prompt
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Ver prompt
              </>
            )}
          </Button>
        </div>
        
        {isExpanded && (
          <div className="space-y-3">
            <div className="relative bg-muted/50 rounded-lg border">
              {/* Botón de copiar en la esquina superior derecha */}
              <div className="absolute top-3 right-3 z-10">
                <Button
                  variant="modern-ghost"
                  size="sm"
                  onClick={handleCopyPrompt}
                  className="h-8 w-8 p-0 backdrop-blur-sm"
                  title="Copiar prompt"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Área de texto con scroll personalizado */}
              <div className="max-h-48 overflow-y-auto p-4 pr-12 custom-scrollbar">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
                  {prompt}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span>Vista previa del video</span>
            <div className="flex items-center gap-2">
              <Button
                variant="modern-ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                {isFullscreen ? 'Salir' : 'Pantalla completa'}
              </Button>
              <Button
                variant="modern"
                size="sm"
                onClick={handleDownload}
                className="gap-2"
                disabled={!processedVideoUrl || hasError || !!urlError}
              >
                <Download className="w-4 h-4" />
                Descargar
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-0 space-y-4">
          {/* Video Container */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {renderLoading()}
            {renderError()}
            {renderVideo()}
          </div>

          {/* Prompt Section */}
          {renderPrompt()}
        </div>
      </DialogContent>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <Dialog open={isFullscreen} onOpenChange={() => setIsFullscreen(false)}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-2">
            <div className="relative w-full h-[90vh] bg-black rounded-lg overflow-hidden">
              {renderLoading()}
              {renderError()}
              {renderVideo()}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};

export default VideoPreview;
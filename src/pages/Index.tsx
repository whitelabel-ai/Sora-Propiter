import { useState, useEffect } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import VideoCreator from "@/components/VideoCreator";
import VideoPreview from "@/components/VideoPreview";
import VideoGallery from "@/components/VideoGallery";
import heroBg from "@/assets/hero-bg.jpg";
import { useToast } from "@/hooks/use-toast";

interface Video {
  id: string;
  prompt: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  resolution: string;
  createdAt: string;
}

const Index = () => {
  const { toast } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleGenerate = async (params: {
    prompt: string;
    seconds: string;
    size: string;
    model: string;
  }) => {
    setIsGenerating(true);
    setProgress(0);
    setCurrentVideo(undefined);

    try {
      // Iniciar generación del video
      const generateResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        }
      );

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.error || 'Error al iniciar la generación del video');
      }

      const { video_id } = await generateResponse.json();
      console.log('Video ID recibido:', video_id);
      
      toast({
        title: "Generando video",
        description: "Tu video está siendo generado. Esto puede tomar unos minutos.",
      });

      // Simular progreso mientras se genera
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress += 5;
        if (currentProgress <= 90) {
          setProgress(currentProgress);
        }
      }, 2000);

      // Hacer polling para obtener el video
      let attempts = 0;
      const maxAttempts = 60; // 5 minutos máximo
      const pollInterval = 5000; // 5 segundos

      const checkVideo = async () => {
        attempts++;
        
        if (attempts > maxAttempts) {
          clearInterval(progressInterval);
          setIsGenerating(false);
          setProgress(0);
          toast({
            title: "Error",
            description: "Tiempo de espera excedido. Por favor intenta de nuevo.",
            variant: "destructive",
          });
          return;
        }

        try {
          const videoResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video?video_id=${video_id}`,
            {
              method: 'GET',
            }
          );

          const contentType = videoResponse.headers.get('content-type');
          
          // Si es video/mp4, el video está listo
          if (videoResponse.ok && contentType?.includes('video/mp4')) {
            clearInterval(progressInterval);
            setProgress(100);

            // Crear URL del video
            const videoBlob = await videoResponse.blob();
            const videoUrl = URL.createObjectURL(videoBlob);

            const newVideo: Video = {
              id: video_id,
              prompt: params.prompt,
              thumbnailUrl: heroBg,
              videoUrl: videoUrl,
              duration: `${params.seconds}s`,
              resolution: params.size,
              createdAt: new Date().toLocaleDateString('es-ES', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }),
            };

            setVideos((prev) => [newVideo, ...prev]);
            setCurrentVideo(newVideo.videoUrl);
            setIsGenerating(false);
            
            toast({
              title: "¡Video listo!",
              description: "Tu video ha sido generado exitosamente.",
            });
          } else if (videoResponse.status === 202) {
            // Status 202 significa que aún se está procesando
            const statusData = await videoResponse.json();
            const apiProgress = statusData.progress || 0;
            
            // Actualizar progreso si la API lo proporciona
            if (apiProgress > 0) {
              setProgress(apiProgress);
            }
            
            console.log(`Intento ${attempts}/${maxAttempts}: Video en progreso (${apiProgress}%)`);
            setTimeout(checkVideo, pollInterval);
          } else {
            // Error al verificar
            console.error('Error verificando video:', videoResponse.status);
            setTimeout(checkVideo, pollInterval);
          }
        } catch (error) {
          console.error('Error verificando video:', error);
          // Continuar intentando en caso de errores de red temporales
          setTimeout(checkVideo, pollInterval);
        }
      };

      // Iniciar polling
      setTimeout(checkVideo, pollInterval);

    } catch (error) {
      console.error('Error:', error);
      setIsGenerating(false);
      setProgress(0);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar el video",
        variant: "destructive",
      });
    }
  };

  const handleVideoClick = (video: Video) => {
    setCurrentVideo(video.videoUrl);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      {/* Hero Section with gradient */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-glow opacity-50" />
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        <div className="relative container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            <h2 className="text-4xl md:text-5xl font-bold">
              Crea Videos Impresionantes con{" "}
              <span className="gradient-primary bg-clip-text text-transparent">
                Sora 2
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Transforma tus ideas en videos cinematográficos con inteligencia artificial de última generación
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <VideoCreator onGenerate={handleGenerate} />
            <VideoPreview 
              videoUrl={currentVideo} 
              isGenerating={isGenerating}
              progress={progress}
            />
          </div>

          <VideoGallery videos={videos} onVideoClick={handleVideoClick} />
        </div>
      </div>
    </div>
  );
};

export default Index;

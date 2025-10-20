import { useState, useEffect } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import VideoCreator from "@/components/VideoCreator";
import VideoPreview from "@/components/VideoPreview";
import VideoGallery from "@/components/VideoGallery";
import heroBg from "@/assets/hero-bg.jpg";

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
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleGenerate = async (params: {
    prompt: string;
    duration: string;
    resolution: string;
    style: string;
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
        throw new Error('Error al iniciar la generación del video');
      }

      const { video_id } = await generateResponse.json();
      console.log('Video ID recibido:', video_id);

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
          throw new Error('Tiempo de espera excedido');
        }

        try {
          const videoResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video?video_id=${video_id}`,
            {
              method: 'GET',
            }
          );

          if (videoResponse.ok) {
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
              duration: `${params.duration}s`,
              resolution: params.resolution,
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
          } else {
            // Si no está listo, seguir esperando
            setTimeout(checkVideo, pollInterval);
          }
        } catch (error) {
          console.error('Error verificando video:', error);
          setTimeout(checkVideo, pollInterval);
        }
      };

      // Iniciar polling
      setTimeout(checkVideo, pollInterval);

    } catch (error) {
      console.error('Error:', error);
      setIsGenerating(false);
      setProgress(0);
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

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

  const handleGenerate = (params: {
    prompt: string;
    duration: string;
    resolution: string;
    style: string;
  }) => {
    setIsGenerating(true);
    setProgress(0);
    setCurrentVideo(undefined);

    // Simular progreso de generación
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          
          // Simular video generado
          const newVideo: Video = {
            id: Date.now().toString(),
            prompt: params.prompt,
            thumbnailUrl: heroBg,
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
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
          
          return 100;
        }
        return prev + 2;
      });
    }, 100);
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

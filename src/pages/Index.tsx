import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import VideoCreator from "@/components/VideoCreator";
import VideoPreview from "@/components/VideoPreview";
import VideoGallery from "@/components/VideoGallery";
import UsageStats from "@/components/UsageStats";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useVideos } from "@/hooks/use-videos";
import type { User } from "@supabase/supabase-js";
import type { Video } from "@/types/database";
import heroBg from "@/assets/hero-bg.jpg";

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [modalVideo, setModalVideo] = useState<Video | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { refetch } = useVideos({ autoRefresh: true });

  useEffect(() => {
    // Check auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleVideoGenerated = () => {
    refetch(); // Refresh the video gallery
  };

  const handleVideoClick = async (video: Video) => {
    if (video.status !== 'completed') {
      toast({
        title: "Video no disponible",
        description: "Este video aún se está procesando o no está disponible.",
        variant: "destructive",
      });
      return;
    }

    if (!video.video_url) {
      toast({
        title: "Video no disponible",
        description: "La URL del video no está disponible.",
        variant: "destructive",
      });
      return;
    }

    // Open modal with the selected video
    setModalVideo(video);
    setIsModalOpen(true);
  };

  const handleVideoDelete = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      toast({
        title: "Video eliminado",
        description: "El video ha sido eliminado exitosamente.",
      });

      refetch();
      setIsModalOpen(false);
      setModalVideo(null);
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el video.",
        variant: "destructive",
      });
    }
  };

  const handleVideoUpgrade = async (videoId: string) => {
    // This would open the upgrade modal
    toast({
      title: "Función en desarrollo",
      description: "La función de mejora estará disponible pronto.",
    });
  };

  const handleRegenerate = async (prompt: string) => {
    setIsModalOpen(false);
    setModalVideo(null);
    // This would trigger video regeneration
    toast({
      title: "Regenerando video",
      description: "Se iniciará la regeneración del video con el mismo prompt.",
    });
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

          {/* Video Creator - First Priority */}
          <div className="mb-8">
            <VideoCreator onVideoGenerated={handleVideoGenerated} />
          </div>

          {/* Video Gallery - Second Priority */}
          <div className="mb-8">
            <VideoGallery onVideoClick={handleVideoClick} />
          </div>

          {/* Usage Stats */}
          <div className="mt-8">
            <UsageStats user={user} />
          </div>
        </div>
      </div>

      {/* Video Preview Modal */}
      {isModalOpen && modalVideo && (
        <VideoPreview
          isOpen={isModalOpen}
          videoUrl={modalVideo.video_url}
          isGenerating={false}
          progress={0}
          prompt={modalVideo.prompt}
          onDelete={() => handleVideoDelete(modalVideo.id)}
          onRegenerate={() => handleRegenerate(modalVideo.prompt)}
          onUpgrade={() => handleVideoUpgrade(modalVideo.id)}
          isModal={true}
          onClose={() => {
            setIsModalOpen(false);
            setModalVideo(null);
          }}
        />
      )}
    </div>
  );
};

export default Index;

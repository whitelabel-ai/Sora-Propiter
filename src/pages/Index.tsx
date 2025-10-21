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
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [currentVideoParams, setCurrentVideoParams] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { videos, loading, refetch } = useVideos({ autoRefresh: true });

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
    if (video.status !== 'completed' || !video.video_url) {
      return;
    }

    try {
      // All videos are now stored in Supabase Storage, get signed URL
      const { data, error } = await supabase.storage
        .from('videos')
        .createSignedUrl(video.video_url, 3600); // 1 hour expiry

      if (error) {
        console.error("Error getting signed URL:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar el video",
          variant: "destructive",
        });
        return;
      }

      setCurrentVideo(data.signedUrl);
      setCurrentVideoParams(null); // Don't allow re-saving
    } catch (error) {
      console.error("Error loading video:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el video",
        variant: "destructive",
      });
    }
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
            <VideoCreator onVideoGenerated={handleVideoGenerated} />
            <VideoPreview 
              videoUrl={currentVideo} 
              isGenerating={isGenerating}
              progress={progress}
              prompt={currentVideoParams?.prompt}
            />
          </div>

          <UsageStats user={user} />
          
          <VideoGallery onVideoClick={handleVideoClick} />
        </div>
      </div>
    </div>
  );
};

export default Index;

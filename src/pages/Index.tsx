import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import VideoCreator from "@/components/VideoCreator";
import VideoPreview from "@/components/VideoPreview";
import VideoGallery from "@/components/VideoGallery";
import UsageStats from "@/components/UsageStats";
import heroBg from "@/assets/hero-bg.jpg";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Video {
  id: string;
  prompt: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  resolution: string;
  createdAt: string;
  category: string;
}

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<string | undefined>();
  const [currentVideoParams, setCurrentVideoParams] = useState<{
    prompt: string;
    category: string;
    model: string;
    size: string;
    duration: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

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

  useEffect(() => {
    if (user) {
      loadVideos();
    }
  }, [user]);

  const loadVideos = async () => {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading videos:", error);
      return;
    }

    if (data) {
      const formattedVideos: Video[] = data.map((v) => ({
        id: v.id,
        prompt: v.prompt,
        thumbnailUrl: heroBg,
        videoUrl: v.video_url,
        duration: v.duration,
        resolution: v.size,
        category: v.category,
        createdAt: new Date(v.created_at).toLocaleDateString('es-ES', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
      }));
      setVideos(formattedVideos);
    }
  };

  const handleSaveVideo = async () => {
    if (!currentVideo || !currentVideoParams || !user) return;

    try {
      toast({
        title: "Guardando video...",
        description: "Subiendo tu video al almacenamiento.",
      });

      // Fetch the blob from the current video URL
      const response = await fetch(currentVideo);
      const blob = await response.blob();
      
      // Generate a unique filename
      const timestamp = new Date().getTime();
      const fileName = `${user.id}/${timestamp}.mp4`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, blob, {
          contentType: 'video/mp4',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Save to database with storage path (not public URL)
      const { data: videoData, error: dbError } = await supabase.from("videos").insert({
        user_id: user.id,
        prompt: currentVideoParams.prompt,
        category: currentVideoParams.category,
        model: currentVideoParams.model,
        size: currentVideoParams.size,
        duration: currentVideoParams.duration,
        video_url: fileName, // Save the storage path, not the public URL
      }).select().single();

      if (dbError) {
        throw dbError;
      }

      // Calculate and log the cost
      const seconds = parseInt(currentVideoParams.duration.replace('s', ''));
      let pricePerSecond = 0;
      
      if (currentVideoParams.model === "sora-2") {
        pricePerSecond = 0.10;
      } else if (currentVideoParams.model === "sora-2-pro") {
        if (currentVideoParams.size === "1280x720" || currentVideoParams.size === "720x1280") {
          pricePerSecond = 0.30;
        } else if (currentVideoParams.size === "1792x1024" || currentVideoParams.size === "1024x1792") {
          pricePerSecond = 0.50;
        }
      }

      const cost = seconds * pricePerSecond;

      // Insert usage log
      await supabase.from("usage_logs").insert({
        user_id: user.id,
        video_id: videoData.id,
        amount_usd: cost,
        model: currentVideoParams.model,
        size: currentVideoParams.size,
        seconds: seconds,
      });

      toast({
        title: "¡Video guardado!",
        description: "Tu video ha sido guardado en tu galería.",
      });
      
      await loadVideos();
      setCurrentVideoParams(null);
      
    } catch (error) {
      console.error("Error saving video:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el video",
        variant: "destructive",
      });
    }
  };

  const handleGenerate = async (params: {
    prompt: string;
    seconds: string;
    size: string;
    model: string;
    category: string;
    style: string;
  }) => {
    setIsGenerating(true);
    setProgress(0);
    setCurrentVideo(undefined);
    setCurrentVideoParams(null);

    try {
      // Primero, mejorar el prompt con detalles cinematográficos
      toast({
        title: "Mejorando tu prompt",
        description: "Agregando detalles cinematográficos...",
      });

      let finalPrompt = params.prompt;

      try {
        const enhanceResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enhance-prompt`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: params.prompt,
              style: params.style,
            }),
          }
        );

        if (!enhanceResponse.ok) {
          const errorData = await enhanceResponse.json();
          throw new Error(errorData.error || 'Error al mejorar el prompt');
        }

        const { enhanced } = await enhanceResponse.json();
        console.log('Prompt mejorado:', enhanced);
        finalPrompt = enhanced;

        toast({
          title: "Prompt mejorado",
          description: "Ahora generando tu video con detalles cinematográficos...",
        });
      } catch (error: any) {
        console.error('Error al mejorar prompt:', error);
        const errorMessage = error?.message || 'Error desconocido al mejorar el prompt';
        
        toast({
          title: "No se pudo mejorar el prompt",
          description: errorMessage,
          variant: "destructive",
        });
        
        // Si el error es de créditos, no continuar
        if (errorMessage.includes('créditos') || errorMessage.includes('quota')) {
          setIsGenerating(false);
          return;
        }
        
        // Para otros errores, usar el prompt original
        toast({
          title: "Usando prompt original",
          description: "Generando video con tu descripción sin mejoras...",
        });
      }

      // Usar el prompt (mejorado o original) para generar el video
      const enhancedParams = {
        ...params,
        prompt: finalPrompt,
      };

      // Iniciar generación del video
      const generateResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(enhancedParams),
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

            // Guardar parámetros para poder guardar después
            setCurrentVideoParams({
              prompt: params.prompt,
              category: params.category,
              model: params.model,
              size: params.size,
              duration: `${params.seconds}s`,
            });
            
            setCurrentVideo(videoUrl);
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

  const handleVideoClick = async (video: Video) => {
    try {
      // Get a signed URL from storage
      const { data, error } = await supabase.storage
        .from('videos')
        .createSignedUrl(video.videoUrl, 3600); // 1 hour expiry

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
            <VideoCreator onGenerate={handleGenerate} />
            <VideoPreview 
              videoUrl={currentVideo} 
              isGenerating={isGenerating}
              progress={progress}
              prompt={currentVideoParams?.prompt}
              onSave={handleSaveVideo}
              canSave={!!currentVideoParams}
            />
          </div>

          <UsageStats user={user} />
          
          <VideoGallery videos={videos} onVideoClick={handleVideoClick} />
        </div>
      </div>
    </div>
  );
};

export default Index;

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { VideoService } from '@/services/video-service';
import { Video, VideoGenerationRequest } from '@/types/database';
import { useAsyncCallback } from './use-async';
import { toast } from 'sonner';
import { calculateVideoCost } from '@/lib/cost-utils';

interface UseVideosOptions {
  category?: string;
  status?: Video['status'];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useVideos = (options: UseVideosOptions = {}) => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    category,
    status,
    autoRefresh = false,
    refreshInterval = 5000,
  } = options;

  const fetchVideos = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const result = await VideoService.getUserVideos(user.id, {
        category,
        status,
        limit: 50,
      });
      
      setVideos(result.videos);
      setTotal(result.total);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al cargar videos');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [user, category, status]);

  const {
    execute: generateVideo,
    loading: generating,
    error: generateError,
  } = useAsyncCallback(
    async (request: VideoGenerationRequest) => {
      if (!user) throw new Error('Usuario no autenticado');

      // Crear registro en la base de datos
      const videoData = {
        user_id: user.id,
        prompt: request.prompt,
        enhanced_prompt: request.prompt, // Use the original prompt as enhanced_prompt initially
        model: request.model,
        duration: request.duration,
        size: request.size,
        category: request.category,
        style: request.style,
        status: 'pending' as const,
        cost: calculateVideoCost(request),
      };

      const video = await VideoService.createVideo(videoData);
      console.log('Video creado en la base de datos:', video.id);

      // Generar video usando la función de Supabase
      const response = await VideoService.generateVideo(request);
      console.log('Respuesta de generación de video:', response);

      // Actualizar con el video_id de OpenAI
      if (response.video_id) {
        try {
          console.log('Actualizando video con openai_task_id:', response.video_id);
          await VideoService.updateVideo(video.id, {
            openai_task_id: response.video_id,
            status: 'processing',
          });
          console.log('Video actualizado exitosamente con openai_task_id');
        } catch (updateError) {
          console.error('Error al actualizar video con openai_task_id:', updateError);
          console.error('Video ID que falló:', video.id);
          // Si no se puede actualizar, al menos loguear el error pero continuar
          toast.error('Advertencia', {
            description: 'Video generado pero hubo un problema al actualizar el estado. Revisa tu lista de videos.',
          });
        }
      }

      // Registrar uso
      await VideoService.logUsage({
        user_id: user.id,
        video_id: video.id,
        action: 'generate',
        cost: videoData.cost,
        duration: request.duration,
        metadata: { request },
      });

      toast.success('Video en proceso', {
        description: 'Tu video se está generando. Te notificaremos cuando esté listo.',
      });

      // Refrescar la lista de videos
      await fetchVideos();

      return video;
    },
    {
      onError: (error) => {
        toast.error('Error al generar video', {
          description: error.message,
        });
      },
    }
  );

  const {
    execute: deleteVideo,
    loading: deleting,
  } = useAsyncCallback(
    async (videoId: string) => {
      await VideoService.deleteVideo(videoId);
      
      toast.success('Video eliminado correctamente');
      
      // Actualizar la lista local
      setVideos(prev => prev.filter(v => v.id !== videoId));
      setTotal(prev => prev - 1);
    },
    {
      onError: (error) => {
        toast.error('Error al eliminar video', {
          description: error.message,
        });
      },
    }
  );

  const {
    execute: retryVideo,
    loading: retrying,
  } = useAsyncCallback(
    async (video: Video) => {
      if (!user) throw new Error('Usuario no autenticado');

      console.log('Reintentando generación para video:', video.id);

      // Crear la request basada en los datos del video existente
      const request: VideoGenerationRequest = {
        prompt: video.prompt,
        model: video.model as 'sora-2' | 'sora-2-pro',
        duration: video.duration,
        size: video.size,
        category: video.category,
        style: video.style || undefined,
      };

      try {
        // Generar video usando la función de Supabase
        const response = await VideoService.generateVideo(request);
        console.log('Respuesta de reintento de generación:', response);

        // Actualizar con el video_id de OpenAI
        if (response.video_id) {
          await VideoService.updateVideo(video.id, {
            openai_task_id: response.video_id,
            status: 'processing',
          });
          
          toast.success('Video reintentado', {
            description: 'El video se está generando nuevamente.',
          });
        }

        // Refrescar la lista de videos
        await fetchVideos();
      } catch (error) {
        console.error('Error al reintentar video:', error);
        toast.error('Error al reintentar', {
          description: 'No se pudo reintentar la generación del video.',
        });
      }
    },
    {
      onError: (error) => {
        toast.error('Error al reintentar video', {
          description: error.message,
        });
      },
    }
  );

  const {
    execute: upgradeVideo,
    loading: upgrading,
  } = useAsyncCallback(
    async (video: Video) => {
      if (!user) throw new Error('Usuario no autenticado');

      // Crear request para el modelo pro
      const upgradeRequest: VideoGenerationRequest = {
        prompt: video.prompt,
        model: 'sora-2-pro',
        duration: video.duration,
        size: video.size,
        category: video.category,
        style: video.style,
      };

      const upgradeCost = calculateVideoCost(upgradeRequest);

      // Crear nuevo video con modelo pro
      const videoData = {
        user_id: user.id,
        prompt: video.prompt,
        enhanced_prompt: video.enhanced_prompt || video.prompt,
        model: 'sora-2-pro',
        duration: video.duration,
        size: video.size,
        category: video.category,
        style: video.style,
        status: 'pending' as const,
        cost: upgradeCost,
      };

      const newVideo = await VideoService.createVideo(videoData);

      // Generar video usando la función de Supabase
      const response = await VideoService.generateVideo(upgradeRequest);

      // Actualizar con el video_id de OpenAI
      if (response.video_id) {
        await VideoService.updateVideo(newVideo.id, {
          openai_task_id: response.video_id,
          status: 'processing',
        });
      }

      // Registrar uso
      await VideoService.logUsage({
        user_id: user.id,
        video_id: newVideo.id,
        action: 'upgrade',
        cost: upgradeCost,
        duration: video.duration,
        metadata: { originalVideoId: video.id, upgradeRequest },
      });

      toast.success('Video mejorado en proceso', {
        description: 'Tu video mejorado se está generando con Sora Pro.',
      });

      // Refrescar la lista de videos
      await fetchVideos();

      return newVideo;
    },
    {
      onError: (error) => {
        toast.error('Error al mejorar video', {
          description: error.message,
        });
      },
    }
  );

  const checkVideoStatus = useCallback(async (video: Video) => {
    try {
      // Usar el openai_task_id para verificar el estado, no el UUID local
      if (!video.openai_task_id) {
        console.warn('Video sin openai_task_id, manteniéndolo en pending:', video.id);
        // No verificar estado si no tiene openai_task_id, mantener como pending
        return;
      }
      
      const statusResponse = await VideoService.checkVideoStatus(video.openai_task_id);
      
      // Actualizar el video en la base de datos
      try {
        await VideoService.updateVideo(video.id, {
          status: statusResponse.status,
          video_url: statusResponse.video_url,
          thumbnail_url: statusResponse.thumbnail_url,
        });
      } catch (updateError) {
         console.error('Error al actualizar estado del video:', updateError);
         // No eliminar el video, solo loguear el error
         console.warn('No se pudo actualizar el video, manteniéndolo en su estado actual:', video.id);
         return; // Salir sin actualizar la UI local
       }

      // Actualizar la lista local
      setVideos(prev => 
        prev.map(v => 
          v.id === video.id 
            ? { 
                ...v, 
                status: statusResponse.status,
                video_url: statusResponse.video_url,
                thumbnail_url: statusResponse.thumbnail_url,
              }
            : v
        )
      );

      if (statusResponse.status === 'completed') {
        toast.success('¡Video completado!', {
          description: 'Tu video está listo para ver.',
        });
      } else if (statusResponse.status === 'failed') {
        toast.error('Error en la generación', {
          description: 'Hubo un problema generando tu video.',
        });
      }

      return statusResponse;
    } catch (error) {
      console.error('Error checking video status:', error);
    }
  }, []);

  // Auto-refresh para videos en proceso
  useEffect(() => {
    if (!autoRefresh) return;

    const processingVideos = videos.filter(v => 
      v.status === 'pending' || v.status === 'processing'
    );

    if (processingVideos.length === 0) return;

    const interval = setInterval(() => {
      processingVideos.forEach(video => {
        checkVideoStatus(video);
      });
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [videos, autoRefresh, refreshInterval, checkVideoStatus]);

  // Cargar videos inicialmente
  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return {
    videos,
    total,
    loading,
    error: error || generateError,
    generating,
    deleting,
    retrying,
    upgrading,
    generateVideo,
    deleteVideo,
    retryVideo,
    upgradeVideo,
    checkVideoStatus,
    refetch: fetchVideos,
  };
};

export const useVideoStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalVideos: 0,
    completedVideos: 0,
    processingVideos: 0,
    totalCost: 0,
    categoryCounts: {} as Record<string, number>,
  });
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userStats = await VideoService.getUserStats(user.id);
      setStats(userStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    refetch: fetchStats,
  };
};
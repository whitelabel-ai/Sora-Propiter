import { supabase } from '@/integrations/supabase/client';
import { 
  Video, 
  VideoInsert, 
  VideoUpdate, 
  VideoGenerationRequest, 
  VideoGenerationResponse,
  VideoStatusResponse,
  UsageLogInsert 
} from '@/types/database';
import { withRetry, createApiError } from '@/lib/error-utils';



export class VideoService {
  static async createVideo(videoData: VideoInsert): Promise<Video> {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('videos')
        .insert(videoData)
        .select()
        .single();

      if (error) {
        throw createApiError(
          `Error al crear video: ${error.message}`,
          500,
          'CREATE_VIDEO_ERROR',
          error
        );
      }

      return data;
    });
  }

  static async updateVideo(id: string, updates: VideoUpdate): Promise<Video> {
    return withRetry(async () => {
      console.log(`[VideoService] Actualizando video ${id} con:`, updates);
      
      const { data, error } = await supabase
        .from('videos')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`[VideoService] Error al actualizar video ${id}:`, error);
        
        if (error.code === 'PGRST116') {
          // Verificar si el video realmente existe
          const existingVideo = await this.getVideo(id);
          if (!existingVideo) {
            throw createApiError(
              `Video con ID ${id} no encontrado`,
              404,
              'VIDEO_NOT_FOUND',
              { videoId: id, error }
            );
          } else {
            // El video existe pero no se pudo actualizar - posible problema de permisos o RLS
            console.error(`[VideoService] Video ${id} existe pero no se pudo actualizar. Posible problema de RLS.`);
            throw createApiError(
              `No se pudo actualizar el video ${id}. Problema de permisos o políticas de seguridad.`,
              403,
              'UPDATE_PERMISSION_ERROR',
              { videoId: id, error, existingVideo }
            );
          }
        }
        
        throw createApiError(
          `Error al actualizar video: ${error.message}`,
          500,
          'UPDATE_VIDEO_ERROR',
          error
        );
      }

      console.log(`[VideoService] Video ${id} actualizado exitosamente:`, data);
      return data;
    });
  }

  static async getVideo(id: string): Promise<Video | null> {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Video not found
        }
        throw createApiError(
          `Error al obtener video: ${error.message}`,
          500,
          'GET_VIDEO_ERROR',
          error
        );
      }

      return data;
    });
  }

  static async getUserVideos(
    userId: string,
    options: {
      category?: string;
      status?: Video['status'];
      limit?: number;
      offset?: number;
      orderBy?: 'created_at' | 'updated_at';
      ascending?: boolean;
    } = {}
  ): Promise<{ videos: Video[]; total: number }> {
    return withRetry(async () => {
      const {
        category,
        status,
        limit = 20,
        offset = 0,
        orderBy = 'created_at',
        ascending = false,
      } = options;

      let query = supabase
        .from('videos')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      if (category) {
        query = query.eq('category', category);
      }

      if (status) {
        query = query.eq('status', status);
      }

      query = query
        .order(orderBy, { ascending })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw createApiError(
          `Error al obtener videos del usuario: ${error.message}`,
          500,
          'GET_USER_VIDEOS_ERROR',
          error
        );
      }

      return {
        videos: data || [],
        total: count || 0,
      };
    });
  }

  static async deleteVideo(id: string): Promise<void> {
    return withRetry(async () => {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);

      if (error) {
        throw createApiError(
          `Error al eliminar video: ${error.message}`,
          500,
          'DELETE_VIDEO_ERROR',
          error
        );
      }
    });
  }

  static async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    return withRetry(async () => {
      const { data, error } = await supabase.functions.invoke('generate-video', {
        body: request,
      });

      if (error) {
        throw createApiError(
          `Error al generar video: ${error.message}`,
          500,
          'GENERATE_VIDEO_ERROR',
          error
        );
      }

      return data;
    });
  }

  static async checkVideoStatus(videoId: string): Promise<VideoStatusResponse> {
    return withRetry(async () => {
      const { data, error } = await supabase.functions.invoke('generate-video', {
        body: { action: 'status', video_id: videoId },
      });

      if (error) {
        throw createApiError(
          `Error al verificar estado del video: ${error.message}`,
          500,
          'CHECK_VIDEO_STATUS_ERROR',
          error
        );
      }

      return data;
    });
  }

  static async enhancePrompt(context: {
    originalPrompt: string;
    duration: string;
    resolution: string;
    category: string;
    style: string;
    model: string;
  }): Promise<string> {
    return withRetry(async () => {
      const { data, error } = await supabase.functions.invoke('enhance-prompt', {
        body: context,
      });

      if (error) {
        throw createApiError(
          `Error al mejorar prompt: ${error.message}`,
          500,
          'ENHANCE_PROMPT_ERROR',
          error
        );
      }

      return data.enhanced;
    });
  }

  static async logUsage(usageData: UsageLogInsert): Promise<void> {
    return withRetry(async () => {
      const { error } = await supabase
        .from('usage_logs')
        .insert(usageData);

      if (error) {
        throw createApiError(
          `Error al registrar uso: ${error.message}`,
          500,
          'LOG_USAGE_ERROR',
          error
        );
      }
    });
  }

  static async getVideosByCategory(userId: string): Promise<Record<string, number>> {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('category')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (error) {
        throw createApiError(
          `Error al obtener videos por categoría: ${error.message}`,
          500,
          'GET_VIDEOS_BY_CATEGORY_ERROR',
          error
        );
      }

      const categoryCounts: Record<string, number> = {};
      data?.forEach(video => {
        categoryCounts[video.category] = (categoryCounts[video.category] || 0) + 1;
      });

      return categoryCounts;
    });
  }

  static async getUserStats(userId: string): Promise<{
    totalVideos: number;
    completedVideos: number;
    processingVideos: number;
    totalCost: number;
    categoryCounts: Record<string, number>;
  }> {
    return withRetry(async () => {
      const { data: videos, error: videosError } = await supabase
        .from('videos')
        .select('status, cost, category')
        .eq('user_id', userId);

      if (videosError) {
        throw createApiError(
          `Error al obtener estadísticas: ${videosError.message}`,
          500,
          'GET_USER_STATS_ERROR',
          videosError
        );
      }

      const stats = {
        totalVideos: videos?.length || 0,
        completedVideos: videos?.filter(v => v.status === 'completed').length || 0,
        processingVideos: videos?.filter(v => v.status === 'processing').length || 0,
        totalCost: videos?.reduce((sum, v) => sum + (v.cost || 0), 0) || 0,
        categoryCounts: {} as Record<string, number>,
      };

      videos?.forEach(video => {
        if (video.status === 'completed') {
          stats.categoryCounts[video.category] = (stats.categoryCounts[video.category] || 0) + 1;
        }
      });

      return stats;
    });
  }
}
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VideoUrlState {
  url: string | null;
  isLoading: boolean;
  error: string | null;
}

interface UseVideoUrlReturn extends VideoUrlState {
  refreshUrl: () => Promise<void>;
  validateUrl: (url: string) => { isValid: boolean; error?: string };
}

/**
 * Hook personalizado para manejar URLs de video de Supabase Storage
 * Maneja automáticamente la autenticación y generación de URLs firmadas
 */
export const useVideoUrl = (videoPath?: string): UseVideoUrlReturn => {
  const [state, setState] = useState<VideoUrlState>({
    url: null,
    isLoading: false,
    error: null,
  });

  /**
   * Valida si una URL de video es válida
   */
  const validateUrl = useCallback((url: string): { isValid: boolean; error?: string } => {
    if (!url || url.trim() === '') {
      return { isValid: false, error: 'URL vacía' };
    }

    // Si ya es una URL completa, validar protocolo
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        new URL(url);
        return { isValid: true };
      } catch {
        return { isValid: false, error: 'URL malformada' };
      }
    }

    // Si es una ruta relativa, validar formato
    if (!url.includes('/') || !url.includes('.')) {
      return { isValid: false, error: 'Formato de ruta inválido' };
    }

    return { isValid: true };
  }, []);

  /**
   * Genera una URL firmada para acceder al video privado
   */
  const generateSignedUrl = useCallback(async (path: string): Promise<string> => {
    try {
      const { data, error } = await supabase.storage
        .from('videos')
        .createSignedUrl(path, 3600); // URL válida por 1 hora

      if (error) {
        throw new Error(`Error generando URL firmada: ${error.message}`);
      }

      if (!data?.signedUrl) {
        throw new Error('No se pudo generar la URL firmada');
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error en generateSignedUrl:', error);
      throw error;
    }
  }, []);

  /**
   * Procesa la ruta del video y genera la URL apropiada
   */
  const processVideoPath = useCallback(async (path: string): Promise<string> => {
    // Si ya es una URL completa, devolverla tal como está
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // Para rutas relativas, generar URL firmada
    return await generateSignedUrl(path);
  }, [generateSignedUrl]);

  /**
   * Actualiza la URL del video
   */
  const refreshUrl = useCallback(async (): Promise<void> => {
    if (!videoPath) {
      setState({ url: null, isLoading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Validar la ruta
      const validation = validateUrl(videoPath);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Ruta de video inválida');
      }

      // Procesar la ruta y generar URL
      const processedUrl = await processVideoPath(videoPath);
      
      setState({
        url: processedUrl,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error procesando URL de video:', errorMessage);
      
      setState({
        url: null,
        isLoading: false,
        error: errorMessage,
      });
    }
  }, [videoPath, validateUrl, processVideoPath]);

  // Efecto para actualizar la URL cuando cambia la ruta
  useEffect(() => {
    refreshUrl();
  }, [refreshUrl]);

  return {
    url: state.url,
    isLoading: state.isLoading,
    error: state.error,
    refreshUrl,
    validateUrl,
  };
};
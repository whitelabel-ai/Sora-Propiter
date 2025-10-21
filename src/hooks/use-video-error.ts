import { useState, useCallback } from 'react';

interface VideoError {
  code: number;
  message: string;
  networkState: number;
  readyState: number;
  timestamp: number;
}

interface UseVideoErrorReturn {
  error: VideoError | null;
  hasError: boolean;
  handleVideoError: (event: Event) => void;
  clearError: () => void;
  getErrorMessage: (errorCode: number) => string;
}

/**
 * Hook personalizado para manejar errores de video de forma centralizada
 */
export const useVideoError = (): UseVideoErrorReturn => {
  const [error, setError] = useState<VideoError | null>(null);

  /**
   * Obtiene un mensaje de error legible basado en el código de error
   */
  const getErrorMessage = useCallback((errorCode: number): string => {
    switch (errorCode) {
      case 1:
        return 'Carga de video abortada por el usuario';
      case 2:
        return 'Error de red al cargar el video';
      case 3:
        return 'Error de decodificación del video';
      case 4:
        return 'Formato de video no soportado o archivo corrupto';
      default:
        return 'Error desconocido al cargar el video';
    }
  }, []);

  /**
   * Maneja los errores de video del elemento HTML video
   */
  const handleVideoError = useCallback((event: Event) => {
    const videoElement = event.target as HTMLVideoElement;
    
    if (!videoElement) {
      console.error('Elemento de video no encontrado en el evento de error');
      return;
    }

    const errorCode = videoElement.error?.code || 0;
    const errorMessage = getErrorMessage(errorCode);

    const videoError: VideoError = {
      code: errorCode,
      message: errorMessage,
      networkState: videoElement.networkState,
      readyState: videoElement.readyState,
      timestamp: Date.now(),
    };

    console.error('Error de video detectado:', {
      ...videoError,
      videoSrc: videoElement.src,
      videoCurrentTime: videoElement.currentTime,
      videoDuration: videoElement.duration,
    });

    setError(videoError);
  }, [getErrorMessage]);

  /**
   * Limpia el estado de error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    hasError: error !== null,
    handleVideoError,
    clearError,
    getErrorMessage,
  };
};
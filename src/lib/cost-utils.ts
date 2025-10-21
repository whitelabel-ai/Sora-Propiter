import { VideoGenerationRequest } from '@/types/database';

/**
 * Calcula el costo de generación de video basado en el modelo, duración y tamaño
 * @param request - Datos de la solicitud de generación de video
 * @returns Costo total en USD
 */
export const calculateVideoCost = (request: VideoGenerationRequest): number => {
  let pricePerSecond = 0;
  
  // Determinar precio por segundo basado en modelo y resolución
  if (request.model === 'sora-2') {
    // sora-2: Vertical (720x1280) y Horizontal (1280x720) = $0.10 por segundo
    pricePerSecond = 0.10;
  } else if (request.model === 'sora-2-pro') {
    if (request.size === '720x1280' || request.size === '1280x720') {
      // sora-2-pro: Vertical (720x1280) y Horizontal (1280x720) = $0.30 por segundo
      pricePerSecond = 0.30;
    } else if (request.size === '1024x1792' || request.size === '1792x1024') {
      // sora-2-pro: Vertical (1024x1792) y Horizontal (1792x1024) = $0.50 por segundo
      pricePerSecond = 0.50;
    }
  }
  
  const totalCost = pricePerSecond * request.duration;
  return Math.round(totalCost * 100) / 100; // Redondear a 2 decimales
};

/**
 * Calcula el costo de upgrade de un video existente a sora-2-pro
 * @param videoData - Datos del video a actualizar
 * @returns Costo del upgrade en USD
 */
export const calculateUpgradeCost = (videoData: {
  duration: number;
  size: string;
  prompt: string;
  category: string;
  style?: string;
}): number => {
  return calculateVideoCost({
    model: 'sora-2-pro',
    duration: videoData.duration,
    size: videoData.size,
    prompt: videoData.prompt,
    category: videoData.category,
    style: videoData.style || ''
  });
};

/**
 * Obtiene el precio por segundo para un modelo y tamaño específicos
 * @param model - Modelo de IA (sora-2 o sora-2-pro)
 * @param size - Tamaño del video
 * @returns Precio por segundo en USD
 */
export const getPricePerSecond = (model: string, size: string): number => {
  if (model === 'sora-2') {
    return 0.10;
  } else if (model === 'sora-2-pro') {
    if (size === '720x1280' || size === '1280x720') {
      return 0.30;
    } else if (size === '1024x1792' || size === '1792x1024') {
      return 0.50;
    }
  }
  return 0;
};
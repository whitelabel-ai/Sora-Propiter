import { toast } from 'sonner';

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const createApiError = (
  message: string,
  status?: number,
  code?: string,
  details?: unknown
): ApiError => {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Ha ocurrido un error inesperado';
};

export const getErrorCode = (error: unknown): string | undefined => {
  if (error && typeof error === 'object' && 'code' in error) {
    return error.code as string;
  }
  return undefined;
};

export const isNetworkError = (error: unknown): boolean => {
  return (
    error instanceof Error &&
    (error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('NetworkError'))
  );
};

export const handleApiError = (error: unknown, context?: string): void => {
  const message = getErrorMessage(error);
  const code = getErrorCode(error);
  
  console.error(`API Error${context ? ` in ${context}` : ''}:`, {
    message,
    code,
    error,
  });

  // Show user-friendly error messages
  if (isNetworkError(error)) {
    toast.error('Error de conexión', {
      description: 'Verifica tu conexión a internet e intenta nuevamente.',
    });
  } else if (code === 'RATE_LIMIT_EXCEEDED') {
    toast.error('Límite excedido', {
      description: 'Has alcanzado el límite de solicitudes. Intenta más tarde.',
    });
  } else if (code === 'INSUFFICIENT_CREDITS') {
    toast.error('Créditos insuficientes', {
      description: 'No tienes suficientes créditos para esta operación.',
    });
  } else {
    toast.error('Error', {
      description: message,
    });
  }
};

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true,
    shouldRetry = (error, attempt) => {
      // Retry on network errors or 5xx status codes
      if (isNetworkError(error)) return true;
      if (error && typeof error === 'object' && 'status' in error) {
        const status = error.status as number;
        return status >= 500 && status < 600;
      }
      return false;
    },
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !shouldRetry(error, attempt)) {
        throw error;
      }

      const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
};

export const safeAsync = async <T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<T | undefined> => {
  try {
    return await fn();
  } catch (error) {
    console.error('Safe async operation failed:', error);
    return fallback;
  }
};

export const createAsyncHandler = <T extends unknown[]>(
  fn: (...args: T) => Promise<void>,
  errorHandler?: (error: unknown) => void
) => {
  return async (...args: T) => {
    try {
      await fn(...args);
    } catch (error) {
      if (errorHandler) {
        errorHandler(error);
      } else {
        handleApiError(error);
      }
    }
  };
};
import { useState, useCallback, useRef, useEffect } from 'react';
import { handleApiError } from '@/lib/error-utils';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface UseAsyncOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  autoReset?: boolean;
  resetDelay?: number;
}

export const useAsync = <T>(
  asyncFunction: () => Promise<T>,
  options: UseAsyncOptions<T> = {}
) => {
  const {
    initialData = null,
    onSuccess,
    onError,
    autoReset = false,
    resetDelay = 5000,
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const isMountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const execute = useCallback(async () => {
    if (!isMountedRef.current) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await asyncFunction();
      
      if (!isMountedRef.current) return;

      setState({ data, loading: false, error: null });
      onSuccess?.(data);

      if (autoReset && resetDelay > 0) {
        timeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setState(prev => ({ ...prev, data: initialData }));
          }
        }, resetDelay);
      }
    } catch (error) {
      if (!isMountedRef.current) return;

      const errorObj = error instanceof Error ? error : new Error(String(error));
      setState(prev => ({ ...prev, loading: false, error: errorObj }));
      
      if (onError) {
        onError(errorObj);
      } else {
        handleApiError(errorObj);
      }
    }
  }, [asyncFunction, onSuccess, onError, autoReset, resetDelay, initialData]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState({
      data: initialData,
      loading: false,
      error: null,
    });
  }, [initialData]);

  return {
    ...state,
    execute,
    reset,
    isIdle: !state.loading && !state.error && state.data === initialData,
    isSuccess: !state.loading && !state.error && state.data !== null,
  };
};

export const useAsyncCallback = <T, Args extends unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: UseAsyncOptions<T> = {}
) => {
  const [state, setState] = useState<AsyncState<T>>({
    data: options.initialData || null,
    loading: false,
    error: null,
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (...args: Args) => {
    if (!isMountedRef.current) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await asyncFunction(...args);
      
      if (!isMountedRef.current) return;

      setState({ data, loading: false, error: null });
      options.onSuccess?.(data);
      return data;
    } catch (error) {
      if (!isMountedRef.current) return;

      const errorObj = error instanceof Error ? error : new Error(String(error));
      setState(prev => ({ ...prev, loading: false, error: errorObj }));
      
      if (options.onError) {
        options.onError(errorObj);
      } else {
        handleApiError(errorObj);
      }
      throw errorObj;
    }
  }, [asyncFunction, options]);

  const reset = useCallback(() => {
    setState({
      data: options.initialData || null,
      loading: false,
      error: null,
    });
  }, [options.initialData]);

  return {
    ...state,
    execute,
    reset,
    isIdle: !state.loading && !state.error && state.data === (options.initialData || null),
    isSuccess: !state.loading && !state.error && state.data !== null,
  };
};
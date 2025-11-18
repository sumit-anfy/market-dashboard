import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../config/axiosClient';
import { AxiosRequestConfig } from 'axios';

interface UseAPIOptions<T> {
  url: string;
  params?: Record<string, any>;
  config?: AxiosRequestConfig;
  enabled?: boolean; // Auto-fetch on mount if true
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
}

interface UseAPIResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Generic hook for making API calls with automatic cancellation
 * Cancels previous pending requests when dependencies change or component unmounts
 *
 * @example
 * const { data, loading, error, refetch } = useAPI<MyDataType>({
 *   url: '/api/arbitrage',
 *   params: { page, limit },
 *   enabled: true,
 * });
 */
export function useAPI<T = any>(options: UseAPIOptions<T>): UseAPIResult<T> {
  const {
    url,
    params,
    config,
    enabled = true,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    // Don't fetch if not enabled
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<T>(url, {
        params,
        ...config,
      });

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setData(response.data);
        setLoading(false);
        onSuccess?.(response.data);
      }
    } catch (err: any) {
      // Ignore cancelled requests
      if (err?.cancelled) {
        console.log('[useAPI] Request was cancelled, ignoring error');
        return;
      }

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        const errorMessage = err?.message || 'An error occurred while fetching data';
        setError(errorMessage);
        setLoading(false);
        onError?.(err);
      }
    }
  }, [url, JSON.stringify(params), enabled, config, onSuccess, onError]);

  useEffect(() => {
    // Mark component as mounted
    isMountedRef.current = true;

    // Auto-fetch if enabled
    if (enabled) {
      fetchData();
    }

    // Cleanup: mark as unmounted (requests will be auto-cancelled by axios interceptor)
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData, enabled]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook for making POST requests with automatic cancellation
 */
export function useAPIMutation<TData = any, TVariables = any>() {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const mutate = useCallback(async (
    url: string,
    variables?: TVariables,
    config?: AxiosRequestConfig
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post<TData>(url, variables, config);

      if (isMountedRef.current) {
        setData(response.data);
        setLoading(false);
      }

      return response.data;
    } catch (err: any) {
      if (err?.cancelled) {
        console.log('[useAPIMutation] Request was cancelled');
        return null;
      }

      if (isMountedRef.current) {
        const errorMessage = err?.message || 'An error occurred';
        setError(errorMessage);
        setLoading(false);
      }

      throw err;
    }
  }, []);

  return {
    data,
    loading,
    error,
    mutate,
  };
}

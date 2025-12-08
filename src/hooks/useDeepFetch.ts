import { useState, useEffect, useCallback } from 'react';
import { deepFetchAll, clearDeepFetchCache, getCacheStats, DeepFetchOptions } from '@/services/deepFetch';

interface DeepFetchProgress {
  current: number;
  total: number;
  currentUrl: string;
  isComplete: boolean;
  error: string | null;
}

interface DeepFetchResult {
  programs: any[];
  courses: any[];
  sections: any[];
  allData: Map<string, any>;
}

/**
 * Hook para buscar recursivamente todas as informações da API
 * antes de exibir para o usuário
 */
export function useDeepFetch(startUrls?: string[]) {
  const [progress, setProgress] = useState<DeepFetchProgress>({
    current: 0,
    total: 0,
    currentUrl: 'Iniciando...',
    isComplete: false,
    error: null,
  });

  const [result, setResult] = useState<DeepFetchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAll = useCallback(async (urls?: string[], options?: DeepFetchOptions) => {
    setIsLoading(true);
    setProgress({
      current: 0,
      total: 0,
      currentUrl: 'Iniciando busca profunda...',
      isComplete: false,
      error: null,
    });

    try {
      const progressCallback = (current: number, total: number, url: string) => {
        setProgress({
          current,
          total,
          currentUrl: url,
          isComplete: false,
          error: null,
        });
      };

      const data = await deepFetchAll(urls || [], progressCallback, options);

      setResult(data);
      setProgress(prev => ({
        ...prev,
        isComplete: true,
        currentUrl: 'Concluído!',
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setProgress(prev => ({
        ...prev,
        error: errorMessage,
        isComplete: false,
      }));
      console.error('Erro no deep fetch:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCache = useCallback(() => {
    clearDeepFetchCache();
    setResult(null);
    setProgress({
      current: 0,
      total: 0,
      currentUrl: '',
      isComplete: false,
      error: null,
    });
  }, []);

  const getStats = useCallback(() => {
    return getCacheStats();
  }, []);

  return {
    progress,
    result,
    isLoading,
    fetchAll,
    clearCache,
    getStats,
  };
}


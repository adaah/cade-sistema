import { useCallback, useEffect, useState } from 'react';
import { useDeepFetch } from '@/hooks/useDeepFetch';
import { DeepFetchProgress } from './DeepFetchProgress';
import { useApp } from '@/contexts/AppContext';
import { fetchCoursesIndex, fetchPrograms, getProgramCourseCodes } from '@/services/api';
import { hydrateDeepFetch } from '@/services/deepFetch';

const API_BASE_URL = 'https://FormigTeen.github.io/sigaa-static/api/v1';
const CATALOG_CACHE_KEY = 'deepfetch.catalog';
const LAST_PROGRAM_KEY = 'deepfetch.lastProgram';

/**
 * Provider que gerencia o deep fetch de forma incremental:
 * - Carrega catálogo (programas + lista de cursos) ao iniciar
 * - Quando um curso é selecionado, busca apenas o universo daquele curso
 * - Mantém o último resultado persistido para não refazer a busca
 */
export function DeepFetchProvider({ children }: { children: React.ReactNode }) {
  const { selectedCourse } = useApp();
  const { progress, fetchAll, clearCache } = useDeepFetch();

  const [showProgress, setShowProgress] = useState(false);
  const [catalogFetched, setCatalogFetched] = useState(false);
  const [lastProgramFetched, setLastProgramFetched] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LAST_PROGRAM_KEY);
  });

  const buildProgramUrls = useCallback(async (programIdRef: string) => {
    const [programs, courseCodes, coursesIndex] = await Promise.all([
      fetchPrograms(),
      getProgramCourseCodes(programIdRef),
      fetchCoursesIndex(),
    ]);

    const urls = new Set<string>();
    const programDetail = programs.find(p => p.id_ref === programIdRef)?.detail_url;
    if (programDetail) urls.add(programDetail);

    courseCodes.forEach(code => {
      const course = coursesIndex.find(c => c.code === code);
      if (!course) return;
      if (course.detail_url) urls.add(course.detail_url);
      if (course.sections_url) urls.add(course.sections_url);
      if (course.code_url) urls.add(course.code_url);
    });

    // Fallback para garantir que temos algo a seguir
    if (urls.size === 0) {
      urls.add(`${API_BASE_URL}/courses.json`);
    }

    return Array.from(urls);
  }, []);

  // 1) Buscar apenas o catálogo inicial (programas + lista de cursos)
  useEffect(() => {
    if (catalogFetched) return;

    setCatalogFetched(true);
    setShowProgress(true);

    fetchAll(
      [`${API_BASE_URL}/programs.json`, `${API_BASE_URL}/courses.json`],
      { persistKey: CATALOG_CACHE_KEY, reuseCache: true, clearProcessed: false }
    ).finally(() => {
      setTimeout(() => setShowProgress(false), 1200);
    });
  }, [catalogFetched, fetchAll]);

  // 2) Quando um curso é selecionado, fazer deep fetch somente dele
  useEffect(() => {
    if (!selectedCourse) return;
    if (lastProgramFetched === selectedCourse) return;

    const persistKey = `deepfetch.program.${selectedCourse}`;

    // Restaurar se já houver cache persistido
    const restored = hydrateDeepFetch(persistKey);
    if (restored) {
      setLastProgramFetched(selectedCourse);
      localStorage.setItem(LAST_PROGRAM_KEY, selectedCourse);
      setShowProgress(false);
      return;
    }

    // Se trocou de curso, limpamos o cache em memória para evitar mistura
    if (lastProgramFetched && lastProgramFetched !== selectedCourse) {
      clearCache();
    }

    const run = async () => {
      try {
        const urls = await buildProgramUrls(selectedCourse);
        setShowProgress(true);
        await fetchAll(urls, { persistKey });
        setLastProgramFetched(selectedCourse);
        localStorage.setItem(LAST_PROGRAM_KEY, selectedCourse);
      } catch (error) {
        console.error('Erro ao preparar deep fetch do curso selecionado', error);
          }
    };

    run();
  }, [buildProgramUrls, clearCache, fetchAll, lastProgramFetched, selectedCourse]);

  // 3) Ocultar o progresso alguns segundos após finalizar
  useEffect(() => {
    if (!showProgress) return;
    if (progress.isComplete || progress.error) {
      const timer = setTimeout(() => setShowProgress(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [progress.error, progress.isComplete, showProgress]);

  return (
    <>
      {children}
      {showProgress && (
        <DeepFetchProgress
          current={progress.current}
          total={progress.total}
          currentUrl={progress.currentUrl}
          isComplete={progress.isComplete}
          error={progress.error}
          onDismiss={() => setShowProgress(false)}
        />
      )}
    </>
  );
}


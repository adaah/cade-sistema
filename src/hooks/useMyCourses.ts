import { useMemo } from 'react';
import { useCourses } from '@/hooks/useApi';
import { useProgramCoursesBatch } from '@/hooks/useApi';
import { useMyPrograms } from '@/hooks/useMyPrograms';
import type { Course } from '@/services/api';

interface UseMyCoursesResult {
  courses: Course[];
  isLoading: boolean;
}

// Aggregates courses from all selected programs, running N parallel queries.
export function useMyCourses(): UseMyCoursesResult {
  const { selectedPrograms } = useMyPrograms();

  // If no selected programs, preserve previous behavior: return all courses
  const fallbackAll = useCourses();

  const batchResults = useProgramCoursesBatch(selectedPrograms);

  const hasSelection = selectedPrograms.length > 0;

  const isLoading = hasSelection
    ? batchResults.some((r) => r.isLoading)
    : fallbackAll.isLoading;

  const courses: Course[] = useMemo(() => {
    if (!hasSelection) return fallbackAll.data || [];
    // Apenas concatena os resultados mantendo possíveis duplicatas
    return batchResults.flatMap((r) => r.data || []);
  }, [hasSelection, batchResults, fallbackAll.data]);

  return { courses, isLoading };
}

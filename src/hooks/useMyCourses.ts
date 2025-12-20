import { useMemo } from 'react';
import { pipe, map, uniq } from 'ramda'
import { useCourses } from '@/hooks/useApi';
import { useProgramCoursesBatch } from '@/hooks/useApi';
import { useMyPrograms } from '@/hooks/useMyPrograms';
import type { Course } from '@/services/api';

// Aggregates courses from all selected programs, running N parallel queries.
export function useMyCourses() {
  const { selectedPrograms } = useMyPrograms();

  const batchResults = useProgramCoursesBatch(selectedPrograms);

  const hasSelection = selectedPrograms.length > 0;

  const isLoading = batchResults.some((r) => r.isLoading)


  const courses: Course[] = useMemo(() => {
    return batchResults.flatMap((r) => r.data || []);
  }, [batchResults]);

  const types = useMemo(() => pipe(
      map((r) => r.type),
      uniq
      )(courses), [courses]);

  const levels = useMemo(() => pipe(
          map((r) => r.level),
          uniq
      )(courses), [courses]);

  return { courses, isLoading, levels, types };
}

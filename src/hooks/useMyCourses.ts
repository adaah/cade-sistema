import { useMemo } from 'react';
import { pipe, map, uniq } from 'ramda'
import { useQueries } from '@tanstack/react-query';
import { useMyPrograms } from '@/hooks/useMyPrograms';
import type { Course } from '@/services/api';
import type { ProgramDetail } from '@/services/api';
import { fetchProgramDetail } from '@/services/api';

// Aggregates courses from all selected programs, running N parallel queries.
export function useMyCourses() {
  const { myPrograms } = useMyPrograms();

  const batchResults = useQueries({
    queries: (myPrograms || []).map((p) => ({
      queryKey: ['program-detail', p.detail_url] as const,
      queryFn: () => fetchProgramDetail(p.detail_url),
      enabled: !!p.detail_url,
      staleTime: 1000 * 60 * 60,
      gcTime: 1000 * 60 * 60 * 24,
    })),
  });

  const isLoading = batchResults.some((r) => r.isLoading);

  const courses: Course[] = useMemo(() => {
    // Extrai e deduplica disciplinas (por código) a partir dos ProgramDetail
    const all: Course[] = batchResults.flatMap((r) => {
      const pd = (r.data as unknown as ProgramDetail) || ({} as ProgramDetail);
      const list = Array.isArray(pd?.courses) ? pd.courses : [];
      return list.map((c: any) => ({
        code: c.code,
        name: c.name,
        level: typeof c.semester === 'number' ? `Nível ${c.semester}` : (c.level ?? ''),
        type: c.type,
        credits: c.credits,
        workload: c.workload,
        prerequisites: c.prerequisites,
      })) as Course[];
    });

    const byCode = new Map(all.map((c) => [c.code, c]));
    return Array.from(byCode.values());
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

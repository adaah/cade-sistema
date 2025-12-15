import { useQuery, useQueries } from '@tanstack/react-query';
import { 
  fetchPrograms, 
  fetchCourses, 
  fetchSections, 
  fetchCourseDetail,
  fetchCourseByCode,
  fetchCourseSections,
  fetchSectionsByCourseCode,
  fetchProgramDetail,
  fetchCoursesForProgram,
  getProgramCourseCodes,
  Program, 
  Course, 
  Section,
  CourseDetail,
  ProgramDetail
} from '@/services/api';

export function usePrograms() {
  const result = useQuery<Program[], Error>({
    queryKey: ['programs'],
    queryFn: fetchPrograms,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });
  const programs = result.data || [];
  return { ...result, data: programs };
}

export function useCourses() {
  return useQuery<Course[], Error>({
    queryKey: ['courses'],
    queryFn: fetchCourses,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });
}

export function useProgramCourses(programIdRef: string | null | undefined) {
  return useQuery<Course[], Error>(getProgramCourseQuery(programIdRef));
}

// Reusable query config for program courses
export const getProgramCourseQuery = (programIdRef: string | null | undefined) => ({
  queryKey: ['program-courses', programIdRef] as const,
  queryFn: () => (programIdRef ? fetchCoursesForProgram(programIdRef) : fetchCourses()),
  enabled: true,
  staleTime: 1000 * 60 * 60,
  gcTime: 1000 * 60 * 60 * 24,
});

// Alias for a batch of program course queries
export function useProgramCoursesBatch(programIds: Array<string | null | undefined>) {
  return useQueries({
    queries: programIds.map((id) => getProgramCourseQuery(id)),
  });
}

export function useSections() {
  return useQuery<Section[], Error>({
    queryKey: ['sections'],
    queryFn: fetchSections,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 12,
  });
}

export function useCourseDetail(detailUrl: string | null | undefined) {
  return useQuery<CourseDetail, Error>({
    queryKey: ['course-detail', detailUrl],
    queryFn: () => detailUrl ? fetchCourseDetail(detailUrl) : Promise.reject(new Error('URL não fornecida')),
    enabled: !!detailUrl,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });
}

export function useCourseByCode(code: string | null | undefined) {
  return useQuery<CourseDetail, Error>({
    queryKey: ['course-by-code', code],
    queryFn: () => code ? fetchCourseByCode(code) : Promise.reject(new Error('Código não fornecido')),
    enabled: !!code,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });
}

export function useCourseSectionsByUrl(sectionsUrl: string | null | undefined) {
  return useQuery<Section[], Error>({
    queryKey: ['course-sections', sectionsUrl],
    queryFn: () => sectionsUrl ? fetchCourseSections(sectionsUrl) : Promise.reject(new Error('URL não fornecida')),
    enabled: !!sectionsUrl,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });
}

export function useCourseSections(courseCode: string | null | undefined) {
  return useQuery<Section[], Error>({
    queryKey: ['course-sections-by-code', courseCode],
    queryFn: () => courseCode ? fetchSectionsByCourseCode(courseCode) : Promise.reject(new Error('Código não fornecido')),
    enabled: !!courseCode,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });
}

export function useAvailableCourses() {
  const { data: courses, isLoading: loadingCourses } = useCourses();
  const { data: sections, isLoading: loadingSections } = useSections();

  const coursesWithSections = courses?.filter(course => 
    sections?.some(section => 
      section.course_code === course.code && section.available > 0
    )
  ) || [];

  return {
    data: coursesWithSections,
    sections: sections || [],
    isLoading: loadingCourses || loadingSections,
  };
}

export function useCoursesWithSectionCount() {
  const { data: courses, isLoading: loadingCourses } = useCourses();
  const { data: sections, isLoading: loadingSections } = useSections();

  const coursesWithCounts = courses?.map(course => {
    const courseSections = sections?.filter(s => s.course_code === course.code) || [];
    const totalSlots = courseSections.reduce((sum, s) => sum + s.slots, 0);
    const totalEnrolled = courseSections.reduce((sum, s) => sum + s.enrolled, 0);
    const totalAvailable = courseSections.reduce((sum, s) => sum + s.available, 0);

    return {
      ...course,
      sections_count: courseSections.length,
      total_slots: totalSlots,
      total_enrolled: totalEnrolled,
      total_available: totalAvailable,
    };
  }) || [];

  return {
    data: coursesWithCounts,
    isLoading: loadingCourses || loadingSections,
  };
}

export function useProgramDetail(detailUrl: string | null | undefined) {
  return useQuery<ProgramDetail, Error>({
    queryKey: ['program-detail', detailUrl],
    queryFn: () => detailUrl ? fetchProgramDetail(detailUrl) : Promise.reject(new Error('URL não fornecida')),
    enabled: !!detailUrl,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });
}

export function useProgramCourseCodes(programIdRef: string | null | undefined) {
  return useQuery<string[], Error>({
    queryKey: ['program-course-codes', programIdRef],
    queryFn: () => programIdRef ? getProgramCourseCodes(programIdRef) : Promise.reject(new Error('ID não fornecido')),
    enabled: !!programIdRef,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });
}

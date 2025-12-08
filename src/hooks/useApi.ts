import { useQuery } from '@tanstack/react-query';
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
  return useQuery<Program[], Error>({
    queryKey: ['programs'],
    queryFn: fetchPrograms,
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
  });
}

export function useCourses() {
  return useQuery<Course[], Error>({
    queryKey: ['courses'],
    queryFn: fetchCourses,
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
  });
}

// Hook para buscar cursos já filtrados pelo programa selecionado
export function useProgramCourses(programIdRef: string | null | undefined) {
  return useQuery<Course[], Error>({
    queryKey: ['program-courses', programIdRef],
    queryFn: () => programIdRef ? fetchCoursesForProgram(programIdRef) : fetchCourses(),
    enabled: true,
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
  });
}

export function useSections() {
  return useQuery<Section[], Error>({
    queryKey: ['sections'],
    queryFn: fetchSections,
    staleTime: 1000 * 60 * 30, // 30 min
    gcTime: 1000 * 60 * 60 * 12, // 12 horas
  });
}

// Hook para buscar detalhes de um curso específico
export function useCourseDetail(detailUrl: string | null | undefined) {
  return useQuery<CourseDetail, Error>({
    queryKey: ['course-detail', detailUrl],
    queryFn: () => detailUrl ? fetchCourseDetail(detailUrl) : Promise.reject(new Error('URL não fornecida')),
    enabled: !!detailUrl,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });
}

// Hook para buscar curso por código
export function useCourseByCode(code: string | null | undefined) {
  return useQuery<CourseDetail, Error>({
    queryKey: ['course-by-code', code],
    queryFn: () => code ? fetchCourseByCode(code) : Promise.reject(new Error('Código não fornecido')),
    enabled: !!code,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });
}

// Hook para buscar seções de um curso específico usando sections_url
export function useCourseSectionsByUrl(sectionsUrl: string | null | undefined) {
  return useQuery<Section[], Error>({
    queryKey: ['course-sections', sectionsUrl],
    queryFn: () => sectionsUrl ? fetchCourseSections(sectionsUrl) : Promise.reject(new Error('URL não fornecida')),
    enabled: !!sectionsUrl,
    staleTime: 1000 * 60 * 5, // 5 minutos (seções mudam mais frequentemente)
    gcTime: 1000 * 60 * 60,
  });
}

// Hook para buscar seções de uma disciplina específica (por código)
export function useCourseSections(courseCode: string | null | undefined) {
  return useQuery<Section[], Error>({
    queryKey: ['course-sections-by-code', courseCode],
    queryFn: () => courseCode ? fetchSectionsByCourseCode(courseCode) : Promise.reject(new Error('Código não fornecido')),
    enabled: !!courseCode,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });
}

// Hook para buscar disciplinas com vagas disponíveis
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

// Hook para buscar disciplinas com contagem de turmas
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

// Hook para buscar detalhes do programa
export function useProgramDetail(detailUrl: string | null | undefined) {
  return useQuery<ProgramDetail, Error>({
    queryKey: ['program-detail', detailUrl],
    queryFn: () => detailUrl ? fetchProgramDetail(detailUrl) : Promise.reject(new Error('URL não fornecida')),
    enabled: !!detailUrl,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });
}

// Hook para buscar códigos das disciplinas de um programa
export function useProgramCourseCodes(programIdRef: string | null | undefined) {
  return useQuery<string[], Error>({
    queryKey: ['program-course-codes', programIdRef],
    queryFn: () => programIdRef ? getProgramCourseCodes(programIdRef) : Promise.reject(new Error('ID não fornecido')),
    enabled: !!programIdRef,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });
}

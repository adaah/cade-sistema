import { useQuery } from '@tanstack/react-query';
import { fetchPrograms, fetchCourses, fetchSections, Program, Course, Section } from '@/services/api';

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
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
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

// Hook para buscar seções de uma disciplina específica
export function useCourseSections(courseCode: string) {
  const { data: sections, ...rest } = useSections();
  
  const filteredSections = sections?.filter(s => s.course_code === courseCode) || [];
  
  return {
    ...rest,
    data: filteredSections,
  };
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

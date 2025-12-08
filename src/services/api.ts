import { z } from 'zod';
import { getCachedData } from './deepFetch';

const API_BASE_URL = 'https://FormigTeen.github.io/sigaa-static/api/v1';

// Cache simples para evitar múltiplas requisições
// Este cache é complementar ao cache do deepFetch
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutos

// Função auxiliar para acessar o cache do deepFetch (se disponível)
// Primeiro verifica o cache do deepFetch, depois o cache local, e por último faz requisição
async function fetchWithCache<T>(url: string, schema: z.ZodSchema<T>): Promise<T> {
  // Primeiro, verificar cache do deepFetch (prioridade)
  const deepFetchCached = getCachedData(url);
  if (deepFetchCached) {
    // Validar com schema antes de retornar
    try {
      const parsed = schema.parse(deepFetchCached);
      // Também armazenar no cache local para acesso rápido
      cache.set(url, { data: parsed, timestamp: Date.now() });
      return parsed;
    } catch (error) {
      // Se o schema não bater, continuar para buscar novamente
      console.warn(`Dados do deepFetch não passaram na validação do schema para ${url}`, error);
    }
  }

  // Segundo, verificar cache local
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }

  // Se não estiver em nenhum cache, fazer requisição
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao carregar dados de ${url}`);
  }
  const data = await response.json();
  const parsed = schema.parse(data);
  
  // Armazenar no cache local
  cache.set(url, { data: parsed, timestamp: Date.now() });
  return parsed;
}

// Schemas para a estrutura real da API
export const ProgramApiSchema = z.object({
  title: z.string(),
  location: z.string(),
  program_type: z.string(),
  mode: z.string(),
  time_code: z.string(),
  id_ref: z.string(),
  code: z.string(),
  detail_url: z.string(),
});

export const CourseApiSchema = z.object({
  code: z.string(),
  name: z.string(),
  mode: z.string(),
  id_ref: z.string(),
  location: z.string(),
  department: z.string(),
  detail_url: z.string(),
  code_url: z.string(),
  sections_url: z.string(),
  sections_count: z.number(),
});

// Schema para detalhes completos de um curso (vem de detail_url)
export const CourseDetailSchema = z.object({
  code: z.string(),
  name: z.string(),
  credits: z.number().optional(),
  workload: z.number().optional(),
  semester: z.number().optional(),
  type: z.string().optional(),
  prerequisites: z.array(z.string()).optional(),
  description: z.string().optional(),
  department: z.string().optional(),
  mode: z.string().optional(),
  location: z.string().optional(),
  id_ref: z.string().optional(),
}).passthrough(); // Permite campos extras

// Schema para detalhes do programa (vem de detail_url)
export const ProgramDetailSchema = z.object({
  id_ref: z.string(),
  title: z.string(),
  code: z.string().optional(),
  courses: z.array(z.object({
    code: z.string(),
    name: z.string(),
    semester: z.number().optional(),
    type: z.string().optional(),
    credits: z.number().optional(),
    workload: z.number().optional(),
    prerequisites: z.array(z.string()).optional(),
  })).optional(),
}).passthrough(); // Permite campos extras

export type ProgramDetail = z.infer<typeof ProgramDetailSchema>;

// Schema para seções (vem de sections.json ou sections_url)
export const SectionApiSchema = z.object({
  course_code: z.string(),
  course_name: z.string().optional(),
  section_code: z.string(),
  professor: z.string().optional(),
  schedule: z.array(z.object({
    day: z.string(),
    start_time: z.string(),
    end_time: z.string(),
  })).optional(),
  schedule_raw: z.string().optional(),
  room: z.string().optional(),
  slots: z.number().optional(),
  enrolled: z.number().optional(),
  available: z.number().optional(),
}).passthrough();

// Tipos internos do sistema (transformados da API)
export type Program = z.infer<typeof ProgramApiSchema>;
export type CourseApi = z.infer<typeof CourseApiSchema>;
export type CourseDetail = z.infer<typeof CourseDetailSchema>;
export type SectionApi = z.infer<typeof SectionApiSchema>;

// Tipo interno para Course (combinando dados da API e detalhes)
export interface Course {
  code: string;
  name: string;
  credits: number;
  workload: number;
  semester?: number;
  type?: string;
  prerequisites?: string[];
  description?: string;
  department?: string;
  mode?: string;
  location?: string;
  id_ref?: string;
  sections_count: number;
  sections_url: string;
  detail_url: string;
  code_url: string;
}

// Tipo interno para Section
export interface Section {
  course_code: string;
  course_name: string;
  section_code: string;
  professor: string;
  schedule: SectionSchedule[];
  schedule_raw: string;
  room: string;
  slots: number;
  enrolled: number;
  available: number;
}

export interface SectionSchedule {
  day: string;
  start_time: string;
  end_time: string;
}

// Funções de fetch principais
export async function fetchPrograms(): Promise<Program[]> {
  return fetchWithCache(
    `${API_BASE_URL}/programs.json`,
    z.array(ProgramApiSchema)
  );
}

// Busca apenas o catálogo (lista) de cursos sem carregar detalhes
export async function fetchCoursesIndex(): Promise<CourseApi[]> {
  return fetchWithCache(
    `${API_BASE_URL}/courses.json`,
    z.array(CourseApiSchema)
  );
}

export async function findCourseSummaryByCode(code: string): Promise<CourseApi | null> {
  const courses = await fetchCoursesIndex();
  return courses.find(course => course.code === code) || null;
}

export async function fetchCourses(): Promise<Course[]> {
  const coursesApi = await fetchWithCache(
    `${API_BASE_URL}/courses.json`,
    z.array(CourseApiSchema)
  );

  // Transformar para o formato interno
  const courses: Course[] = await Promise.all(
    coursesApi.map(async (courseApi) => {
      try {
        // Buscar detalhes completos do curso
        const detail = await fetchCourseDetail(courseApi.detail_url);
        
        return {
          code: courseApi.code,
          name: courseApi.name,
          credits: detail.credits || 4,
          workload: detail.workload || 60,
          semester: detail.semester,
          type: detail.type || 'obrigatoria',
          prerequisites: detail.prerequisites || [],
          description: detail.description || '',
          department: courseApi.department || detail.department,
          mode: courseApi.mode,
          location: courseApi.location,
          id_ref: courseApi.id_ref,
          sections_count: courseApi.sections_count,
          sections_url: courseApi.sections_url,
          detail_url: courseApi.detail_url,
          code_url: courseApi.code_url,
        };
      } catch (error) {
        // Se falhar ao buscar detalhes, usar valores padrão
        console.warn(`Erro ao buscar detalhes de ${courseApi.code}:`, error);
        return {
          code: courseApi.code,
          name: courseApi.name,
          credits: 4,
          workload: 60,
          department: courseApi.department,
          mode: courseApi.mode,
          location: courseApi.location,
          id_ref: courseApi.id_ref,
          sections_count: courseApi.sections_count,
          sections_url: courseApi.sections_url,
          detail_url: courseApi.detail_url,
          code_url: courseApi.code_url,
        };
      }
    })
  );

  return courses;
}

/**
 * Busca cursos já filtrados pelo programa selecionado, enriquecendo com
 * informações de tipo/semestre vindas do detail do programa.
 */
export async function fetchCoursesForProgram(programIdRef: string): Promise<Course[]> {
  try {
    const programs = await fetchPrograms();
    const program = programs.find((p) => p.id_ref === programIdRef);
    const detailUrl = program?.detail_url;

    if (!detailUrl) {
      // Fallback: retorna catálogo completo
      return fetchCourses();
    }

    const [programDetail, coursesIndex] = await Promise.all([
      fetchProgramDetail(detailUrl),
      fetchCoursesIndex(),
    ]);

    const indexByCode = new Map(coursesIndex.map((c) => [c.code, c]));
    const programCourses = programDetail.courses || [];

    const courses: Course[] = (
      await Promise.all(
        programCourses.map(async (progCourse) => {
          const summary = indexByCode.get(progCourse.code);
          if (!summary) return null;

          try {
            const detail = await fetchCourseDetail(summary.detail_url);

            return {
              code: summary.code,
              name: summary.name,
              credits: detail.credits ?? 4,
              workload: detail.workload ?? 60,
              semester: progCourse.semester ?? detail.semester,
              type: progCourse.type ?? detail.type ?? 'obrigatoria',
              prerequisites: progCourse.prerequisites ?? detail.prerequisites ?? [],
              description: detail.description ?? '',
              department: summary.department ?? detail.department,
              mode: summary.mode,
              location: summary.location,
              id_ref: summary.id_ref,
              sections_count: summary.sections_count,
              sections_url: summary.sections_url,
              detail_url: summary.detail_url,
              code_url: summary.code_url,
            };
          } catch (error) {
            console.warn(`Erro ao enriquecer curso ${summary.code}:`, error);
            return {
              code: summary.code,
              name: summary.name,
              credits: 4,
              workload: 60,
              semester: progCourse.semester,
              type: progCourse.type ?? 'obrigatoria',
              prerequisites: progCourse.prerequisites ?? [],
              department: summary.department,
              mode: summary.mode,
              location: summary.location,
              id_ref: summary.id_ref,
              sections_count: summary.sections_count,
              sections_url: summary.sections_url,
              detail_url: summary.detail_url,
              code_url: summary.code_url,
            };
          }
        })
      )
    ).filter(Boolean) as Course[];

    // Caso o detail do programa não liste courses, retorna catálogo completo
    if (courses.length === 0) {
      return fetchCourses();
    }

    return courses;
  } catch (error) {
    console.error(`Erro ao buscar cursos do programa ${programIdRef}:`, error);
    return fetchCourses();
  }
}

export async function fetchSections(): Promise<Section[]> {
  const sectionsApi = await fetchWithCache(
    `${API_BASE_URL}/sections.json`,
    z.array(SectionApiSchema)
  );

  // Transformar para o formato interno
  return sectionsApi.map((sectionApi) => ({
    course_code: sectionApi.course_code,
    course_name: sectionApi.course_name || '',
    section_code: sectionApi.section_code,
    professor: sectionApi.professor || 'A definir',
    schedule: sectionApi.schedule || parseSigaaSchedule(sectionApi.schedule_raw || ''),
    schedule_raw: sectionApi.schedule_raw || '',
    room: sectionApi.room || 'A definir',
    slots: sectionApi.slots || 40,
    enrolled: sectionApi.enrolled || 0,
    available: (sectionApi.slots || 40) - (sectionApi.enrolled || 0),
  }));
}

// Funções para buscar dados das URLs relacionadas
export async function fetchCourseDetail(detailUrl: string): Promise<CourseDetail> {
  return fetchWithCache(detailUrl, CourseDetailSchema);
}

export async function fetchCourseByCode(code: string): Promise<CourseDetail> {
  const url = `${API_BASE_URL}/course/code/${code}.json`;
  return fetchWithCache(url, CourseDetailSchema);
}

export async function fetchCourseSections(sectionsUrl: string): Promise<Section[]> {
  const sectionsApi = await fetchWithCache(
    sectionsUrl,
    z.array(SectionApiSchema)
  );

  return sectionsApi.map((sectionApi) => ({
    course_code: sectionApi.course_code,
    course_name: sectionApi.course_name || '',
    section_code: sectionApi.section_code,
    professor: sectionApi.professor || 'A definir',
    schedule: sectionApi.schedule || parseSigaaSchedule(sectionApi.schedule_raw || ''),
    schedule_raw: sectionApi.schedule_raw || '',
    room: sectionApi.room || 'A definir',
    slots: sectionApi.slots || 40,
    enrolled: sectionApi.enrolled || 0,
    available: (sectionApi.slots || 40) - (sectionApi.enrolled || 0),
  }));
}

// Função auxiliar para buscar seções de um curso específico
export async function fetchSectionsByCourseCode(courseCode: string): Promise<Section[]> {
  try {
    // Primeiro, buscar o curso para obter a sections_url
    const courses = await fetchCourses();
    const course = courses.find(c => c.code === courseCode);
    
    if (course && course.sections_url) {
      return fetchCourseSections(course.sections_url);
    }
    
    // Se não encontrar, buscar todas as seções e filtrar
    const allSections = await fetchSections();
    return allSections.filter(s => s.course_code === courseCode);
  } catch (error) {
    console.error(`Erro ao buscar seções de ${courseCode}:`, error);
    // Fallback: buscar todas e filtrar
    const allSections = await fetchSections();
    return allSections.filter(s => s.course_code === courseCode);
  }
}

// Utilitário para parsear horário do SIGAA (ex: "24T12" -> dia e hora)
export function parseSigaaSchedule(raw: string): SectionSchedule[] {
  if (!raw || raw.trim() === '') return [];
  
  const schedules: SectionSchedule[] = [];
  
  // Formato: 24T12 significa dias 2 e 4 (Seg/Qua), turno T (tarde), horários 1 e 2
  const dayMap: Record<string, string> = {
    '2': 'Seg',
    '3': 'Ter',
    '4': 'Qua',
    '5': 'Qui',
    '6': 'Sex',
    '7': 'Sáb',
  };

  const shiftMap: Record<string, { base: number }> = {
    'M': { base: 7 }, // Manhã começa às 7h
    'T': { base: 13 }, // Tarde começa às 13h
    'N': { base: 18 }, // Noite começa às 18h
  };

  // Regex para capturar padrões como "24T12" ou "35M34"
  const pattern = /(\d+)([MTN])(\d+)/g;
  let match;

  while ((match = pattern.exec(raw)) !== null) {
    const [, days, shift, slots] = match;
    const shiftInfo = shiftMap[shift];
    
    if (!shiftInfo) continue;

    // Cada slot é ~50min
    const slotNumbers = slots.split('').map(Number);
    const firstSlot = Math.min(...slotNumbers);
    const lastSlot = Math.max(...slotNumbers);
    
    const startTime = shiftInfo.base + (firstSlot - 1);
    const endTime = shiftInfo.base + lastSlot;

    for (const dayChar of days.split('')) {
      const dayName = dayMap[dayChar];
      if (dayName) {
        schedules.push({
          day: dayName,
          start_time: `${startTime.toString().padStart(2, '0')}:00`,
          end_time: `${endTime.toString().padStart(2, '0')}:00`,
        });
      }
    }
  }

  return schedules;
}

// Função para buscar detalhes do programa
export async function fetchProgramDetail(detailUrl: string): Promise<ProgramDetail> {
  return fetchWithCache(detailUrl, ProgramDetailSchema);
}

// Função para obter códigos das disciplinas de um programa
export async function getProgramCourseCodes(programIdRef: string): Promise<string[]> {
  try {
    const programs = await fetchPrograms();
    const program = programs.find(p => p.id_ref === programIdRef);
    
    if (!program || !program.detail_url) {
      return [];
    }
    
    const programDetail = await fetchProgramDetail(program.detail_url);
    
    // Se o detail tem uma lista de courses, retornar os códigos
    if (programDetail.courses && Array.isArray(programDetail.courses)) {
      return programDetail.courses.map(c => c.code);
    }
    
    return [];
  } catch (error) {
    console.error(`Erro ao buscar disciplinas do programa ${programIdRef}:`, error);
    return [];
  }
}

// Função para limpar o cache (útil para desenvolvimento)
export function clearApiCache() {
  cache.clear();
}

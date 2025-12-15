import { z } from 'zod';
import { getCachedData } from './deepFetch';

// Base externa (GitHub Pages)
const EXTERNAL_API_BASE = 'https://FormigTeen.github.io/sigaa-static/api/v1';

// Edge function proxy URL
const PROXY_URL = 'https://ezupytejdcledagzgaku.supabase.co/functions/v1/sigaa-proxy';

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 5;

// Busca via Edge Function proxy para evitar CORS
async function fetchViaProxy(path: string): Promise<any> {
  const url = `${PROXY_URL}?path=${encodeURIComponent(path)}`;
  
  console.log(`Fetching via proxy: ${path}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Proxy error for ${path}:`, errorText);
    throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
  }
  
  return response.json();
}

// Converte URL absoluta em path relativo para o proxy
function urlToPath(url: string): string {
  if (url.startsWith(EXTERNAL_API_BASE)) {
    return url.replace(EXTERNAL_API_BASE + '/', '');
  }
  // Se já é uma URL completa do GitHub, passa direto
  if (url.includes('formigteen.github.io') || url.includes('FormigTeen.github.io')) {
    return url;
  }
  return url;
}

async function fetchWithCache<T>(url: string, schema: z.ZodSchema<T>): Promise<T> {
  // Check deepFetch cache first (using original URL as key)
  const deepFetchCached = getCachedData(url);
  if (deepFetchCached) {
    try {
      const parsed = schema.parse(deepFetchCached);
      cache.set(url, { data: parsed, timestamp: Date.now() });
      return parsed;
    } catch (error) {
      console.warn(`Cache validation failed for ${url}`, error);
    }
  }

  // Check local cache
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }

  // Fetch via proxy
  const path = urlToPath(url);
  const data = await fetchViaProxy(path);
  const parsed = schema.parse(data);

  cache.set(url, { data: parsed, timestamp: Date.now() });
  return parsed;
}

export const ProgramApiSchema = z.object({
  title: z.string().default(''),
  location: z.string().default(''),
  program_type: z.string().default(''),
  mode: z.string().default(''),
  time_code: z.string().default(''),
  id_ref: z.string().default(''),
  code: z.string().default(''),
  detail_url: z.string().optional(),
}).passthrough();

export const CourseApiSchema = z.object({
  code: z.string().default(''),
  name: z.string().default(''),
  mode: z.string().default(''),
  id_ref: z.string().default(''),
  location: z.string().default(''),
  department: z.string().default(''),
  detail_url: z.string().default(''),
  code_url: z.string().default(''),
  sections_url: z.string().default(''),
  sections_count: z.coerce.number().default(0),
});

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
}).passthrough();

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
}).passthrough();

export type ProgramDetail = z.infer<typeof ProgramDetailSchema>;

export const SectionApiSchema = z.object({
  course_code: z.string(),
  course_name: z.string().optional(),
  section_code: z.string(),
  professor: z.string().optional(),
  schedule: z.array(z.object({
    day: z.string().default(''),
    start_time: z.string().default(''),
    end_time: z.string().default(''),
  })).optional(),
  schedule_raw: z.string().optional(),
  room: z.string().optional(),
  slots: z.number().optional(),
  enrolled: z.number().optional(),
  available: z.number().optional(),
}).passthrough();

export type Program = z.infer<typeof ProgramApiSchema>;
export type CourseApi = z.infer<typeof CourseApiSchema>;
export type CourseDetail = z.infer<typeof CourseDetailSchema>;
export type SectionApi = z.infer<typeof SectionApiSchema>;

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

export async function fetchPrograms(): Promise<Program[]> {
  return fetchWithCache(
    `${EXTERNAL_API_BASE}/programs.json`,
    z.array(ProgramApiSchema)
  );
}

export async function fetchCoursesIndex(): Promise<CourseApi[]> {
  return fetchWithCache(
    `${EXTERNAL_API_BASE}/courses.json`,
    z.array(CourseApiSchema)
  );
}

export async function findCourseSummaryByCode(code: string): Promise<CourseApi | null> {
  const courses = await fetchCoursesIndex();
  return courses.find(course => course.code === code) || null;
}

export async function fetchCourses(): Promise<Course[]> {
  const coursesApi = await fetchWithCache(
    `${EXTERNAL_API_BASE}/courses.json`,
    z.array(CourseApiSchema)
  );

  return coursesApi.map((courseApi) => ({
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
  }));
}

export async function fetchCoursesForProgram(programIdRef: string): Promise<Course[]> {
  try {
    const programs = await fetchPrograms();
    const program = programs.find((p) => p.id_ref === programIdRef);
    const detailUrl = program?.detail_url;

    if (!detailUrl) {
      return fetchCourses();
    }

    const [programDetail, coursesIndex] = await Promise.all([
      fetchProgramDetail(detailUrl),
      fetchCoursesIndex(),
    ]);

    const indexByCode = new Map(coursesIndex.map((c) => [c.code, c]));
    const programCourses = programDetail.courses || [];

    const courses: Course[] = programCourses
      .map((progCourse) => {
        const summary = indexByCode.get(progCourse.code);
        if (!summary) return null;

        return {
          code: summary.code,
          name: summary.name,
          credits: progCourse.credits ?? 4,
          workload: progCourse.workload ?? 60,
          semester: progCourse.semester,
          type: progCourse.type ?? 'obrigatoria',
          prerequisites: progCourse.prerequisites ?? [],
          description: '',
          department: summary.department,
          mode: summary.mode,
          location: summary.location,
          id_ref: summary.id_ref,
          sections_count: summary.sections_count,
          sections_url: summary.sections_url,
          detail_url: summary.detail_url,
          code_url: summary.code_url,
        };
      })
      .filter(Boolean) as Course[];

    if (courses.length === 0) {
      return fetchCourses();
    }

    return courses;
  } catch (error) {
    console.error(`Error fetching courses for program ${programIdRef}:`, error);
    return fetchCourses();
  }
}

export async function fetchSections(): Promise<Section[]> {
  const sectionsApi = await fetchWithCache(
    `${EXTERNAL_API_BASE}/sections.json`,
    z.array(SectionApiSchema)
  );

  return sectionsApi.map((sectionApi) => ({
    course_code: sectionApi.course_code,
    course_name: sectionApi.course_name || '',
    section_code: sectionApi.section_code,
    professor: sectionApi.professor || 'A definir',
    schedule: (sectionApi.schedule || []).map(s => ({ day: s.day || '', start_time: s.start_time || '', end_time: s.end_time || '' })) as SectionSchedule[] || parseSigaaSchedule(sectionApi.schedule_raw || ''),
    schedule_raw: sectionApi.schedule_raw || '',
    room: sectionApi.room || 'A definir',
    slots: sectionApi.slots || 40,
    enrolled: sectionApi.enrolled || 0,
    available: (sectionApi.slots || 40) - (sectionApi.enrolled || 0),
  }));
}

export async function fetchCourseDetail(detailUrl: string): Promise<CourseDetail> {
  return fetchWithCache(detailUrl, CourseDetailSchema);
}

export async function fetchCourseByCode(code: string): Promise<CourseDetail> {
  const url = `${EXTERNAL_API_BASE}/course/code/${code}.json`;
  return fetchWithCache(url, CourseDetailSchema);
}

export async function fetchCourseSections(sectionsUrl: string): Promise<Section[]> {
  const raw = await fetchWithCache(sectionsUrl, z.any());
  const sectionsApi = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as any)?.sections)
      ? (raw as any).sections
      : [];

  return sectionsApi.map((sectionApi) => ({
    course_code: sectionApi.course_code,
    course_name: sectionApi.course_name || '',
    section_code: sectionApi.section_code,
    professor: sectionApi.professor || 'A definir',
    schedule: (sectionApi.schedule || []).map(s => ({ day: s.day || '', start_time: s.start_time || '', end_time: s.end_time || '' })) as SectionSchedule[] || parseSigaaSchedule(sectionApi.schedule_raw || ''),
    schedule_raw: sectionApi.schedule_raw || '',
    room: sectionApi.room || 'A definir',
    slots: sectionApi.slots || 40,
    enrolled: sectionApi.enrolled || 0,
    available: (sectionApi.slots || 40) - (sectionApi.enrolled || 0),
  }));
}

export async function fetchSectionsByCourseCode(courseCode: string): Promise<Section[]> {
  try {
    const courses = await fetchCoursesIndex();
    const course = courses.find(c => c.code === courseCode);
    
    if (course && course.sections_url) {
      return fetchCourseSections(course.sections_url);
    }
    
    const allSections = await fetchSections();
    return allSections.filter(s => s.course_code === courseCode);
  } catch (error) {
    console.error(`Error fetching sections for ${courseCode}:`, error);
    const allSections = await fetchSections();
    return allSections.filter(s => s.course_code === courseCode);
  }
}

export function parseSigaaSchedule(raw: string): SectionSchedule[] {
  if (!raw || raw.trim() === '') return [];
  
  const schedules: SectionSchedule[] = [];
  
  const dayMap: Record<string, string> = {
    '2': 'Seg',
    '3': 'Ter',
    '4': 'Qua',
    '5': 'Qui',
    '6': 'Sex',
    '7': 'Sáb',
  };

  const shiftMap: Record<string, { base: number }> = {
    'M': { base: 7 },
    'T': { base: 13 },
    'N': { base: 18 },
  };

  const pattern = /(\d+)([MTN])(\d+)/g;
  let match;

  while ((match = pattern.exec(raw)) !== null) {
    const [, days, shift, slots] = match;
    const shiftInfo = shiftMap[shift];
    
    if (!shiftInfo) continue;

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

export async function fetchProgramDetail(detailUrl: string): Promise<ProgramDetail> {
  return fetchWithCache(detailUrl, ProgramDetailSchema);
}

export async function getProgramCourseCodes(programIdRef: string): Promise<string[]> {
  try {
    const programs = await fetchPrograms();
    const program = programs.find(p => p.id_ref === programIdRef);
    
    if (!program || !program.detail_url) {
      return [];
    }
    
    const programDetail = await fetchProgramDetail(program.detail_url);
    
    if (programDetail.courses && Array.isArray(programDetail.courses)) {
      return programDetail.courses.map(c => c.code);
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching courses for program ${programIdRef}:`, error);
    return [];
  }
}

export function clearApiCache() {
  cache.clear();
}

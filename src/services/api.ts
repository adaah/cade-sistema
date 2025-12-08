import { z } from 'zod';

const API_BASE_URL = 'https://FormigTeen.github.io/sigaa-static/api/v1';

// Schemas de validação com Zod
export const ProgramSchema = z.object({
  title: z.string(),
  location: z.string(),
  program_type: z.string(),
  mode: z.string(),
  time_code: z.string(),
  id_ref: z.string(),
  code: z.string(),
  detail_url: z.string(),
});

export const CourseSchema = z.object({
  code: z.string(),
  name: z.string(),
  credits: z.number().optional().default(4),
  workload: z.number().optional().default(60),
  semester: z.number().optional().default(1),
  type: z.string().optional().default('obrigatoria'),
  prerequisites: z.array(z.string()).optional().default([]),
  description: z.string().optional().default(''),
  department: z.string().optional(),
});

export const SectionScheduleSchema = z.object({
  day: z.string(),
  start_time: z.string(),
  end_time: z.string(),
});

export const SectionSchema = z.object({
  course_code: z.string(),
  course_name: z.string().optional().default(''),
  section_code: z.string(),
  professor: z.string().optional().default('A definir'),
  schedule: z.array(SectionScheduleSchema).optional().default([]),
  schedule_raw: z.string().optional().default(''),
  room: z.string().optional().default('A definir'),
  slots: z.number().optional().default(40),
  enrolled: z.number().optional().default(0),
  available: z.number().optional().default(40),
});

export type Program = z.infer<typeof ProgramSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type SectionSchedule = z.infer<typeof SectionScheduleSchema>;

// Funções de fetch
export async function fetchPrograms(): Promise<Program[]> {
  const response = await fetch(`${API_BASE_URL}/programs.json`);
  if (!response.ok) {
    throw new Error('Falha ao carregar programas');
  }
  const data = await response.json();
  return z.array(ProgramSchema).parse(data);
}

export async function fetchCourses(): Promise<Course[]> {
  const response = await fetch(`${API_BASE_URL}/courses.json`);
  if (!response.ok) {
    throw new Error('Falha ao carregar disciplinas');
  }
  const data = await response.json();
  return z.array(CourseSchema).parse(data);
}

export async function fetchSections(): Promise<Section[]> {
  const response = await fetch(`${API_BASE_URL}/sections.json`);
  if (!response.ok) {
    throw new Error('Falha ao carregar turmas');
  }
  const data = await response.json();
  return z.array(SectionSchema).parse(data);
}

// Utilitário para parsear horário do SIGAA (ex: "24T12" -> dia e hora)
export function parseSigaaSchedule(raw: string): SectionSchedule[] {
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

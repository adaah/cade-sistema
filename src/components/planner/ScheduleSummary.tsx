import { Clock, BookOpen, Trash2 } from 'lucide-react';
import { useCourses } from '@/hooks/useApi';
import {useMyCourses} from "@/hooks/useMyCourses.ts";
import { useMySections } from '@/hooks/useMySections';
import { parseSigaaSchedule } from '@/services/api';

type ScheduledItem = {
  disciplineCode: string;
  disciplineName: string;
  classCode: string;
  professor: string;
  schedule: string;
  color: string;
  day: string;
  startTime: string;
  endTime: string;
};

const COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(142, 71%, 45%)',
  'hsl(280, 65%, 60%)',
  'hsl(0, 72%, 51%)',
  'hsl(38, 92%, 50%)',
  'hsl(180, 65%, 45%)',
  'hsl(320, 65%, 52%)',
  'hsl(45, 93%, 47%)',
];

function colorFor(code: string) {
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = ((hash << 5) - hash) + code.charCodeAt(i);
  const idx = Math.abs(hash) % COLORS.length;
  return COLORS[idx];
}

export function ScheduleSummary() {
  const { mySections, toggleSection } = useMySections();
  const { courses } = useMyCourses();

  // Build items from mySections
  const scheduledItems: ScheduledItem[] = [];
  for (const s of mySections) {
    const disciplineCode = (s as any)?.course?.code || (s as any)?.course_code || '';
    const disciplineName = (s as any)?.course?.name || disciplineCode;
    const classCode = (s as any)?.section_code || s.id_ref;
    const professor = (s as any)?.professor || '';
    const raw = (s as any)?.schedule_raw || (Array.isArray((s as any)?.time_codes) ? (s as any).time_codes.join(' ') : '');
    const parsed = raw ? parseSigaaSchedule(raw) : [];
    if (parsed.length > 0) {
      for (const sched of parsed) {
        scheduledItems.push({
          disciplineCode,
          disciplineName,
          classCode,
          professor,
          schedule: raw,
          color: colorFor(disciplineCode),
          day: sched.day,
          startTime: sched.start_time,
          endTime: sched.end_time,
        });
      }
    } else {
      scheduledItems.push({
        disciplineCode,
        disciplineName,
        classCode,
        professor,
        schedule: raw || 'Horário a definir',
        color: colorFor(disciplineCode),
        day: 'Seg',
        startTime: '08:00',
        endTime: '10:00',
      });
    }
  }

  const uniqueDisciplines = scheduledItems.reduce((acc, item) => {
    const key = `${item.disciplineCode}-${item.classCode}`;
    if (!acc.find(d => `${d.disciplineCode}-${d.classCode}` === key)) {
      acc.push(item);
    }
    return acc;
  }, [] as ScheduledItem[]);

  const totalCredits = uniqueDisciplines.reduce((sum, item) => {
    const discipline = courses?.find(d => d.code === item.disciplineCode);
    return sum + (discipline?.credits || 0);
  }, 0);

  const totalWorkload = uniqueDisciplines.reduce((sum, item) => {
    const discipline = courses?.find(d => d.code === item.disciplineCode);
    return sum + (discipline?.workload || 0);
  }, 0);

  if (uniqueDisciplines.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <BookOpen className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-card-foreground mb-1">Grade Vazia</h3>
        <p className="text-sm text-muted-foreground">
          Adicione turmas pelo catálogo de disciplinas
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-card-foreground">Minha Grade</h3>
        {/* Clear all: toggle off every section */}
        <button
          onClick={() => mySections.forEach((s) => toggleSection(s))}
          className="text-sm text-destructive hover:text-destructive/80 transition-colors"
        >
          Limpar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Carga Horária</span>
          </div>
          <p className="text-xl font-bold text-card-foreground">{totalWorkload}h</p>
        </div>
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <BookOpen className="w-4 h-4" />
            <span className="text-xs">Créditos</span>
          </div>
          <p className="text-xl font-bold text-card-foreground">{totalCredits}</p>
        </div>
      </div>

      <div className="space-y-2">
        {uniqueDisciplines.map((item) => (
          <div
            key={`${item.disciplineCode}-${item.classCode}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors group"
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color || '#3b82f6' }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-card-foreground text-sm truncate">
                {item.disciplineName}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.classCode} • {item.professor}
              </p>
            </div>
            <button
              onClick={() => {
                const toRemove = mySections.find((s) => {
                  const dc = (s as any)?.course?.code || (s as any)?.course_code;
                  const cc = (s as any)?.section_code || s.id_ref;
                  return dc === item.disciplineCode && cc === item.classCode;
                });
                if (toRemove) toggleSection(toRemove);
              }}
              className="p-1.5 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

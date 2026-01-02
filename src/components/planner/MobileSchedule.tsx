import { useState } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useMySections } from '@/hooks/useMySections';
import { parseSigaaSchedule } from '@/services/api';

const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const hours = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

const dayMap: Record<string, string> = {
  'Seg': 'Seg',
  'Ter': 'Ter',
  'Qua': 'Qua',
  'Qui': 'Qui',
  'Sex': 'Sex',
  'Sáb': 'Sáb'
};

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

export function MobileSchedule() {
  const [activeDay, setActiveDay] = useState('Seg');
  const { mySections, toggleSection } = useMySections();

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

  const getItemsForDay = (day: string) => {
    return scheduledItems.filter(item => {
      const itemDay = dayMap[item.day] || item.day;
      return itemDay === day;
    });
  };

  const dayItems = getItemsForDay(activeDay);

  // Group by unique discipline-class
  const uniqueItems = dayItems.reduce((acc, item) => {
    const key = `${item.disciplineCode}-${item.classCode}`;
    if (!acc.find(i => `${i.disciplineCode}-${i.classCode}` === key)) {
      acc.push(item);
    }
    return acc;
  }, [] as ScheduledItem[]);

  // Sort by start time
  uniqueItems.sort((a, b) => {
    const aHour = parseInt(a.startTime.split(':')[0]);
    const bHour = parseInt(b.startTime.split(':')[0]);
    return aHour - bHour;
  });

  return (
    <div className="space-y-4">
      {/* Day tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {days.map((day) => {
          const count = getItemsForDay(day).length;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all relative",
                activeDay === day
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {day}
              {count > 0 && (
                <span className={cn(
                  "absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center",
                  activeDay === day
                    ? "bg-primary-foreground text-primary"
                    : "bg-primary text-primary-foreground"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {uniqueItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma aula neste dia
          </div>
        ) : (
          uniqueItems.map((item) => (
            <div
              key={`${item.disciplineCode}-${item.classCode}`}
              className="flex gap-3 animate-fade-in"
            >
              {/* Time */}
              <div className="w-14 flex-shrink-0 text-right">
                <p className="text-sm font-medium text-card-foreground">
                  {item.startTime}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.endTime}
                </p>
              </div>

              {/* Line */}
              <div className="relative flex flex-col items-center">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div className="w-0.5 flex-1 bg-border" />
              </div>

              {/* Content */}
              <div
                className="flex-1 p-4 rounded-xl border-l-4 bg-card shadow-card mb-2"
                style={{ borderColor: item.color }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-card-foreground">
                      {item.disciplineName}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
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
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

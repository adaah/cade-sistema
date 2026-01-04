import { useMySections } from '@/hooks/useMySections';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { getSpplitedCode } from '@/lib/schedule';

const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const hours = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

const dayMap: Record<string, string> = {
  '2': 'Seg',
  '3': 'Ter',
  '4': 'Qua',
  '5': 'Qui',
  '6': 'Sex',
  '7': 'Sáb',
};

type ScheduledItem = {
  disciplineCode: string;
  disciplineName: string;
  classCode: string;
  professor: string;
  color: string;
  day: string; // 'Seg' | 'Ter' | ...
  startTime: string; // 'HH:MM'
  endTime: string;   // 'HH:MM'
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

export function ScheduleGrid() {
  const { mySections, toggleSection } = useMySections();

  const scheduledItems: ScheduledItem[] = [];
  for (const s of mySections) {
    const disciplineCode = (s as any)?.course?.code || (s as any)?.course_code || '';
    const disciplineName = (s as any)?.course?.name || disciplineCode;
    const classCode = (s as any)?.section_code || s.id_ref;
    const professor = Array.isArray((s as any)?.teachers) && (s as any).teachers.length > 0
      ? (s as any).teachers.join(', ')
      : ((s as any)?.professor || '');

    const codes = Array.isArray(s.time_codes) ? s.time_codes : [];
    const discreteCodes = codes.flatMap((c) => getSpplitedCode(c));

    for (const code of discreteCodes) {
      const match = code.match(/^([2-7])([MTN])([1-6])$/i);
      if (!match) continue;
      const [, dayNum, shift, slotStr] = match;
      const day = dayMap[dayNum];
      const base = shift === 'M' ? 7 : shift === 'T' ? 13 : 18;
      const slot = parseInt(slotStr, 10);
      const startHour = base + (slot - 1);
      const endHour = startHour + 1;

      scheduledItems.push({
        disciplineCode,
        disciplineName,
        classCode,
        professor,
        color: colorFor(disciplineCode),
        day,
        startTime: `${startHour.toString().padStart(2, '0')}:00`,
        endTime: `${endHour.toString().padStart(2, '0')}:00`,
      });
    }
  }

  const removeFromSchedule = (disciplineCode: string, classCode: string) => {
    const target = mySections.find((sec) => {
      const dc = (sec as any)?.course?.code || (sec as any)?.course_code;
      const cc = (sec as any)?.section_code || sec.id_ref;
      return dc === disciplineCode && cc === classCode;
    });
    if (target) toggleSection(target);
  };

  const getItemsForSlot = (day: string, hour: string) => {
    return scheduledItems.filter(item => {
      if (item.day !== day) return false;

      const slotHour = parseInt(hour.split(':')[0]);
      const startHour = parseInt(item.startTime.split(':')[0]);
      const endHour = parseInt(item.endTime.split(':')[0]);

      return slotHour >= startHour && slotHour < endHour;
    });
  };

  const isStartSlot = (item: typeof scheduledItems[0], hour: string) => {
    const slotHour = parseInt(hour.split(':')[0]);
    const startHour = parseInt(item.startTime.split(':')[0]);
    return slotHour === startHour;
  };

  const getItemDuration = (item: typeof scheduledItems[0]) => {
    const startHour = parseInt(item.startTime.split(':')[0]);
    const endHour = parseInt(item.endTime.split(':')[0]);
    return endHour - startHour;
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          <div className="w-16" />
          {days.map((day) => (
            <div
              key={day}
              className="py-3 text-center font-semibold text-card-foreground bg-muted rounded-lg"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="relative">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-7 gap-1 mb-1">
              {/* Time label */}
              <div className="w-16 py-2 text-xs text-muted-foreground text-right pr-2">
                {hour}
              </div>

              {/* Day columns */}
              {days.map((day) => {
                const items = getItemsForSlot(day, hour);
                const hasConflict = items.length > 1;

                return (
                  <div
                    key={`${day}-${hour}`}
                    className="relative h-12 bg-muted/30 rounded border border-border/50"
                  >
                    {items.map((item, index) => {
                      if (!isStartSlot(item, hour)) return null;
                      
                      const duration = getItemDuration(item);
                      const width = hasConflict ? `${100 / items.length}%` : '100%';
                      const left = hasConflict ? `${(index * 100) / items.length}%` : '0';

                      return (
                        <div
                          key={`${item.disciplineCode}-${item.classCode}-${item.day}`}
                          className={cn(
                            "absolute top-0 rounded-lg p-1.5 text-xs overflow-hidden group cursor-pointer transition-all hover:z-10",
                            hasConflict && "border-2 border-destructive animate-pulse"
                          )}
                          style={{
                            backgroundColor: item.color,
                            height: `${duration * 48 + (duration - 1) * 4}px`,
                            width,
                            left,
                            zIndex: 10 + index
                          }}
                        >
                          <div className="text-white font-semibold truncate">
                            {item.disciplineCode}
                          </div>
                          <div className="text-white/80 truncate text-[10px]">
                            {item.classCode}
                          </div>
                          
                          {/* Remove button */}
                          <button
                            onClick={() => removeFromSchedule(item.disciplineCode, item.classCode)}
                            className="absolute top-1 right-1 p-0.5 rounded bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

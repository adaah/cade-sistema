import { useMySections } from '@/hooks/useMySections';
import { cn } from '@/lib/utils';
import { getSpplitedCode } from '@/lib/schedule';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Section } from '@/services/api';
import { AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const hours = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
const hoursCompact = ['07:00', '08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

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
  section: Section; // Seção completa para passar ao modal
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

interface ScheduleGridProps {
  onSectionClick?: (section: Section) => void;
}

export function ScheduleGrid({ onSectionClick }: ScheduleGridProps = {}) {
  const { mySections, toggleSection, getConflictsForSection } = useMySections();
  const isMobile = useIsMobile();
  const displayHours = isMobile ? hoursCompact : hours;

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
        section: s,
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

  const getConflictMessage = (conflicts: Array<{ code: string; section: Section }>) => {
    if (!conflicts.length) return '';
    
    const conflictList = conflicts.map(conflict => {
      const section = conflict.section;
      const courseCode = section.course?.code || (section as any)?.course_code || 'Desconhecido';
      const className = (section as any)?.section_code || section.id_ref || 'N/A';
      return `${courseCode} (${className})`;
    }).join(', ');
    
    return conflictList;
  };

  const getItemDuration = (item: typeof scheduledItems[0]) => {
    const startHour = parseInt(item.startTime.split(':')[0]);
    const endHour = parseInt(item.endTime.split(':')[0]);
    return endHour - startHour;
  };

  // As funções getConflictsForSection e toggleSection são importadas do hook useMySections

  return (
    <div className={cn("overflow-x-auto w-full", isMobile && "px-1")}>
      <div className={cn(isMobile ? "w-full" : "min-w-[800px]")}>
        {/* Header */}
        <div className={cn("grid grid-cols-7 gap-0.5 md:gap-1 mb-0.5 md:mb-1 w-full", isMobile && "text-xs")}>
          <div className={cn(isMobile ? "w-8" : "w-16")} />
          {days.map((day) => (
            <div
              key={day}
              className={cn(
                "py-1.5 md:py-2 text-center font-medium text-muted-foreground",
                isMobile ? "text-[10px] px-0" : ""
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="relative">
          {displayHours.map((hour) => (
            <div key={hour} className={cn("grid grid-cols-7 gap-0.5 md:gap-1 mb-0.5 md:mb-1")}>
              {/* Time label */}
              <div
                className={cn(
                  "py-1 md:py-2 text-xs text-muted-foreground text-right pr-1 md:pr-2 flex items-start justify-end",
                  isMobile ? "w-10 text-[9px]" : "w-16"
                )}
                style={{
                  height: `calc(${isMobile ? '1.5' : '3'}rem * ${Math.max(1, getItemsForSlot(days[0], hour).length)})`,
                  minHeight: isMobile ? '1.5rem' : '3rem'
                }}
              >
                {hour}
              </div>

              {/* Day columns */}
              {days.map((day) => {
                const items = getItemsForSlot(day, hour);
                const hasConflict = items.length > 1;
                
                // Verificar conflitos para cada item usando getConflictsForSection
                const itemsWithConflicts = items.map(item => {
                  const conflicts = getConflictsForSection(item.section);
                  // Um item tem conflito se houver outros itens no mesmo horário
                  // ou se houver conflitos detectados pelo getConflictsForSection
                  const hasItemConflict = items.length > 1 || conflicts.length > 0;
                  return { ...item, hasConflict: hasItemConflict, conflicts };
                });

                return (
                  <div
                    key={`${day}-${hour}`}
                    className={cn(
                      "relative rounded border overflow-hidden transition-all duration-200",
                      hasConflict ? "bg-destructive/10 border-destructive/50" : "bg-muted/30 border-border/50"
                    )}
                    style={{
                      // Altura base + (altura adicional por item extra * número de itens extras)
                      height: `calc(${isMobile ? '1.5' : '3'}rem * ${Math.max(1, items.length)})`,
                      minHeight: isMobile ? '1.5rem' : '3rem'
                    }}
                  >
                    <TooltipProvider key={`${day}-${hour}-tooltip`}>
                      {itemsWithConflicts.map((item, index) => {
                        const duration = getItemDuration(item);
                        // Ajusta a altura e posição para caber no quadro de horário
                        const hourHeight = isMobile ? 1.5 : 3; // altura de cada hora em rem
                        const itemHeight = `calc(${duration} * ${hourHeight}rem - 2px)`; // altura do item baseado na duração
                        const top = `${index * hourHeight}rem`; // posiciona verticalmente baseado no índice
                        const width = 'calc(100% - 4px)'; // largura total com margem
                        const left = '2px'; // pequena margem para a borda
                        const conflictMessage = getConflictMessage(item.conflicts);
                        
                        // Altura máxima baseada no número de itens
                        const maxHeight = `calc(${items.length} * ${hourHeight}rem)`;

                        return (
                          <Tooltip key={`${item.disciplineCode}-${item.classCode}-${item.day}`}>
                            <TooltipTrigger asChild>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onSectionClick) {
                                    onSectionClick(item.section);
                                  }
                                }}
                                className={cn(
                                  "absolute rounded overflow-hidden cursor-pointer transition-all hover:z-10 hover:opacity-90",
                                  isMobile ? "p-0.5" : "p-1.5",
                                  item.hasConflict && "border-2 border-destructive shadow-lg shadow-destructive/20"
                                )}
                                style={{
                                  backgroundColor: item.color,
                                  height: itemHeight,
                                  maxHeight: maxHeight,
                                  width,
                                  top,
                                  left,
                                  zIndex: 10 + index,
                                  boxSizing: 'border-box'
                                }}
                              >
                                <div className={cn(
                                  "flex flex-col gap-0.5 p-1 w-full",
                                  isMobile ? "text-[9px] leading-tight" : "text-xs"
                                )}>
                                  <div className="flex items-start gap-1">
                                    {item.hasConflict && (
                                      <AlertTriangle className="w-3 h-3 text-white flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="font-semibold truncate">
                                      {item.disciplineCode}
                                    </div>
                                  </div>
                                  <div className="text-white/80 truncate pl-4">
                                    {item.classCode}
                                  </div>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                              <p className="text-sm font-medium">Conflito de Horário</p>
                              {conflictMessage && (
                                <p className="text-xs text-muted-foreground">
                                  {conflictMessage}
                                </p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </TooltipProvider>
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

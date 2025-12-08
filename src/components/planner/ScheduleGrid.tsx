import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

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

export function ScheduleGrid() {
  const { scheduledItems, removeFromSchedule } = useApp();

  const getItemsForSlot = (day: string, hour: string) => {
    return scheduledItems.filter(item => {
      const itemDay = dayMap[item.day] || item.day;
      if (itemDay !== day) return false;

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
